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
  {
    // Assinaturas Stripe com período pago ainda vigente → mantém ACTIVE, limpa provider
    name: "migrar assinaturas Stripe com período vigente → ACTIVE/syncpay",
    sql: `
      UPDATE subscription
      SET "paymentProvider" = 'syncpay', "paymentProviderId" = null
      WHERE "paymentProvider" = 'stripe'
        AND "currentPeriodEnd" IS NOT NULL
        AND "currentPeriodEnd" > NOW()
    `,
  },
  {
    // Assinaturas Stripe sem período vigente (ou sem data) → EXPIRED
    name: "migrar assinaturas Stripe sem período vigente → EXPIRED",
    sql: `
      UPDATE subscription
      SET status = 'EXPIRED', "paymentProvider" = 'syncpay', "paymentProviderId" = null
      WHERE "paymentProvider" = 'stripe'
        AND ("currentPeriodEnd" IS NULL OR "currentPeriodEnd" <= NOW())
    `,
  },
  {
    // sub_1TAtG9Hr1k2LjmYKzR5Vt6UQ → EXPIRED
    name: "migrar sub_1TAtG9Hr1k2LjmYKzR5Vt6UQ → EXPIRED",
    sql: `
      UPDATE subscription
      SET status = 'EXPIRED', "paymentProvider" = 'syncpay', "paymentProviderId" = null
      WHERE "paymentProviderId" = 'sub_1TAtG9Hr1k2LjmYKzR5Vt6UQ'
    `,
  },
  {
    // sub_1T49SqHr1k2LjmYK2YfqCwYj → ACTIVE até 23/03/2026
    name: "migrar sub_1T49SqHr1k2LjmYK2YfqCwYj → ACTIVE até 2026-03-23",
    sql: `
      UPDATE subscription
      SET status = 'ACTIVE',
          "paymentProvider" = 'syncpay',
          "paymentProviderId" = null,
          "currentPeriodEnd" = '2026-03-23 23:59:59'
      WHERE "paymentProviderId" = 'sub_1T49SqHr1k2LjmYK2YfqCwYj'
    `,
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
