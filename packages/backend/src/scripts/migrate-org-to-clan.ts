/**
 * Script de migração: Organizações → Clans
 *
 * Executa em SQL puro pois o banco ainda tem a estrutura antiga
 * (sem ownerId em clan, sem clanId em subscription).
 *
 * O que faz:
 *  1. Adiciona coluna `ownerId` em `clan` (se não existir)
 *  2. Popula `ownerId` a partir do member com role='owner' de cada org
 *  3. Adiciona coluna `clanId` em `subscription` (se não existir)
 *  4. Para cada clan: cria uma row em subscription copiando os dados da sub da org
 *  5. Migra PixPayments: adiciona `clanId` se faltar, e atualiza
 *  6. Migra SeasonSnapshots: converte `organizationId` → `clanId` pelo clanTag
 *
 * Execute com: bun run db:migrate-orgs
 * DEPOIS rode: bun run db:push   (remove tabelas legadas, faz colunas NOT NULL, etc.)
 */

import { Pool } from "pg";
import { env } from "../env";

const pool = new Pool({ connectionString: env.DATABASE_URL });
const q = <T = any>(sql: string, params: any[] = []) =>
  pool.query<T>(sql, params).then((r) => r.rows);
const exec = (sql: string, params: any[] = []) =>
  pool.query(sql, params).then((r) => r.rowCount ?? 0);

async function colExists(table: string, col: string) {
  const rows = await q(
    `SELECT 1 FROM information_schema.columns
     WHERE table_schema='public' AND table_name=$1 AND column_name=$2`,
    [table, col]
  );
  return rows.length > 0;
}

