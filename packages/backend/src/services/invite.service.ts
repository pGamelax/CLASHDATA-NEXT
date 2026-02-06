import { InviteRepository } from "../repositories/invite.repository";
import { OrganizationRepository } from "../repositories/organization.repository";
import { SubscriptionService } from "./subscription.service";
import { SubscriptionRepository } from "../repositories/subscription.repository";
import { prisma } from "../lib/prisma";

export class InviteService {
  private subscriptionService: SubscriptionService;

  constructor(
    private inviteRepository: InviteRepository,
    private organizationRepository: OrganizationRepository
  ) {
    const subscriptionRepository = new SubscriptionRepository();
    this.subscriptionService = new SubscriptionService(subscriptionRepository);
  }

  /**
   * Envia um convite para um usuário
   * Apenas o owner pode enviar convites
   */
  async sendInvite(
    organizationId: string,
    userId: string,
    invitedBy: string
  ) {
    // Verifica se a organização existe
    const organization = await this.organizationRepository.findById(
      organizationId
    );
    if (!organization) {
      throw new Error("Organização não encontrada");
    }

    // Verifica se o usuário que está enviando é o owner
    const inviterMember = organization.members.find(
      (m) => m.userId === invitedBy && m.role === "owner"
    );
    if (!inviterMember) {
      // Verifica se é admin
      const inviter = await prisma.user.findUnique({
        where: { id: invitedBy },
        select: { role: true },
      });
      if (inviter?.role !== "admin") {
        throw new Error("Apenas o dono da organização pode enviar convites");
      }
    }

    // Verifica se o usuário já é membro
    const existingMember = organization.members.find(
      (m) => m.userId === userId
    );
    if (existingMember) {
      throw new Error("Usuário já é membro desta organização");
    }

    // Verifica se já existe convite pendente
    const existingInvite = await this.inviteRepository.findByOrganizationAndUser(
      organizationId,
      userId
    );
    if (existingInvite && existingInvite.status === "PENDING") {
      throw new Error("Já existe um convite pendente para este usuário");
    }

    // Se existe um convite rejeitado ou expirado, deleta antes de criar um novo
    if (existingInvite && (existingInvite.status === "REJECTED" || existingInvite.status === "EXPIRED")) {
      await this.inviteRepository.delete(existingInvite.id);
    }

    // Verifica limite de convites (exceto para admins)
    const inviter = await prisma.user.findUnique({
      where: { id: invitedBy },
      select: { role: true },
    });
    
    if (inviter?.role !== "admin") {
      const canAdd = await this.subscriptionService.canAddInvite(
        organizationId,
        invitedBy
      );
      if (!canAdd.canAdd) {
        throw new Error(
          canAdd.reason ||
            `Limite de ${canAdd.maxCount} convite(s) atingido para o plano atual`
        );
      }
    }

    // Cria o convite
    return await this.inviteRepository.create({
      organizationId,
      userId,
      invitedBy,
    });
  }

  /**
   * Aceita um convite
   */
  async acceptInvite(inviteId: string, userId: string) {
    const invite = await this.inviteRepository.findById(inviteId);
    if (!invite) {
      throw new Error("Convite não encontrado");
    }

    if (invite.userId !== userId) {
      throw new Error("Este convite não é para você");
    }

    if (invite.status !== "PENDING") {
      throw new Error("Este convite já foi processado");
    }

    // Verifica se o convite expirou
    if (invite.expiresAt && new Date() > invite.expiresAt) {
      await this.inviteRepository.update(inviteId, { status: "EXPIRED" });
      throw new Error("Este convite expirou");
    }

    // Adiciona o usuário como membro
    await this.organizationRepository.addMember(
      invite.organizationId,
      userId,
      "member"
    );

    // Atualiza o status do convite
    await this.inviteRepository.update(inviteId, { status: "ACCEPTED" });

    return invite;
  }

  /**
   * Rejeita um convite
   */
  async rejectInvite(inviteId: string, userId: string) {
    const invite = await this.inviteRepository.findById(inviteId);
    if (!invite) {
      throw new Error("Convite não encontrado");
    }

    if (invite.userId !== userId) {
      throw new Error("Este convite não é para você");
    }

    if (invite.status !== "PENDING") {
      throw new Error("Este convite já foi processado");
    }

    // Atualiza o status do convite
    await this.inviteRepository.update(inviteId, { status: "REJECTED" });

    return invite;
  }

  /**
   * Cancela um convite (apenas o owner pode cancelar)
   */
  async cancelInvite(inviteId: string, userId: string) {
    const invite = await this.inviteRepository.findById(inviteId);
    if (!invite) {
      throw new Error("Convite não encontrado");
    }

    // Verifica se o usuário é o owner ou admin
    const organization = await this.organizationRepository.findById(
      invite.organizationId
    );
    if (!organization) {
      throw new Error("Organização não encontrada");
    }

    const member = organization.members.find((m) => m.userId === userId);
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (
      member?.role !== "owner" &&
      user?.role !== "admin" &&
      invite.invitedBy !== userId
    ) {
      throw new Error("Apenas o dono da organização pode cancelar convites");
    }

    if (invite.status !== "PENDING") {
      throw new Error("Apenas convites pendentes podem ser cancelados");
    }

    // Deleta o convite
    await this.inviteRepository.delete(inviteId);

    return invite;
  }

  /**
   * Lista convites de uma organização
   */
  async getInvitesByOrganization(organizationId: string) {
    return await this.inviteRepository.findByOrganizationId(organizationId);
  }

  /**
   * Lista convites pendentes de um usuário
   */
  async getPendingInvitesByUser(userId: string) {
    return await this.inviteRepository.findByUserId(userId);
  }
}
