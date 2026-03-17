# Guia de Migração para Produção

## Visão geral das mudanças

1. **Stripe removido** — SDK, tabela `stripeCustomerId` e rotas removidos
2. **Tabela `plan`** criada — planos dinâmicos no banco
3. **Tabela `pix_payment`** criada — cobranças PIX
4. **Coluna `period`** adicionada em `subscription`
5. **Provider padrão** virou `syncpay`

---

## Ordem de execução (NÃO pule etapas)

### 0. Antes de tudo — faça backup

```bash
pg_dump $DATABASE_URL > backup_pre_migration_$(date +%Y%m%d_%H%M%S).sql
```

---

### 1. Cancelar assinaturas Stripe e migrar dados

Este script:
- Cancela cada assinatura ativa na API da Stripe (sem cobrar mais)
- Muda status para `CANCELLED` no banco
- Limpa o `paymentProviderId` para não re-processar

```bash
cd packages/backend

# Defina sua chave secreta da Stripe (sk_live_xxx)
STRIPE_SECRET_KEY=sk_live_xxx \
DATABASE_URL=postgres://... \
bun run migrate:cancel-stripe
```

> Se alguma assinatura falhar, o script lista os IDs para cancelamento manual no dashboard da Stripe.

---

### 2. Aplicar mudanças de schema no banco

O `prisma db push` vai:
- Criar as tabelas `plan` e `pix_payment`
- Adicionar coluna `period` em `subscription`
- **Remover coluna `stripeCustomerId`** (já sem dados úteis após passo 1)

```bash
cd packages/backend
DATABASE_URL=postgres://... bunx --bun prisma db push --accept-data-loss
```

> `--accept-data-loss` é necessário para permitir a remoção da coluna `stripeCustomerId`.
> Os dados dessa coluna (customer IDs da Stripe) não são mais necessários após o cancelamento.

Depois, regenere o client:

```bash
DATABASE_URL=postgres://... bunx --bun prisma generate
```

---

### 3. Seed dos planos

Popula (ou atualiza) os 4 planos no banco. **Idempotente** — pode rodar mais de uma vez com segurança.

```bash
cd packages/backend
DATABASE_URL=postgres://... bun run db:seed
```

Output esperado:
```
✅ Mestre (MESTRE)
✅ Campeão (CAMPEAO)
✅ Titã (TITA)
✅ Legend (LEGEND)
🎉 Seed concluído! 4 planos configurados.
```

---

### 4. Deploy da aplicação

Deploy normal com os novos binários. Nenhuma outra ação necessária.

---

## Checklist de verificação pós-deploy

- [ ] `/admin/organizations` mostra planos com nome e ícone corretos
- [ ] `/pricing` exibe os 4 planos no carrossel
- [ ] Webhook SyncPay `/pix/webhook` retorna `{ received: true, success: true }` ao receber pagamento
- [ ] Nenhuma assinatura aparece como "sem plano" no painel admin
- [ ] Stripe dashboard mostra as assinaturas como canceladas

---

## Rollback

Se algo der errado antes do passo 2 (schema):

```bash
psql $DATABASE_URL < backup_pre_migration_YYYYMMDD_HHMMSS.sql
```

Se o problema for após o passo 2, o rollback de schema é manual (recriar coluna `stripeCustomerId`).
Os dados de assinaturas Stripe ainda estarão no dashboard da Stripe.
