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

      // Se não tem clan ou opponent, retorna a guerra como está (sem processar scores)
      // Isso pode acontecer em estados como "preparation" ou quando os dados ainda não estão disponíveis
      if (!war.clan || !war.opponent) {
        console.log(`Guerra ${warTag} sem clan/opponent completo. Estado: ${war.state}`);
        return war;
      }

      // Se tem clan e opponent, calcula performanceScore para ambos os lados da guerra
      try {
        const warWithScores = this.calculateWarMemberScoresForBothSides(war);
        return warWithScores;
      } catch (error) {
        // Se houver erro ao calcular scores, retorna a guerra sem scores
        console.warn(`Erro ao calcular scores da guerra ${warTag}:`, error);
        return war;
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erro desconhecido";
      console.error("Erro ao buscar guerra CWL:", error);
      
      return status(500, { message });
    }
  }
}
