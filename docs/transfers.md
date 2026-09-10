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

## Modelo da cotação (Fase 6)

- `sourceAmount` = valor que o remetente indica **e que é convertido**.
- `feeAmount` = taxa, cobrada **por cima** (`MOCK_TRANSFER_FEE_PERCENT` % do
  `sourceAmount`, arredondado **para cima**, + `MOCK_TRANSFER_FIXED_FEE_MINOR`).
- **Total debitado ao remetente** = `sourceAmount + feeAmount`.
- `destinationAmount` = `sourceAmount` convertido a `MOCK_EUR_MAD_RATE`,
  arredondado **para baixo**.
- Cálculo em `computeQuoteBreakdown` (`@app/shared/contracts/quote`): função pura
  usada no browser (preview ao vivo) **e** no `MockPaymentProvider` (quote real),
  garantindo que os números batem certo.

Ex.: 100 EUR → fee 2,00 EUR → total 102,00 EUR → 1085,00 MAD (10000 × 10,85).

## Arredondamento monetário

- `feeAmount`: arredondado **para cima** — a plataforma nunca cobra a menos.
- `destinationAmount`: arredondado **para baixo** — nunca prometemos ao estudante
  mais do que conseguimos garantir.

## Abstração de provider (Fase 6)

`PaymentProvider` (`apps/api/src/payments/payment-provider.interface.ts`):
`createQuote` · `createTransfer` · `getTransferStatus` · `cancelTransfer?`.

`PaymentsModule` resolve a implementação por `PAYMENT_PROVIDER` (env) via factory
— nada de `if (provider === ...)` no resto do código. `MockPaymentProvider`
implementado; `WisePaymentProvider` é stub (`NotImplementedException`).
`MockPaymentProvider` NÃO liga a nenhuma API real — lê taxa e fee da config.

Em dev, `POST /api/v1/dev/mock/transfers/:id/advance` avançará o estado
manualmente (Fase 7) — **nunca disponível em produção**.
Em dev, `POST /api/v1/dev/mock/transfers/:id/advance` avança o estado
manualmente — **nunca disponível em produção**.
