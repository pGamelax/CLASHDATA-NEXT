import { Elysia, t } from "elysia";
import { CurrentWarController } from "../controllers/current-war.controller";
import { CurrentWarService } from "../services/current-war.service";
import { CurrentWarRepository } from "../repositories/current-war.repository";
import { ClashOfClansService } from "../services/clash-of-clans.service";

// Inicializa dependências
const currentWarRepository = new CurrentWarRepository();
const clashOfClansService = new ClashOfClansService();
const currentWarService = new CurrentWarService(currentWarRepository);
const currentWarController = new CurrentWarController(currentWarService, clashOfClansService);

export const currentWarRoutes = new Elysia({ prefix: "/current-war" })
  .get(
    "/:tag",
    async (context) => await currentWarController.getCurrentWar(context),
    {
      params: t.Object({
        tag: t.String(),
      }),
      detail: {
        tags: ["Current War"],
        summary: "Buscar guerra atual do clan",
        description:
          "Retorna informações sobre a guerra atual, incluindo previsão de vitória, timeline e ataques de 3 estrelas",
      },
    }
  );

