import { SubscriptionService } from "../services/subscription.service";
import { ClanService } from "../services/clan.service";
import { auth } from "../auth";

type ElysiaContext = {
  params?: Record<string, string>;
  body?: any;
  request: Request;
  status: (code: number, data?: any) => any;
};

export class SubscriptionsController {
  constructor(
    private subscriptionService: SubscriptionService,
    private clanService: ClanService
  ) {}

  async activateSubscription(context: ElysiaContext) {
    const { body, request, status } = context;
    try {
      const session = await auth.api.getSession({ headers: request.headers });
      if (!session?.user) return status(401, { message: "Não autenticado" });

      const { clanId, currentPeriodEnd, paymentProvider, paymentProviderId } = body as {
        clanId: string;
        currentPeriodEnd: string;
        paymentProvider?: string;
        paymentProviderId?: string;
      };

      const access = await this.clanService.canUserAccessClan(session.user.id, clanId);
      if (!access.canAccess || access.role !== "owner") {
        return status(403, { message: "Apenas o dono do clan pode ativar a assinatura" });
      }

      const subscription = await this.subscriptionService.activateSubscription(
        clanId,
        new Date(currentPeriodEnd),
        paymentProvider,
        paymentProviderId
      );

      return { success: true, subscription };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro desconhecido";
      console.error("Erro ao ativar subscription:", error);
      return status(500, { message });
    }
  }

  async getSubscription(context: ElysiaContext) {
    const { params, request, status } = context;
    try {
      const session = await auth.api.getSession({ headers: request.headers });
      if (!session?.user) return status(401, { message: "Não autenticado" });

      const { clanId } = params as { clanId: string };

      const access = await this.clanService.canUserAccessClan(session.user.id, clanId);
      if (!access.canAccess) return status(403, { message: access.reason || "Acesso negado" });

      const { SubscriptionRepository } = await import("../repositories/subscription.repository");
      const subscriptionRepository = new SubscriptionRepository();
      const subscription = await subscriptionRepository.findByClanId(clanId);

      if (!subscription) return status(404, { message: "Subscription não encontrada" });

      const isActive = this.subscriptionService.isSubscriptionActive(subscription);
      const limits = this.subscriptionService.getPlanLimits(subscription.plan);

      return {
        success: true,
        subscription: { ...subscription, isActive, limits },
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro desconhecido";
      console.error("Erro ao buscar subscription:", error);
      return status(500, { message });
    }
  }

  async cancelSubscription(context: ElysiaContext) {
    const { params, request, status } = context;
    try {
      const session = await auth.api.getSession({ headers: request.headers });
      if (!session?.user) return status(401, { message: "Não autenticado" });

      const { clanId } = params as { clanId: string };

      const access = await this.clanService.canUserAccessClan(session.user.id, clanId);
      if (!access.canAccess || access.role !== "owner") {
        return status(403, { message: "Apenas o dono do clan pode cancelar a assinatura" });
      }

      const { SubscriptionRepository } = await import("../repositories/subscription.repository");
      const subscriptionRepository = new SubscriptionRepository();
      const subscription = await subscriptionRepository.cancel(clanId);

      return {
        success: true,
        subscription,
        message: "Assinatura cancelada. O clan foi mantido.",
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro desconhecido";
      console.error("Erro ao cancelar subscription:", error);
      return status(500, { message });
    }
  }

  async getPlans(context: ElysiaContext) {
    const { status } = context;
    try {
      const { prisma } = await import("../lib/prisma");
      const plans = await prisma.plan.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
      });
      return { success: true, plans, trialDays: 3 };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro desconhecido";
      return status(500, { message });
    }
  }
}
