import type { Reflector } from '@nestjs/core';
import { type ExecutionContext } from '@nestjs/common';
import { AppError, UserRole } from '@app/shared';
import { RolesGuard } from './roles.guard';
import { ROLES_KEY } from '../decorators/roles.decorator';

function contextWithUser(user: unknown): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
    getHandler: () => ({}),
    getClass: () => ({}),
  } as unknown as ExecutionContext;
}

describe('RolesGuard', () => {
  const makeGuard = (required: UserRole[] | undefined): RolesGuard => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue(required),
    } as unknown as Reflector;
    return new RolesGuard(reflector);
  };

  it('permite quando a rota nao exige papeis', () => {
    expect(makeGuard(undefined).canActivate(contextWithUser({ role: UserRole.SENDER }))).toBe(true);
  });

  it('permite quando o utilizador tem o papel exigido', () => {
    const guard = makeGuard([UserRole.ADMIN]);
    expect(guard.canActivate(contextWithUser({ role: UserRole.ADMIN }))).toBe(true);
  });

  it('bloqueia (FORBIDDEN) quando o papel nao bate', () => {
    const guard = makeGuard([UserRole.ADMIN]);
    expect(() => guard.canActivate(contextWithUser({ role: UserRole.STUDENT }))).toThrow(AppError);
  });

  it('bloqueia quando nao ha utilizador', () => {
    const guard = makeGuard([UserRole.SENDER]);
    expect(() => guard.canActivate(contextWithUser(undefined))).toThrow(AppError);
  });

  it('usa a chave de metadados correta', () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue(undefined),
    } as unknown as Reflector;
    new RolesGuard(reflector).canActivate(contextWithUser({ role: UserRole.ADMIN }));
    expect(reflector.getAllAndOverride).toHaveBeenCalledWith(ROLES_KEY, expect.anything());
  });
});
