import { Injectable } from '@nestjs/common';
import { Prisma } from '@app/database';
import { assertTransition, type TransferEventType, type TransferStatus } from '@app/shared';
import { PrismaService } from '../database/prisma.service';

/**
 * Unico sitio que muda o estado de uma Transfer. Nunca fazer
 * `prisma.transfer.update({ data: { status } })` fora daqui — garante que
 * toda a transicao passa por `assertTransition` e fica registada num
 * TransferEvent append-only (doc, seccao 10).
 */
@Injectable()
export class TransferStateService {
  constructor(private readonly prisma: PrismaService) {}

  async transition(
    transferId: string,
    from: TransferStatus,
    to: TransferStatus,
    eventType: TransferEventType,
    metadata: Prisma.InputJsonValue = {},
  ): Promise<void> {
    assertTransition(from, to);

    await this.prisma.$transaction([
      this.prisma.transfer.update({
        where: { id: transferId },
        data: {
          status: to,
          completedAt: to === 'DELIVERED' ? new Date() : undefined,
        },
      }),
      this.prisma.transferEvent.create({
        data: {
          transferId,
          previousStatus: from,
          newStatus: to,
          eventType,
          metadata,
        },
      }),
    ]);
  }
}
