import { Elysia, t } from "elysia";
import { CurrentCWLController } from "../controllers/current-cwl.controller";
import { CurrentCWLService } from "../services/current-cwl.service";
import { CurrentCWLRepository } from "../repositories/current-cwl.repository";

// Inicializa dependências
const currentCWLRepository = new CurrentCWLRepository();
const currentCWLService = new CurrentCWLService(currentCWLRepository);
const currentCWLController = new CurrentCWLController(currentCWLService);

export const currentCWLRoutes = new Elysia({ prefix: "/current-cwl" })
  .get(
    "/war/:warTag",
    async (context) => await currentCWLController.getCWLWar(context),
    {
      params: t.Object({
        warTag: t.String(),
      }),
      detail: {
        tags: ["Current CWL"],
        summary: "Buscar guerra específica da CWL",
        description: "Retorna dados detalhados de uma guerra específica da CWL pelo warTag",
      },
    }
  )
  .get(
    "/:tag",
    async (context) => await currentCWLController.getCurrentCWL(context),
    {
      params: t.Object({
        tag: t.String(),
      }),
      detail: {
        tags: ["Current CWL"],
        summary: "Buscar CWL atual do clan",
        description:
          "Retorna informações sobre a temporada atual da CWL, incluindo grupo, rodadas e guerra atual",
      },
    }
  )
  .get(
    "/:tag/townhalls",
    async (context) => await currentCWLController.getClansTownHalls(context),
    {
      params: t.Object({
        tag: t.String(),
      }),
      detail: {
        tags: ["Current CWL"],
        summary: "Buscar Town Halls dos clãs do CWL",
        description:
          "Retorna a contagem de membros por Town Hall level para cada clã do grupo CWL",
      },
    }
  )
  
