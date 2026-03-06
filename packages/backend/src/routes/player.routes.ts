import { Elysia, t } from "elysia";
import { PlayerController } from "../controllers/player.controller";
import { betterAuthPlugin } from "../http/plugins/betterAuthPlugin";

export const playerRoutes = new Elysia({ prefix: "/player" })
  .use(betterAuthPlugin)
  .get(
    "/:playerTag",
    async (context) => await new PlayerController().getPlayer(context),
    {
      params: t.Object({
        playerTag: t.String(),
      }),
      detail: {
        tags: ["Player"],
        summary: "Buscar dados completos do jogador",
        description: "Busca dados completos do jogador incluindo histórico de guerra, CWL e amistosa. Requer assinatura ativa.",
      },
    }
  )
  .get(
    "/:playerTag/basic",
    async (context) => await new PlayerController().getPlayerBasic(context),
    {
      params: t.Object({
        playerTag: t.String(),
      }),
      detail: {
        tags: ["Player"],
        summary: "Buscar dados básicos do jogador",
        description: "Busca apenas dados básicos do jogador (sem histórico). Requer assinatura ativa.",
      },
    }
  );
