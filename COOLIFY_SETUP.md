# 🚀 Guia de Deploy no Coolify - CLASHDATA

## ⚠️ CONFIGURAÇÃO CRÍTICA

O problema mais comum é o **Build Context** estar incorreto. Siga estas instruções cuidadosamente.

## Passo a Passo

### 1. Backend

1. No Coolify, crie um novo **Resource**
2. Escolha **Dockerfile** como tipo
3. Configure:
   - **Build Context**: `.` (ponto - raiz do repositório)
   - **Dockerfile Path**: `packages/backend/Dockerfile`
   - **Port**: `3000`

### 2. Frontend

1. No Coolify, crie um novo **Resource**
2. Escolha **Dockerfile** como tipo
3. Configure:
   - **Build Context**: `.` (ponto - raiz do repositório)
   - **Dockerfile Path**: `packages/frontend/Dockerfile`
   - **Port**: `3001`

## Verificação do Build Context

Se você ver erros como:
- `"/bun.lock": not found`
- `"/packages/backend/package.json": not found`
- `"/packages/frontend/package.json": not found`

**Isso significa que o Build Context está errado!**

### Como corrigir:

1. Vá em **Settings** do Resource no Coolify
2. Procure por **Build Context** ou **Docker Build Context**
3. Altere para: `.` (ponto)
4. Salve e faça deploy novamente

## Variáveis de Ambiente

### Backend

Configure todas estas variáveis no Coolify (como Runtime Variables):

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

### Frontend

```
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://api.seudominio.com
PORT=3001
```

## ⚠️ Importante sobre NODE_ENV

Se você configurou `NODE_ENV=production` como Build-time variable, o Coolify mostrará um aviso. Isso é normal, mas você pode:

1. **Opção 1**: Marcar `NODE_ENV` como "Runtime only" (recomendado)
2. **Opção 2**: Ignorar o aviso (funciona, mas pode pular devDependencies no build)

## Após o Deploy

1. **Executar migrations do Prisma**:
   - Acesse o terminal do container do backend no Coolify
   - Execute: `bun run db:push`

2. **Configurar Webhook do Stripe**:
   - No Stripe Dashboard, configure o webhook para: `https://api.seudominio.com/stripe/webhook`
   - Use o `STRIPE_WEBHOOK_SECRET` gerado

## Troubleshooting

### Erro: "bun.lock not found"
- **Causa**: Build Context incorreto
- **Solução**: Configure Build Context como `.` (raiz do repositório)

### Erro: "packages/backend/package.json not found"
- **Causa**: Build Context incorreto
- **Solução**: Configure Build Context como `.` (raiz do repositório)

### Erro: "NODE_ENV=development warning"
- **Causa**: NODE_ENV configurado como Build-time variable
- **Solução**: Marque NODE_ENV como "Runtime only" ou ignore o aviso
