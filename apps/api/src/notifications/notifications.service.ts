import { Injectable } from '@nestjs/common';
import { Prisma } from '@app/database';
import { AppError, ErrorCode, type NotificationListResult } from '@app/shared';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Cria uma notificacao IN_APP. Nunca deve rebentar o fluxo principal (ex.:
   * avancar uma transferencia) — falhas ficam so em log.
   */
  async create(
    userId: string,
    type: string,
    title: string,
    body: string,
    metadata: Prisma.InputJsonValue = {},
  ): Promise<void> {
    await this.prisma.notification.create({
      data: { userId, channel: 'IN_APP', type, title, body, metadata },
    });
  }

  async list(userId: string): Promise<NotificationListResult> {
    const [items, unreadCount] = await Promise.all([
      this.prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
      this.prisma.notification.count({ where: { userId, readAt: null } }),
    ]);
    return {
      items: items.map((n) => ({
        id: n.id,
        type: n.type,
        title: n.title,
        body: n.body,
        readAt: n.readAt ? n.readAt.toISOString() : null,
        createdAt: n.createdAt.toISOString(),
        metadata: (n.metadata as Record<string, unknown>) ?? {},
      })),
      unreadCount,
    };
  }

  async markRead(userId: string, id: string): Promise<void> {
    const notification = await this.prisma.notification.findUnique({ where: { id } });
    if (!notification || notification.userId !== userId) {
      throw new AppError(ErrorCode.NOT_FOUND, 'Notificacao nao encontrada.');
    }
    if (!notification.readAt) {
      await this.prisma.notification.update({ where: { id }, data: { readAt: new Date() } });
    }
  }

  async markAllRead(userId: string): Promise<void> {
    await this.prisma.notification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() },
    });
  }
}
