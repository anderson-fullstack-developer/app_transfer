import { Global, Module } from '@nestjs/common';
import { AppConfigService } from '../config/app-config.service';
import { ConsoleEmailProvider } from './console-email.provider';
import { EMAIL_PROVIDER } from './email.types';

/**
 * Seleciona a implementacao de EmailProvider por configuracao.
 * Hoje so existe "console"; "smtp" sera adicionado quando necessario.
 */
@Global()
@Module({
  providers: [
    ConsoleEmailProvider,
    {
      provide: EMAIL_PROVIDER,
      useFactory: (config: AppConfigService, consoleProvider: ConsoleEmailProvider) => {
        switch (config.raw.EMAIL_PROVIDER) {
          case 'console':
          default:
            return consoleProvider;
        }
      },
      inject: [AppConfigService, ConsoleEmailProvider],
    },
  ],
  exports: [EMAIL_PROVIDER],
})
export class EmailModule {}
