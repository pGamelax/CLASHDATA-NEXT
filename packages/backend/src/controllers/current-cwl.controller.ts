import { CurrentCWLService } from "../services/current-cwl.service";
import { CurrentCWLRepository } from "../repositories/current-cwl.repository";
import { CWLWarData } from "../repositories/current-cwl.repository";

type ElysiaContext = {
  params?: Record<string, string>;
  request: Request;
  status: (code: number, data?: any) => any;
};

export class CurrentCWLController {
  private repository = new CurrentCWLRepository();

  constructor(private currentCWLService: CurrentCWLService) {}

  /**
   * Calcula performanceScore para ambos os lados da guerra
   */
  private calculateWarMemberScoresForBothSides(war: CWLWarData): CWLWarData {
    return this.currentCWLService.calculateWarMemberScoresForBothSides(war);
  }

  async getCurrentCWL(context: ElysiaContext) {
    const { params, status } = context;
    try {
      const tag = params?.tag;
      if (!tag) {
        return status(400, { message: "Tag do clan é obrigatória" });
      }

      const analysis = await this.currentCWLService.getCurrentCWL(tag);
      return analysis;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erro desconhecido";
      console.error("Erro ao buscar CWL atual:", error);
      return status(500, { message });
    }
  }

  async getCWLWar(context: ElysiaContext) {
    const { params, status } = context;
    try {
      const warTag = params?.warTag;
      if (!warTag) {
        return status(400, { message: "WarTag é obrigatório" });
      }

      const war = await this.repository.getCWLWar("#" + warTag);
      
      // Valida se os dados básicos da guerra existem
      if (!war) {
        return status(404, { message: "Guerra não encontrada" });
      }

     
      if (!war.clan || !war.opponent) {
        return war;
      }

      try {
        const warWithScores = this.calculateWarMemberScoresForBothSides(war);
        return warWithScores;
      } catch (error) {
        return war;
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erro desconhecido";
      console.error("Erro ao buscar guerra CWL:", error);
      
      return status(500, { message });
    }
  }

  async getClansTownHalls(context: ElysiaContext) {
    const { params, status } = context;
    try {
      const tag = params?.tag;
      if (!tag) {
        return status(400, { message: "Tag do clan é obrigatória" });
      }

      const data = await this.currentCWLService.getClansTownHalls(tag);
      return data;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erro desconhecido";
      console.error("Erro ao buscar Town Halls dos clãs:", error);
      return status(500, { message });
    }
  }
}
