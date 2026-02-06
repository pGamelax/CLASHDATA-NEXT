import { prisma } from "../lib/prisma";

export class PlayerRepository {
  async findByTag(tag: string) {
    return await prisma.player.findUnique({
      where: { tag },
    });
  }

  async findAll() {
    return await prisma.player.findMany();
  }

  async create(data: {
    tag: string;
    name: string;
    trophies: number;
  }) {
    return await prisma.player.create({
      data,
    });
  }

  async update(tag: string, data: {
    name?: string;
    trophies?: number;
  }) {
    return await prisma.player.update({
      where: { tag },
      data,
    });
  }

  async upsert(data: {
    tag: string;
    name: string;
    trophies: number;
  }) {
    return await prisma.player.upsert({
      where: { tag: data.tag },
      update: {
        name: data.name,
        trophies: data.trophies,
      },
      create: data,
    });
  }

  async findPlayersNotInClans(clanTags: string[]) {
    // Esta query busca players que não estão em nenhum dos clans fornecidos
    // Como não temos uma relação direta, vamos retornar todos os players
    // e filtrar no service
    return await prisma.player.findMany();
  }
}
