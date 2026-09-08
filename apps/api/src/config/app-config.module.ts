import { Global, Module } from '@nestjs/common';
import { AppConfigService } from './app-config.service';

/**
 * Modulo global de configuracao. O carregamento do `.env` acontece em
 * `main.ts` (antes de o Nest arrancar); aqui apenas expomos `AppConfigService`,
 * que valida e tipa as variaveis.
 */
@Global()
@Module({
  providers: [AppConfigService],
  exports: [AppConfigService],
})
export class AppConfigModule {}
