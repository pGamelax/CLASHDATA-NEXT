import type { Context } from "elysia";
import { CWLService } from "../services/cwl.service";
import { ClashOfClansService } from "../services/clash-of-clans.service";

export class CWLController {
  constructor(
    private cwlService: CWLService,
    private clashOfClansService: ClashOfClansService
  ) {}

  async getPlayerRanking({ params, query, set, status }: Context) {
    try {
      const { tag } = params as { tag: string };
      const { seasons } = query as { seasons?: string };

      if (!seasons) {
        return status(400, {
          message: "Parâmetro 'seasons' é obrigatório",
        });
      }

      // Parse dos meses/temporadas
      // Formato esperado: "2026-1,2026-2" ou "2026-1"
      const seasonStrings = seasons.split(",");
      const months = seasonStrings.map((seasonStr) => {
        const parts = seasonStr.trim().split("-");
        if (parts.length !== 2) {
          throw new Error(`Formato de temporada inválido: ${seasonStr}`);
        }
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10);
        if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
          throw new Error(`Temporada inválida: ${seasonStr}`);
        }
        return { year, month };
      });

      // Valida se o clan existe
      const cleanTag = tag.startsWith("#") ? tag : `#${tag}`;
      try {
        await this.clashOfClansService.searchClanByTag(cleanTag);
      } catch (error: any) {
        if (error.message?.includes("não encontrado") || error.message?.includes("404")) {
          return status(404, {
            message: "Clan não encontrado",
          });
        }
        throw error;
      }

      const ranking = await this.cwlService.getPlayerRanking(cleanTag, months);

      return {
        data: ranking,
      };
    } catch (error: any) {
      console.error("[CWLController] Erro ao buscar ranking:", error);
      return status(500, {
        message: error.message || "Erro ao buscar ranking de CWL",
      });
    }
  }
}

