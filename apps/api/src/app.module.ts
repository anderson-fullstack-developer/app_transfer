import { type MiddlewareConsumer, Module, type NestModule } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { AppConfigModule } from './config/app-config.module';
import { AllExceptionsFilter } from './common/http/all-exceptions.filter';
import { RequestIdMiddleware } from './common/http/request-id.middleware';
import { HealthModule } from './health/health.module';

/**
 * Modulo raiz. Cada dominio (auth, students, quotes, transfers, ...) sera um
 * modulo proprio com fronteiras claras — Modular Monolith (seccao 2 da doc).
 */
@Module({
  imports: [AppConfigModule, HealthModule],
  providers: [{ provide: APP_FILTER, useClass: AllExceptionsFilter }],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestIdMiddleware).forRoutes('*');
  }
}
