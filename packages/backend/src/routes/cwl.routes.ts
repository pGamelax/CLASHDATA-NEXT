import { Elysia, t } from "elysia";
import { CWLController } from "../controllers/cwl.controller";
import { CWLService } from "../services/cwl.service";
import { CWLRepository } from "../repositories/cwl.repository";
import { ClashOfClansService } from "../services/clash-of-clans.service";

// Inicializa dependências
const cwlRepository = new CWLRepository();
const clashOfClansService = new ClashOfClansService();
const cwlService = new CWLService(cwlRepository);
const cwlController = new CWLController(cwlService, clashOfClansService);

export const cwlRoutes = new Elysia({ prefix: "/cwl" })
  .get(
    "/ranking/:tag",
    async (context) => await cwlController.getPlayerRanking(context),
    {
      params: t.Object({
        tag: t.String(),
      }),
      query: t.Object({
        seasons: t.String(), // Formato: "2026-1,2026-2" ou "2026-1"
      }),
      detail: {
        tags: ["CWL"],
        summary: "Buscar ranking de jogadores de CWL por temporada",
        description:
          "Retorna ranking de jogadores baseado em média bayesiana das temporadas de CWL do clan, filtrado por temporada(s)",
      },
    }
  );