async function tableExists(table: string) {
  const rows = await q(
    `SELECT 1 FROM information_schema.tables
     WHERE table_schema='public' AND table_name=$1`,
    [table]
  );
  return rows.length > 0;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("=== Migração Org → Clan (SQL raw) ===\n");

  if (!(await tableExists("organization"))) {
    console.log("Tabela 'organization' não existe — banco já na estrutura nova.");
    return;
  }

  // ── 1. Adicionar colunas faltando ──────────────────────────────────────────

  if (!(await colExists("clan", "ownerId"))) {
    console.log('Adicionando coluna "ownerId" em clan...');
    await exec(`ALTER TABLE clan ADD COLUMN "ownerId" TEXT`);
  }

  if (!(await colExists("subscription", "clanId"))) {
    console.log('Adicionando coluna "clanId" em subscription...');
    await exec(`ALTER TABLE subscription ADD COLUMN "clanId" TEXT`);
  }

  if (!(await colExists("pix_payment", "clanId"))) {
    console.log('Adicionando coluna "clanId" em pix_payment...');
    await exec(`ALTER TABLE pix_payment ADD COLUMN "clanId" TEXT`);
  }

  if (!(await colExists("pix_payment", "subscriptionId"))) {
    console.log('Adicionando coluna "subscriptionId" em pix_payment...');
    await exec(`ALTER TABLE pix_payment ADD COLUMN "subscriptionId" TEXT`);
  }

  if (!(await colExists("season_snapshot", "clanId"))) {
    console.log('Adicionando coluna "clanId" em season_snapshot...');
    await exec(`ALTER TABLE season_snapshot ADD COLUMN "clanId" TEXT`);
  }

  console.log();

  // ── 2. Soltar constraints legados que bloqueiam inserção ───────────────────

  // Remove unique constraint de organizationId em subscription (se existir)
  const subConstraints = await q<{ conname: string }>(
    `SELECT conname FROM pg_constraint
     WHERE conrelid = 'subscription'::regclass AND contype = 'u'`
  );
  for (const c of subConstraints) {
    if (c.conname.toLowerCase().includes("organizationid")) {
      console.log(`Removendo constraint ${c.conname} de subscription...`);
      await exec(`ALTER TABLE subscription DROP CONSTRAINT "${c.conname}"`);
    }
  }

  // Torna organizationId nullable em subscription
  if (await colExists("subscription", "organizationId")) {
    await exec(`ALTER TABLE subscription ALTER COLUMN "organizationId" DROP NOT NULL`);
    console.log('organizationId em subscription agora é nullable\n');
  }

  // ── 3. Busca todas as orgs ─────────────────────────────────────────────────

  const orgs = await q<{ id: string; name: string }>(
    `SELECT id, name FROM organization ORDER BY "createdAt"`
  );
  console.log(`Organizações encontradas: ${orgs.length}\n`);

  let totalClans = 0, totalSubs = 0, totalPix = 0, totalSnaps = 0;

  for (const org of orgs) {
    console.log(`── Org: "${org.name}" (${org.id})`);

    // Owner da org
    const owners = await q<{ userId: string; email: string }>(
      `SELECT m."userId", u.email
       FROM member m
       JOIN "User" u ON u.id = m."userId"
       WHERE m."organizationId" = $1 AND m.role = 'owner'
       LIMIT 1`,
      [org.id]
    );

    let ownerId: string | null = null;
    if (owners.length > 0) {
      ownerId = owners[0].userId;
      console.log(`   Owner: ${owners[0].email}`);
    } else {
      // fallback: qualquer membro
      const fallback = await q<{ userId: string }>(
        `SELECT "userId" FROM member WHERE "organizationId" = $1 LIMIT 1`,
        [org.id]
      );
      ownerId = fallback[0]?.userId ?? null;
      if (ownerId) console.log(`   Owner (fallback): ${ownerId}`);
    }

    if (!ownerId) {
      console.warn(`   ⚠ Nenhum membro — pulando\n`);
      continue;
    }

    // Subscription da org
    const subs = await q(
      `SELECT * FROM subscription WHERE "organizationId" = $1 LIMIT 1`,
      [org.id]
    );
    const orgSub = subs[0] ?? null;

    if (orgSub) {
      console.log(`   Subscription: ${orgSub.plan}/${orgSub.status}`);
    } else {
      console.log(`   Subscription: nenhuma`);
    }

    // Clans da org
    const clans = await q(
      `SELECT * FROM clan WHERE "organizationId" = $1`,
      [org.id]
    );
    console.log(`   Clans: ${clans.length}`);

    for (const clan of clans) {
      console.log(`\n   → Clan: "${clan.name}" (${clan.tag})`);
      totalClans++;

      // Define ownerId
      await exec(
        `UPDATE clan SET "ownerId" = $1 WHERE id = $2`,
        [ownerId, clan.id]
      );
      console.log(`     ✓ ownerId definido`);

      if (!orgSub) continue;

      // Verifica se já existe subscription para esse clan
      const existingSub = await q(
        `SELECT id FROM subscription WHERE "clanId" = $1 LIMIT 1`,
        [clan.id]
      );

      let clanSubId: string;

      if (existingSub.length > 0) {
        clanSubId = existingSub[0].id;
        console.log(`     ✓ Subscription já existe — reutilizando`);
      } else {
        // Gera novo id estilo cuid
        const newId = `c${Date.now().toString(36)}${Math.random().toString(36).slice(2, 9)}`;
        const now = new Date().toISOString();

        await exec(
          `INSERT INTO subscription
             (id, "clanId", plan, status, period,
              "trialEndsAt", "currentPeriodEnd", "cancelAtPeriodEnd",
              "paymentProvider", "paymentProviderId", "createdAt", "updatedAt")
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
          [
            newId,
            clan.id,
            orgSub.plan,
            orgSub.status,
            orgSub.period ?? "monthly",
            orgSub.trialEndsAt ?? null,
            orgSub.currentPeriodEnd ?? null,
            orgSub.cancelAtPeriodEnd ?? false,
            orgSub.paymentProvider ?? "syncpay",
            orgSub.paymentProviderId ?? null,
            now,
            now,
          ]
        );
        clanSubId = newId;
        totalSubs++;
        console.log(`     ✓ Subscription criada (${orgSub.plan}/${orgSub.status})`);
      }

      // Migra PixPayments da sub da org → sub do clan
      const pixCount = await exec(
        `UPDATE pix_payment
         SET "clanId" = $1, "subscriptionId" = $2
         WHERE "subscriptionId" = $3`,
        [clan.id, clanSubId, orgSub.id]
      );
      if (pixCount > 0) {
        totalPix += pixCount;
        console.log(`     ✓ ${pixCount} PIX payment(s) migrado(s)`);
      }
    }

    // Migra SeasonSnapshots pelo clanTag
    const snapCount = await exec(
      `UPDATE season_snapshot ss
       SET "clanId" = c.id
       FROM clan c
       WHERE ss."organizationId" = $1
         AND ss."clanTag" = c.tag
         AND (ss."clanId" IS NULL OR ss."clanId" != c.id)`,
      [org.id]
    );
    if (snapCount > 0) {
      totalSnaps += snapCount;
      console.log(`\n   ✓ ${snapCount} snapshot(s) migrado(s)`);
    }

    console.log();
  }

  // ── Resumo ─────────────────────────────────────────────────────────────────
  console.log("─────────────────────────────────");
  console.log(`Clans atualizados:     ${totalClans}`);
  console.log(`Subscriptions criadas: ${totalSubs}`);
  console.log(`PixPayments migrados:  ${totalPix}`);
  console.log(`Snapshots migrados:    ${totalSnaps}`);
  console.log("\n✅ Migração concluída!");
  console.log("Próximo passo: bun run db:push");
}

main()
  .catch((e) => {
    console.error("\n❌ Erro:", e.message ?? e);
    process.exit(1);
  })
  .finally(() => pool.end());
