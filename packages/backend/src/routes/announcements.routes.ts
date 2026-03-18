import { Elysia } from "elysia";
import { AnnouncementController } from "../controllers/announcement.controller";

const announcementController = new AnnouncementController();

export const announcementsRoutes = new Elysia({ prefix: "/announcements" }).get(
  "/active",
  async (context: any) => announcementController.getActive(context),
  {
    detail: { tags: ["Announcements"], summary: "Listar anúncios ativos" },
  }
);
