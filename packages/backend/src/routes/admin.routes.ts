import { Elysia, t } from "elysia";
import { AdminController } from "../controllers/admin.controller";
import { AdminPlansController } from "../controllers/admin-plans.controller";
import { AnnouncementController } from "../controllers/announcement.controller";

const adminController = new AdminController();
const adminPlansController = new AdminPlansController();
const announcementController = new AnnouncementController();

export const adminRoutes = new Elysia({ prefix: "/admin" })
  .get(
    "/billing",
    async (context) => await adminController.getBillingStats(context),
    { detail: { tags: ["Admin"], summary: "Estatísticas de faturamento" } }
  )
  .get(
    "/stats",
    async (context) => await adminController.getDashboardStats(context),
    { detail: { tags: ["Admin"], summary: "Estatísticas do dashboard admin" } }
  )
  .get(
    "/subscriptions",
    async (context) => await adminController.getSubscriptions(context),
    { detail: { tags: ["Admin"], summary: "Listar todas as subscriptions" } }
  )
  .get(
    "/clans",
    async (context) => await adminController.getClans(context),
    { detail: { tags: ["Admin"], summary: "Listar todos os clans" } }
  )
  .get(
    "/users",
    async (context) => await adminController.getUsers(context),
    { detail: { tags: ["Admin"], summary: "Listar todos os usuários" } }
  )
  .post(
    "/clans/create-with-subscription",
    async (context) => await adminController.createClanWithManualSubscription(context),
    {
      body: t.Object({
        ownerEmail: t.String(),
        clanTag: t.String(),
        plan: t.String(),
        daysUntilExpiry: t.Number(),
      }),
      detail: { tags: ["Admin"], summary: "Criar clan com assinatura manual (admin)" },
    }
  )
  .post(
    "/clans/:clanId/cancel-subscription",
    async (context) => await adminController.cancelClanSubscription(context),
    {
      params: t.Object({ clanId: t.String() }),
      detail: { tags: ["Admin"], summary: "Cancelar assinatura de clan (admin)" },
    }
  )
  .post(
    "/clans/:clanId/reactivate-subscription",
    async (context) => await adminController.reactivateSubscription(context),
    {
      params: t.Object({ clanId: t.String() }),
      body: t.Object({ daysUntilExpiry: t.Number() }),
      detail: { tags: ["Admin"], summary: "Reativar assinatura manual (admin)" },
    }
  )
  .delete(
    "/clans/:clanId",
    async (context) => await adminController.deleteClan(context),
    {
      params: t.Object({ clanId: t.String() }),
      detail: { tags: ["Admin"], summary: "Excluir clan (admin)" },
    }
  )
  .delete(
    "/users/:userId",
    async (context) => await adminController.deleteUser(context),
    {
      params: t.Object({ userId: t.String() }),
      detail: { tags: ["Admin"], summary: "Excluir usuário (admin)" },
    }
  )
  .put(
    "/users/:userId",
    async (context) => await adminController.updateUser(context),
    {
      params: t.Object({ userId: t.String() }),
      body: t.Object({
        name: t.Optional(t.String()),
        email: t.Optional(t.String()),
        role: t.Optional(t.String()),
        banned: t.Optional(t.Boolean()),
      }),
      detail: { tags: ["Admin"], summary: "Atualizar usuário (admin)" },
    }
  )
  .post(
    "/subscriptions/manage",
    async (context) => await adminController.manageSubscription(context),
    {
      body: t.Object({
        ownerEmail: t.String(),
        newStatus: t.Union([t.Literal("ACTIVE"), t.Literal("EXPIRED"), t.Literal("CANCELLED")]),
        activeUntil: t.Optional(t.String()),
        clanTag: t.Optional(t.String()),
        plan: t.Optional(t.String()),
      }),
      detail: { tags: ["Admin"], summary: "Criar ou gerenciar subscription manualmente" },
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
  )

  // ── Announcements ───────────────────────────────────────────────
  .get("/announcements", async (context) => announcementController.getAll(context), {
    detail: { tags: ["Admin"], summary: "Listar todos os anúncios" },
  })
  .post(
    "/announcements",
    async (context) => announcementController.create(context),
    {
      body: t.Object({ title: t.String(), content: t.String() }),
      detail: { tags: ["Admin"], summary: "Criar anúncio" },
    }
  )
  .put(
    "/announcements/:id",
    async (context) => announcementController.update(context),
    {
      params: t.Object({ id: t.String() }),
      body: t.Object({
        title: t.Optional(t.String()),
        content: t.Optional(t.String()),
        isActive: t.Optional(t.Boolean()),
      }),
      detail: { tags: ["Admin"], summary: "Atualizar anúncio" },
    }
  )
  .delete(
    "/announcements/:id",
    async (context) => announcementController.delete(context),
    {
      params: t.Object({ id: t.String() }),
      detail: { tags: ["Admin"], summary: "Excluir anúncio" },
    }
  );
