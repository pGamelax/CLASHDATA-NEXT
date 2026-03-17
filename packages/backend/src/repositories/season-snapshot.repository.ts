import { prisma } from "../lib/prisma";

export class SeasonSnapshotRepository {
  async createSeasonEndDate(data: { date: string; label?: string }) {
    return prisma.seasonEndDate.create({ data });
  }

  async getAllSeasonEndDates() {
    return prisma.seasonEndDate.findMany({
      orderBy: { date: "desc" },
      include: { _count: { select: { snapshots: true } } },
    });
  }

  async getSeasonEndDateById(id: string) {
    return prisma.seasonEndDate.findUnique({ where: { id } });
  }

  async updateSeasonEndDate(
    id: string,
    data: Partial<{ status: string; jobId: string; capturedAt: Date }>
  ) {
    return prisma.seasonEndDate.update({ where: { id }, data });
  }

  async deleteSeasonEndDate(id: string) {
    return prisma.seasonEndDate.delete({ where: { id } });
  }

  async upsertSnapshot(data: {
    seasonEndDateId: string;
    clanTag: string;
    clanName: string;
    organizationId: string;
    players: any[];
  }) {
    return prisma.seasonSnapshot.upsert({
      where: {
        seasonEndDateId_clanTag: {
          seasonEndDateId: data.seasonEndDateId,
          clanTag: data.clanTag,
        },
      },
      create: { ...data, capturedAt: new Date() },
      update: { players: data.players, capturedAt: new Date() },
    });
  }

  async getSnapshotsByClanTag(clanTag: string) {
    return prisma.seasonSnapshot.findMany({
      where: { clanTag },
      include: { seasonEndDate: true },
      orderBy: { capturedAt: "desc" },
    });
  }

  async getSnapshotsBySeasonAndClan(seasonEndDateId: string, clanTag: string) {
    return prisma.seasonSnapshot.findUnique({
      where: { seasonEndDateId_clanTag: { seasonEndDateId, clanTag } },
      include: { seasonEndDate: true },
    });
  }
}
