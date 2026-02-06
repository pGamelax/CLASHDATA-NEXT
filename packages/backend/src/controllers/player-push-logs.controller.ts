import { LegendLeagueLogRepository } from "../repositories/legend-league-log.repository";
import { PlayerRepository } from "../repositories/player.repository";
import { PlayerPushLogsService } from "../services/player-push-logs.service";
import { ClashOfClansService } from "../services/clash-of-clans.service";

type Context = {
  params: any;
  query: any;
  status: (code: number, data?: any) => any;
};

export class PlayerPushLogsController {
  private playerPushLogsService: PlayerPushLogsService;

  constructor() {
    const legendLeagueLogRepository = new LegendLeagueLogRepository();
    const playerRepository = new PlayerRepository();
    const clashOfClansService = new ClashOfClansService();
    this.playerPushLogsService = new PlayerPushLogsService(
      legendLeagueLogRepository,
      playerRepository,
      clashOfClansService
    );
  }

  async getPlayersByClan({ params, status }: Context) {
    try {
      const { clanTag } = params as { clanTag: string };
      
      if (!clanTag) {
        return status(400, { message: "Clan tag é obrigatório" });
      }

      // Normalizar o clanTag (adicionar # se não tiver)
      const normalizedTag = clanTag.startsWith("#") ? clanTag : `#${clanTag}`;

      const players = await this.playerPushLogsService.getPlayersByClanTag(normalizedTag);

      return {
        data: players,
      };
    } catch (error) {
      console.error("Erro ao buscar players por clan:", error);
      return status(500, {
        message: error instanceof Error ? error.message : "Erro ao buscar players",
      });
    }
  }
}
