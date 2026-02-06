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
  );
