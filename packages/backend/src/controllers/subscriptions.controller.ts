import { SubscriptionService } from "../services/subscription.service";
import { OrganizationService } from "../services/organization.service";
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
    private organizationService: OrganizationService
  ) {}

  /**
   * Ativa uma subscription após pagamento aprovado
   * IMPORTANTE: Este endpoint deve ser chamado após confirmação do pagamento
   */
  async activateSubscription(context: ElysiaContext) {
    const { body, request, status } = context;
    try {
      // Verifica autenticação
      const session = await auth.api.getSession({
        headers: request.headers,
      });

      if (!session || !session.user) {
        return status(401, { message: "Não autenticado" });
      }

      const { organizationId, currentPeriodEnd, paymentProvider, paymentProviderId } =
        body as {
          organizationId: string;
          currentPeriodEnd: string; // ISO date string
          paymentProvider?: string;
          paymentProviderId?: string;
        };

      // Verifica se o usuário é owner da organização
      const access = await this.organizationService.canUserAccessOrganization(
        session.user.id,
        organizationId
      );

      if (!access.canAccess || access.role !== "owner") {
        return status(403, {
          message: "Apenas o dono da organização pode ativar a assinatura",
        });
      }

      // Ativa a subscription
      const subscription = await this.organizationService.activateSubscriptionAfterPayment(
        organizationId,
        new Date(currentPeriodEnd),
        paymentProvider,
        paymentProviderId
      );

      return {
        success: true,
        subscription,
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erro desconhecido";

      console.error("Erro ao ativar subscription:", error);
      return status(500, { message });
    }
  }

  /**
   * Busca informações da subscription de uma organização
   */
  async getSubscription(context: ElysiaContext) {
    const { params, request, status } = context;
    try {
      // Verifica autenticação
      const session = await auth.api.getSession({
        headers: request.headers,
      });

      if (!session || !session.user) {
        return status(401, { message: "Não autenticado" });
      }

      const { organizationId } = params as { organizationId: string };

      // Verifica se o usuário tem acesso à organização
      const access = await this.organizationService.canUserAccessOrganization(
        session.user.id,
        organizationId
      );

      if (!access.canAccess) {
        return status(403, { message: access.reason || "Acesso negado" });
      }

      // Busca a subscription
      const { SubscriptionRepository } = await import(
        "../repositories/subscription.repository"
      );
      const subscriptionRepository = new SubscriptionRepository();
      const subscription = await subscriptionRepository.findByOrganizationId(
        organizationId
      );

      if (!subscription) {
        return status(404, { message: "Subscription não encontrada" });
      }

      // Calcula se está ativa
      const isActive = this.subscriptionService.isSubscriptionActive(
        subscription
      );

      // Busca limites do plano
      const limits = this.subscriptionService.getPlanLimits(subscription.plan);

      // Busca contadores atuais
      // Passa userId para verificar se é admin (admins têm limites ilimitados)
      const canAddClan = await this.subscriptionService.canAddClan(
        organizationId,
        session.user.id
      );
      const canAddInvite = await this.subscriptionService.canAddInvite(
        organizationId,
        session.user.id
      );

      return {
        success: true,
        subscription: {
          ...subscription,
          isActive,
          limits,
          usage: {
            clans: {
              current: canAddClan.currentCount,
              max: canAddClan.maxCount,
              canAdd: canAddClan.canAdd,
            },
            invites: {
              current: canAddInvite.currentCount,
              max: canAddInvite.maxCount,
              canAdd: canAddInvite.canAdd,
            },
          },
        },
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erro desconhecido";

      console.error("Erro ao buscar subscription:", error);
      return status(500, { message });
    }
  }

  /**
   * Cancela uma subscription
   */
  async cancelSubscription(context: ElysiaContext) {
    const { params, request, status } = context;
    try {
      // Verifica autenticação
      const session = await auth.api.getSession({
        headers: request.headers,
      });

      if (!session || !session.user) {
        return status(401, { message: "Não autenticado" });
      }

      const { organizationId } = params as { organizationId: string };

      // Verifica se o usuário é owner da organização
      const access = await this.organizationService.canUserAccessOrganization(
        session.user.id,
        organizationId
      );

      if (!access.canAccess || access.role !== "owner") {
        return status(403, {
          message: "Apenas o dono da organização pode cancelar a assinatura",
        });
      }

      // Cancela a subscription
      const { SubscriptionRepository } = await import(
        "../repositories/subscription.repository"
      );
      const subscriptionRepository = new SubscriptionRepository();
      const subscription = await subscriptionRepository.cancel(organizationId);

      return {
        success: true,
        subscription,
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erro desconhecido";

      console.error("Erro ao cancelar subscription:", error);
      return status(500, { message });
    }
  }

  /**
   * Lista os planos disponíveis
   */
  async getPlans(context: ElysiaContext) {
    const { status } = context;
    try {
      const plans = [
        {
          id: "MESTRE",
          name: "Mestre",
          price: 29.9,
          limits: this.subscriptionService.getPlanLimits("MESTRE"),
        },
        {
          id: "CAMPEAO",
          name: "Campeão",
          price: 45.9,
          limits: this.subscriptionService.getPlanLimits("CAMPEAO"),
        },
        {
          id: "TITA",
          name: "Titã",
          price: 74.9,
          limits: this.subscriptionService.getPlanLimits("TITA"),
        },
      ];

      return {
        success: true,
        plans,
        trialDays: 3,
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erro desconhecido";

      console.error("Erro ao listar planos:", error);
      return status(500, { message });
    }
  }
}
