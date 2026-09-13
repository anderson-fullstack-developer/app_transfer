import { Injectable, type ExecutionContext } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

/**
 * ThrottlerGuard normal, exceto quando NODE_ENV=test. Os testes de
 * integracao (apps/api/test/*.e2e-spec.ts) criam dezenas de utilizadores em
 * segundos a partir do mesmo IP -- sem isto, os limites por minuto (pensados
 * para trafego real de producao) tornariam os testes inflaveis com 429s que
 * nada tem a ver com o que se esta a validar.
 */
@Injectable()
export class AppThrottlerGuard extends ThrottlerGuard {
  override canActivate(context: ExecutionContext): Promise<boolean> {
    if (process.env.NODE_ENV === 'test') return Promise.resolve(true);
    return super.canActivate(context);
  }
}
