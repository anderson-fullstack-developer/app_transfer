# Deployment

Frontend e backend vivem em **domínios diferentes** — é essa a decisão
consciente (Vercel é feito para Next.js; a API precisa de um servidor
persistente, que a Vercel não oferece bem para NestJS).

| Peça                 | Onde    | URL                                 |
| -------------------- | ------- | ----------------------------------- |
| `apps/web` (Next.js) | Vercel  | https://marrocospay.vercel.app      |
| `apps/api` (NestJS)  | Railway | (definido no projeto Railway)       |
| PostgreSQL           | Neon    | mesma base usada em desenvolvimento |

## Railway (API)

O repositório é um monorepo pnpm — o Railway não sabe por si só que só
precisa de construir `apps/api`. O ficheiro `railway.json` na raiz resolve
isso ("configuration as code", aplicado automaticamente a cada deploy):

```json
{
  "build": {
    "buildCommand": "pnpm install --frozen-lockfile && pnpm turbo run build --filter=...@app/api"
  },
  "deploy": { "startCommand": "node apps/api/dist/main.js" }
}
```

`--filter=...@app/api` = "a API e tudo o que ela depende" (`@app/shared`,
`@app/database`, `@app/config`) — não constrói o `apps/web`.

### Variáveis de ambiente no Railway

Copiar do `.env` local, com estas diferenças:

```env
NODE_ENV=production
APP_MODE=SIMULATION
API_URL=https://<o-teu-dominio>.up.railway.app
WEB_URL=https://marrocospay.vercel.app
CORS_ORIGINS=https://marrocospay.vercel.app

DATABASE_URL=<a mesma connection string da Neon>
# DIRECT_URL nao e necessaria em runtime (so para `prisma migrate`).

JWT_ACCESS_SECRET=<gerar um valor novo e forte>
JWT_REFRESH_SECRET=<gerar outro>
COOKIE_DOMAIN=
COOKIE_SECURE=true

PAYMENT_PROVIDER=mock
MOCK_EUR_MAD_RATE=10.85
MOCK_TRANSFER_FEE_PERCENT=2
MOCK_TRANSFER_FIXED_FEE_MINOR=0
TRANSFER_MIN_SOURCE_MINOR=1000
TRANSFER_MAX_SOURCE_MINOR=500000
QUOTE_TTL_SECONDS=600

EMAIL_PROVIDER=console
EMAIL_FROM="app-transfer <no-reply@apptransfer.test>"

# NUNCA true em producao — parseApiEnv recusa arrancar se NODE_ENV=production
# e isto estiver true.
ENABLE_DEV_ENDPOINTS=false
```

Gerar secrets fortes:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

`REDIS_URL` é opcional (ainda sem uso real — rate limiting corre em memória).
Não é preciso defini-la.

O Railway injeta a própria `PORT` — a app já lê `process.env.PORT` primeiro
(`apps/api/src/main.ts`), com fallback para `API_PORT` em desenvolvimento.

## Vercel (Web)

Variável a definir no projeto Vercel:

```env
NEXT_PUBLIC_API_URL=https://<o-dominio-do-railway>.up.railway.app/api/v1
NEXT_PUBLIC_APP_MODE=SIMULATION
```

## Cookies entre domínios

O refresh token vive num cookie `httpOnly`. Como o site e a API estão em
domínios diferentes em produção, o cookie usa `SameSite=None; Secure`
(`apps/api/src/auth/refresh-cookie.ts` — ativado automaticamente quando
`COOKIE_SECURE=true`). Em desenvolvimento local (mesmo "site", portas
diferentes) usa-se `SameSite=Lax`, que não exige HTTPS.

## Depois do primeiro deploy da API

1. Confirmar `GET https://<railway-url>/api/v1/health` → `{"status":"ok", ...}`
2. Atualizar `NEXT_PUBLIC_API_URL` na Vercel com esse domínio e fazer redeploy
   do frontend (ou só re-executar o último deploy — a Vercel também redesenha
   a cada push ao GitHub)
3. Testar o fluxo completo em `https://marrocospay.vercel.app`: registo →
   login → onboarding → enviar dinheiro
