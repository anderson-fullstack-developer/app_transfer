# Domínio

## Invariantes de negócio (secção 37 da doc)

1. Username é único (index único em `usernameNormalized`).
2. Sender não pode enviar para estudante inexistente.
3. Quote tem validade limitada (`expiresAt`).
4. Quote expirada não cria transferência.
5. Valor mínimo e máximo vêm de configuração (`TRANSFER_MIN/MAX_SOURCE_MINOR`).
6. Transfer não muda de status arbitrariamente — só via state machine.
7. Transfer não pode ser duplicada por retry — `Idempotency-Key` persistente.
8. Valores financeiros nunca usam `float` — minor units (`BigInt`) + `Decimal`.
9. Utilizador comum não muda o próprio `role`.
10. Provider não controla lógica de domínio.
11. `TransferEvent` é append-only — nunca apagar eventos financeiros.
12. Dados privados do estudante nunca aparecem na pesquisa pública.
13. Ações de admin relevantes são auditadas.
14. Endpoints mock/dev nunca disponíveis em produção.

## Enums

Fonte de verdade: [`packages/shared/src/domain/enums.ts`](../packages/shared/src/domain/enums.ts).
O schema Prisma espelha estes valores.

- `UserRole`: STUDENT · SENDER · ADMIN
- `UserStatus`: ACTIVE · SUSPENDED · DELETED
- `KycStatus`: NOT_STARTED · PENDING · VERIFIED · REJECTED
- `QuoteStatus`: ACTIVE · EXPIRED · CONSUMED
- `TransferStatus`: DRAFT · AWAITING_PAYMENT · PAYMENT_PROCESSING · PAID · PROCESSING · SENT_TO_PROVIDER · DELIVERED · FAILED · CANCELLED · REFUNDED
- `TransferEventType`: CREATED · STATUS_CHANGED · PROVIDER_UPDATE · PAYMENT_ATTEMPT · NOTE
- `NotificationChannel`: IN_APP · EMAIL · PUSH · SMS · WHATSAPP

## `@username`

- Normalização: remove `@` inicial, trim, minúsculas. Guardamos `usernameNormalized`.
- Regras: 3–30 caracteres, `[a-z0-9._]`, sem espaços, sem `.` no início/fim, sem `..`.
- Lista de reservados em [`packages/shared/src/username/reserved.ts`](../packages/shared/src/username/reserved.ts).
- **Disponibilidade é sempre confirmada pelo backend** contra a base de dados.

## Dinheiro (regra fundamental — secção 44)

- Valor canónico: minor units inteiros em `BigInt` (ex.: `10000` = 100,00 EUR).
- Taxas de câmbio: `Decimal` (decimal.js), nunca `number`.
- `Money` é imutável; ver [`packages/shared/src/money/money.ts`](../packages/shared/src/money/money.ts).
- Arredondamento: fee **para cima** (nunca cobramos a menos), montante do
  destinatário **para baixo** (nunca prometemos a mais). Documentado no código.

## Entidades (modelo de dados completo na Fase 2)

`User` · `StudentProfile` · `SenderProfile` · `Quote` · `Transfer` ·
`TransferEvent` · `PaymentAttempt` · `FavoriteBeneficiary` · `KycVerification` ·
`Notification` · `AuditLog` · `IdempotencyKey`
