# Deploy no Coolify

Este documento explica como fazer deploy do CLASHDATA no Coolify.

## Pré-requisitos

- Conta no Coolify configurada
- Repositório Git configurado
- Variáveis de ambiente configuradas no Coolify

## Configuração no Coolify

### Backend

1. **Criar novo Resource (Backend)**
   - Tipo: `Dockerfile`
   - Dockerfile Path: `packages/backend/Dockerfile`
   - Build Context: `.` (raiz do projeto)
   - Port: `3000`

2. **Variáveis de Ambiente (Backend)**
   ```
   DATABASE_URL=postgresql://user:password@host:5432/database
   BETTER_AUTH_SECRET=seu_secret_minimo_32_caracteres
   BETTER_AUTH_BASE_URL=https://api.seudominio.com
   BETTER_AUTH_TRUSTED_ORIGIN=https://seudominio.com
   BETTER_AUTH_TRUSTED_DOMAIN=seudominio.com
   PORT=3000
   NODE_ENV=production
   CORS_ORIGIN=https://seudominio.com
   TOKEN_COC=seu_token_coc
   REDIS_URL=redis://host:6379
   STRIPE_SECRET_KEY=sk_live_...
   STRIPE_PUBLISHABLE_KEY=pk_live_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```

3. **Health Check**
   - Path: `/health`
   - Interval: 30s

### Frontend

1. **Criar novo Resource (Frontend)**
   - Tipo: `Dockerfile`
   - Dockerfile Path: `packages/frontend/Dockerfile`
   - Build Context: `.` (raiz do projeto)
   - Port: `3001`

2. **Variáveis de Ambiente (Frontend)**
   ```
   NODE_ENV=production
   NEXT_PUBLIC_API_URL=https://api.seudominio.com
   PORT=3001
   ```

3. **Health Check**
   - Path: `/`
   - Interval: 30s

### Database (PostgreSQL)

1. **Criar Database Resource**
   - Tipo: PostgreSQL
   - Versão: 16
   - Configurar usuário, senha e database

### Redis

1. **Criar Redis Resource**
   - Tipo: Redis
   - Versão: 7

## Ordem de Deploy

1. Deploy do PostgreSQL primeiro
2. Deploy do Redis
3. Deploy do Backend (depende de PostgreSQL e Redis)
4. Deploy do Frontend (depende do Backend)

## Após o Deploy

1. **Executar migrations do Prisma**
   - Acesse o terminal do container do backend
   - Execute: `bun run db:push`

2. **Configurar Webhook do Stripe**
   - No Stripe Dashboard, configure o webhook para: `https://api.seudominio.com/stripe/webhook`
   - Use o `STRIPE_WEBHOOK_SECRET` gerado

## Notas Importantes

- Certifique-se de que o `BETTER_AUTH_SECRET` tenha pelo menos 32 caracteres
- O `NEXT_PUBLIC_API_URL` deve apontar para a URL do backend
- Configure SSL/TLS no Coolify para ambos os serviços
- Configure o reverse proxy no Coolify para rotear o tráfego corretamente
