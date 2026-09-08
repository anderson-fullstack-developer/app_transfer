# Payment Providers

## Abstração (secção 9 da doc)

O domínio define uma interface e nunca importa um SDK de provider diretamente.

```typescript
interface PaymentProvider {
  createQuote(input: CreateQuoteInput): Promise<ProviderQuote>;
  createTransfer(input: CreateTransferInput): Promise<ProviderTransfer>;
  getTransferStatus(providerTransferId: string): Promise<TransferStatus>;
  cancelTransfer?(providerTransferId: string): Promise<void>;
}
```

Estrutura (Fase 6):

```
apps/api/src/payments/
  payment-provider.interface.ts
  payment-provider.factory.ts      seleciona por PAYMENT_PROVIDER
  mock/mock-payment.provider.ts     implementado
  wise/wise-payment.provider.ts     stub (NotImplementedException)
  nium/nium-payment.provider.ts     stub
  thunes/thunes-payment.provider.ts stub
```

## Feature flag (secção 32)

`PAYMENT_PROVIDER=mock | wise | nium | thunes`.

Não espalhar `if (provider === ...)` pelo código — a `PaymentProviderFactory`
resolve a implementação e injeta-a. O resto da aplicação só conhece a interface.

## Como trocar Mock → Wise/Nium/Thunes

1. Implementar `WisePaymentProvider implements PaymentProvider` em
   `apps/api/src/payments/wise/`, encapsulando o SDK.
2. `verifySignature()`, `parseEvent()`, `mapStatus()` para o webhook do provider.
3. Registar no `PaymentProviderFactory`.
4. Definir `PAYMENT_PROVIDER=wise` e as credenciais no ambiente.
5. **Nenhuma alteração** em `quotes`, `transfers` ou no domínio.

O SDK do Wise vive só na camada de infraestrutura. O domínio continua a
depender apenas de `PaymentProvider`.

## Webhooks (secção 15)

`POST /api/v1/webhooks/payment/:provider` → `WebhookService` delega no provider
correspondente para verificar assinatura, parsear e mapear o estado para o
`TransferStatus` interno.
