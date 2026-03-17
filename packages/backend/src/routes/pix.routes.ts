import { Elysia, t } from "elysia";
import { PixController } from "../controllers/pix.controller";
import { SyncPayService } from "../services/syncpay.service";
import { SubscriptionRepository } from "../repositories/subscription.repository";
import { PixPaymentRepository } from "../repositories/pix-payment.repository";
import { OrganizationService } from "../services/organization.service";
import { OrganizationRepository } from "../repositories/organization.repository";
import { SubscriptionService } from "../services/subscription.service";

const syncPayService = new SyncPayService();
const subscriptionRepository = new SubscriptionRepository();
const pixPaymentRepository = new PixPaymentRepository();
const organizationRepository = new OrganizationRepository();
const subscriptionService = new SubscriptionService(subscriptionRepository);
const organizationService = new OrganizationService(organizationRepository, subscriptionService);

const pixController = new PixController(
  syncPayService,
  subscriptionRepository,
  pixPaymentRepository,
  organizationService,
  subscriptionService,
);

export const pixWebhookRoute = new Elysia({ prefix: "/pix" })
  .post(
    "/webhook",
    async (context: any) => pixController.handleWebhook(context),
    {
      type: "json",
      detail: {
        tags: ["PIX"],
        summary: "Webhook SyncPay",
        description: "Recebe notificações de pagamento do SyncPay.",
      },
    }
  );

export const pixRoutes = new Elysia({ prefix: "/pix" })
  .get(
    "/check-trial",
    async (context) => await pixController.checkTrialStatus(context),
    {
      detail: {
        tags: ["PIX"],
        summary: "Verifica se usuário já usou trial",
        description: "Retorna { hasUsedTrial: boolean } para o usuário autenticado.",
      },
    }
  )
  .post(
    "/create-org",
    async (context) => await pixController.createOrgWithTrial(context),
    {
      body: t.Object({
        name: t.String(),
        plan: t.String(),
        period: t.Union([
          t.Literal("monthly"),
          t.Literal("quarterly"),
          t.Literal("yearly"),
        ]),
      }),
      detail: {
        tags: ["PIX"],
        summary: "Criar organização com trial",
        description:
          "Cria organização com trial de 3 dias e gera QR code PIX. O usuário pode pagar agora ou nos próximos 3 dias.",
      },
    }
  )
  .post(
    "/create-payment",
    async (context) => await pixController.createPixPayment(context),
    {
      body: t.Object({
        organizationId: t.String(),
        plan: t.String(),
        period: t.Union([
          t.Literal("monthly"),
          t.Literal("quarterly"),
          t.Literal("yearly"),
        ]),
      }),
      detail: {
        tags: ["PIX"],
        summary: "Gerar cobrança PIX",
        description: "Gera nova cobrança PIX para ativar ou renovar assinatura.",
      },
    }
  )
  .get(
    "/status/:organizationId",
    async (context) => await pixController.getPixStatus(context),
    {
      params: t.Object({ organizationId: t.String() }),
      detail: {
        tags: ["PIX"],
        summary: "Status do PIX pendente",
        description: "Retorna o PIX pendente da organização para exibição do QR code.",
      },
    }
  );
