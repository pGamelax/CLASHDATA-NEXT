# Configuração do Stripe

## Passos para Configurar

### 1. Criar Produtos e Preços no Stripe Dashboard

1. Acesse o [Stripe Dashboard](https://dashboard.stripe.com)
2. Vá em **Products** → **Add Product**
3. Crie 3 produtos (um para cada plano):

#### Produto: Mestre
- **Name**: Mestre
- **Price**: R$ 29,90
- **Billing period**: Monthly
- **Recurring**: Yes
- Copie o **Price ID** (ex: `price_xxxxx`)

#### Produto: Campeão
- **Name**: Campeão
- **Price**: R$ 45,90
- **Billing period**: Monthly
- **Recurring**: Yes
- Copie o **Price ID**

#### Produto: Titã
- **Name**: Titã
- **Price**: R$ 74,90
- **Billing period**: Monthly
- **Recurring**: Yes
- Copie o **Price ID**

### 2. Configurar Variáveis de Ambiente

Adicione as seguintes variáveis no seu `.env`:

```env
# Stripe
STRIPE_SECRET_KEY=sk_test_xxxxx  # Sua chave secreta do Stripe
STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx  # Sua chave pública do Stripe
STRIPE_WEBHOOK_SECRET=whsec_xxxxx  # Secret do webhook (veja passo 3)
STRIPE_PRICE_MESTRE=price_xxxxx  # Price ID do plano Mestre
STRIPE_PRICE_CAMPEAO=price_xxxxx  # Price ID do plano Campeão
STRIPE_PRICE_TITA=price_xxxxx  # Price ID do plano Titã
```

### 3. Configurar Webhook

1. No Stripe Dashboard, vá em **Developers** → **Webhooks**
2. Clique em **Add endpoint**
3. Configure:
   - **Endpoint URL**: `https://seu-dominio.com/stripe/webhook`
   - **Events to send**: Selecione os seguintes eventos:
     - `checkout.session.completed`
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.payment_succeeded`
     - `invoice.payment_failed`
4. Copie o **Signing secret** (começa com `whsec_`) e adicione em `STRIPE_WEBHOOK_SECRET`

### 4. Para Desenvolvimento Local

Use o Stripe CLI para testar webhooks localmente:

```bash
# Instalar Stripe CLI
# https://stripe.com/docs/stripe-cli

# Login
stripe login

# Forward webhooks para localhost
stripe listen --forward-to localhost:3000/stripe/webhook
```

O comando acima mostrará o webhook secret para desenvolvimento. Use esse valor em `STRIPE_WEBHOOK_SECRET` durante desenvolvimento.

### 5. Atualizar Código com Price IDs

Atualize o arquivo `packages/backend/src/services/stripe.service.ts` com os Price IDs reais:

```typescript
export const STRIPE_PLANS: Record<SubscriptionPlan, {...}> = {
  MESTRE: {
    priceId: process.env.STRIPE_PRICE_MESTRE || "price_xxxxx", // Substitua
    // ...
  },
  CAMPEAO: {
    priceId: process.env.STRIPE_PRICE_CAMPEAO || "price_xxxxx", // Substitua
    // ...
  },
  TITA: {
    priceId: process.env.STRIPE_PRICE_TITA || "price_xxxxx", // Substitua
    // ...
  },
};
```

## Fluxo de Funcionamento

1. **Usuário cria organização**: Escolhe nome e plano
2. **Organização criada com trial**: Subscription criada com status `TRIAL` e `trialEndsAt` em 3 dias
3. **Checkout do Stripe**: Usuário é redirecionado para checkout do Stripe
4. **Webhook processa pagamento**: Quando o checkout é completado, o webhook atualiza a subscription
5. **Trial ativo**: Durante 3 dias, a subscription está em trial
6. **Após trial**: Stripe cobra automaticamente e renova a subscription
7. **Job de expiração**: Job verifica subscriptions expiradas a cada hora

## Testando

### Cartões de Teste do Stripe

- **Sucesso**: `4242 4242 4242 4242`
- **Falha**: `4000 0000 0000 0002`
- **3D Secure**: `4000 0025 0000 3155`

Use qualquer data futura para expiração e qualquer CVC.

## Troubleshooting

### Webhook não está sendo recebido

1. Verifique se o endpoint está acessível publicamente
2. Verifique se o `STRIPE_WEBHOOK_SECRET` está correto
3. Use o Stripe CLI para testar localmente
4. Verifique os logs do Stripe Dashboard em **Developers** → **Webhooks** → **Logs**

### Subscription não está sendo atualizada

1. Verifique se os eventos estão sendo enviados no webhook
2. Verifique os logs do backend
3. Verifique se a metadata `organizationId` está sendo enviada no checkout
