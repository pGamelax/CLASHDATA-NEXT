import { BuyPixService, calcPeriodEnd, type PaymentPeriod } from "../services/buypix.service";
import { SubscriptionRepository } from "../repositories/subscription.repository";
import { PixPaymentRepository } from "../repositories/pix-payment.repository";
import { PendingClanPaymentRepository } from "../repositories/pending-clan-payment.repository";
import { PlanRepository } from "../repositories/plan.repository";
import { ClanService } from "../services/clan.service";
import { SubscriptionService } from "../services/subscription.service";
import { auth } from "../auth";
import { SubscriptionStatus, PixPaymentStatus, PendingClanPaymentStatus } from "../generated/prisma";
import { env } from "../env";

const PERIOD_DAYS: Record<PaymentPeriod, number> = {
  monthly: 30,
  quarterly: 90,
  yearly: 365,
};

/**
 * Busca o preço do plano SOMENTE no banco de dados.
 * Se o plano não existir → erro 400 (sem fallback hardcoded).
 * Previne manipulação de preço via frontend.
 */
async function getPriceConfig(planKey: string, period: PaymentPeriod): Promise<{ amount: number; originalAmount?: number }> {
  const planRepo = new PlanRepository();
  const plan = await planRepo.findByKey(planKey);

  if (!plan) {
    throw Object.assign(
      new Error(`Plano "${planKey}" não encontrado. Verifique se o plano está cadastrado no sistema.`),
      { statusCode: 400 },
    );
  }

  if (period === "monthly")   return { amount: plan.monthlyPrice };
  if (period === "quarterly") return { amount: plan.quarterlyPrice, originalAmount: plan.originalQuarterlyPrice ?? undefined };
  if (period === "yearly")    return { amount: plan.yearlyPrice, originalAmount: plan.originalYearlyPrice ?? undefined };

  throw Object.assign(new Error(`Período inválido: ${period}`), { statusCode: 400 });
}

type ElysiaContext = {
  params?: Record<string, string>;
  body?: any;
  query?: Record<string, string>;
  request: Request;
  status: (code: number, data?: any) => any;
};


export class PixController {
  constructor(
    private buyPixService: BuyPixService,
    private subscriptionRepository: SubscriptionRepository,
    private pixPaymentRepository: PixPaymentRepository,
    private pendingClanPaymentRepository: PendingClanPaymentRepository,
    private clanService: ClanService,
    private subscriptionService: SubscriptionService,
  ) {}

