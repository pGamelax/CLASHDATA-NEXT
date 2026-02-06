import { prisma } from "../lib/prisma";

export class MemberRepository {
  async findByOrganizationAndUser(organizationId: string, userId: string) {
    return await prisma.member.findFirst({
      where: {
        organizationId,
        userId,
      },
      include: {
        user: true,
      },
    });
  }

  async findByOrganization(organizationId: string) {
    return await prisma.member.findMany({
      where: {
        organizationId,
      },
      include: {
        user: true,
      },
    });
  }

  async removeMember(organizationId: string, userId: string) {
    return await prisma.member.deleteMany({
      where: {
        organizationId,
        userId,
      },
    });
  }

  async findById(memberId: string) {
    return await prisma.member.findUnique({
      where: { id: memberId },
      include: {
        user: true,
        organization: true,
      },
    });
  }
}
