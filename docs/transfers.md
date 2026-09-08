# Transferências

## State machine (secção 10 da doc)

Fonte de verdade:
[`packages/shared/src/transfer/transfer-state-machine.ts`](../packages/shared/src/transfer/transfer-state-machine.ts).

```
DRAFT ─▶ AWAITING_PAYMENT ─▶ PAYMENT_PROCESSING ─▶ PAID ─▶ PROCESSING
      ─▶ SENT_TO_PROVIDER ─▶ DELIVERED

PAYMENT_PROCESSING ─▶ FAILED
PROCESSING         ─▶ FAILED
SENT_TO_PROVIDER   ─▶ FAILED
FAILED             ─▶ REFUNDED
PAID               ─▶ REFUNDED
DRAFT / AWAITING_PAYMENT ─▶ CANCELLED
```

Estados terminais: `DELIVERED`, `CANCELLED`, `REFUNDED`.

Transições arbitrárias são proibidas. O `TransferStateService` (Fase 7) chama
`assertTransition(from, to)` antes de qualquer mudança e grava um `TransferEvent`
append-only com `previousStatus`, `newStatus`, `eventType` e `metadata`.

## Idempotência (secção 11)

`POST /api/v1/transfers` aceita o header `Idempotency-Key: <uuid>`.

- A chave + payload hash são persistidos (`IdempotencyKey`).
- Repetição com a mesma chave e mesmo payload → devolve a transferência já criada.
- Mesma chave com payload diferente → `409 IDEMPOTENCY_KEY_CONFLICT`.
- Implementação persistente (tabela), não em memória.

## Quote → Transfer

1. `POST /quotes` cria uma `Quote` (`sourceAmount`, `feeAmount`, `exchangeRate`,
   `destinationAmount`, `expiresAt = now + QUOTE_TTL_SECONDS`).
2. `POST /transfers` recebe `quoteId` + `Idempotency-Key`.
3. Se a quote expirou → `410 QUOTE_EXPIRED` (o frontend cria nova quote).
4. Transfer nasce em `DRAFT`, com `reference` pública `TRF-XXXXXXXX`.

## Arredondamento monetário

- `feeAmount`: arredondado **para cima**.
- `destinationAmount`: arredondado **para baixo**.
- Justificação: a plataforma nunca cobra a menos nem promete ao estudante mais
  do que consegue garantir.

## Mock provider

`MockPaymentProvider` (Fase 6) simula EUR → MAD com taxa de
`MOCK_EUR_MAD_RATE` e fee de `MOCK_TRANSFER_FEE_PERCENT`.
Em dev, `POST /api/v1/dev/mock/transfers/:id/advance` avança o estado
manualmente — **nunca disponível em produção**.
