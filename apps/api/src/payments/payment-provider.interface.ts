import { type TransferStatus } from '@app/shared';

/**
 * Abstracao central de provider de pagamento (doc, seccao 9).
 * O DOMINIO nunca importa um SDK de provider — depende so desta interface.
 * A infraestrutura (mock/, wise/, nium/, thunes/) implementa-a.
 */

export interface ProviderQuoteInput {
  sourceCurrency: string;
  destinationCurrency: string;
  /** Montante a converter, em minor units da moeda de origem (cents de EUR). */
  sourceAmountMinor: bigint;
}

export interface ProviderQuote {
  sourceAmountMinor: bigint;
  feeAmountMinor: bigint;
  destinationAmountMinor: bigint;
  /** Taxa aplicada, como string decimal (MAD por 1 EUR). */
  exchangeRate: string;
}

export interface ProviderTransferInput {
  providerQuoteRef?: string;
  sourceCurrency: string;
  destinationCurrency: string;
  sourceAmountMinor: bigint;
  destinationAmountMinor: bigint;
  /** Referencia interna da nossa transferencia (para correlacao). */
  reference: string;
}

export interface ProviderTransfer {
  providerTransferId: string;
  status: TransferStatus;
}

export interface PaymentProvider {
  readonly name: string;
  createQuote(input: ProviderQuoteInput): Promise<ProviderQuote>;
  createTransfer(input: ProviderTransferInput): Promise<ProviderTransfer>;
  getTransferStatus(providerTransferId: string): Promise<TransferStatus>;
  cancelTransfer?(providerTransferId: string): Promise<void>;
}

export const PAYMENT_PROVIDER = Symbol('PAYMENT_PROVIDER');
