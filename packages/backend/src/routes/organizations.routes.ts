import { Elysia, t } from "elysia";
import { OrganizationsController } from "../controllers/organizations.controller";
import { OrganizationRepository } from "../repositories/organization.repository";
import { OrganizationService } from "../services/organization.service";
import { SubscriptionService } from "../services/subscription.service";
import { SubscriptionRepository } from "../repositories/subscription.repository";

// Inicializa dependências
const organizationRepository = new OrganizationRepository();
const subscriptionRepository = new SubscriptionRepository();
const subscriptionService = new SubscriptionService(subscriptionRepository);
const organizationService = new OrganizationService(
  organizationRepository,
  subscriptionService
);
const organizationsController = new OrganizationsController(
  organizationService
);

export const organizationsRoutes = new Elysia({ prefix: "/organizations" })
  .get(
    "/list",
    async (context) => await organizationsController.listOrganizations(context),
    {
      detail: {
        tags: ["Organizations"],
        summary: "Listar organizações do usuário",
        description:
          "Lista todas as organizações do usuário autenticado com suas subscriptions.",
      },
    }
  )
  .post(
    "/create",
    async (context) => await organizationsController.createOrganization(context),
    {
      body: t.Object({
        name: t.String(),
        slug: t.String(),
        plan: t.Optional(t.Union([
          t.Literal("MESTRE"),
          t.Literal("CAMPEAO"),
          t.Literal("TITA"),
        ])),
      }),
      detail: {
        tags: ["Organizations"],
        summary: "Criar organização",
        description:
          "Cria uma nova organização. Admins podem criar sem plano. Usuários normais devem usar o checkout do Stripe.",
      },
    }
  )
  .get(
    "/:id",
    async (context) => await organizationsController.getOrganization(context),
    {
      params: t.Object({
        id: t.String(),
      }),
      detail: {
        tags: ["Organizations"],
        summary: "Buscar organização",
        description:
          "Busca uma organização por ID ou slug. Apenas membros podem acessar.",
      },
    }
  )
  .put(
    "/:id",
    async (context) => await organizationsController.updateOrganization(context),
    {
      params: t.Object({
        id: t.String(),
      }),
      body: t.Object({
        name: t.Optional(t.String()),
        slug: t.Optional(t.String()),
      }),
      detail: {
        tags: ["Organizations"],
        summary: "Atualizar organização",
        description: "Atualiza o nome ou slug de uma organização. Apenas o dono pode atualizar.",
      },
    }
  )
  .delete(
    "/:id",
    async (context) => await organizationsController.deleteOrganization(context),
    {
      params: t.Object({
        id: t.String(),
      }),
      detail: {
        tags: ["Organizations"],
        summary: "Deletar organização",
        description: "Deleta uma organização e todos os seus dados relacionados. Apenas o dono pode deletar.",
      },
    }
  );

