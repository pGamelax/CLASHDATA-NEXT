import { Elysia, t } from "elysia";
import { WarsController } from "../controllers/wars.controller";
import { WarService } from "../services/war.service";
import { WarRepository } from "../repositories/war.repository";
import { ClashOfClansService } from "../services/clash-of-clans.service";

// Inicializa dependências
const warRepository = new WarRepository();
const clashOfClansService = new ClashOfClansService();
const warService = new WarService(warRepository);
const warsController = new WarsController(warService, clashOfClansService);

export const warsRoutes = new Elysia({ prefix: "/wars" })
  .get(
    "/ranking/:tag",
    async (context) => await warsController.getPlayerRanking(context),
    {
      params: t.Object({
        tag: t.String(),
      }),
      query: t.Object({
        months: t.String(), // Formato: "2024-1,2024-2" ou "2024-1"
      }),
      detail: {
        tags: ["Wars"],
        summary: "Buscar ranking de jogadores por mês",
        description:
          "Retorna ranking de jogadores baseado em média bayesiana das últimas guerras do clan, filtrado por mês(s)",
      },
    }
  )
  .get(
    "/:tag/month",
    async (context) => await warsController.getWarsByMonth(context),
    {
      params: t.Object({
        tag: t.String(),
      }),
      query: t.Object({
        year: t.Optional(t.String()),
        month: t.Optional(t.String()),
      }),
      detail: {
        tags: ["Wars"],
        summary: "Buscar guerras por mês",
        description: "Retorna todas as guerras de um mês específico",
      },
    }
  );

