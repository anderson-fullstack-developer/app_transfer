import { Global, Logger, Module } from '@nestjs/common';
import { AppConfigService } from '../config/app-config.service';
import { PAYMENT_PROVIDER, type PaymentProvider } from './payment-provider.interface';
import { MockPaymentProvider } from './mock/mock-payment.provider';
import { WisePaymentProvider } from './wise/wise-payment.provider';

/**
 * Feature flag (doc, seccao 32): `PAYMENT_PROVIDER=mock|wise|nium|thunes`.
 * A factory resolve a implementacao; o resto da app injeta `PAYMENT_PROVIDER`
 * e so conhece a interface. Nada de `if (provider === ...)` espalhado.
 */
@Global()
@Module({
  providers: [
    MockPaymentProvider,
    WisePaymentProvider,
    {
      provide: PAYMENT_PROVIDER,
      useFactory: (
        config: AppConfigService,
        mock: MockPaymentProvider,
        wise: WisePaymentProvider,
      ): PaymentProvider => {
        const logger = new Logger('Payments');
        const selected = config.raw.PAYMENT_PROVIDER;
        logger.log(`Payment provider: ${selected}`);
        switch (selected) {
          case 'wise':
            return wise;
          case 'mock':
          default:
            return mock;
        }
      },
      inject: [AppConfigService, MockPaymentProvider, WisePaymentProvider],
    },
  ],
  exports: [PAYMENT_PROVIDER],
})
export class PaymentsModule {}
