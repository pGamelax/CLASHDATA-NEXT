import { ClanRepository } from "../repositories/clan.repository";
import { SubscriptionRepository } from "../repositories/subscription.repository";
import { ClashOfClansService, ClanData } from "./clash-of-clans.service";
import { SubscriptionService } from "./subscription.service";
import { prisma } from "../lib/prisma";

export class ClanService {
  private subscriptionService: SubscriptionService;

  constructor(
    private clanRepository: ClanRepository,
    private clashOfClansService: ClashOfClansService
  ) {
    this.subscriptionService = new SubscriptionService(new SubscriptionRepository());
  }

  async createClan(ownerId: string, clanTag: string, clanData: ClanData) {
    // Verifica se já existe clan com essa tag
    const existing = await this.clanRepository.findByTagAnywhere(clanTag);
    if (existing) {
      if (existing.ownerId === ownerId) {
        throw new Error("Você já cadastrou este clan");
      }
      throw new Error("Clan com essa tag já está cadastrado no sistema");
    }

    // Cria o clan
    const clan = await this.clanRepository.create({
      ownerId,
      tag: clanTag,
      name: clanData.name,
      description: clanData.description,
      badgeUrls: clanData.badgeUrls,
      clanLevel: clanData.clanLevel,
      clanPoints: clanData.clanPoints,
      members: clanData.members,
      metadata: {
        location: clanData.location,
        warFrequency: clanData.warFrequency,
        warWins: clanData.warWins,
        warLosses: clanData.warLosses,
        warTies: clanData.warTies,
        warWinStreak: clanData.warWinStreak,
        requiredTrophies: clanData.requiredTrophies,
      },
    });

    return clan;
  }

  async getClansByOwner(ownerId: string) {
    return await this.clanRepository.findByOwner(ownerId);
  }

  async updateClan(clanId: string, clanData: ClanData) {
    const clan = await this.clanRepository.findById(clanId);
    if (!clan) throw new Error("Clan não encontrado");

    const updatedData = await this.clashOfClansService.searchClanByTag(clan.tag);

    return await this.clanRepository.update(clanId, {
      name: updatedData.name,
      description: updatedData.description,
      badgeUrls: updatedData.badgeUrls,
      clanLevel: updatedData.clanLevel,
      clanPoints: updatedData.clanPoints,
      members: updatedData.members,
      metadata: {
        location: updatedData.location,
        warFrequency: updatedData.warFrequency,
        warWins: updatedData.warWins,
        warLosses: updatedData.warLosses,
        warTies: updatedData.warTies,
        warWinStreak: updatedData.warWinStreak,
        requiredTrophies: updatedData.requiredTrophies,
      },
    });
  }

  async getPublicRanking() {
    return await this.clanRepository.findAllPublicRanking();
  }

  async removeClan(clanId: string, userId: string) {
    const clan = await this.clanRepository.findById(clanId);
    if (!clan) throw new Error("Clan não encontrado");

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (clan.ownerId !== userId && user?.role !== "admin") {
      throw new Error("Apenas o dono do clan pode removê-lo");
    }

    await this.clanRepository.delete(clanId);
    return { success: true };
  }

  async canUserAccessClan(userId: string, clanId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (user?.role === "admin") {
      return { canAccess: true, role: "admin" as const };
    }

    const clan = await this.clanRepository.findById(clanId);
    if (!clan) return { canAccess: false, reason: "Clan não encontrado" };

    if (clan.ownerId === userId) {
      return { canAccess: true, role: "owner" as const };
    }

    return { canAccess: false, reason: "Você não é o dono deste clan" };
  }
}
