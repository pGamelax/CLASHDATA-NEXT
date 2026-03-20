import { Elysia } from "elysia";
import { betterAuthPlugin } from "../http/plugins/betterAuthPlugin";
import { SeasonEndDateController } from "../controllers/season-end-date.controller";

const controller = new SeasonEndDateController();

export const seasonEndDateRoutes = new Elysia()
  .use(betterAuthPlugin)
  // Admin routes
  .post("/admin/season-dates", (ctx) => controller.create(ctx))
  .get("/admin/season-dates", (ctx) => controller.list(ctx))
  .delete("/admin/season-dates/:id", (ctx) => controller.remove(ctx))
  .post("/admin/season-dates/:id/trigger", (ctx) => controller.triggerNow(ctx))
  // Clan page route
  .get("/season-snapshots/clan/:clanTag", (ctx) => controller.getSnapshotsByClan(ctx))
  // Public route (no auth) - just dates for filtering
  .get("/season-dates", (ctx) => controller.listPublic(ctx));
