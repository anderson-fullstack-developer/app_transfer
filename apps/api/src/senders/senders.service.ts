import { Injectable } from '@nestjs/common';
import { AppError, ErrorCode, type SenderProfileInput, type SenderProfileView } from '@app/shared';
import { PrismaService } from '../database/prisma.service';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class SendersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async getMyProfile(userId: string): Promise<SenderProfileView> {
    const profile = await this.prisma.senderProfile.findUnique({ where: { userId } });
    if (!profile) {
      throw new AppError(ErrorCode.NOT_FOUND, 'Ainda nao tens perfil de remetente.');
    }
    return this.toView(profile);
  }

  async upsertMyProfile(
    userId: string,
    input: SenderProfileInput,
    ctx: { ip?: string | null; userAgent?: string | null },
  ): Promise<SenderProfileView> {
    const existed = await this.prisma.senderProfile.findUnique({
      where: { userId },
      select: { id: true },
    });

    const profile = await this.prisma.senderProfile.upsert({
      where: { userId },
      create: {
        userId,
        displayName: input.fullName,
        country: input.country ?? null,
        phone: input.phone ?? null,
      },
      update: {
        displayName: input.fullName,
        country: input.country ?? null,
        phone: input.phone ?? null,
      },
    });

    if (!existed) {
      await this.audit.record({
        actorId: userId,
        action: 'SENDER_PROFILE_CREATED',
        entityType: 'SenderProfile',
        entityId: profile.id,
        ip: ctx.ip,
        userAgent: ctx.userAgent,
      });
    }

    return this.toView(profile);
  }

  /**
   * Garante que existe um SenderProfile para o utilizador (usado pelos modulos
   * de quote/transfer, que precisam de um senderId). Cria um minimo se faltar.
   */
  async ensureProfile(userId: string, fallbackName: string): Promise<{ id: string }> {
    const existing = await this.prisma.senderProfile.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (existing) return existing;
    return this.prisma.senderProfile.create({
      data: { userId, displayName: fallbackName },
      select: { id: true },
    });
  }

  private toView(p: {
    id: string;
    displayName: string;
    country: string | null;
    phone: string | null;
  }): SenderProfileView {
    return { id: p.id, displayName: p.displayName, country: p.country, phone: p.phone };
  }
}
