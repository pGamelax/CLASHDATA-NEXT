import { ClanRepository } from "../repositories/clan.repository";
import { OrganizationRepository } from "../repositories/organization.repository";
import { ClashOfClansService, ClanData } from "./clash-of-clans.service";
import { SubscriptionService } from "./subscription.service";
import { SubscriptionRepository } from "../repositories/subscription.repository";
import { prisma } from "../lib/prisma";

export class ClanService {
  private subscriptionService: SubscriptionService;

  constructor(
    private clanRepository: ClanRepository,
    private organizationRepository: OrganizationRepository,
    private clashOfClansService: ClashOfClansService
  ) {
    // Inicializa subscription service
    const subscriptionRepository = new SubscriptionRepository();
    this.subscriptionService = new SubscriptionService(subscriptionRepository);
  }

  async createClanInOrganization(
    organizationId: string,
    clanTag: string,
    clanData: ClanData,
    userId?: string
  ) {
    // Verifica se a organização existe (pode ser ID ou slug)
    const organization = await this.organizationRepository.findByIdOrSlug(
      organizationId
    );
    if (!organization) {
      throw new Error("Organização não encontrada");
    }

    // Verifica se o usuário é owner da organização (ou admin)
    if (userId) {
      const member = organization.members?.find((m: any) => m.userId === userId);
      if (!member) {
        throw new Error("Você não é membro desta organização");
      }
      
      // Verifica se é admin (admins podem criar clans)
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true }
      });
      
      if (member.role !== "owner" && user?.role !== "admin") {
        throw new Error("Apenas o dono da organização pode adicionar clans");
      }
    }

    // Verifica se já existe clan com essa tag em qualquer organização
    const existingClan = await this.clanRepository.findByTagAnywhere(clanTag);
    if (existingClan) {
      if (existingClan.organizationId === organization.id) {
        throw new Error("Clan com essa tag já existe nesta organização");
      } else {
        throw new Error(
          `Clan com essa tag já está cadastrado em outra organização`
        );
      }
    }

    // Verifica se pode adicionar mais clans (limite da subscription)
    // Passa userId para verificar se é admin (admins têm limite ilimitado)
    const canAdd = await this.subscriptionService.canAddClan(organization.id, userId);
    if (!canAdd.canAdd) {
      throw new Error(
        canAdd.reason ||
          `Limite de ${canAdd.maxCount} clan(s) atingido para o plano atual`
      );
    }

    // Cria o clan
    const clan = await this.clanRepository.create({
      organizationId: organization.id,
      tag: clanTag,
      name: clanData.name,
      description: clanData.description ,
      badgeUrls: clanData.badgeUrls ,
      clanLevel: clanData.clanLevel ,
      clanPoints: clanData.clanPoints,
      members: clanData.members ,
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

  async getClansByOrganization(organizationId: string) {
    const organization = await this.organizationRepository.findByIdOrSlug(
      organizationId
    );
    if (!organization) {
      throw new Error("Organização não encontrada");
    }

    return await this.clanRepository.findByOrganization(organization.id);
  }

  async updateClan(clanId: string, clanData: ClanData) {
    const clan = await this.clanRepository.findById(clanId);
    if (!clan) {
      throw new Error("Clan não encontrado");
    }

    // Busca dados atualizados da API
    const updatedData = await this.clashOfClansService.searchClanByTag(
      clan.tag
    );

    return await this.clanRepository.update(clanId, {
      name: updatedData.name,
      description: updatedData.description,
      badgeUrls: updatedData.badgeUrls ,
      clanLevel: updatedData.clanLevel ,
      clanPoints: updatedData.clanPoints ,
      members: updatedData.members ,
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

  async removeClan(clanId: string, userId: string) {
    // Verifica se o clan existe
    const clan = await this.clanRepository.findById(clanId);
    if (!clan) {
      throw new Error("Clan não encontrado");
    }

    // Verifica se a organização existe
    const organization = await this.organizationRepository.findById(
      clan.organizationId
    );
    if (!organization) {
      throw new Error("Organização não encontrada");
    }

    // Verifica se o usuário é owner
    const member = organization.members?.find((m: any) => m.userId === userId);
    if (!member) {
      throw new Error("Você não é membro desta organização");
    }

    // Verifica se é admin
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    // Apenas owner ou admin podem remover
    if (member.role !== "owner" && user?.role !== "admin") {
      throw new Error("Apenas o dono da organização pode remover clans");
    }

    // Remove o clan
    await this.clanRepository.delete(clanId);

    return { success: true };
  }
}

