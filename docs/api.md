# API

Base URL: `/api/v1`. Documentação interativa (Swagger): `/docs`.

## Formato de erro (secção 25 da doc)

Todas as respostas de erro seguem:

```json
{
  "error": {
    "code": "USERNAME_NOT_FOUND",
    "message": "Nao encontramos nenhum estudante com esse username.",
    "details": { "campo": ["mensagem"] },
    "requestId": "b6c1f0a2-..."
  }
}
```

Códigos estáveis em
[`packages/shared/src/errors/error-codes.ts`](../packages/shared/src/errors/error-codes.ts):
`UNAUTHORIZED`, `FORBIDDEN`, `VALIDATION_ERROR`, `INVALID_AMOUNT`,
`USERNAME_TAKEN`, `USERNAME_NOT_FOUND`, `QUOTE_EXPIRED`, `TRANSFER_NOT_FOUND`,
`INVALID_TRANSFER_STATE`, `RATE_LIMIT_EXCEEDED`, `PROVIDER_UNAVAILABLE`,
`IDEMPOTENCY_KEY_CONFLICT`, ...

Em produção nunca são enviadas stack traces.

## Endpoints (planeados)

### Health — implementado

```
GET /api/v1/health
```

### Auth — implementado (Fase 3)

```
POST /api/v1/auth/register             { email, password, accountType: STUDENT|SENDER }
POST /api/v1/auth/login                { email, password }
POST /api/v1/auth/refresh              (usa o cookie refresh_token)
POST /api/v1/auth/logout
GET  /api/v1/auth/me                   (Bearer)
POST /api/v1/auth/verify-email         { token }
POST /api/v1/auth/resend-verification  (Bearer)
POST /api/v1/auth/forgot-password      { email }        -> 202 sempre (anti-enumeração)
POST /api/v1/auth/reset-password       { token, password }
```

**Modelo de tokens:**

- `accessToken` (JWT, ~15 min) devolvido no corpo — guardar em memória, **nunca** em `localStorage`.
- `refresh_token` em cookie `httpOnly` + `sameSite=lax` + `secure` (produção),
  `path=/api/v1/auth`. Rotativo: cada `refresh` revoga o anterior. Reutilizar um
  refresh token já revogado revoga a família toda (deteção de roubo) → `SESSION_EXPIRED`.
- `role` nunca é aceite do cliente. `accountType` só permite `STUDENT`/`SENDER`.

**Proteção:** rate limiting em `login` (10/min), `register` / `forgot-password` /
`reset-password` (5/min). `USER_REGISTERED` e `USER_LOGIN` gravados no audit log.

### Students (Fases 4–5)

```
GET   /api/v1/students/username/:username/availability   (autoritativo: formato + reservados + BD)
GET   /api/v1/students/me                                (Bearer, role STUDENT; 404 se sem perfil)
POST  /api/v1/students/me                                (completar perfil / onboarding)
PATCH /api/v1/students/me                                (atualizar; mudanca de @username -> audit)
GET   /api/v1/students/by-username/:username             (so username/nome/cidade/pais/verified)
```

`by-username` devolve **apenas** dados publicos minimos (doc, seccao 24) —
nunca email, telefone, data de nascimento, KYC ou IDs internos. Rate limit 20/min.

Validacao via `ZodValidationPipe` com o schema de `@app/shared/contracts`
(a mesma fonte de verdade do frontend). `/auth/*` devolve `onboardingComplete`.

### Senders (Fase 5)

```
GET /api/v1/senders/me    (Bearer, role SENDER; 404 se sem perfil)
PUT /api/v1/senders/me    (criar ou atualizar: fullName [+ country, phone opcionais])
```

### Quotes (Fase 6)

```
POST /api/v1/quotes
GET  /api/v1/quotes/:id
```

### Transfers (Fase 7)

```
POST /api/v1/transfers          (header: Idempotency-Key)
GET  /api/v1/transfers
GET  /api/v1/transfers/:reference
```

### Favorites / Notifications (Fases 8–9)

```
GET    /api/v1/favorites
POST   /api/v1/favorites
DELETE /api/v1/favorites/:id
GET    /api/v1/notifications
PATCH  /api/v1/notifications/:id/read
```

### Admin (Fase 10) — RBAC obrigatório

```
GET /api/v1/admin/users
GET /api/v1/admin/transfers
GET /api/v1/admin/transfers/:reference
GET /api/v1/admin/stats
```

### Webhooks (Fase 6+)

```
POST /api/v1/webhooks/payment/:provider
```

### Dev (apenas com ENABLE_DEV_ENDPOINTS=true)

```
POST /api/v1/dev/mock/transfers/:id/advance
```