  /**
   * Fluxo:
   * - Usuário sem trial anterior → cria clan + trial imediatamente (sem PIX)
   * - Usuário já usou trial → gera PIX, clan criado apenas no webhook após pagamento
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
      if (!plan)    return status(400, { message: "Plano é obrigatório" });
      if (!["monthly", "quarterly", "yearly"].includes(period))
        return status(400, { message: "Período inválido" });

      const { ClashOfClansService } = await import("../services/clash-of-clans.service");
      const { ClanRepository } = await import("../repositories/clan.repository");
      const { prisma } = await import("../lib/prisma");

      const normalizedTag = clanTag.startsWith("#") ? clanTag : `#${clanTag}`;
      const clanRepo = new ClanRepository();

      // Checks rápidos em paralelo (sem CoC API ainda)
      const [existingClan, existingTrial] = await Promise.all([
        clanRepo.findByTagAnywhere(normalizedTag),
        prisma.subscription.findFirst({ where: { clan: { ownerId: session.user.id } } }),
      ]);

      if (existingClan) return status(409, { message: "Este clan já está cadastrado no sistema" });

      const hasUsedTrial = !!existingTrial;

      if (!hasUsedTrial) {
        // ── TRIAL: cria clan imediatamente — CoC API necessária aqui ──
        const cocService = new ClashOfClansService();
        const clanData = await cocService.searchClanByTag(normalizedTag);
        const clan = await this.clanService.createClan(session.user.id, normalizedTag, clanData);
        const subscription = await this.subscriptionService.createTrialSubscription(clan.id, plan);
        await this.subscriptionRepository.update(clan.id, {
          paymentProvider: "buypix",
          period,
        });

        return {
          success: true,
          requiresPayment: false,
          clan: { id: clan.id, tag: clan.tag, name: clan.name },
          subscription: {
            id: subscription.id,
            status: subscription.status,
            trialEndsAt: subscription.trialEndsAt,
          },
        };
      }

      // ── SEM TRIAL: valida plano no banco e gera PIX, clan só criado no webhook ──

      let priceConfig: { amount: number; originalAmount?: number };
      try {
        priceConfig = await getPriceConfig(plan, period);
      } catch (err: any) {
        return status(err.statusCode ?? 400, { message: err.message });
      }

      // Expira pendências antigas deste usuário
      await this.pendingClanPaymentRepository.expireOldPending(session.user.id);

      const charge = await this.buyPixService.createPixCharge({
        amount: priceConfig.amount,
        idempotencyKey: `pending-${session.user.id}-${Date.now()}`,
      });

      const pixExpiresAt = charge.expiresAt ?? (() => {
        const d = new Date();
        d.setHours(d.getHours() + 24);
        return d;
      })();

      // CoC API não é chamada aqui — o nome será buscado no webhook ao criar o clan
      const pending = await this.pendingClanPaymentRepository.create({
        userId: session.user.id,
        clanTag: normalizedTag,
        clanName: normalizedTag,
        plan,
        period,
        amount: priceConfig.amount,
        externalId: charge.id,
        pixCode: charge.pixCode,
        pixQrCodeBase64: charge.pixQrCodeBase64,
        pixExpiresAt,
      });

      return {
        success: true,
        requiresPayment: true,
        pix: {
          pendingId: pending.id,
          pixCode: charge.pixCode,
          pixQrCodeBase64: charge.pixQrCodeBase64,
          pixExpiresAt,
          amount: priceConfig.amount,
        },
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro desconhecido";
      console.error("Erro ao criar clan com trial:", error);
      return status(500, { message });
    }
  }

  /** Retorna status do pagamento pendente de criação de clan (para polling do frontend) */
  async getPendingClanStatus(context: ElysiaContext) {
    const { request, status } = context;
    try {
      const session = await auth.api.getSession({ headers: request.headers });
      if (!session?.user) return status(401, { message: "Não autenticado" });

      await this.pendingClanPaymentRepository.expireOldPending(session.user.id);
      const pending = await this.pendingClanPaymentRepository.findPendingByUserId(session.user.id);

      if (!pending) return { success: true, pending: null };

      return {
        success: true,
        pending: {
          id: pending.id,
          clanTag: pending.clanTag,
          clanName: pending.clanName,
          plan: pending.plan,
          period: pending.period,
          status: pending.status,
          pixCode: pending.pixCode,
          pixQrCodeBase64: pending.pixQrCodeBase64,
          pixExpiresAt: pending.pixExpiresAt,
          amount: pending.amount,
        },
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro desconhecido";
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

      // Valida e busca preço do plano no banco — nunca aceita preço do frontend
      let amount: number;
      let periodFrom: Date;
      let periodTo: Date;
      const now = new Date();

      if (upgradeOnly) {
        const currentPeriod = (subscription.period ?? "monthly") as PaymentPeriod;

        let currentPrice: number;
        let newPrice: number;
        try {
          currentPrice = (await getPriceConfig(subscription.plan, currentPeriod)).amount;
          newPrice = (await getPriceConfig(plan, currentPeriod)).amount;
        } catch (err: any) {
          return status(err.statusCode ?? 400, { message: err.message });
        }

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
        let priceConfig: { amount: number; originalAmount?: number };
        try {
          priceConfig = await getPriceConfig(plan, period);
        } catch (err: any) {
          return status(err.statusCode ?? 400, { message: err.message });
        }
        amount = priceConfig.amount;
        periodFrom = subscription.currentPeriodEnd && subscription.currentPeriodEnd > now
          ? new Date(subscription.currentPeriodEnd)
          : now;
        periodTo = calcPeriodEnd(period, periodFrom);
      }

      await this.pixPaymentRepository.expireOldPending(clanId);

      const charge = await this.buyPixService.createPixCharge({
        amount,
        idempotencyKey: `${clanId}-${plan}-${Date.now()}`,
      });

      const pixExpiresAt = charge.expiresAt ?? (() => {
        const d = new Date();
        d.setHours(d.getHours() + 24);
        return d;
      })();

      const effectivePeriod = upgradeOnly
        ? ((subscription.period ?? "monthly") as PaymentPeriod)
        : period;

      const pixPayment = await this.pixPaymentRepository.create({
        clanId,
        subscriptionId: subscription.id,
        amount,
        plan,
        period: effectivePeriod,
        upgradeOnly: upgradeOnly ?? false,
        externalId: charge.id,
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

      // Valida que o plano existe antes de agendar downgrade
      const planRepo = new PlanRepository();
      const planData = await planRepo.findByKey(plan);
      if (!planData) return status(400, { message: `Plano "${plan}" não encontrado.` });

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
      // body chega como string quando type:"text" funciona, ou como objeto quando
      // Elysia auto-detecta Content-Type:application/json e ignora o type da rota
      let payload: any;
      let canValidateHmac = false;
      let rawBody = "";

      if (typeof body === "string") {
        rawBody = body;
        canValidateHmac = true;
        try {
          payload = JSON.parse(rawBody);
        } catch {
          return { received: true, error: "Invalid JSON" };
        }
      } else if (body && typeof body === "object") {
        // Elysia parseou como JSON (Content-Type: application/json) — HMAC não pode ser validado
        payload = body;
      } else {
        return { received: true, error: "Empty body" };
      }

      if (canValidateHmac) {
        const signature = request.headers.get("X-Webhook-Signature");
        if (!this.buyPixService.validateWebhookSignature(rawBody, signature)) {
          console.warn("⚠️ Webhook BuyPix com assinatura inválida");
          return { received: true, error: "Invalid signature" };
        }
      }

      const event     = payload?.event as string | undefined;
      const buypixId  = (payload?.data?.id ?? payload?.id) as string | undefined;
      const rawStatus = (payload?.data?.status ?? payload?.status) as string | undefined;

      console.log("[PIX Webhook] payload recebido:", JSON.stringify(payload, null, 2));
      console.log("[PIX Webhook] event:", event, "| id:", buypixId, "| status:", rawStatus);

      if (!buypixId) return { received: true, error: "Missing deposit ID" };

      const isPaid = BuyPixService.isPaymentCompleted(event, rawStatus);
      if (!isPaid) return { received: true, ignored: true, event, status: rawStatus };

      // 1. Verifica se é um pagamento de criação de clan pendente
      const pendingClan = await this.pendingClanPaymentRepository.findByExternalId(buypixId);
      if (pendingClan && pendingClan.status === PendingClanPaymentStatus.PENDING) {
        await this.handlePendingClanConfirmed(pendingClan, buypixId);
        return { received: true, success: true };
      }

      // 2. Verifica se é um pagamento de renovação/upgrade
      const pixPayment = await this.pixPaymentRepository.findByExternalId(buypixId);
      if (pixPayment && pixPayment.status !== PixPaymentStatus.PAID) {
        await this.handlePaymentConfirmed(pixPayment.id, buypixId, pixPayment.clanId);
        return { received: true, success: true };
      }

      return { received: true, error: "Payment not found" };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro desconhecido";
      console.error("[PIX Webhook] erro:", error);
      return { received: true, error: message };
    }
  }

  /**
   * Cria o clan e ativa a assinatura após confirmação de pagamento de novo clan.
   */
  private async handlePendingClanConfirmed(
    pending: { id: string; userId: string; clanTag: string; clanName: string; plan: string; period: string; amount: number },
    buypixId: string,
  ) {
    // Verifica se o clan já foi criado (ex: webhook duplicado)
    const { ClanRepository } = await import("../repositories/clan.repository");
    const clanRepo = new ClanRepository();
    const existingClan = await clanRepo.findByTagAnywhere(pending.clanTag);
    if (existingClan) {
      await this.pendingClanPaymentRepository.markAsPaid(pending.id);
      return;
    }

    // Busca dados atualizados do clan na API do CoC
    const { ClashOfClansService } = await import("../services/clash-of-clans.service");
    const cocService = new ClashOfClansService();
    const clanData = await cocService.searchClanByTag(pending.clanTag);

    // Cria clan
    const clan = await this.clanService.createClan(pending.userId, pending.clanTag, clanData);

    // Cria e ativa assinatura
    const periodFrom = new Date();
    const periodTo = calcPeriodEnd(pending.period as PaymentPeriod, periodFrom);

    await this.subscriptionRepository.create({
      clanId: clan.id,
      plan: pending.plan,
      status: SubscriptionStatus.EXPIRED,
    });

    await this.subscriptionRepository.activate(clan.id, periodTo, "buypix", buypixId);
    await this.subscriptionRepository.update(clan.id, {
      plan: pending.plan,
      paymentProvider: "buypix",
      period: pending.period,
    });

    await this.pendingClanPaymentRepository.markAsPaid(pending.id);
  }

  /**
   * Ativa assinatura existente após confirmação de pagamento de renovação/upgrade.
   */
  private async handlePaymentConfirmed(pixPaymentId: string, buypixId: string, clanId: string) {
    const pixPayment = await this.pixPaymentRepository.findById(pixPaymentId);
    if (!pixPayment || pixPayment.status === PixPaymentStatus.PAID) return;

    await this.pixPaymentRepository.markAsPaid(pixPaymentId);

    if (pixPayment.upgradeOnly) {
      await this.subscriptionRepository.update(clanId, {
        plan: pixPayment.plan,
        paymentProvider: "buypix",
        pendingPlan: null,
      });
    } else {
      const periodTo = pixPayment.periodTo || calcPeriodEnd(pixPayment.period as PaymentPeriod);
      await this.subscriptionRepository.activate(clanId, periodTo, "buypix", buypixId);
      await this.subscriptionRepository.update(clanId, {
        plan: pixPayment.plan,
        paymentProvider: "buypix",
      });
    }
  }
}
