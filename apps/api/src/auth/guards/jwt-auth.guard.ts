import { type ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { AppError, ErrorCode } from '@app/shared';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { type AuthenticatedUser } from '../auth.types';

/**
 * Guard global: exige um access token valido, exceto em rotas marcadas
 * com @Public(). Converte falhas no AppError(UNAUTHORIZED) para manter o
 * formato de erro consistente.
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  override canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;
    return super.canActivate(context);
  }

  override handleRequest<TUser = AuthenticatedUser>(err: unknown, user: unknown): TUser {
    if (err || !user) {
      throw new AppError(
        ErrorCode.UNAUTHORIZED,
        'Precisas de iniciar sessao para aceder a este recurso.',
        { cause: err instanceof UnauthorizedException ? err : undefined },
      );
    }
    return user as TUser;
  }
}
