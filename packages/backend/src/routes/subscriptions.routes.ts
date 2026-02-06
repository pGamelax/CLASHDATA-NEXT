import { Elysia, t } from "elysia";
import { SubscriptionsController } from "../controllers/subscriptions.controller";
import { SubscriptionService } from "../services/subscription.service";
import { SubscriptionRepository } from "../repositories/subscription.repository";
import { OrganizationService } from "../services/organization.service";
import { OrganizationRepository } from "../repositories/organization.repository";

// Inicializa dependências
const subscriptionRepository = new SubscriptionRepository();
const subscriptionService = new SubscriptionService(subscriptionRepository);
const organizationRepository = new OrganizationRepository();
const organizationService = new OrganizationService(
  organizationRepository,
  subscriptionService
);
const subscriptionsController = new SubscriptionsController(
  subscriptionService,
  organizationService
);

export const subscriptionsRoutes = new Elysia({ prefix: "/subscriptions" })
  .get(
    "/plans",
    async (context) => await subscriptionsController.getPlans(context),
    {
      detail: {
        tags: ["Subscriptions"],
        summary: "Listar planos disponíveis",
        description: "Retorna todos os planos de assinatura disponíveis",
      },
    }
  )
  .get(
    "/organization/:organizationId",
    async (context) =>
      await subscriptionsController.getSubscription(context),
    {
      params: t.Object({
        organizationId: t.String(),
      }),
      detail: {
        tags: ["Subscriptions"],
        summary: "Buscar subscription de uma organização",
        description:
          "Busca informações da subscription de uma organização. Apenas membros podem acessar.",
      },
    }
  )
  .post(
    "/activate",
    async (context) =>
      await subscriptionsController.activateSubscription(context),
    {
      body: t.Object({
        organizationId: t.String(),
        currentPeriodEnd: t.String(), // ISO date string
        paymentProvider: t.Optional(t.String()),
        paymentProviderId: t.Optional(t.String()),
      }),
      detail: {
        tags: ["Subscriptions"],
        summary: "Ativar subscription após pagamento",
        description:
          "Ativa uma subscription após confirmação do pagamento. Apenas o dono pode ativar.",
      },
    }
  )
  .post(
    "/:organizationId/cancel",
    async (context) =>
      await subscriptionsController.cancelSubscription(context),
    {
      params: t.Object({
        organizationId: t.String(),
      }),
      detail: {
        tags: ["Subscriptions"],
        summary: "Cancelar subscription",
        description:
          "Cancela uma subscription. Apenas o dono pode cancelar.",
      },
    }
  );
