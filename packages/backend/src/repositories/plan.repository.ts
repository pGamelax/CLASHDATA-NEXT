import { prisma } from "../lib/prisma";

export interface PlanCreateInput {
  key: string;
  name: string;
  description?: string;
  monthlyPrice: number;
  quarterlyPrice: number;
  yearlyPrice: number;
  originalQuarterlyPrice?: number;
  originalYearlyPrice?: number;
  maxClans: number;
  icon?: string;
  color?: string;
  features?: string[];
  isPopular?: boolean;
  isActive?: boolean;
  sortOrder?: number;
}

export class PlanRepository {
  findAll() {
    return prisma.plan.findMany({ orderBy: { sortOrder: "asc" } });
  }

  findActive() {
    return prisma.plan.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
    });
  }

  findById(id: string) {
    return prisma.plan.findUnique({ where: { id } });
  }

  findByKey(key: string) {
    return prisma.plan.findUnique({ where: { key } });
  }

  create(data: PlanCreateInput) {
    return prisma.plan.create({ data });
  }

  update(id: string, data: Partial<PlanCreateInput>) {
    return prisma.plan.update({ where: { id }, data });
  }

  delete(id: string) {
    return prisma.plan.delete({ where: { id } });
  }

  /** Seed with default plans if table is empty */
  async seedDefaults() {
    const count = await prisma.plan.count();
    if (count > 0) return { seeded: false, count };

    const defaults: PlanCreateInput[] = [
      {
        key: "MESTRE",
        name: "Mestre",
        description: "Ideal para quem gerencia um único clã",
        monthlyPrice: 2990,
        quarterlyPrice: 8073,
        yearlyPrice: 28704,
        originalQuarterlyPrice: 8970,
        originalYearlyPrice: 35880,
        maxClans: 1,
        icon: "shield",
        color: "blue",
        features: ["1 Clã", "Dashboard Completo", "Rankings de Guerras", "Estatísticas Avançadas", "Suporte por Email"],
        isPopular: false,
        isActive: true,
        sortOrder: 1,
      },
      {
        key: "CAMPEAO",
        name: "Campeão",
        description: "Para líderes com múltiplos clãs",
        monthlyPrice: 4590,
        quarterlyPrice: 12393,
        yearlyPrice: 44064,
        originalQuarterlyPrice: 13770,
        originalYearlyPrice: 55080,
        maxClans: 2,
        icon: "crown",
        color: "yellow",
        features: ["2 Clãs", "Dashboard Completo", "Rankings de Guerras", "Estatísticas Avançadas", "Previsões Inteligentes", "Suporte Prioritário"],
        isPopular: false,
        isActive: true,
        sortOrder: 2,
      },
      {
        key: "TITA",
        name: "Titã",
        description: "O plano mais popular para times sérios",
        monthlyPrice: 7490,
        quarterlyPrice: 20223,
        yearlyPrice: 71904,
        originalQuarterlyPrice: 22470,
        originalYearlyPrice: 89880,
        maxClans: 3,
        icon: "zap",
        color: "purple",
        features: ["3 Clãs", "Dashboard Completo", "Rankings de Guerras", "Estatísticas Avançadas", "Previsões Inteligentes", "Analytics Avançado", "Suporte 24/7"],
        isPopular: true,
        isActive: true,
        sortOrder: 3,
      },
      {
        key: "LEGEND",
        name: "Legend",
        description: "Para organizações que buscam o máximo",
        monthlyPrice: 11990,
        quarterlyPrice: 32373,
        yearlyPrice: 115104,
        originalQuarterlyPrice: 35970,
        originalYearlyPrice: 143880,
        maxClans: 5,
        icon: "star",
        color: "green",
        features: ["5 Clãs", "Dashboard Completo", "Rankings de Guerras", "Estatísticas Avançadas", "Previsões Inteligentes", "Analytics Avançado", "Suporte 24/7"],
        isPopular: false,
        isActive: true,
        sortOrder: 4,
      },
    ];

    await prisma.plan.createMany({ data: defaults });
    return { seeded: true, count: defaults.length };
  }
}
