import { SyncPayService, PLAN_PRICES, calcPeriodEnd, type PaymentPeriod } from "../services/syncpay.service";
import { SubscriptionRepository } from "../repositories/subscription.repository";
import { PixPaymentRepository } from "../repositories/pix-payment.repository";
import { PlanRepository } from "../repositories/plan.repository";
import { OrganizationService } from "../services/organization.service";
import { SubscriptionService } from "../services/subscription.service";
import { auth } from "../auth";
import { SubscriptionStatus, PixPaymentStatus } from "../generated/prisma";
import { env } from "../env";

/** Busca o preço do plano no DB; cai no hardcode como fallback */
async function getPriceConfig(planKey: string, period: PaymentPeriod): Promise<{ amount: number; originalAmount?: number }> {
  const planRepo = new PlanRepository();
  const plan = await planRepo.findByKey(planKey);
  if (plan) {
    if (period === "monthly")   return { amount: plan.monthlyPrice };
    if (period === "quarterly") return { amount: plan.quarterlyPrice, originalAmount: plan.originalQuarterlyPrice ?? undefined };
    if (period === "yearly")    return { amount: plan.yearlyPrice, originalAmount: plan.originalYearlyPrice ?? undefined };
  }
  // Fallback para hardcode
  const fallback = (PLAN_PRICES as any)[planKey]?.[period];
  if (fallback) return fallback;
  throw new Error(`Plano ou período inválido: ${planKey}/${period}`);
}

type ElysiaContext = {
  params?: Record<string, string>;
  body?: any;
  query?: Record<string, string>;
  request: Request;
  status: (code: number, data?: any) => any;
};

const FRONTEND_URL = env.BETTER_AUTH_TRUSTED_ORIGIN || "http://localhost:3001";
const BACKEND_URL  = env.BETTER_AUTH_BASE_URL || "http://localhost:3000";
const WEBHOOK_BASE = env.SYNCPAY_WEBHOOK_URL ?? BACKEND_URL;

