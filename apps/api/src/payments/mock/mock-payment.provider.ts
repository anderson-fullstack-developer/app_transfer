import { randomBytes } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { AppError, ErrorCode, TransferStatus, computeQuoteBreakdown } from '@app/shared';
import { AppConfigService } from '../../config/app-config.service';
import {
  type PaymentProvider,
  type ProviderQuote,
  type ProviderQuoteInput,
  type ProviderTransfer,
  type ProviderTransferInput,
} from '../payment-provider.interface';

/**
 * Provider simulado. NAO liga a nenhuma API financeira real. Le a taxa e a fee
 * da configuracao (`MOCK_EUR_MAD_RATE`, `MOCK_TRANSFER_FEE_PERCENT`,
 * `MOCK_TRANSFER_FIXED_FEE_MINOR`). Usa a matematica money-safe de `@app/shared`.
 */
@Injectable()
export class MockPaymentProvider implements PaymentProvider {
  readonly name = 'mock';

  constructor(private readonly config: AppConfigService) {}

  createQuote(input: ProviderQuoteInput): Promise<ProviderQuote> {
    if (input.sourceCurrency !== 'EUR' || input.destinationCurrency !== 'MAD') {
      throw new AppError(ErrorCode.NOT_IMPLEMENTED, 'O provider mock so simula EUR -> MAD.');
    }
    const env = this.config.raw;
    const sourceMajor = (Number(input.sourceAmountMinor) / 100).toFixed(2);
    const b = computeQuoteBreakdown(
      sourceMajor,
      env.MOCK_EUR_MAD_RATE,
      env.MOCK_TRANSFER_FEE_PERCENT,
      env.MOCK_TRANSFER_FIXED_FEE_MINOR,
    );
    return Promise.resolve({
      sourceAmountMinor: BigInt(b.sourceAmountMinor),
      feeAmountMinor: BigInt(b.feeAmountMinor),
      destinationAmountMinor: BigInt(b.destinationAmountMinor),
      exchangeRate: b.exchangeRate,
    });
  }

  createTransfer(_input: ProviderTransferInput): Promise<ProviderTransfer> {
    // Simula a criacao no provider: devolve um id e o estado inicial.
    return Promise.resolve({
      providerTransferId: `mock_${randomBytes(10).toString('hex')}`,
      status: TransferStatus.SENT_TO_PROVIDER,
    });
  }

  getTransferStatus(): Promise<TransferStatus> {
    // O avanco do estado do mock e feito pelo endpoint de dev, nao por polling.
    return Promise.resolve(TransferStatus.SENT_TO_PROVIDER);
  }

  cancelTransfer(): Promise<void> {
    return Promise.resolve();
  }
}
