import { AppError, ErrorCode } from '../errors/index.js';
import { TransferStatus } from '../domain/enums.js';

/**
 * State machine explicita das transferencias (seccao 10 da doc).
 * Nao sao permitidas transicoes arbitrarias — o `TransferStateService` no
 * backend usa `assertTransition` antes de qualquer mudanca de estado.
 *
 * Caminho feliz:
 *   DRAFT -> AWAITING_PAYMENT -> PAYMENT_PROCESSING -> PAID -> PROCESSING
 *         -> SENT_TO_PROVIDER -> DELIVERED
 */
const TRANSITIONS: Record<TransferStatus, readonly TransferStatus[]> = {
  DRAFT: [TransferStatus.AWAITING_PAYMENT, TransferStatus.CANCELLED],
  AWAITING_PAYMENT: [TransferStatus.PAYMENT_PROCESSING, TransferStatus.CANCELLED],
  PAYMENT_PROCESSING: [TransferStatus.PAID, TransferStatus.FAILED],
  PAID: [TransferStatus.PROCESSING, TransferStatus.REFUNDED],
  PROCESSING: [TransferStatus.SENT_TO_PROVIDER, TransferStatus.FAILED],
  SENT_TO_PROVIDER: [TransferStatus.DELIVERED, TransferStatus.FAILED],
  DELIVERED: [],
  FAILED: [TransferStatus.REFUNDED],
  CANCELLED: [],
  REFUNDED: [],
};

/** Estados terminais: nenhuma transicao possivel a partir deles. */
export const TERMINAL_TRANSFER_STATUSES: readonly TransferStatus[] = [
  TransferStatus.DELIVERED,
  TransferStatus.CANCELLED,
  TransferStatus.REFUNDED,
];

export function canTransition(from: TransferStatus, to: TransferStatus): boolean {
  return TRANSITIONS[from].includes(to);
}

export function allowedTransitions(from: TransferStatus): readonly TransferStatus[] {
  return TRANSITIONS[from];
}

export function isTerminalTransferStatus(status: TransferStatus): boolean {
  return TERMINAL_TRANSFER_STATUSES.includes(status);
}

/** Lanca AppError(INVALID_TRANSFER_STATE) se a transicao nao for permitida. */
export function assertTransition(from: TransferStatus, to: TransferStatus): void {
  if (!canTransition(from, to)) {
    throw new AppError(
      ErrorCode.INVALID_TRANSFER_STATE,
      `Transicao de transferencia invalida: ${from} -> ${to}`,
    );
  }
}
