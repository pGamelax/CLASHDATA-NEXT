/**
 * Migrações SQL manuais que precisam rodar antes do prisma db push.
 * Cada migração é idempotente — erro de "já foi feito" é ignorado silenciosamente.
 */

import { prisma } from "../src/lib/prisma";

const migrations: { name: string; sql: string }[] = [
  {
    name: "cast subscription.plan enum → TEXT",
    sql: "ALTER TABLE subscription ALTER COLUMN plan TYPE TEXT USING plan::TEXT",
  },
];

async function main() {
  for (const migration of migrations) {
    try {
      await prisma.$executeRawUnsafe(migration.sql);
      console.log(`✅ ${migration.name}`);
    } catch (err: any) {
      // Coluna já é TEXT ou migração já foi aplicada — sem problema
      console.log(`⏭️  ${migration.name} — já aplicada (${err.message?.split("\n")[0]})`);
    }
  }
}

main()
  .catch((err) => {
    console.error("❌ Erro na migração pré-deploy:", err);
    process.exit(1);
  });
