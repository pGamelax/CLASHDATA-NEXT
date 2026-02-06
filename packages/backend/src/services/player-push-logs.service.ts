import { LegendLeagueLogRepository } from "../repositories/legend-league-log.repository";
import { PlayerRepository } from "../repositories/player.repository";
import { ClashOfClansService } from "./clash-of-clans.service";

export interface PlayerPushStats {
  tag: string;
  name: string;
  currentTrophies: number;
  totalAttack: number;
  totalDefense: number;
  attackCount: number;
  defenseCount: number;
  logs: Array<{
    id: string;
    type: string;
    trophiesChange: number;
    previousTrophies: number;
    currentTrophies: number;
    createdAt: Date;
  }>;
}

export class PlayerPushLogsService {
  constructor(
    private legendLeagueLogRepository: LegendLeagueLogRepository,
    private playerRepository: PlayerRepository,
    private clashOfClansService: ClashOfClansService
  ) {}

  async getPlayersByClanTag(clanTag: string): Promise<PlayerPushStats[]> {
    // Buscar membros do clan via API da Supercell
    const membersData = await this.clashOfClansService.getClanMembers(clanTag);
    const members = membersData.items || [];

    // Filtrar apenas jogadores na Legend League
    const legendLeagueMembers = members.filter(
      (member: any) => member.leagueTier?.name === "Legend League"
    );

    if (legendLeagueMembers.length === 0) {
      return [];
    }

    // Buscar todos os players no banco de dados de uma vez
    const allPlayers = await this.playerRepository.findAll();
    const playersMap = new Map<string, any>();
    for (const player of allPlayers) {
      playersMap.set(player.tag, player);
    }

    // Buscar logs de todos os players que estão no clan
    const stats: PlayerPushStats[] = [];

    for (const member of legendLeagueMembers) {
      const player = playersMap.get(member.tag);
      
      // Se o player não existe no banco, pula (não tem logs ainda)
      if (!player) {
        continue;
      }

      // Buscar todos os logs deste player (independente do clanTag do log)
      const logs = await this.legendLeagueLogRepository.findByPlayerId(player.id);

      // Calcular totais
      let totalAttack = 0;
      let totalDefense = 0;
      const attackLogs: any[] = [];
      const defenseLogs: any[] = [];

      for (const log of logs) {
        if (log.type === "attack") {
          totalAttack += log.trophiesChange;
          attackLogs.push(log);
        } else if (log.type === "defense") {
          totalDefense += log.trophiesChange;
          defenseLogs.push(log);
        }
      }

      // Usar os troféus atuais do membro da API (mais atualizado)
      const currentTrophies = member.trophies || player.trophies;

      stats.push({
        tag: player.tag,
        name: player.name,
        currentTrophies,
        totalAttack,
        totalDefense,
        attackCount: attackLogs.length,
        defenseCount: defenseLogs.length,
        logs: logs.map(log => ({
          id: log.id,
          type: log.type,
          trophiesChange: log.trophiesChange,
          previousTrophies: log.previousTrophies,
          currentTrophies: log.currentTrophies,
          createdAt: log.createdAt,
        })),
      });
    }

    // Ordenar por troféus atuais (maior primeiro)
    return stats.sort((a, b) => b.currentTrophies - a.currentTrophies);
  }
}
