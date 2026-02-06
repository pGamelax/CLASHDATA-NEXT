import { MemberRepository } from "../repositories/member.repository";
import { OrganizationRepository } from "../repositories/organization.repository";
import { prisma } from "../lib/prisma";

export class MemberService {
  constructor(
    private memberRepository: MemberRepository,
    private organizationRepository: OrganizationRepository
  ) {}

  async removeMember(organizationId: string, memberUserId: string, requestedBy: string) {
    // Verifica se a organização existe
    const organization = await this.organizationRepository.findById(organizationId);
    if (!organization) {
      throw new Error("Organização não encontrada");
    }

    // Verifica se o membro existe
    const member = await this.memberRepository.findByOrganizationAndUser(
      organizationId,
      memberUserId
    );
    if (!member) {
      throw new Error("Membro não encontrado");
    }

    // Verifica se o usuário que está fazendo a requisição tem permissão
    const requester = organization.members.find((m) => m.userId === requestedBy);
    if (!requester) {
      throw new Error("Você não é membro desta organização");
    }

    // Verifica se é admin
    const user = await prisma.user.findUnique({
      where: { id: requestedBy },
      select: { role: true },
    });

    // Apenas owner ou admin podem remover membros
    if (requester.role !== "owner" && user?.role !== "admin") {
      throw new Error("Apenas o dono da organização pode remover membros");
    }

    // Não permite remover o próprio owner (a menos que seja admin)
    if (member.role === "owner" && requester.role === "owner" && user?.role !== "admin") {
      throw new Error("O dono da organização não pode remover a si mesmo");
    }

    // Remove o membro
    await this.memberRepository.removeMember(organizationId, memberUserId);

    return { success: true };
  }
}
