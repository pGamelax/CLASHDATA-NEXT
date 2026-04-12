import { prisma } from "../lib/prisma";

export class ClanRepository {
  async findByTag(tag: string) {
    const clan = await prisma.clan.findUnique({
      where: { tag },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        subscription: true,
      },
    });
    if (!clan) return null;
    return { ...clan, clanTag: clan.tag };
  }

  async findByTagAnywhere(tag: string) {
    const clan = await prisma.clan.findUnique({
      where: { tag },
      include: {
        owner: { select: { id: true, name: true, email: true } },
      },
    });
    if (!clan) return null;
    return { ...clan, clanTag: clan.tag };
  }

  async findByOwner(ownerId: string) {
    const clans = await prisma.clan.findMany({
      where: { ownerId },
      include: { subscription: true },
      orderBy: { createdAt: "desc" },
    });
    return clans.map((clan) => ({ ...clan, clanTag: clan.tag }));
  }

  async create(data: {
    ownerId: string;
    tag: string;
    name: string;
    description?: string;
    badgeUrls?: { small?: string; medium?: string; large?: string };
    clanLevel?: number;
    clanPoints?: number;
    members?: number;
    metadata?: any;
  }) {
    const clan = await prisma.clan.create({ data });
    return { ...clan, clanTag: clan.tag };
  }

  async update(
    id: string,
    data: {
      name?: string;
      description?: string;
      badgeUrls?: any;
      clanLevel?: number;
      clanPoints?: number;
      members?: number;
      metadata?: any;
    }
  ) {
    return await prisma.clan.update({ where: { id }, data });
  }

  async delete(id: string) {
    return await prisma.clan.delete({ where: { id } });
  }

  async findById(id: string) {
    const clan = await prisma.clan.findUnique({
      where: { id },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        subscription: true,
      },
    });
    if (!clan) return null;
    return { ...clan, clanTag: clan.tag };
  }

  async findAll() {
    return await prisma.clan.findMany();
  }

  async findAllWithSubscriptions() {
    const clans = await prisma.clan.findMany({
      include: { subscription: true },
      orderBy: { createdAt: "desc" },
    });
    return clans.map((clan) => ({ ...clan, clanTag: clan.tag }));
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
        owner: { select: { name: true } },
      },
      orderBy: { clanPoints: "desc" },
    });
    return clans.map((clan) => ({ ...clan, clanTag: clan.tag }));
  }
}
