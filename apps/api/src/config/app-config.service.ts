import { Injectable } from '@nestjs/common';
import { type ApiEnv, parseApiEnv } from '@app/config';

/**
 * Configuracao tipada da aplicacao. Valida `process.env` uma unica vez no
 * arranque (fail fast) e expoe getters seguros. Nenhum outro sitio da app
 * deve ler `process.env` diretamente.
 */
@Injectable()
export class AppConfigService {
  private readonly env: ApiEnv;

  constructor() {
    this.env = parseApiEnv();
  }

  get raw(): Readonly<ApiEnv> {
    return this.env;
  }

  get nodeEnv(): ApiEnv['NODE_ENV'] {
    return this.env.NODE_ENV;
  }

  get isProduction(): boolean {
    return this.env.NODE_ENV === 'production';
  }

  get isSimulationMode(): boolean {
    return this.env.APP_MODE === 'SIMULATION';
  }

  get port(): number {
    return this.env.API_PORT;
  }

  get corsOrigins(): string[] {
    return this.env.CORS_ORIGINS;
  }

  get devEndpointsEnabled(): boolean {
    return this.env.ENABLE_DEV_ENDPOINTS;
  }
}
