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

### Auth (Fase 3)

```
POST /api/v1/auth/register
POST /api/v1/auth/login
POST /api/v1/auth/logout
POST /api/v1/auth/refresh
GET  /api/v1/auth/me
```

### Students (Fases 4–5)

```
GET   /api/v1/students/by-username/:username
GET   /api/v1/students/me
PATCH /api/v1/students/me
GET   /api/v1/students/username/:username/availability
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
