import { prisma } from "../lib/prisma";

export class LegendLeagueLogRepository {
  async create(data: {
    playerId: string;
    type: string;
    trophiesChange: number;
    previousTrophies: number;
    currentTrophies: number;
    clanTag?: string;
  }) {
    return await prisma.legendLeagueLog.create({
      data,
    });
  }

  async findByPlayerId(playerId: string) {
    return await prisma.legendLeagueLog.findMany({
      where: { playerId },
      orderBy: { createdAt: "desc" },
    });
  }

  async findByPlayerIds(playerIds: string[], from?: Date, to?: Date) {
    return await prisma.legendLeagueLog.findMany({
      where: {
        playerId: { in: playerIds },
        ...(from || to
          ? {
              createdAt: {
                ...(from && { gte: from }),
                ...(to && { lte: to }),
              },
            }
          : {}),
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async findRecentLogs(limit: number = 100) {
    return await prisma.legendLeagueLog.findMany({
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        player: true,
      },
    });
  }

  async findByClanTag(clanTag: string) {
    return await prisma.legendLeagueLog.findMany({
      where: { clanTag },
      include: {
        player: true,
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async findPlayersWithLogsByClanTag(clanTag: string) {
    // Buscar todos os players que têm logs com este clanTag
    const logs = await prisma.legendLeagueLog.findMany({
      where: { clanTag },
      include: {
        player: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // Agrupar por player e calcular totais
    const playerMap = new Map<string, {
      player: any;
      logs: any[];
      totalAttack: number;
      totalDefense: number;
    }>();

    for (const log of logs) {
      const playerId = log.playerId;
      if (!playerMap.has(playerId)) {
        playerMap.set(playerId, {
          player: log.player,
          logs: [],
          totalAttack: 0,
          totalDefense: 0,
        });
      }

      const playerData = playerMap.get(playerId)!;
      playerData.logs.push(log);

      if (log.type === "attack") {
        playerData.totalAttack += log.trophiesChange;
      } else if (log.type === "defense") {
        playerData.totalDefense += log.trophiesChange;
      }
    }

    return Array.from(playerMap.values());
  }
}
