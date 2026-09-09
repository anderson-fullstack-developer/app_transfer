import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AppConfigModule } from './config/app-config.module';
import { DatabaseModule } from './database/database.module';
import { EmailModule } from './email/email.module';
import { AuditModule } from './audit/audit.module';
import { AuthModule } from './auth/auth.module';
import { StudentsModule } from './students/students.module';
import { SendersModule } from './senders/senders.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { RolesGuard } from './auth/guards/roles.guard';
import { AllExceptionsFilter } from './common/http/all-exceptions.filter';
import { HealthModule } from './health/health.module';

/**
 * Modulo raiz. Cada dominio (auth, students, quotes, transfers, ...) e um
 * modulo proprio com fronteiras claras — Modular Monolith (doc, seccao 2).
 *
 * Guards globais (ordem importa):
 *   1. ThrottlerGuard  — rate limiting
 *   2. JwtAuthGuard     — exige sessao (exceto @Public())
 *   3. RolesGuard       — RBAC (@Roles(...))
 */
@Module({
  imports: [
    AppConfigModule,
    DatabaseModule,
    EmailModule,
    AuditModule,
    ThrottlerModule.forRoot([{ name: 'default', ttl: 60_000, limit: 120 }]),
    AuthModule,
    StudentsModule,
    SendersModule,
    HealthModule,
  ],
  providers: [
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
