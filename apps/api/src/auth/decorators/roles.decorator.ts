import { SetMetadata } from '@nestjs/common';
import { type UserRole } from '@app/shared';

export const ROLES_KEY = 'roles';

/** Restringe uma rota aos papeis indicados. Verificado pelo RolesGuard (backend). */
export const Roles = (...roles: UserRole[]): MethodDecorator & ClassDecorator =>
  SetMetadata(ROLES_KEY, roles);
