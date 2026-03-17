import { ClanRepository } from "../repositories/clan.repository";
import { ClashOfClansService } from "./clash-of-clans.service";
import { SeasonSnapshotRepository } from "../repositories/season-snapshot.repository";

export class SeasonSnapshotService {
  constructor(
    private clanRepository: ClanRepository,
    private clashOfClansService: ClashOfClansService,
    private snapshotRepository: SeasonSnapshotRepository
  ) {}

  async captureAllClans(seasonEndDateId: string): Promise<void> {
    await this.snapshotRepository.updateSeasonEndDate(seasonEndDateId, {
      status: "RUNNING",
      capturedAt: new Date(),
    });

    try {
      const clans = await this.clanRepository.findAll();

      await Promise.allSettled(
        clans.map(async (clan) => {
          try {
            const cleanTag = clan.tag.startsWith("#") ? clan.tag.slice(1) : clan.tag;
            const membersData = await this.clashOfClansService.getClanMembers(cleanTag);
            const members: any[] = membersData.items || [];

            const sorted = [...members].sort(
              (a, b) => (b.trophies || 0) - (a.trophies || 0)
            );

            const players = sorted.map((member, index) => ({
              rank: index + 1,
              name: member.name,
              tag: member.tag,
              trophies: member.trophies || 0,
              role: member.role,
              expLevel: member.expLevel,
            }));

            await this.snapshotRepository.upsertSnapshot({
              seasonEndDateId,
              clanTag: clan.tag,
              clanName: clan.name,
              organizationId: clan.organizationId,
              players,
            });

            console.log(`[SeasonSnapshot] Clan ${clan.tag} capturado: ${players.length} jogadores`);
          } catch (err) {
            console.error(`[SeasonSnapshot] Erro no clan ${clan.tag}:`, err);
          }
        })
      );

      await this.snapshotRepository.updateSeasonEndDate(seasonEndDateId, {
        status: "COMPLETED",
      });

      console.log(`[SeasonSnapshot] Temporada ${seasonEndDateId} concluída.`);
    } catch (err) {
      await this.snapshotRepository.updateSeasonEndDate(seasonEndDateId, {
        status: "FAILED",
      });
      throw err;
    }
  }
}
