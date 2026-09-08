import { describe, expect, it } from 'vitest';
import {
  assertTransition,
  canTransition,
  isTerminalTransferStatus,
} from './transfer-state-machine.js';
import { AppError } from '../errors/index.js';
import type { TransferStatus } from '../domain/enums.js';

describe('transfer state machine', () => {
  it('permite o caminho feliz completo', () => {
    const happyPath: ReadonlyArray<readonly [TransferStatus, TransferStatus]> = [
      ['DRAFT', 'AWAITING_PAYMENT'],
      ['AWAITING_PAYMENT', 'PAYMENT_PROCESSING'],
      ['PAYMENT_PROCESSING', 'PAID'],
      ['PAID', 'PROCESSING'],
      ['PROCESSING', 'SENT_TO_PROVIDER'],
      ['SENT_TO_PROVIDER', 'DELIVERED'],
    ];
    for (const [from, to] of happyPath) {
      expect(canTransition(from, to)).toBe(true);
    }
  });

  it('proibe transicoes arbitrarias', () => {
    expect(canTransition('DRAFT', 'DELIVERED')).toBe(false);
    expect(canTransition('DELIVERED', 'PROCESSING')).toBe(false);
    expect(canTransition('PAID', 'DRAFT')).toBe(false);
  });

  it('permite falha durante o processamento do pagamento', () => {
    expect(canTransition('PAYMENT_PROCESSING', 'FAILED')).toBe(true);
  });

  it('assertTransition lanca AppError numa transicao invalida', () => {
    expect(() => assertTransition('DRAFT', 'PAID')).toThrow(AppError);
  });

  it('identifica estados terminais', () => {
    expect(isTerminalTransferStatus('DELIVERED')).toBe(true);
    expect(isTerminalTransferStatus('CANCELLED')).toBe(true);
    expect(isTerminalTransferStatus('REFUNDED')).toBe(true);
    expect(isTerminalTransferStatus('PROCESSING')).toBe(false);
  });
});
