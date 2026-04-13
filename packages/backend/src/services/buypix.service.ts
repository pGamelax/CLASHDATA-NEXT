import { env } from "../env";
import { createHmac, timingSafeEqual } from "crypto";

const BUYPIX_BASE_URL = "https://buypix.me/api/v1";

export type PaymentPeriod = "monthly" | "quarterly" | "yearly";

// Calcula a data de fim do período
export function calcPeriodEnd(period: PaymentPeriod, from: Date = new Date()): Date {
  const end = new Date(from);
  if (period === "monthly")   end.setMonth(end.getMonth() + 1);
  if (period === "quarterly") end.setMonth(end.getMonth() + 3);
  if (period === "yearly")    end.setFullYear(end.getFullYear() + 1);
  return end;
}

export interface BuyPixChargeResult {
  id: string;              // UUID do depósito no BuyPix
  pixCode: string;         // pix_qr_code (copia e cola)
  pixQrCodeBase64: string; // pix_qr_code_base64 (data URL da imagem)
  status: string;
  expiresAt?: Date;
}

export class BuyPixService {
  private get authHeaders(): Record<string, string> {
    return {
      "Content-Type": "application/json",
      "Accept": "application/json",
      "Authorization": `Bearer ${env.BUYPIX_API_KEY}`,
    };
  }

  /**
   * Cria uma cobrança PIX via BuyPix.
   * amount em centavos — converte para reais internamente.
   * O valor SEMPRE vem do backend (buscado no DB pelo controller).
   */
  async createPixCharge(params: {
    amount: number;      // centavos
    idempotencyKey?: string;
  }): Promise<BuyPixChargeResult> {
    const amountInReais = params.amount / 100;

    const headers: Record<string, string> = { ...this.authHeaders };
    if (params.idempotencyKey) {
      headers["X-Idempotency-Key"] = params.idempotencyKey;
    }

    const response = await fetch(`${BUYPIX_BASE_URL}/deposits`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        amount: amountInReais,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`BuyPix criar depósito falhou ${response.status}: ${text}`);
    }

    const json = await response.json() as any;
    const d = json?.data ?? json;

    const id: string = d?.id ?? "";
    const pixCode: string = d?.pix_qr_code ?? "";
    const pixQrCodeBase64: string = d?.pix_qr_code_base64 ?? "";
    const status: string = d?.status ?? "pending";
    const expiresAt = d?.expires_at ? new Date(d.expires_at) : undefined;

    if (!id) {
      throw new Error(`BuyPix: id não retornado. Resposta: ${JSON.stringify(json)}`);
    }

    return { id, pixCode, pixQrCodeBase64, status, expiresAt };
  }

  /**
   * Consulta o status de um depósito no BuyPix
   */
  async getDepositStatus(depositId: string): Promise<{ status: string }> {
    const response = await fetch(`${BUYPIX_BASE_URL}/deposits/${depositId}`, {
      headers: this.authHeaders,
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`BuyPix consulta depósito falhou ${response.status}: ${text}`);
    }

    const json = await response.json() as any;
    const d = json?.data ?? json;
    return { status: d?.status ?? "unknown" };
  }

  /**
   * Verifica a assinatura HMAC-SHA256 do webhook.
   * Header: X-Webhook-Signature (aceita "sha256=<hex>" ou apenas "<hex>")
   */
  validateWebhookSignature(rawBody: string, signatureHeader: string | null): boolean {
    if (!env.BUYPIX_WEBHOOK_SECRET) return true;
    if (!signatureHeader) return false;

    const receivedSig = signatureHeader.replace(/^sha256=/i, "").trim();
    const expectedSig = createHmac("sha256", env.BUYPIX_WEBHOOK_SECRET)
      .update(rawBody, "utf-8")
      .digest("hex");

    try {
      return timingSafeEqual(
        Buffer.from(expectedSig, "hex"),
        Buffer.from(receivedSig, "hex"),
      );
    } catch {
      return false;
    }
  }

  /**
   * Retorna true se o evento ou status do webhook indica pagamento confirmado.
   * Evento pago: deposit.completed | Status pago: depix_sent
   */
  static isPaymentCompleted(event: string | undefined, status: string | undefined): boolean {
    if (event === "deposit.completed") return true;
    if (!status) return false;
    return status === "depix_sent";
  }
}
