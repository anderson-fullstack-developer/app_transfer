# Segurança

Decisões e mecanismos (secção 23 da doc). Atualizar à medida que se implementa.

## Autenticação

- Passwords com hashing forte via **scrypt** (`node:crypto`, sem dependências
  nativas) — parâmetros N=16384, r=8, p=1, guardados no próprio hash para
  permitir aumentar o custo no futuro. scrypt é recomendado pela OWASP para
  armazenamento de passwords. Implementação em `@app/shared/password`
  (`hashPassword` / `verifyPassword` / `passwordNeedsRehash`). **Nunca** texto simples.
  Decisão: scrypt em vez de Argon2id para evitar um módulo nativo no monorepo;
  o formato do hash é versionado, portanto migrar para Argon2 mais tarde é
  transparente para hashes existentes.
- Proteção contra brute force: rate limiting no `/auth/login` + backoff.
- Tokens:
  - access token curto (`JWT_ACCESS_TTL`, default 15 min);
  - refresh token longo, rotativo, guardado em cookie `httpOnly`;
    `sameSite=lax` em desenvolvimento (mesmo site), `sameSite=none` + `secure`
    em produção (frontend e API em domínios diferentes — Vercel + Railway —
    exigem isto para o cookie ser enviado entre eles);
  - **nunca** guardar access tokens sensíveis em `localStorage`.
- Verificação de email obrigatória para ações sensíveis.

## Autorização (RBAC)

- Roles: `STUDENT`, `SENDER`, `ADMIN`.
- Verificação **no backend** via guard + decorator `@Roles(...)`.
- Um utilizador comum **não pode** tornar-se `ADMIN` pelo frontend — o campo
  `role` nunca é aceite do cliente; admins são criados por seed / operação interna.

## IDOR / ownership

Nunca confiar em `userId`, `senderId`, `role`, `studentId`, `amount`, `status`
vindos do frontend. Cada acesso a `/transfers/:id`, `/quotes/:id`, etc. valida
que o requester é o sender, o student, ou um admin autorizado.

## Rede

- `helmet()` para security headers.
- CORS explícito por `CORS_ORIGINS` (nunca `*` com credenciais).
- Rate limiting global + específico (login, pesquisa de `@username` para impedir
  enumeração massiva).

## Input / output

- Validação de todo o input (class-validator / Zod) — `whitelist` + `forbidNonWhitelisted`.
- Proteção contra mass assignment: DTOs explícitos, nunca `...body` para o ORM.
- IDs internos são UUID; referências públicas são `TRF-XXXXXXXX`.

## Serviços externos

- Timeout em todas as chamadas a providers.
- Retry apenas em operações idempotentes.
- `Idempotency-Key` persistente na criação de transferências.

## Logs

- Logger estruturado com `requestId`, `userId` (quando aplicável), `transferReference`.
- **Nunca** registar passwords, tokens ou documentos completos.

## Endpoints de desenvolvimento

`ENABLE_DEV_ENDPOINTS` tem de ser `false` em produção. `parseApiEnv` recusa
`NODE_ENV=production` com dev endpoints ligados.

## Revisão de segurança (Fase 12)

Auditoria manual de todo o backend contra esta checklist, sem findings de
severidade alta/média. Confirmado nomeadamente: nenhum `data: {...body}`
(mass assignment) em todo o código, JWT sem dados sensíveis no payload,
`JwtStrategy` revalida sempre o utilizador na BD (uma conta suspensa perde
acesso de imediato, mesmo com access token ainda válido), e o padrão IDOR
(404 em vez de 403 para não-donos) é consistente em todos os módulos
(quotes, transfers, favorites, notifications, admin).
