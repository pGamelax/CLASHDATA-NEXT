import { Elysia, t } from "elysia";
import { PixController } from "../controllers/pix.controller";
import { BuyPixService } from "../services/buypix.service";
import { SubscriptionRepository } from "../repositories/subscription.repository";
import { PixPaymentRepository } from "../repositories/pix-payment.repository";
import { PendingClanPaymentRepository } from "../repositories/pending-clan-payment.repository";
import { ClanService } from "../services/clan.service";
import { ClanRepository } from "../repositories/clan.repository";
import { ClashOfClansService } from "../services/clash-of-clans.service";
import { SubscriptionService } from "../services/subscription.service";

const buyPixService = new BuyPixService();
const subscriptionRepository = new SubscriptionRepository();
const pixPaymentRepository = new PixPaymentRepository();
const pendingClanPaymentRepository = new PendingClanPaymentRepository();
const clanRepository = new ClanRepository();
const clashOfClansService = new ClashOfClansService();
const subscriptionService = new SubscriptionService(subscriptionRepository);
const clanService = new ClanService(clanRepository, clashOfClansService);

const pixController = new PixController(
  buyPixService,
  subscriptionRepository,
  pixPaymentRepository,
  pendingClanPaymentRepository,
  clanService,
  subscriptionService,
);

export const pixWebhookRoute = new Elysia({ prefix: "/pix" })
  .post(
    "/webhook",
    async (context: any) => pixController.handleWebhook(context),
    {
      type: "text",
      detail: { tags: ["PIX"], summary: "Webhook BuyPix" },
    }
  );

export const pixRoutes = new Elysia({ prefix: "/pix" })
  .get(
    "/check-trial",
    async (context) => pixController.checkTrialStatus(context),
    { detail: { tags: ["PIX"], summary: "Verifica se usuário já usou trial" } }
  )
  .get(
    "/pending-clan",
    async (context) => pixController.getPendingClanStatus(context),
    { detail: { tags: ["PIX"], summary: "Status do pagamento pendente de criação de clan" } }
  )
  .post(
    "/create-clan",
    async (context) => pixController.createClanWithTrial(context),
    {
      body: t.Object({
        clanTag: t.String(),
        plan: t.String(),
        period: t.Union([
          t.Literal("monthly"),
          t.Literal("quarterly"),
          t.Literal("yearly"),
        ]),
      }),
      detail: { tags: ["PIX"], summary: "Criar clan (trial imediato ou PIX se já usou trial)" },
    }
  )
  .post(
    "/create-payment",
    async (context) => pixController.createPixPayment(context),
    {
      body: t.Object({
        clanId: t.String(),
        plan: t.String(),
        period: t.Union([
          t.Literal("monthly"),
          t.Literal("quarterly"),
          t.Literal("yearly"),
        ]),
        upgradeOnly: t.Optional(t.Boolean()),
      }),
      detail: { tags: ["PIX"], summary: "Gerar cobrança PIX de renovação/upgrade" },
    }
  )
  .post(
    "/downgrade",
    async (context) => pixController.scheduleDowngrade(context),
    {
      body: t.Object({
        clanId: t.String(),
        plan: t.String(),
      }),
      detail: { tags: ["PIX"], summary: "Agendar downgrade" },
    }
  )
  .get(
    "/status/:clanId",
    async (context) => pixController.getPixStatus(context),
    {
      params: t.Object({ clanId: t.String() }),
      detail: { tags: ["PIX"], summary: "Status do PIX pendente de renovação do clan" },
    }
  );
