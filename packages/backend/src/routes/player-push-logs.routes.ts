import { Elysia, t } from "elysia";
import { PlayerPushLogsController } from "../controllers/player-push-logs.controller";

const playerPushLogsController = new PlayerPushLogsController();

export const playerPushLogsRoutes = new Elysia({ prefix: "/player-push" })
  .get(
    "/clan/:clanTag",
    async (context) => await playerPushLogsController.getPlayersByClan(context),
    {
      params: t.Object({
        clanTag: t.String(),
      }),
    }
  );
