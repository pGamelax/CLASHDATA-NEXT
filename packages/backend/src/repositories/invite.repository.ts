import { prisma } from "../lib/prisma";

export class InviteRepository {
  async create(data: {
    organizationId: string;
    userId: string;
    invitedBy: string;
    expiresAt?: Date;
  }) {
    return await prisma.invite.create({
      data,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
            logo: true,
          },
        },
      },
    });
  }

  async findByOrganizationId(organizationId: string) {
    return await prisma.invite.findMany({
      where: { organizationId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  async findByUserId(userId: string) {
    return await prisma.invite.findMany({
      where: {
        userId,
        status: "PENDING",
      },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
            logo: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  async findById(id: string) {
    return await prisma.invite.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
            logo: true,
          },
        },
      },
    });
  }

  async findByOrganizationAndUser(organizationId: string, userId: string) {
    return await prisma.invite.findUnique({
      where: {
        organizationId_userId: {
          organizationId,
          userId,
        },
      },
    });
  }

  async update(id: string, data: { status: string }) {
    return await prisma.invite.update({
      where: { id },
      data,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
            logo: true,
          },
        },
      },
    });
  }

  async delete(id: string) {
    return await prisma.invite.delete({
      where: { id },
    });
  }

  async countPendingByOrganization(organizationId: string) {
    return await prisma.invite.count({
      where: {
        organizationId,
        status: "PENDING",
      },
    });
  }
}
