/**
 * SEED — Planos do banco de dados
 *
 * Faz upsert (cria ou atualiza) dos 4 planos padrão.
 * Seguro para re-executar quantas vezes quiser — não duplica dados.
 *
 * Como executar (do diretório packages/backend):
 *   bun run prisma/seed.ts
 *   ou via package.json:
 *   bun run db:seed
 */

import { prisma } from "../src/lib/prisma";

const plans = [
  {
    key: "MESTRE",
    name: "Mestre",
    description: "Ideal para líderes de um único clã",
    monthlyPrice: 2990,
    quarterlyPrice: 8073,
    yearlyPrice: 28704,
    originalQuarterlyPrice: 8970,
    originalYearlyPrice: 35880,
    maxClans: 1,
    maxInvites: 1,
    icon: "shield",
    color: "blue",
    features: [
      "1 Clã",
      "1 Convite",
      "Dashboard Completo",
      "Rankings de Guerras",
      "Estatísticas Avançadas",
      "Suporte por Email",
    ],
    isPopular: false,
    isActive: true,
    sortOrder: 1,
  },
  {
    key: "CAMPEAO",
    name: "Campeão",
    description: "Para quem gerencia mais de um clã",
    monthlyPrice: 4590,
    quarterlyPrice: 12393,
    yearlyPrice: 44064,
    originalQuarterlyPrice: 13770,
    originalYearlyPrice: 55080,
    maxClans: 2,
    maxInvites: 2,
    icon: "crown",
    color: "yellow",
    features: [
      "2 Clãs",
      "2 Convites",
      "Dashboard Completo",
      "Rankings de Guerras",
      "Estatísticas Avançadas",
      "Previsões Inteligentes",
      "Suporte Prioritário",
    ],
    isPopular: false,
    isActive: true,
    sortOrder: 2,
  },
  {
    key: "TITA",
    name: "Titã",
    description: "O mais popular — analytics completo",
    monthlyPrice: 7490,
    quarterlyPrice: 20223,
    yearlyPrice: 71904,
    originalQuarterlyPrice: 22470,
    originalYearlyPrice: 89880,
    maxClans: 3,
    maxInvites: 3,
    icon: "zap",
    color: "purple",
    features: [
      "3 Clãs",
      "3 Convites",
      "Dashboard Completo",
      "Rankings de Guerras",
      "Estatísticas Avançadas",
      "Previsões Inteligentes",
      "Analytics Avançado",
      "Suporte 24/7",
    ],
    isPopular: true,
    isActive: true,
    sortOrder: 3,
  },
  {
    key: "LEGEND",
    name: "Legend",
    description: "Para organizações de alto nível",
    monthlyPrice: 11990,
    quarterlyPrice: 32373,
    yearlyPrice: 115104,
    originalQuarterlyPrice: 35970,
    originalYearlyPrice: 143880,
    maxClans: 5,
    maxInvites: 5,
    icon: "star",
    color: "green",
    features: [
      "5 Clãs",
      "5 Convites",
      "Dashboard Completo",
      "Rankings de Guerras",
      "Estatísticas Avançadas",
      "Previsões Inteligentes",
      "Analytics Avançado",
      "Suporte 24/7",
    ],
    isPopular: false,
    isActive: true,
    sortOrder: 4,
  },
];

async function main() {
  console.log("🌱 Iniciando seed dos planos...\n");

  for (const plan of plans) {
    const result = await prisma.plan.upsert({
      where: { key: plan.key },
      update: {
        name: plan.name,
        description: plan.description,
        monthlyPrice: plan.monthlyPrice,
        quarterlyPrice: plan.quarterlyPrice,
        yearlyPrice: plan.yearlyPrice,
        originalQuarterlyPrice: plan.originalQuarterlyPrice,
        originalYearlyPrice: plan.originalYearlyPrice,
        maxClans: plan.maxClans,
        maxInvites: plan.maxInvites,
        icon: plan.icon,
        color: plan.color,
        features: plan.features,
        isPopular: plan.isPopular,
        isActive: plan.isActive,
        sortOrder: plan.sortOrder,
      },
      create: {
        id: `plan_${plan.key.toLowerCase()}`,
        ...plan,
      },
    });

    console.log(`  ✅ ${result.name} (${result.key}) — ${result.id}`);
  }

  console.log("\n🎉 Seed concluído! 4 planos configurados.");
}

main()
  .catch((err) => {
    console.error("\n❌ Erro no seed:", err);
    process.exit(1);
  });
