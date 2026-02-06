import { ClashOfClansService } from "../services/clash-of-clans.service";
import { WarService } from "../services/war.service";
import { auth } from "../auth";

type ElysiaContext = {
  params?: Record<string, string>;
  query?: Record<string, string>;
  request: Request;
  status: (code: number, data?: any) => any;
};

export class WarsController {
  constructor(
    private warService: WarService,
    private clashOfClansService: ClashOfClansService
  ) {}

  async getPlayerRanking(context: ElysiaContext) {
    try {
      const { params, query, status } = context;
      const { tag } = params as { tag: string };

      // Parse meses da query string (formato: "2024-1,2024-2" ou "2024-1")
      const monthsParam = query?.months || "";
      if (!monthsParam) {
        return status(400, {
          message: "Parâmetro 'months' é obrigatório (formato: '2024-1,2024-2')",
        });
      }

      const months = monthsParam.split(",").map((monthStr) => {
        const [year, month] = monthStr.split("-").map(Number);
        if (!year || !month || month < 1 || month > 12) {
          throw new Error(`Formato de mês inválido: ${monthStr}`);
        }
        return { year, month };
      });

      const ranking = await this.warService.getPlayerRanking(tag, months);

      return {
        success: true,
        data: ranking,
        months: months,
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erro desconhecido";

      if (message.includes("não encontrada") || message.includes("não encontrado")) {
        return status(404, { message });
      }

      if (message.includes("inválido")) {
        return status(400, { message });
      }

      console.error("Erro ao buscar ranking de jogadores:", error);
      return status(500, { message });
    }
  }

  async getWarsByMonth(context: ElysiaContext) {
    try {
      const { params, query, status } = context;
      const { tag } = params as { tag: string };

      const year = query?.year ? parseInt(query.year) : new Date().getFullYear();
      const month = query?.month
        ? parseInt(query.month)
        : new Date().getMonth() + 1;

      if (month < 1 || month > 12) {
        return status(400, { message: "Mês deve estar entre 1 e 12" });
      }

      const wars = await this.warService.getWarsByMonth(tag, year, month);

      return {
        success: true,
        data: wars,
        year,
        month,
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erro desconhecido";

      if (message.includes("não encontrada") || message.includes("não encontrado")) {
        return status(404, { message });
      }

      console.error("Erro ao buscar guerras:", error);
      return status(500, { message });
    }
  }
}

