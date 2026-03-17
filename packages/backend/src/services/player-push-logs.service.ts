import { LegendLeagueLogRepository } from "../repositories/legend-league-log.repository";
import { PlayerRepository } from "../repositories/player.repository";
import { ClashOfClansService } from "./clash-of-clans.service";

export interface PlayerPushStats {
  tag: string;
  name: string;
  currentTrophies: number;
  globalRank: number | null;
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
    // 1. Fetch clan members
    const membersData = await this.clashOfClansService.getClanMembers(clanTag);
    const members = membersData.items || [];

    // 2. Filter Legend League only
    const legendMembers = members.filter(
      (member: any) => member.leagueTier?.name === "Legend League"
    );
    if (legendMembers.length === 0) return [];

    // 3. Bulk-fetch players from DB + fetch player details from CoC API in parallel
    const memberTags = legendMembers.map((m: any) => m.tag);
    const [players, playerDetailsResults] = await Promise.all([
      this.playerRepository.findManyByTags(memberTags),
      Promise.allSettled(
        legendMembers.map((m: any) => this.clashOfClansService.getPlayerByTag(m.tag))
      ),
    ]);

    // 4. Build players map
    const playersMap = new Map<string, any>();
    for (const player of players) {
      playersMap.set(player.tag, player);
    }

    // 5. Extract globalRank per player tag
    const globalRankMap = new Map<string, number | null>();
    legendMembers.forEach((m: any, i: number) => {
      const result = playerDetailsResults[i];
      if (result.status === "fulfilled") {
        globalRankMap.set(m.tag, result.value.legendStatistics?.currentSeason?.rank ?? null);
      } else {
        globalRankMap.set(m.tag, null);
      }
    });

    // 7. Bulk-fetch all logs at once
    const playerIds = players.map((p) => p.id);
    const allLogs =
      playerIds.length > 0
        ? await this.legendLeagueLogRepository.findByPlayerIds(playerIds)
        : [];

    // 8. Group logs by playerId
    const logsByPlayerId = new Map<string, typeof allLogs>();
    for (const log of allLogs) {
      const list = logsByPlayerId.get(log.playerId) ?? [];
      list.push(log);
      logsByPlayerId.set(log.playerId, list);
    }

    // 9. Build stats
    const stats: PlayerPushStats[] = [];
    for (const member of legendMembers) {
      const player = playersMap.get(member.tag);
      if (!player) continue;

      const logs = logsByPlayerId.get(player.id) ?? [];
      let totalAttack = 0;
      let totalDefense = 0;
      let attackCount = 0;
      let defenseCount = 0;

      for (const log of logs) {
        if (log.type === "attack") { totalAttack += log.trophiesChange; attackCount++; }
        else if (log.type === "defense") { totalDefense += log.trophiesChange; defenseCount++; }
      }

      stats.push({
        tag: player.tag,
        name: player.name,
        currentTrophies: member.trophies || player.trophies,
        globalRank: globalRankMap.get(member.tag) ?? null,
        totalAttack,
        totalDefense,
        attackCount,
        defenseCount,
        logs: logs.map((log) => ({
          id: log.id,
          type: log.type,
          trophiesChange: log.trophiesChange,
          previousTrophies: log.previousTrophies,
          currentTrophies: log.currentTrophies,
          createdAt: log.createdAt,
        })),
      });
    }

    return stats.sort((a, b) => b.currentTrophies - a.currentTrophies);
  }
}
