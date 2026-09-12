import { createHash } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { Prisma } from '@app/database';
import { AppError, ErrorCode } from '@app/shared';
import { PrismaService } from '../database/prisma.service';

const DEFAULT_TTL_MS = 24 * 60 * 60 * 1000; // 24h

export interface IdempotentRunParams<T> {
  key: string;
  scope: string;
  userId: string;
  /** O que identifica o pedido — se mudar, a mesma key e um conflito. */
  payload: unknown;
  fn: () => Promise<{ status: number; body: T }>;
}

export interface IdempotentRunResult<T> {
  status: number;
  body: T;
  /** true se a resposta veio de uma execucao anterior (retry). */
  replayed: boolean;
}

function hashPayload(payload: unknown): string {
  return createHash('sha256').update(JSON.stringify(payload)).digest('hex');
}

/**
 * Garante `Idempotency-Key` persistente (doc, seccao 11): um retry com a
 * mesma chave e o mesmo pedido devolve a resposta original em vez de repetir
 * o efeito (ex.: criar duas transferencias). Chave + payload diferentes ->
 * 409 IDEMPOTENCY_KEY_CONFLICT.
 */
@Injectable()
export class IdempotencyService {
  constructor(private readonly prisma: PrismaService) {}

  async run<T>(params: IdempotentRunParams<T>): Promise<IdempotentRunResult<T>> {
    const requestHash = hashPayload(params.payload);
    const expiresAt = new Date(Date.now() + DEFAULT_TTL_MS);

    let record: { id: string } | null = null;
    try {
      record = await this.prisma.idempotencyKey.create({
        data: {
          key: params.key,
          scope: params.scope,
          requestHash,
          userId: params.userId,
          expiresAt,
        },
      });
    } catch (error) {
      if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== 'P2002') {
        throw error;
      }
      // Ja existe uma entrada para esta (key, scope) -> ver o que fazer com ela.
      const existing = await this.prisma.idempotencyKey.findUnique({
        where: { key_scope: { key: params.key, scope: params.scope } },
      });
      if (!existing) throw error;

      if (existing.requestHash !== requestHash) {
        throw new AppError(
          ErrorCode.IDEMPOTENCY_KEY_CONFLICT,
          'Essa Idempotency-Key ja foi usada com um pedido diferente.',
        );
      }
      if (existing.responseBody === null) {
        throw new AppError(
          ErrorCode.CONFLICT,
          'Este pedido ainda esta a ser processado. Tenta novamente em breve.',
        );
      }
      return {
        status: existing.responseStatus ?? 200,
        body: existing.responseBody as T,
        replayed: true,
      };
    }

    try {
      const result = await params.fn();
      await this.prisma.idempotencyKey.update({
        where: { id: record.id },
        data: {
          responseStatus: result.status,
          responseBody: result.body as Prisma.InputJsonValue,
        },
      });
      return { ...result, replayed: false };
    } catch (error) {
      // Nao deixar uma entrada "presa" sem resposta — permite um novo retry legitimo.
      await this.prisma.idempotencyKey.delete({ where: { id: record.id } }).catch(() => undefined);
      throw error;
    }
  }
}
