import { Injectable, NotImplementedException } from '@nestjs/common';
import { type TransferStatus } from '@app/shared';
import {
  type PaymentProvider,
  type ProviderQuote,
  type ProviderTransfer,
} from '../payment-provider.interface';

/**
 * Placeholder. A implementacao real encapsularia o SDK do Wise Platform AQUI,
 * na camada de infraestrutura — o dominio continua a depender so de
 * `PaymentProvider`. Ver docs/providers.md.
 */
@Injectable()
export class WisePaymentProvider implements PaymentProvider {
  readonly name = 'wise';

  createQuote(): Promise<ProviderQuote> {
    throw new NotImplementedException('WisePaymentProvider ainda nao esta implementado.');
  }

  createTransfer(): Promise<ProviderTransfer> {
    throw new NotImplementedException('WisePaymentProvider ainda nao esta implementado.');
  }

  getTransferStatus(): Promise<TransferStatus> {
    throw new NotImplementedException('WisePaymentProvider ainda nao esta implementado.');
  }
}
