import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AppError, ErrorCode, type UserRole } from '@app/shared';
import { AppConfigService } from '../config/app-config.service';
import { PrismaService } from '../database/prisma.service';
import { type AccessTokenPayload } from './auth.types';

export interface IssuedTokens {
  accessToken: string;
  accessExpiresInSeconds: number;
  refreshToken: string;
  refreshExpiresAt: Date;
}

interface RefreshContext {
  userAgent?: string | null;
  ip?: string | null;
}

/** SHA-256 hex. Guardamos so o hash dos refresh tokens; o valor cru so vai no cookie. */
function hashToken(raw: string): string {
  return createHash('sha256').update(raw).digest('hex');
}

@Injectable()
export class TokenService {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: AppConfigService,
    private readonly prisma: PrismaService,
  ) {}

  private signAccessToken(user: { id: string; email: string; role: UserRole }): string {
    const payload: AccessTokenPayload = { sub: user.id, email: user.email, role: user.role };
    return this.jwt.sign(payload, {
      secret: this.config.jwt.accessSecret,
      expiresIn: this.config.jwt.accessTtlSeconds,
    });
  }

  /** Emite um par novo (access + refresh) para uma nova sessao. */
  async issueForNewSession(
    user: { id: string; email: string; role: UserRole },
    ctx: RefreshContext,
  ): Promise<IssuedTokens> {
    return this.createRefresh(user, randomUUID(), ctx);
  }

  /**
   * Roda um refresh token: valida o antigo, revoga-o e emite um novo da mesma
   * familia. Reutilizacao de um token ja revogado => revoga a familia toda.
   */
  async rotate(rawRefreshToken: string, ctx: RefreshContext): Promise<IssuedTokens> {
    const tokenHash = hashToken(rawRefreshToken);
    const existing = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!existing) {
      throw new AppError(ErrorCode.SESSION_EXPIRED, 'Sessao invalida. Inicia sessao novamente.');
    }
    if (existing.revokedAt) {
      // Token ja usado -> possivel roubo. Mata a familia inteira.
      await this.prisma.refreshToken.updateMany({
        where: { familyId: existing.familyId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      throw new AppError(ErrorCode.SESSION_EXPIRED, 'Sessao terminada por seguranca.');
    }
    if (existing.expiresAt.getTime() < Date.now()) {
      throw new AppError(ErrorCode.SESSION_EXPIRED, 'A sessao expirou. Inicia sessao novamente.');
    }

    const issued = await this.createRefresh(existing.user, existing.familyId, ctx);
    await this.prisma.refreshToken.update({
      where: { id: existing.id },
      data: { revokedAt: new Date(), replacedById: null },
    });
    return issued;
  }

  /** Revoga um refresh token especifico (logout desta sessao). */
  async revoke(rawRefreshToken: string): Promise<void> {
    const tokenHash = hashToken(rawRefreshToken);
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  /** Revoga todas as sessoes de um utilizador (ex.: apos reset de password). */
  async revokeAllForUser(userId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  private async createRefresh(
    user: { id: string; email: string; role: UserRole },
    familyId: string,
    ctx: RefreshContext,
  ): Promise<IssuedTokens> {
    const raw = randomBytes(48).toString('base64url');
    const refreshTtl = this.config.jwt.refreshTtlSeconds;
    const expiresAt = new Date(Date.now() + refreshTtl * 1000);

    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: hashToken(raw),
        familyId,
        expiresAt,
        userAgent: ctx.userAgent ?? null,
        ip: ctx.ip ?? null,
      },
    });

    return {
      accessToken: this.signAccessToken(user),
      accessExpiresInSeconds: this.config.jwt.accessTtlSeconds,
      refreshToken: raw,
      refreshExpiresAt: expiresAt,
    };
  }
}
