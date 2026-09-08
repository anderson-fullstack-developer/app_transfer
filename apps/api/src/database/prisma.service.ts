import { Injectable, Logger, type OnModuleDestroy, type OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@app/database';

/**
 * Acesso a base de dados. Unico ponto onde o `PrismaClient` e instanciado.
 * Os modulos de dominio injetam `PrismaService` (ou, melhor, os seus proprios
 * repositorios que o usam por baixo).
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({ log: ['warn', 'error'] });
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
    this.logger.log('Ligado a base de dados');
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }

  /** Verifica a ligacao a base de dados (usado pelo health check). */
  async ping(): Promise<boolean> {
    try {
      await this.$queryRawUnsafe('SELECT 1');
      return true;
    } catch {
      return false;
    }
  }
}
