# Segurança

Decisões e mecanismos (secção 23 da doc). Atualizar à medida que se implementa.

## Autenticação

- Passwords com hashing forte (Argon2id ou bcrypt cost >= 12) — **nunca** em texto.
- Proteção contra brute force: rate limiting no `/auth/login` + backoff.
- Tokens:
  - access token curto (`JWT_ACCESS_TTL`, default 15 min);
  - refresh token longo, rotativo, guardado em cookie `httpOnly` + `secure`
    (produção) + `sameSite=lax`;
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
