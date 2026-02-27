import { Elysia, t } from "elysia";
import { AdminController } from "../controllers/admin.controller";

const adminController = new AdminController();

export const adminRoutes = new Elysia({ prefix: "/admin" })
  .get(
    "/stats",
    async (context) => await adminController.getDashboardStats(context),
    {
      detail: {
        tags: ["Admin"],
        summary: "Estatísticas do dashboard admin",
        description: "Retorna estatísticas gerais do sistema (usuários, organizações, subscriptions).",
      },
    }
  )
  .get(
    "/subscriptions",
    async (context) => await adminController.getSubscriptions(context),
    {
      detail: {
        tags: ["Admin"],
        summary: "Listar todas as subscriptions",
        description: "Lista todas as subscriptions com informações das organizações.",
      },
    }
  )
  .get(
    "/organizations",
    async (context) => await adminController.getOrganizations(context),
    {
      detail: {
        tags: ["Admin"],
        summary: "Listar todas as organizações",
        description: "Lista todas as organizações com informações de members e clans.",
      },
    }
  )
  .get(
    "/users",
    async (context) => await adminController.getUsers(context),
    {
      detail: {
        tags: ["Admin"],
        summary: "Listar todos os usuários",
        description: "Lista todos os usuários com informações de organizações.",
      },
    }
  )
  .get(
    "/clans",
    async (context) => await adminController.getClans(context),
    {
      detail: {
        tags: ["Admin"],
        summary: "Listar todos os clans",
        description: "Lista todos os clans cadastrados com informações das organizações.",
      },
    }
  )
  .post(
    "/organizations/create",
    async (context) => await adminController.createOrganization(context),
    {
      body: t.Object({
        name: t.String(),
        slug: t.String(),
      }),
      detail: {
        tags: ["Admin"],
        summary: "Criar organização (admin)",
        description: "Cria uma organização sem subscription. Apenas para administradores.",
      },
    }
  )
  .post(
    "/organizations/:organizationId/cancel-subscription",
    async (context) => await adminController.cancelOrganizationSubscription(context),
    {
      params: t.Object({
        organizationId: t.String(),
      }),
      detail: {
        tags: ["Admin"],
        summary: "Cancelar assinatura de organização (admin)",
        description: "Cancela a assinatura de uma organização. Apenas para administradores.",
      },
    }
  )
  .delete(
    "/organizations/:organizationId",
    async (context) => await adminController.deleteOrganization(context),
    {
      params: t.Object({
        organizationId: t.String(),
      }),
      detail: {
        tags: ["Admin"],
        summary: "Excluir organização (admin)",
        description: "Exclui uma organização e todos os seus dados. Apenas para administradores.",
      },
    }
  );
