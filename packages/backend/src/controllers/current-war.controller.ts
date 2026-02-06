import type { Context } from "elysia";
import { CurrentWarService } from "../services/current-war.service";
import { ClashOfClansService } from "../services/clash-of-clans.service";

export class CurrentWarController {
  constructor(
    private currentWarService: CurrentWarService,
    private clashOfClansService: ClashOfClansService
  ) {}

  async getCurrentWar({ params, set, status }: Context) {
    try {
      const { tag } = params as { tag: string };

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

      const analysis = await this.currentWarService.analyzeCurrentWar(cleanTag);

      if (!analysis) {
        return status(404, {
          message: "Clan não está em guerra no momento",
        });
      }

      return {
        data: analysis,
      };
    } catch (error: any) {
      console.error("[CurrentWarController] Erro ao buscar guerra atual:", error);
      return status(500, {
        message: error.message || "Erro ao buscar guerra atual",
      });
    }
  }
}

