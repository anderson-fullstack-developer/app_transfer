import { z } from 'zod';
import { type TransferStatus } from '../domain/enums.js';

export const createTransferSchema = z.object({
  quoteId: z.string().uuid('Cotacao invalida.'),
});
export type CreateTransferInput = z.infer<typeof createTransferSchema>;

export interface TransferEventView {
  eventType: string;
  previousStatus: TransferStatus | null;
  newStatus: TransferStatus;
  createdAt: string;
}

export interface TransferView {
  reference: string;
  status: TransferStatus;
  sourceCurrency: string;
  destinationCurrency: string;
  sourceAmountMinor: string;
  feeAmountMinor: string;
  totalChargedMinor: string;
  destinationAmountMinor: string;
  exchangeRate: string;
  provider: string;
  /** Nome de quem está do outro lado (perspetiva de quem pediu). */
  counterpartyName: string;
  counterpartyUsername: string | null;
  createdAt: string;
  completedAt: string | null;
  events: TransferEventView[];
}

export interface TransferListItem {
  reference: string;
  status: TransferStatus;
  sourceAmountMinor: string;
  destinationAmountMinor: string;
  counterpartyName: string;
  createdAt: string;
}

/** Passos visuais do progresso (doc, seccao 18). */
export const TRANSFER_TIMELINE_STEPS = [
  'DRAFT',
  'AWAITING_PAYMENT',
  'PAYMENT_PROCESSING',
  'PAID',
  'PROCESSING',
  'SENT_TO_PROVIDER',
  'DELIVERED',
] as const;
