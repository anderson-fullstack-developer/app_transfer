import { Body, Controller, Get, HttpCode, Post, Req, Res } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { type Request, type Response } from 'express';
import { AuthService } from './auth.service';
import { TokenService } from './token.service';
import { AppConfigService } from '../config/app-config.service';
import { Public } from './decorators/public.decorator';
import { CurrentUser } from './decorators/current-user.decorator';
import { type AuthenticatedUser } from './auth.types';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthResultDto, AuthUserDto } from './dto/auth-response.dto';
import { ForgotPasswordDto, ResetPasswordDto, VerifyEmailDto } from './dto/password.dto';
import { REFRESH_COOKIE_NAME, clearRefreshCookie, setRefreshCookie } from './refresh-cookie';

function requestContext(req: Request): { ip?: string | null; userAgent?: string | null } {
  return { ip: req.ip ?? null, userAgent: req.header('user-agent') ?? null };
}

@ApiTags('auth')
@Controller({ path: 'auth', version: '1' })
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly tokens: TokenService,
    private readonly config: AppConfigService,
  ) {}

  @Post('register')
  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiOperation({ summary: 'Criar conta (STUDENT ou SENDER)' })
  async register(
    @Body() dto: RegisterDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResultDto> {
    const { user, tokens } = await this.auth.register(dto, requestContext(req));
    setRefreshCookie(res, this.config, tokens.refreshToken, tokens.refreshExpiresAt);
    return { user, accessToken: tokens.accessToken, expiresIn: tokens.accessExpiresInSeconds };
  }

  @Post('login')
  @Public()
  @HttpCode(200)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiOperation({ summary: 'Iniciar sessao' })
  async login(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResultDto> {
    const { user, tokens } = await this.auth.login(dto, requestContext(req));
    setRefreshCookie(res, this.config, tokens.refreshToken, tokens.refreshExpiresAt);
    return { user, accessToken: tokens.accessToken, expiresIn: tokens.accessExpiresInSeconds };
  }

  @Post('refresh')
  @Public()
  @HttpCode(200)
  @ApiOperation({ summary: 'Renovar o access token usando o refresh cookie' })
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ accessToken: string; expiresIn: number }> {
    const raw = (req.cookies as Record<string, string> | undefined)?.[REFRESH_COOKIE_NAME];
    const tokens = await this.auth.refresh(raw, requestContext(req));
    setRefreshCookie(res, this.config, tokens.refreshToken, tokens.refreshExpiresAt);
    return { accessToken: tokens.accessToken, expiresIn: tokens.accessExpiresInSeconds };
  }

  @Post('logout')
  @Public()
  @HttpCode(204)
  @ApiOperation({ summary: 'Terminar a sessao atual' })
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response): Promise<void> {
    const raw = (req.cookies as Record<string, string> | undefined)?.[REFRESH_COOKIE_NAME];
    await this.auth.logout(raw);
    clearRefreshCookie(res, this.config);
  }

  @Get('me')
  @ApiOperation({ summary: 'Dados do utilizador autenticado' })
  async me(@CurrentUser('id') userId: string): Promise<AuthUserDto> {
    return this.auth.getMe(userId);
  }

  @Post('verify-email')
  @Public()
  @HttpCode(204)
  @ApiOperation({ summary: 'Confirmar email a partir do token do link' })
  async verifyEmail(@Body() dto: VerifyEmailDto): Promise<void> {
    await this.auth.verifyEmail(dto.token);
  }

  @Post('resend-verification')
  @HttpCode(202)
  @ApiOperation({ summary: 'Reenviar o email de verificacao' })
  async resendVerification(@CurrentUser() user: AuthenticatedUser): Promise<void> {
    if (!user.emailVerified) {
      await this.auth.sendEmailVerification(user.id, user.email);
    }
  }

  @Post('forgot-password')
  @Public()
  @HttpCode(202)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiOperation({ summary: 'Pedir link de reposicao de password' })
  async forgotPassword(@Body() dto: ForgotPasswordDto): Promise<void> {
    await this.auth.requestPasswordReset(dto.email);
  }

  @Post('reset-password')
  @Public()
  @HttpCode(204)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiOperation({ summary: 'Definir nova password a partir do token do link' })
  async resetPassword(@Body() dto: ResetPasswordDto): Promise<void> {
    await this.auth.resetPassword(dto.token, dto.password);
  }
}
