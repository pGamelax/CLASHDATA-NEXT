import { Elysia, t } from "elysia";
import { AdminController } from "../controllers/admin.controller";
import { AdminPlansController } from "../controllers/admin-plans.controller";

const adminController = new AdminController();
const adminPlansController = new AdminPlansController();

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
  )
  .delete(
    "/users/:userId",
    async (context) => await adminController.deleteUser(context),
    {
      params: t.Object({
        userId: t.String(),
      }),
      detail: {
        tags: ["Admin"],
        summary: "Excluir usuário (admin)",
        description: "Exclui um usuário e todos os seus dados. Apenas para administradores.",
      },
    }
  )
  .put(
    "/users/:userId",
    async (context) => await adminController.updateUser(context),
    {
      params: t.Object({
        userId: t.String(),
      }),
      body: t.Object({
        name: t.Optional(t.String()),
        email: t.Optional(t.String()),
        role: t.Optional(t.String()),
        banned: t.Optional(t.Boolean()),
      }),
      detail: {
        tags: ["Admin"],
        summary: "Atualizar usuário (admin)",
        description: "Atualiza informações de um usuário. Apenas para administradores.",
      },
    }
  )
  .put(
    "/organizations/:organizationId",
    async (context) => await adminController.updateOrganization(context),
    {
      params: t.Object({
        organizationId: t.String(),
      }),
      body: t.Object({
        name: t.Optional(t.String()),
        slug: t.Optional(t.String()),
      }),
      detail: {
        tags: ["Admin"],
        summary: "Atualizar organização (admin)",
        description: "Atualiza informações de uma organização. Apenas para administradores.",
      },
    }
  )
  .delete(
    "/clans/:clanId",
    async (context) => await adminController.deleteClan(context),
    {
      params: t.Object({
        clanId: t.String(),
      }),
      detail: {
        tags: ["Admin"],
        summary: "Excluir clan (admin)",
        description: "Exclui um clan. Apenas para administradores.",
      },
    }
  )
  .post(
    "/organizations/create-with-subscription",
    async (context) => await adminController.createOrganizationWithManualSubscription(context),
    {
      body: t.Object({
        name: t.String(),
        slug: t.String(),
        ownerEmail: t.String(),
        plan: t.String(),
        daysUntilExpiry: t.Number(),
      }),
      detail: {
        tags: ["Admin"],
        summary: "Criar organização com assinatura manual (admin)",
        description: "Cria uma organização com assinatura manual (valor 0,00) para um usuário específico. Apenas para administradores.",
      },
    }
  )
  .post(
    "/organizations/:organizationId/reactivate-subscription",
    async (context) => await adminController.reactivateSubscription(context),
    {
      params: t.Object({
        organizationId: t.String(),
      }),
      body: t.Object({
        daysUntilExpiry: t.Number(),
      }),
      detail: {
        tags: ["Admin"],
        summary: "Reativar assinatura manual (admin)",
        description: "Reativa uma assinatura manual após pagamento. Apenas para administradores.",
      },
    }
  )

  // ── Plan management ────────────────────────────────────────────
  .get("/plans", async (context) => adminPlansController.getPlans(context), {
    detail: { tags: ["Admin"], summary: "Listar todos os planos" },
  })
  .post("/plans/seed", async (context) => adminPlansController.seedPlans(context), {
    detail: { tags: ["Admin"], summary: "Seed planos padrão" },
  })
  .post(
    "/plans",
    async (context) => adminPlansController.createPlan(context),
    {
      body: t.Object({
        key: t.String(),
        name: t.String(),
        description: t.Optional(t.String()),
        monthlyPrice: t.Number(),
        quarterlyPrice: t.Number(),
        yearlyPrice: t.Number(),
        originalQuarterlyPrice: t.Optional(t.Nullable(t.Number())),
        originalYearlyPrice: t.Optional(t.Nullable(t.Number())),
        maxClans: t.Number(),
        maxInvites: t.Number(),
        icon: t.Optional(t.String()),
        color: t.Optional(t.String()),
        features: t.Optional(t.Array(t.String())),
        isPopular: t.Optional(t.Boolean()),
        isActive: t.Optional(t.Boolean()),
        sortOrder: t.Optional(t.Number()),
      }),
      detail: { tags: ["Admin"], summary: "Criar plano" },
    }
  )
  .put(
    "/plans/:id",
    async (context) => adminPlansController.updatePlan(context),
    {
      params: t.Object({ id: t.String() }),
      body: t.Object({
        key: t.Optional(t.String()),
        name: t.Optional(t.String()),
        description: t.Optional(t.String()),
        monthlyPrice: t.Optional(t.Number()),
        quarterlyPrice: t.Optional(t.Number()),
        yearlyPrice: t.Optional(t.Number()),
        originalQuarterlyPrice: t.Optional(t.Nullable(t.Number())),
        originalYearlyPrice: t.Optional(t.Nullable(t.Number())),
        maxClans: t.Optional(t.Number()),
        maxInvites: t.Optional(t.Number()),
        icon: t.Optional(t.String()),
        color: t.Optional(t.String()),
        features: t.Optional(t.Array(t.String())),
        isPopular: t.Optional(t.Boolean()),
        isActive: t.Optional(t.Boolean()),
        sortOrder: t.Optional(t.Number()),
      }),
      detail: { tags: ["Admin"], summary: "Atualizar plano" },
    }
  )
  .delete(
    "/plans/:id",
    async (context) => adminPlansController.deletePlan(context),
    {
      params: t.Object({ id: t.String() }),
      detail: { tags: ["Admin"], summary: "Excluir plano" },
    }
  );
