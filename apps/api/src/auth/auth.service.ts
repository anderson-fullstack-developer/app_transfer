import { createHash, randomBytes } from 'node:crypto';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { hashPassword, verifyPassword } from '@app/shared/password';
import { AppError, ErrorCode, UserRole, UserStatus } from '@app/shared';
import { PrismaService } from '../database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { EMAIL_PROVIDER, type EmailProvider } from '../email/email.types';
import { AppConfigService } from '../config/app-config.service';
import { TokenService, type IssuedTokens } from './token.service';
import { type RegisterDto } from './dto/register.dto';
import { type LoginDto } from './dto/login.dto';
import { type AuthenticatedUser } from './auth.types';

interface RequestContext {
  ip?: string | null;
  userAgent?: string | null;
}

export interface AuthResult {
  user: AuthenticatedUser;
  tokens: IssuedTokens;
}

const EMAIL_VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000; // 24h
const PASSWORD_RESET_TTL_MS = 60 * 60 * 1000; // 1h

function hashRaw(raw: string): string {
  return createHash('sha256').update(raw).digest('hex');
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger('Auth');

  constructor(
    private readonly prisma: PrismaService,
    private readonly tokens: TokenService,
    private readonly audit: AuditService,
    private readonly config: AppConfigService,
    @Inject(EMAIL_PROVIDER) private readonly email: EmailProvider,
  ) {}

  // --- Registo -----------------------------------------------------------

  async register(dto: RegisterDto, ctx: RequestContext): Promise<AuthResult> {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) {
      // Mensagem generica para nao confirmar a existencia da conta.
      throw new AppError(ErrorCode.CONFLICT, 'Nao foi possivel criar a conta com esse email.');
    }

    const passwordHash = await hashPassword(dto.password);
    const role = dto.accountType === 'STUDENT' ? UserRole.STUDENT : UserRole.SENDER;

    const user = await this.prisma.user.create({
      data: { email: dto.email, passwordHash, role },
    });

    await this.audit.record({
      actorId: user.id,
      action: 'USER_REGISTERED',
      entityType: 'User',
      entityId: user.id,
      metadata: { role },
      ip: ctx.ip,
      userAgent: ctx.userAgent,
    });

    await this.sendEmailVerification(user.id, user.email);

    const tokens = await this.tokens.issueForNewSession(user, ctx);
    return { user: this.toAuthUser(user), tokens };
  }

  // --- Login -----------------------------------------------------------------

  async login(dto: LoginDto, ctx: RequestContext): Promise<AuthResult> {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });

    if (!user) {
      // Gasta trabalho de hashing equivalente para nao vazar (por timing) que
      // o email nao existe.
      await hashPassword(dto.password);
      throw new AppError(ErrorCode.INVALID_CREDENTIALS, 'Email ou password incorretos.');
    }
    if (!(await verifyPassword(dto.password, user.passwordHash))) {
      throw new AppError(ErrorCode.INVALID_CREDENTIALS, 'Email ou password incorretos.');
    }
    if (user.status !== UserStatus.ACTIVE) {
      throw new AppError(ErrorCode.FORBIDDEN, 'Esta conta esta suspensa.');
    }

    await this.audit.record({
      actorId: user.id,
      action: 'USER_LOGIN',
      entityType: 'User',
      entityId: user.id,
      ip: ctx.ip,
      userAgent: ctx.userAgent,
    });

    const tokens = await this.tokens.issueForNewSession(user, ctx);
    return { user: this.toAuthUser(user), tokens };
  }

  // --- Sessao --------------------------------------------------------------

  async refresh(rawRefreshToken: string | undefined, ctx: RequestContext): Promise<IssuedTokens> {
    if (!rawRefreshToken) {
      throw new AppError(ErrorCode.SESSION_EXPIRED, 'Sessao invalida. Inicia sessao novamente.');
    }
    return this.tokens.rotate(rawRefreshToken, ctx);
  }

  async logout(rawRefreshToken: string | undefined): Promise<void> {
    if (rawRefreshToken) {
      await this.tokens.revoke(rawRefreshToken);
    }
  }

  async getMe(userId: string): Promise<AuthenticatedUser> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new AppError(ErrorCode.UNAUTHORIZED, 'Sessao invalida.');
    }
    return this.toAuthUser(user);
  }

  // --- Verificacao de email --------------------------------------------

  async sendEmailVerification(userId: string, email: string): Promise<void> {
    const raw = randomBytes(32).toString('base64url');
    await this.prisma.verificationToken.create({
      data: {
        userId,
        type: 'EMAIL_VERIFICATION',
        tokenHash: hashRaw(raw),
        expiresAt: new Date(Date.now() + EMAIL_VERIFICATION_TTL_MS),
      },
    });
    const link = `${this.config.webUrl}/verify-email?token=${raw}`;
    await this.email.send({
      to: email,
      subject: 'Confirma o teu email — app-transfer',
      text: `Ola,\n\nConfirma o teu email abrindo este link (valido 24h):\n${link}\n\nSe nao criaste esta conta, ignora esta mensagem.`,
    });
  }

  async verifyEmail(rawToken: string): Promise<void> {
    const record = await this.prisma.verificationToken.findUnique({
      where: { tokenHash: hashRaw(rawToken) },
    });
    if (
      !record ||
      record.type !== 'EMAIL_VERIFICATION' ||
      record.consumedAt ||
      record.expiresAt.getTime() < Date.now()
    ) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, 'Link de verificacao invalido ou expirado.');
    }
    await this.prisma.$transaction([
      this.prisma.verificationToken.update({
        where: { id: record.id },
        data: { consumedAt: new Date() },
      }),
      this.prisma.user.update({
        where: { id: record.userId },
        data: { emailVerified: true, emailVerifiedAt: new Date() },
      }),
    ]);
  }

  // --- Reset de password ------------------------------------------------

  /** Nao revela se o email existe (anti-enumeracao). */
  async requestPasswordReset(email: string): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      this.logger.log(`Pedido de reset para email inexistente: ${email}`);
      return;
    }
    const raw = randomBytes(32).toString('base64url');
    await this.prisma.verificationToken.create({
      data: {
        userId: user.id,
        type: 'PASSWORD_RESET',
        tokenHash: hashRaw(raw),
        expiresAt: new Date(Date.now() + PASSWORD_RESET_TTL_MS),
      },
    });
    const link = `${this.config.webUrl}/reset-password?token=${raw}`;
    await this.email.send({
      to: email,
      subject: 'Repor a tua password — app-transfer',
      text: `Ola,\n\nPara repor a tua password, abre este link (valido 1h):\n${link}\n\nSe nao pediste isto, ignora esta mensagem.`,
    });
  }

  async resetPassword(rawToken: string, newPassword: string): Promise<void> {
    const record = await this.prisma.verificationToken.findUnique({
      where: { tokenHash: hashRaw(rawToken) },
    });
    if (
      !record ||
      record.type !== 'PASSWORD_RESET' ||
      record.consumedAt ||
      record.expiresAt.getTime() < Date.now()
    ) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, 'Link de reposicao invalido ou expirado.');
    }
    const passwordHash = await hashPassword(newPassword);
    await this.prisma.$transaction([
      this.prisma.verificationToken.update({
        where: { id: record.id },
        data: { consumedAt: new Date() },
      }),
      this.prisma.user.update({ where: { id: record.userId }, data: { passwordHash } }),
    ]);
    await this.tokens.revokeAllForUser(record.userId);
    await this.audit.record({
      actorId: record.userId,
      action: 'PASSWORD_RESET',
      entityType: 'User',
      entityId: record.userId,
    });
  }

  // --- Helpers ---------------------------------------------------------------

  private toAuthUser(user: {
    id: string;
    email: string;
    role: UserRole;
    emailVerified: boolean;
  }): AuthenticatedUser {
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      emailVerified: user.emailVerified,
    };
  }
}
