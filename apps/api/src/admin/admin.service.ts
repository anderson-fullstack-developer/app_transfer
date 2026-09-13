import { Injectable } from '@nestjs/common';
import {
  ADMIN_COMPLETED_STATUSES,
  ADMIN_FAILED_STATUSES,
  TransferStatus,
  UserRole,
  type AdminStatsView,
  type AdminTransferFilters,
  type AdminTransferListItem,
  type AdminUserListItem,
} from '@app/shared';
import { type Prisma } from '@app/database';
import { PrismaService } from '../database/prisma.service';

const LIST_LIMIT = 100;

/** Todos os endpoints deste servico sao apenas de leitura (doc, seccao 21). */
@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async stats(): Promise<AdminStatsView> {
    const [totalUsers, totalStudents, totalSenders, totalTransfers, volume, pending, failed, completed] =
      await Promise.all([
        this.prisma.user.count(),
        this.prisma.user.count({ where: { role: UserRole.STUDENT } }),
        this.prisma.user.count({ where: { role: UserRole.SENDER } }),
        this.prisma.transfer.count(),
        this.prisma.transfer.aggregate({ _sum: { sourceAmountMinor: true } }),
        this.prisma.transfer.count({
          where: {
            status: { notIn: [...ADMIN_COMPLETED_STATUSES, ...ADMIN_FAILED_STATUSES] },
          },
        }),
        this.prisma.transfer.count({ where: { status: { in: [...ADMIN_FAILED_STATUSES] } } }),
        this.prisma.transfer.count({ where: { status: { in: [...ADMIN_COMPLETED_STATUSES] } } }),
      ]);

    return {
      totalUsers,
      totalStudents,
      totalSenders,
      totalTransfers,
      volumeEurMinor: (volume._sum.sourceAmountMinor ?? 0n).toString(),
      pendingTransfers: pending,
      failedTransfers: failed,
      completedTransfers: completed,
    };
  }

  async listUsers(): Promise<AdminUserListItem[]> {
    const users = await this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      take: LIST_LIMIT,
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
        emailVerified: true,
        createdAt: true,
        studentProfile: { select: { displayName: true, username: true } },
        senderProfile: { select: { displayName: true } },
      },
    });

    return users.map((u) => ({
      id: u.id,
      email: u.email,
      role: u.role,
      status: u.status,
      emailVerified: u.emailVerified,
      displayName: u.studentProfile?.displayName ?? u.senderProfile?.displayName ?? null,
      username: u.studentProfile ? `@${u.studentProfile.username}` : null,
      createdAt: u.createdAt.toISOString(),
    }));
  }

  async listTransfers(filters: AdminTransferFilters): Promise<AdminTransferListItem[]> {
    const where: Prisma.TransferWhereInput = {};

    if (filters.status && (Object.values(TransferStatus) as string[]).includes(filters.status)) {
      where.status = filters.status;
    }
    if (filters.reference) {
      where.reference = { contains: filters.reference.trim(), mode: 'insensitive' };
    }
    if (filters.username) {
      where.student = {
        usernameNormalized: { contains: filters.username.trim().toLowerCase().replace(/^@/, '') },
      };
    }
    if (filters.dateFrom || filters.dateTo) {
      where.createdAt = {};
      if (filters.dateFrom && !Number.isNaN(Date.parse(filters.dateFrom))) {
        where.createdAt.gte = new Date(filters.dateFrom);
      }
      if (filters.dateTo && !Number.isNaN(Date.parse(filters.dateTo))) {
        where.createdAt.lte = new Date(filters.dateTo);
      }
    }

    const transfers = await this.prisma.transfer.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: LIST_LIMIT,
      include: {
        sender: { select: { displayName: true, user: { select: { email: true } } } },
        student: { select: { displayName: true, username: true } },
      },
    });

    return transfers.map((t) => ({
      reference: t.reference,
      status: t.status,
      senderEmail: t.sender.user.email,
      senderDisplayName: t.sender.displayName,
      studentUsername: `@${t.student.username}`,
      studentDisplayName: t.student.displayName,
      sourceAmountMinor: t.sourceAmountMinor.toString(),
      destinationAmountMinor: t.destinationAmountMinor.toString(),
      provider: t.provider,
      createdAt: t.createdAt.toISOString(),
    }));
  }
}
