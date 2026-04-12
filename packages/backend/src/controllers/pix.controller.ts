import { SyncPayService, PLAN_PRICES, calcPeriodEnd, type PaymentPeriod } from "../services/syncpay.service";
import { SubscriptionRepository } from "../repositories/subscription.repository";
import { PixPaymentRepository } from "../repositories/pix-payment.repository";
import { PlanRepository } from "../repositories/plan.repository";
import { ClanService } from "../services/clan.service";
import { SubscriptionService } from "../services/subscription.service";
import { auth } from "../auth";
import { SubscriptionStatus, PixPaymentStatus } from "../generated/prisma";
import { env } from "../env";

const PERIOD_DAYS: Record<PaymentPeriod, number> = {
  monthly: 30,
  quarterly: 90,
  yearly: 365,
};

async function getPriceConfig(planKey: string, period: PaymentPeriod): Promise<{ amount: number; originalAmount?: number }> {
  const planRepo = new PlanRepository();
  const plan = await planRepo.findByKey(planKey);
  if (plan) {
    if (period === "monthly")   return { amount: plan.monthlyPrice };
    if (period === "quarterly") return { amount: plan.quarterlyPrice, originalAmount: plan.originalQuarterlyPrice ?? undefined };
    if (period === "yearly")    return { amount: plan.yearlyPrice, originalAmount: plan.originalYearlyPrice ?? undefined };
  }
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

const BACKEND_URL  = env.BETTER_AUTH_BASE_URL || "http://localhost:3000";
const WEBHOOK_BASE = env.SYNCPAY_WEBHOOK_URL ?? BACKEND_URL;

export class PixController {
  constructor(
    private syncPayService: SyncPayService,
    private subscriptionRepository: SubscriptionRepository,
    private pixPaymentRepository: PixPaymentRepository,
    private clanService: ClanService,
    private subscriptionService: SubscriptionService,
  ) {}

  /**
   * Cria clan com trial de 3 dias e gera cobrança PIX opcional
   */
  async createClanWithTrial(context: ElysiaContext) {
    const { body, request, status } = context;
    try {
      const session = await auth.api.getSession({ headers: request.headers });
      if (!session?.user) return status(401, { message: "Não autenticado" });

      const { clanTag, plan, period } = body as {
        clanTag: string;
        plan: string;
        period: PaymentPeriod;
      };

      if (!clanTag) return status(400, { message: "clanTag é obrigatório" });
      if (!plan) return status(400, { message: "Plano é obrigatório" });
      if (!["monthly", "quarterly", "yearly"].includes(period))
        return status(400, { message: "Período inválido" });

      // Busca dados do clan na API do CoC
      const { ClashOfClansService } = await import("../services/clash-of-clans.service");
      const cocService = new ClashOfClansService();
      const normalizedTag = clanTag.startsWith("#") ? clanTag : `#${clanTag}`;
      const clanData = await cocService.searchClanByTag(normalizedTag);

      // Verifica se o clan já existe
      const { ClanRepository } = await import("../repositories/clan.repository");
      const clanRepo = new ClanRepository();
      const existingClan = await clanRepo.findByTagAnywhere(normalizedTag);
      if (existingClan) return status(409, { message: "Este clan já está cadastrado no sistema" });

      // Verifica se usuário já usou trial
      const { prisma } = await import("../lib/prisma");
      const existingTrial = await prisma.subscription.findFirst({
        where: { clan: { ownerId: session.user.id } },
      });
      const hasUsedTrial = !!existingTrial;

      // Cria o clan
      const clan = await this.clanService.createClan(session.user.id, normalizedTag, clanData);

      let subscription: any;

      if (hasUsedTrial) {
        subscription = await this.subscriptionRepository.create({
          clanId: clan.id,
          plan,
          status: SubscriptionStatus.EXPIRED,
        });
      } else {
        subscription = await this.subscriptionService.createTrialSubscription(clan.id, plan);
      }

      // Salva period na subscription
      await this.subscriptionRepository.update(clan.id, {
        paymentProvider: "syncpay",
        period,
      });

      // Gera cobrança PIX
      const priceConfig = await getPriceConfig(plan, period);
      const periodFrom = new Date();
      const periodTo = calcPeriodEnd(period, periodFrom);
      const postbackUrl = `${WEBHOOK_BASE}/pix/webhook`;

      let pixData = null;
      try {
        const charge = await this.syncPayService.createPixCharge({
          amount: priceConfig.amount,
          plan,
          period,
          clanId: clan.id,
          clanName: clanData.name,
          customerName: session.user.name || session.user.email || "Cliente",
          customerEmail: session.user.email || "",
          postbackUrl,
        });

        const pixExpiresAt = new Date();
        pixExpiresAt.setHours(pixExpiresAt.getHours() + 24);

        const pixPayment = await this.pixPaymentRepository.create({
          clanId: clan.id,
          subscriptionId: subscription.id,
          amount: priceConfig.amount,
          plan,
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
        console.error("Erro ao gerar PIX na criação do clan:", pixError);
      }

      return {
        success: true,
        hasUsedTrial,
        clan: { id: clan.id, tag: clan.tag, name: clan.name },
        subscription: {
          id: subscription.id,
          status: subscription.status,
          trialEndsAt: subscription.trialEndsAt,
        },
        pix: pixData,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro desconhecido";
      console.error("Erro ao criar clan com trial:", error);
      return status(500, { message });
    }
  }

  async checkTrialStatus(context: ElysiaContext) {
    const { request, status } = context;
    try {
      const session = await auth.api.getSession({ headers: request.headers });
      if (!session?.user) return status(401, { message: "Não autenticado" });

      const { prisma } = await import("../lib/prisma");
      const existingTrial = await prisma.subscription.findFirst({
        where: { clan: { ownerId: session.user.id } },
      });

      return { hasUsedTrial: !!existingTrial };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro desconhecido";
      return status(500, { message });
    }
  }

  async createPixPayment(context: ElysiaContext) {
    const { body, request, status } = context;
    try {
      const session = await auth.api.getSession({ headers: request.headers });
      if (!session?.user) return status(401, { message: "Não autenticado" });

      const { clanId, plan, period, upgradeOnly } = body as {
        clanId: string;
        plan: string;
        period: PaymentPeriod;
        upgradeOnly?: boolean;
      };

      const access = await this.clanService.canUserAccessClan(session.user.id, clanId);
      if (!access.canAccess || (access.role !== "owner" && (session.user as any).role !== "admin"))
        return status(403, { message: "Acesso negado" });

      const subscription = await this.subscriptionRepository.findByClanId(clanId);
      if (!subscription) return status(404, { message: "Assinatura não encontrada" });

      await this.pixPaymentRepository.expireOldPending(clanId);

      const now = new Date();
      let amount: number;
      let periodFrom: Date;
      let periodTo: Date;

      if (upgradeOnly) {
        const currentPeriod = (subscription.period ?? "monthly") as PaymentPeriod;
        const currentPrice = (await getPriceConfig(subscription.plan, currentPeriod)).amount;
        const newPrice = (await getPriceConfig(plan, currentPeriod)).amount;

        if (newPrice <= currentPrice)
          return status(400, { message: "Use o endpoint de downgrade para reduzir o plano" });

        const remainingMs = subscription.currentPeriodEnd
          ? subscription.currentPeriodEnd.getTime() - now.getTime()
          : 0;
        const remainingDays = Math.max(0, Math.ceil(remainingMs / 86400000));
        const totalDays = PERIOD_DAYS[currentPeriod];

        amount = Math.max(100, Math.ceil((newPrice - currentPrice) * remainingDays / totalDays));
        periodFrom = now;
        periodTo = subscription.currentPeriodEnd ?? calcPeriodEnd(currentPeriod, now);
      } else {
        const priceConfig = await getPriceConfig(plan, period);
        amount = priceConfig.amount;
        periodFrom = subscription.currentPeriodEnd && subscription.currentPeriodEnd > now
          ? new Date(subscription.currentPeriodEnd)
          : now;
        periodTo = calcPeriodEnd(period, periodFrom);
      }

      const postbackUrl = `${WEBHOOK_BASE}/pix/webhook`;
      const charge = await this.syncPayService.createPixCharge({
        amount,
        plan,
        period: upgradeOnly ? ((subscription.period ?? "monthly") as PaymentPeriod) : period,
        clanId,
        clanName: subscription.clan?.name ?? "Clan",
        customerName: session.user.name || session.user.email || "Cliente",
        customerEmail: session.user.email || "",
        postbackUrl,
      });

      const pixExpiresAt = new Date();
      pixExpiresAt.setHours(pixExpiresAt.getHours() + 24);

      const pixPayment = await this.pixPaymentRepository.create({
        clanId,
        subscriptionId: subscription.id,
        amount,
        plan,
        period: upgradeOnly ? (subscription.period ?? "monthly") : period,
        upgradeOnly: upgradeOnly ?? false,
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
          amount,
          periodFrom,
          periodTo,
          upgradeOnly: upgradeOnly ?? false,
        },
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro desconhecido";
      console.error("Erro ao criar cobrança PIX:", error);
      return status(500, { message });
    }
  }

  async scheduleDowngrade(context: ElysiaContext) {
    const { body, request, status } = context;
    try {
      const session = await auth.api.getSession({ headers: request.headers });
      if (!session?.user) return status(401, { message: "Não autenticado" });

      const { clanId, plan } = body as { clanId: string; plan: string };

      const access = await this.clanService.canUserAccessClan(session.user.id, clanId);
      if (!access.canAccess || (access.role !== "owner" && (session.user as any).role !== "admin"))
        return status(403, { message: "Acesso negado" });

      const subscription = await this.subscriptionRepository.findByClanId(clanId);
      if (!subscription) return status(404, { message: "Assinatura não encontrada" });

      await this.subscriptionRepository.update(clanId, { pendingPlan: plan });

      return {
        success: true,
        message: `Downgrade para "${plan}" agendado para ${subscription.currentPeriodEnd?.toISOString() ?? "o fim do período"}`,
        pendingPlan: plan,
        effectiveAt: subscription.currentPeriodEnd,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro desconhecido";
      return status(500, { message });
    }
  }

  async getPixStatus(context: ElysiaContext) {
    const { params, request, status } = context;
    try {
      const session = await auth.api.getSession({ headers: request.headers });
      if (!session?.user) return status(401, { message: "Não autenticado" });

      const clanId = params?.clanId;
      if (!clanId) return status(400, { message: "clanId é obrigatório" });

      await this.pixPaymentRepository.expireOldPending(clanId);
      const pending = await this.pixPaymentRepository.findPendingByClanId(clanId);

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

  async handleWebhook(context: ElysiaContext) {
    const { body, request } = context;
    try {
      const authHeader = request.headers.get("Authorization");
      if (!this.syncPayService.validateWebhookToken(authHeader)) {
        console.warn("⚠️ Webhook SyncPay com token inválido");
        return { received: true, error: "Invalid token" };
      }

      const payload = body as any;
      const syncpayId = payload?.data?.id || payload?.id;
      const rawStatus = payload?.data?.status || payload?.status;

      if (!syncpayId) return { received: true };

      const isPaid = SyncPayService.isPaymentCompleted(rawStatus);
      if (!isPaid) return { received: true, ignored: true, status: rawStatus };

      const pixPayment = await this.pixPaymentRepository.findBySyncpayId(syncpayId);
      if (!pixPayment) return { received: true, error: "Payment not found" };

      if (pixPayment.status === PixPaymentStatus.PAID) return { received: true, ignored: true };

      await this.handlePaymentConfirmed(pixPayment.id, syncpayId, pixPayment.clanId);

      return { received: true, success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro desconhecido";
      console.error("[PIX Webhook] erro:", error);
      return { received: true, error: message };
    }
  }

  private async handlePaymentConfirmed(pixPaymentId: string, syncpayId: string, clanId: string) {
    const pixPayment = await this.pixPaymentRepository.findById(pixPaymentId);
    if (!pixPayment || pixPayment.status === PixPaymentStatus.PAID) return;

    await this.pixPaymentRepository.markAsPaid(pixPaymentId);

    if (pixPayment.upgradeOnly) {
      await this.subscriptionRepository.update(clanId, {
        plan: pixPayment.plan,
        paymentProvider: "syncpay",
        pendingPlan: null,
      });
    } else {
      const periodTo = pixPayment.periodTo || calcPeriodEnd(pixPayment.period as PaymentPeriod);
      await this.subscriptionRepository.activate(clanId, periodTo, "syncpay", syncpayId);
      await this.subscriptionRepository.update(clanId, {
        plan: pixPayment.plan,
        paymentProvider: "syncpay",
      });
    }
  }
}
