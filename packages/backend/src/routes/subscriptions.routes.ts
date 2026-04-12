import { Elysia, t } from "elysia";
import { SubscriptionsController } from "../controllers/subscriptions.controller";
import { SubscriptionService } from "../services/subscription.service";
import { SubscriptionRepository } from "../repositories/subscription.repository";
import { ClanService } from "../services/clan.service";
import { ClanRepository } from "../repositories/clan.repository";
import { ClashOfClansService } from "../services/clash-of-clans.service";

const subscriptionRepository = new SubscriptionRepository();
const subscriptionService = new SubscriptionService(subscriptionRepository);
const clanRepository = new ClanRepository();
const clashOfClansService = new ClashOfClansService();
const clanService = new ClanService(clanRepository, clashOfClansService);
const subscriptionsController = new SubscriptionsController(subscriptionService, clanService);

export const subscriptionsRoutes = new Elysia({ prefix: "/subscriptions" })
  .get(
    "/plans",
    async (context) => subscriptionsController.getPlans(context),
    { detail: { tags: ["Subscriptions"], summary: "Listar planos disponíveis" } }
  )
  .get(
    "/clan/:clanId",
    async (context) => subscriptionsController.getSubscription(context),
    {
      params: t.Object({ clanId: t.String() }),
      detail: { tags: ["Subscriptions"], summary: "Buscar subscription de um clan" },
    }
  )
  .post(
    "/activate",
    async (context) => subscriptionsController.activateSubscription(context),
    {
      body: t.Object({
        clanId: t.String(),
        currentPeriodEnd: t.String(),
        paymentProvider: t.Optional(t.String()),
        paymentProviderId: t.Optional(t.String()),
      }),
      detail: { tags: ["Subscriptions"], summary: "Ativar subscription após pagamento" },
    }
  )
  .post(
    "/:clanId/cancel",
    async (context) => subscriptionsController.cancelSubscription(context),
    {
      params: t.Object({ clanId: t.String() }),
      detail: { tags: ["Subscriptions"], summary: "Cancelar subscription" },
    }
  );
