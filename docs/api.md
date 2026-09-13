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

### Quotes — implementado (Fase 6)

```
GET  /api/v1/quotes/rate              parametros de cotacao (preview no browser)
POST /api/v1/quotes                   { studentUsername, amount }  (@Roles SENDER)
GET  /api/v1/quotes/:id               (so o sender dono)
```

### Transfers — implementado (Fase 7)

```
POST /api/v1/transfers                { quoteId }  (@Roles SENDER, header Idempotency-Key obrigatorio)
GET  /api/v1/transfers                (as minhas — sender ve as que enviou, student as que recebeu)
GET  /api/v1/transfers/:reference     (so sender/student donos ou ADMIN; 404 para os outros — anti-IDOR)
```

`Idempotency-Key` (UUID, gerado no cliente): retry com a mesma key + mesmo
`quoteId` devolve a transferencia ja criada; mesma key com `quoteId` diferente
→ `409 IDEMPOTENCY_KEY_CONFLICT`. A quote so pode ser consumida uma vez
(update atomico `WHERE status='ACTIVE'`); a segunda tentativa dá
`QUOTE_ALREADY_CONSUMED`.

Ao criar, a transferencia avanca sozinha (modo SIMULATION, sem cobranca real)
por `DRAFT → AWAITING_PAYMENT → PAYMENT_PROCESSING → PAID → PROCESSING →
SENT_TO_PROVIDER`, com um `TransferEvent` append-only em cada passo.

```
POST /api/v1/dev/mock/transfers/:reference/advance   SENT_TO_PROVIDER -> DELIVERED
```

So responde quando `ENABLE_DEV_ENDPOINTS=true` (404 caso contrario) — nunca
disponivel em producao (o `parseApiEnv` ja recusa arrancar assim).

`amount` em EUR (string "100" ou "100,50"). Valida min/max
(`TRANSFER_MIN/MAX_SOURCE_MINOR`). Quote expira em `QUOTE_TTL_SECONDS`
(expiracao preguicosa no `GET`). Referencia publica `QTE-XXXX`. Montantes na
resposta em minor units como string (BigInt). audit `QUOTE_CREATED`.

### Favorites — implementado (Fase 8)

```
GET    /api/v1/favorites             (@Roles SENDER) lista os meus favoritos
POST   /api/v1/favorites             { studentUsername, alias? } — 409 se ja existe
DELETE /api/v1/favorites/:id         204; so o dono pode remover
```

### Notifications — implementado (Fase 9)

```
GET    /api/v1/notifications           { items: NotificationView[], unreadCount }
PATCH  /api/v1/notifications/:id/read  204; so o dono
PATCH  /api/v1/notifications/read-all  204; marca todas como lidas
```

Canal `IN_APP`. Criadas automaticamente quando uma `Transfer` chega a
`DELIVERED`: uma para o estudante ("Recebeste..."), outra para o sender
("...foi entregue"). `metadata.transferReference` liga de volta a
`/transfers/:reference` no frontend.

### Admin (Fase 10) — RBAC obrigatório

```
GET /api/v1/admin/users
GET /api/v1/admin/transfers
GET /api/v1/admin/transfers/:reference
GET /api/v1/admin/stats
```

### Webhooks — não implementado

`POST /api/v1/webhooks/payment/:provider` está previsto na arquitetura
(doc, secção 15) para quando um provider real (Wise/Nium/Thunes) substituir
o `MockPaymentProvider`, mas **não existe código nenhum ainda** — o modo
SIMULATION não precisa de receber callbacks assíncronos de um parceiro
financeiro.

### Dev — implementado, só fora de produção

```
POST /api/v1/dev/mock/transfers/:reference/advance   SENT_TO_PROVIDER -> DELIVERED
```

Só responde com `ENABLE_DEV_ENDPOINTS=true` (404 caso contrário); nunca
disponível em produção — `parseApiEnv` recusa arrancar com
`NODE_ENV=production` e esta variável a `true`.