function slugify(name: string) {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export class PixController {
  constructor(
    private syncPayService: SyncPayService,
    private subscriptionRepository: SubscriptionRepository,
    private pixPaymentRepository: PixPaymentRepository,
    private organizationService: OrganizationService,
    private subscriptionService: SubscriptionService,
  ) {}

  /**
   * Cria organização com trial de 3 dias e gera cobrança PIX opcional
   * O usuário pode pagar agora ou nos próximos 3 dias
   */
  async createOrgWithTrial(context: ElysiaContext) {
    const { body, request, status } = context;
    try {
      const session = await auth.api.getSession({ headers: request.headers });
      if (!session?.user) return status(401, { message: "Não autenticado" });

      const { name, plan, period } = body as {
        name: string;
        plan: string;
        period: PaymentPeriod;
      };

      const slug = slugify(name);

      if (!name || !slug) return status(400, { message: "Nome é obrigatório" });

      if (!plan)
        return status(400, { message: "Plano é obrigatório" });

      if (!["monthly", "quarterly", "yearly"].includes(period))
        return status(400, { message: "Período inválido" });

      // Verifica slug disponível
      const { OrganizationRepository } = await import("../repositories/organization.repository");
      const orgRepo = new OrganizationRepository();
      const existing = await orgRepo.findBySlug(slug);
      if (existing) return status(409, { message: "Já existe uma organização com esse nome" });

      // Verifica se usuário já usou trial
      const { prisma } = await import("../lib/prisma");
      const existingTrial = await prisma.subscription.findFirst({
        where: {
          organization: {
            members: { some: { userId: session.user.id, role: "owner" } },
          },
        },
      });
      const hasUsedTrial = !!existingTrial;

      let organization: any;
      let subscription: any;

      if (hasUsedTrial) {
        // Cria org diretamente sem trial — subscription começa como EXPIRED
        const { OrganizationRepository } = await import("../repositories/organization.repository");
        const orgRepo = new OrganizationRepository();
        organization = await orgRepo.create({ name, slug, logo: null, metadata: {} });
        await orgRepo.addMember(organization.id, session.user.id, "owner");

        subscription = await this.subscriptionRepository.create({
          organizationId: organization.id,
          plan: plan,
          status: SubscriptionStatus.EXPIRED,
        });
      } else {
        // Cria org + trial subscription imediatamente
        const result = await this.organizationService.createOrganizationWithTrial(
          session.user.id,
          { name, slug, plan: plan }
        );
        organization = result.organization;
        subscription = result.subscription!;
      }

      // Salva period na subscription
      await this.subscriptionRepository.update(organization.id, {
        paymentProvider: "syncpay",
        // @ts-ignore - campo period adicionado na migration
        period,
      });

      // Gera cobrança PIX (o usuário pode pagar agora ou depois)
      const priceConfig = await getPriceConfig(plan, period);
      const periodFrom = new Date();
      const periodTo = calcPeriodEnd(period, periodFrom);
      const postbackUrl = `${WEBHOOK_BASE}/pix/webhook`;

      let pixData = null;
      try {
        const charge = await this.syncPayService.createPixCharge({
          amount: priceConfig.amount,
          plan: plan,
          period,
          organizationId: organization.id,
          organizationName: name,
          customerName: session.user.name || session.user.email || "Cliente",
          customerEmail: session.user.email || "",
          postbackUrl,
        });

        const pixExpiresAt = new Date();
        pixExpiresAt.setHours(pixExpiresAt.getHours() + 24);

        const pixPayment = await this.pixPaymentRepository.create({
          organizationId: organization.id,
          subscriptionId: subscription.id,
          amount: priceConfig.amount,
          plan: plan,
          period,
          syncpayId: charge.id,
          pixCode: charge.pixCode,
          pixQrCodeBase64: charge.pixQrCodeBase64,
          pixExpiresAt,
          periodFrom,
          periodTo,
        });

        pixData = {
          pixId: pixPayment.id,
          pixCode: charge.pixCode,
          pixQrCodeBase64: charge.pixQrCodeBase64,
          pixExpiresAt,
          amount: priceConfig.amount,
        };
      } catch (pixError) {
        // Falha ao gerar PIX não impede criação da org - usuário pode gerar depois
        console.error("Erro ao gerar PIX na criação da org:", pixError);
      }

      return {
        success: true,
        hasUsedTrial,
        organization: {
          id: organization.id,
          slug: organization.slug,
          name: organization.name,
        },
        subscription: {
          id: subscription.id,
          status: subscription.status,
          trialEndsAt: subscription.trialEndsAt,
        },
        pix: pixData,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro desconhecido";
      console.error("Erro ao criar org com trial:", error);
      return status(500, { message });
    }
  }

  /**
   * Verifica se o usuário autenticado já usou um trial
   */
  async checkTrialStatus(context: ElysiaContext) {
    const { request, status } = context;
    try {
      const session = await auth.api.getSession({ headers: request.headers });
      if (!session?.user) return status(401, { message: "Não autenticado" });

      const { prisma } = await import("../lib/prisma");
      const existingTrial = await prisma.subscription.findFirst({
        where: {
          organization: {
            members: { some: { userId: session.user.id, role: "owner" } },
          },
        },
      });

      return { hasUsedTrial: !!existingTrial };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro desconhecido";
      return status(500, { message });
    }
  }

  /**
   * Gera uma nova cobrança PIX para renovação/pagamento de uma organização existente
   */
  async createPixPayment(context: ElysiaContext) {
    const { body, request, status } = context;
    try {
      const session = await auth.api.getSession({ headers: request.headers });
      if (!session?.user) return status(401, { message: "Não autenticado" });

      const { organizationId, plan, period } = body as {
        organizationId: string;
        plan: string;
        period: PaymentPeriod;
      };

      // Verifica acesso
      const access = await this.organizationService.canUserAccessOrganization(
        session.user.id, organizationId
      );
      if (!access.canAccess || (access.role !== "owner" && session.user.role !== "admin"))
        return status(403, { message: "Acesso negado" });

      const subscription = await this.subscriptionRepository.findByOrganizationId(organizationId);
      if (!subscription) return status(404, { message: "Assinatura não encontrada" });

      // Expira cobranças PIX antigas pendentes
      await this.pixPaymentRepository.expireOldPending(organizationId);

      const priceConfig = await getPriceConfig(plan, period);

      // Calcula período cobrado: começa quando o atual termina (ou agora se expirado)
      const now = new Date();
      const periodFrom = subscription.currentPeriodEnd && subscription.currentPeriodEnd > now
        ? new Date(subscription.currentPeriodEnd)
        : now;
      const periodTo = calcPeriodEnd(period, periodFrom);

      const postbackUrl = `${WEBHOOK_BASE}/pix/webhook`;

      const charge = await this.syncPayService.createPixCharge({
        amount: priceConfig.amount,
        plan: plan,
        period,
        organizationId,
        organizationName: subscription.organization?.name ?? "Organização",
        customerName: session.user.name || session.user.email || "Cliente",
        customerEmail: session.user.email || "",
        postbackUrl,
      });

      const pixExpiresAt = new Date();
      pixExpiresAt.setHours(pixExpiresAt.getHours() + 24);

      const pixPayment = await this.pixPaymentRepository.create({
        organizationId,
        subscriptionId: subscription.id,
        amount: priceConfig.amount,
        plan: plan,
        period,
        syncpayId: charge.id,
        pixCode: charge.pixCode,
        pixQrCodeBase64: charge.pixQrCodeBase64,
        pixExpiresAt,
        periodFrom,
        periodTo,
      });

      return {
        success: true,
        pix: {
          pixId: pixPayment.id,
          pixCode: charge.pixCode,
          pixQrCodeBase64: charge.pixQrCodeBase64,
          pixExpiresAt,
          amount: priceConfig.amount,
          periodFrom,
          periodTo,
        },
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro desconhecido";
      console.error("Erro ao criar cobrança PIX:", error);
      return status(500, { message });
    }
  }

  /**
   * Retorna a cobrança PIX pendente de uma organização (para exibir QR code)
   */
  async getPixStatus(context: ElysiaContext) {
    const { params, request, status } = context;
    try {
      const session = await auth.api.getSession({ headers: request.headers });
      if (!session?.user) return status(401, { message: "Não autenticado" });

      const organizationId = params?.organizationId;
      if (!organizationId) return status(400, { message: "organizationId é obrigatório" });

      // Expira cobranças vencidas
      await this.pixPaymentRepository.expireOldPending(organizationId);

      const pending = await this.pixPaymentRepository.findPendingByOrganizationId(organizationId);

      if (!pending) return { success: true, pix: null };

      return {
        success: true,
        pix: {
          pixId: pending.id,
          pixCode: pending.pixCode,
          pixQrCodeBase64: pending.pixQrCodeBase64,
          pixExpiresAt: pending.pixExpiresAt,
          amount: pending.amount,
          status: pending.status,
          periodFrom: pending.periodFrom,
          periodTo: pending.periodTo,
        },
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro desconhecido";
      return status(500, { message });
    }
  }

  /**
   * Webhook do SyncPay — chamado quando o pagamento é confirmado
   */
  async handleWebhook(context: ElysiaContext) {
    const { body, request } = context;
    try {
      const authHeader = request.headers.get("Authorization");
      if (!this.syncPayService.validateWebhookToken(authHeader)) {
        console.warn("⚠️ Webhook SyncPay com token inválido");
        return { received: true, error: "Invalid token" };
      }

      const payload = body as any;

      // cashin.update payload: { event: "cashin.update", data: { id, status, ... } }
      const syncpayId = payload?.data?.id || payload?.id;
      const rawStatus = payload?.data?.status || payload?.status;

      if (!syncpayId) {
        console.warn("[PIX Webhook] sem id da transação");
        return { received: true };
      }

      const isPaid = SyncPayService.isPaymentCompleted(rawStatus);

      if (!isPaid) {
        // Pode ser evento de criação ou outro evento — apenas logamos
        return { received: true, ignored: true, status: rawStatus };
      }

      // Busca o pagamento no banco
      const pixPayment = await this.pixPaymentRepository.findBySyncpayId(syncpayId);
      if (!pixPayment) {
        console.warn("[PIX Webhook] pagamento não encontrado para id:", syncpayId);
        return { received: true, error: "Payment not found" };
      }

      if (pixPayment.status === PixPaymentStatus.PAID) {
        return { received: true, ignored: true }; // Já processado
      }

      await this.handlePaymentConfirmed(pixPayment.id, syncpayId, pixPayment.organizationId);

      return { received: true, success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro desconhecido";
      console.error("[PIX Webhook] erro:", error);
      return { received: true, error: message };
    }
  }

  /**
   * Ativa/renova a assinatura após pagamento confirmado
   */
  private async handlePaymentConfirmed(pixPaymentId: string, syncpayId: string, organizationId: string) {
    const pixPayment = await this.pixPaymentRepository.findById(pixPaymentId);
    if (!pixPayment || pixPayment.status === PixPaymentStatus.PAID) return;

    // Marca o pagamento como pago
    await this.pixPaymentRepository.markAsPaid(pixPaymentId);

    const periodTo = pixPayment.periodTo || calcPeriodEnd(pixPayment.period as PaymentPeriod);

    // Ativa ou renova a assinatura
    await this.subscriptionRepository.activate(
      organizationId,
      periodTo,
      "syncpay",
      syncpayId,
    );

    // Atualiza plano se necessário
    await this.subscriptionRepository.update(organizationId, {
      plan: pixPayment.plan,
      paymentProvider: "syncpay",
    });

    console.log(`[PIX] Assinatura ativada para org ${organizationId} até ${periodTo.toISOString()}`);
  }

}
