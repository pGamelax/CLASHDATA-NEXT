import { prisma } from "../lib/prisma";

export class OrganizationRepository {
  async findBySlug(slug: string) {
    return await prisma.organization.findFirst({
      where: { slug },
      include: {
        subscription: true,
      },
    });
  }

  async create(data: {
    name: string;
    slug: string;
    logo: string | null;
    metadata?: any;
  }) {
    return await prisma.organization.create({
      data,
    });
  }

  async findById(id: string) {
    return await prisma.organization.findUnique({
      where: { id },
      include: {
        clans: true,
        members: {
          include: {
            user: true,
          },
        },
        subscription: true,
      },
    });
  }

  async findByIdOrSlug(identifier: string) {
    // Tenta encontrar por ID primeiro
    const byId = await prisma.organization.findUnique({
      where: { id: identifier },
      include: {
        clans: true,
        members: {
          include: {
            user: true,
          },
        },
        subscription: true,
      },
    });
    if (byId) return byId;

    // Se não encontrar, tenta por slug
    return await prisma.organization.findFirst({
      where: { slug: identifier },
      include: {
        clans: true,
        members: {
          include: {
            user: true,
          },
        },
        subscription: true,
      },
    });
  }

  async findByUserId(userId: string) {
    return await prisma.organization.findMany({
      where: {
        members: {
          some: {
            userId,
          },
        },
      },
      include: {
        members: {
          include: {
            user: true,
          },
        },
        subscription: true,
      },
    });
  }

  async addMember(organizationId: string, userId: string, role: string) {
    return await prisma.member.create({
      data: {
        organizationId,
        userId,
        role,
      },
    });
  }

  async update(id: string, data: { name?: string; slug?: string; logo?: string | null }) {
    return await prisma.organization.update({
      where: { id },
      data,
    });
  }

  async delete(id: string) {
    return await prisma.organization.delete({
      where: { id },
    });
  }
}

