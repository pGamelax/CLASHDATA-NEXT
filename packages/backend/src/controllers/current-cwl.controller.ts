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

      const war = await this.repository.getCWLWar(warTag);
      
      // Valida se os dados básicos da guerra existem
      if (!war) {
        return status(404, { message: "Guerra não encontrada" });
      }

      if (!war.clan || !war.opponent) {
        return status(422, { 
          message: "Dados da guerra incompletos: a guerra pode ainda não ter sido iniciada ou os dados não estão disponíveis" 
        });
      }

      // Calcula performanceScore para ambos os lados da guerra
      const warWithScores = this.calculateWarMemberScoresForBothSides(war);
      
      return warWithScores;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erro desconhecido";
      console.error("Erro ao buscar guerra CWL:", error);
      
      // Retorna status 422 se for erro de dados incompletos
      if (message.includes("incompletos")) {
        return status(422, { message });
      }
      
      return status(500, { message });
    }
  }
}
