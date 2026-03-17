import { prisma } from "../lib/prisma";

export class ClanRepository {
  async findByTag(organizationId: string, tag: string) {
    const clan = await prisma.clan.findFirst({
      where: {
        organizationId,
        tag,
      },
    });
    
    if (!clan) return null;
    
    // Mapeia 'tag' para 'clanTag' para compatibilidade com o frontend
    return {
      ...clan,
      clanTag: clan.tag,
    };
  }

  async findByTagAnywhere(tag: string) {
    const clan = await prisma.clan.findUnique({
      where: {
        tag,
      },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });
    
    if (!clan) return null;
    
    // Mapeia 'tag' para 'clanTag' para compatibilidade com o frontend
    return {
      ...clan,
      clanTag: clan.tag,
    };
  }

  async findByOrganization(organizationId: string) {
    const clans = await prisma.clan.findMany({
      where: {
        organizationId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    
    // Mapeia 'tag' para 'clanTag' para compatibilidade com o frontend
    return clans.map(clan => ({
      ...clan,
      clanTag: clan.tag,
    }));
  }

  async create(data: {
    organizationId: string;
    tag: string;
    name: string;
    description?: string;
    badgeUrls?: {
      small?: string;
      medium?: string;
      large?: string;
    };
    clanLevel?: number;
    clanPoints?: number;
    members?: number;
    metadata?: any;
  }) {
    const clan = await prisma.clan.create({
      data,
    });
    
    // Mapeia 'tag' para 'clanTag' para compatibilidade com o frontend
    return {
      ...clan,
      clanTag: clan.tag,
    };
  }

  async update(id: string, data: {
    name?: string;
    description?: string;
    badgeUrls?: any;
    clanLevel?: number;
    clanPoints?: number;
    members?: number;
    metadata?: any;
  }) {
    return await prisma.clan.update({
      where: { id },
      data,
    });
  }

  async delete(id: string) {
    return await prisma.clan.delete({
      where: { id },
    });
  }

  async findById(id: string) {
    const clan = await prisma.clan.findUnique({
      where: { id },
      include: {
        organization: true,
      },
    });
    
    if (!clan) return null;
    
    // Mapeia 'tag' para 'clanTag' para compatibilidade com o frontend
    return {
      ...clan,
      clanTag: clan.tag,
    };
  }

  async findAll() {
    return await prisma.clan.findMany();
  }

  async findAllPublicRanking() {
    const clans = await prisma.clan.findMany({
      select: {
        tag: true,
        name: true,
        badgeUrls: true,
        clanLevel: true,
        clanPoints: true,
        members: true,
        organization: {
          select: {
            name: true,
            slug: true,
          },
        },
      },
      orderBy: { clanPoints: "desc" },
    });
    return clans.map((clan) => ({ ...clan, clanTag: clan.tag }));
  }
}

