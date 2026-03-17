import { env } from "../env";
import QRCode from "qrcode";

const SYNCPAY_BASE_URL = "https://api.syncpayments.com.br/";

export type PaymentPeriod = "monthly" | "quarterly" | "yearly";

// Fallback de preços em centavos (usado quando o plano não está no DB)
export const PLAN_PRICES: Record<string, Record<PaymentPeriod, { amount: number; originalAmount?: number }>> = {
  MESTRE: {
    monthly:   { amount: 2990 },
    quarterly: { amount: 8073, originalAmount: 8970 },
    yearly:    { amount: 28704, originalAmount: 35880 },
  },
  CAMPEAO: {
    monthly:   { amount: 4590 },
    quarterly: { amount: 12393, originalAmount: 13770 },
    yearly:    { amount: 44064, originalAmount: 55080 },
  },
  TITA: {
    monthly:   { amount: 7490 },
    quarterly: { amount: 20223, originalAmount: 22470 },
    yearly:    { amount: 71904, originalAmount: 89880 },
  },
  LEGEND: {
    monthly:   { amount: 11990 },
    quarterly: { amount: 32373, originalAmount: 35970 },
    yearly:    { amount: 115104, originalAmount: 143880 },
  },
};

const PERIOD_LABELS: Record<PaymentPeriod, string> = {
  monthly:   "Mensal",
  quarterly: "Trimestral",
  yearly:    "Anual",
};

// Calcula a data de fim do período
export function calcPeriodEnd(period: PaymentPeriod, from: Date = new Date()): Date {
  const end = new Date(from);
  if (period === "monthly")   end.setMonth(end.getMonth() + 1);
  if (period === "quarterly") end.setMonth(end.getMonth() + 3);
  if (period === "yearly")    end.setFullYear(end.getFullYear() + 1);
  return end;
}

// Cache do token em memória (expira em ~55 min para ter margem)
let cachedToken: string | null = null;
let tokenExpiresAt: number = 0;

export interface SyncPayChargeResult {
  id: string;           // UUID da transação no SyncPay
  pixCode: string;      // copia e cola (pix_code)
  pixQrCodeBase64: string; // QR code em base64 (qr_code)
  status: string;
}

export class SyncPayService {
  /**
   * Obtém (ou renova) o Bearer token do SyncPay.
   * Token é cacheado por 55 minutos.
   */
  async getToken(): Promise<string> {
    const now = Date.now();
    if (cachedToken && now < tokenExpiresAt) {
      return cachedToken;
    }

    const response = await fetch(`${SYNCPAY_BASE_URL}/api/partner/v1/auth-token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: env.SYNCPAY_CLIENT_ID,
        client_secret: env.SYNCPAY_CLIENT_SECRET,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`SyncPay auth falhou ${response.status}: ${text}`);
    }

    const data = await response.json() as any;

    // A resposta pode vir como { token: "..." } ou { access_token: "..." } ou { data: { token } }
    const token: string =
      data?.token || data?.access_token || data?.data?.token || data?.data?.access_token;

    if (!token) {
      throw new Error(`SyncPay auth: token não encontrado na resposta: ${JSON.stringify(data)}`);
    }

    cachedToken = token;
    tokenExpiresAt = now + 55 * 60 * 1000; // 55 minutos

    return token;
  }

  /**
   * Cria uma cobrança PIX via SyncPay
   * amount em centavos — converte para reais internamente
   */
  async createPixCharge(params: {
    amount: number; // centavos
    plan: string;
    period: PaymentPeriod;
    organizationId: string;
    organizationName: string;
    customerName: string;
    customerEmail: string;
    customerCpf?: string;
    customerPhone?: string;
    postbackUrl: string;
  }): Promise<SyncPayChargeResult> {
    const token = await this.getToken();
    const amountInReais = params.amount / 100;
    const description = `ClashData - Plano ${params.plan} ${PERIOD_LABELS[params.period]} - ${params.organizationName}`;

    const body: Record<string, any> = {
      amount: amountInReais,
      description,
      webhook_url: params.postbackUrl,
      client: {
        name: params.customerName,
        email: params.customerEmail,
        ...(params.customerCpf  && { cpf: params.customerCpf }),
        ...(params.customerPhone && { phone: params.customerPhone }),
      },
    };

    const response = await fetch(`${SYNCPAY_BASE_URL}/api/partner/v1/cash-in`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`SyncPay cash-in falhou ${response.status}: ${text}`);
    }

    const data = await response.json() as any;

    // Normaliza a resposta (o campo pode estar em data.data ou na raiz)
    const d = data?.data ?? data;

    const id: string = d?.identifier ?? d?.id ?? d?.transaction_id ?? "";
    const pixCode: string = d?.pix_code ?? d?.pixCode ?? d?.paymentCode ?? "";
    const status: string = d?.status ?? "pending";

    if (!id) {
      throw new Error(`SyncPay cash-in: id não retornado. Resposta: ${JSON.stringify(data)}`);
    }

    // Gera QR code como PNG a partir do pix_code
    let pixQrCodeBase64 = "";
    if (pixCode) {
      const buf = await QRCode.toBuffer(pixCode, {
        type: "png",
        width: 512,
        margin: 2,
        errorCorrectionLevel: "M",
      });
      pixQrCodeBase64 = buf.toString("base64");
    }

    return { id, pixCode, pixQrCodeBase64, status };
  }

  /**
   * Valida o token do webhook (header Authorization: Bearer <token>)
   */
  validateWebhookToken(authHeader: string | null): boolean {
    if (!env.SYNCPAY_WEBHOOK_TOKEN) return true; // sem token configurado, aceita tudo
    if (!authHeader) return false;
    const token = authHeader.replace(/^Bearer\s+/i, "").trim();
    return token === env.SYNCPAY_WEBHOOK_TOKEN;
  }

  /**
   * Normaliza o status recebido no webhook para determinar se foi pago
   */
  static isPaymentCompleted(status: string | undefined): boolean {
    if (!status) return false;
    const s = status.toLowerCase();
    return s === "completed" || s === "paid_out" || s === "paid";
  }
}
