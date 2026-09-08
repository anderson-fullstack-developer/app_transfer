import { type UserRole } from '@app/shared';

/** Payload assinado no access token (JWT). */
export interface AccessTokenPayload {
  sub: string;
  email: string;
  role: UserRole;
}

/** Utilizador autenticado, anexado a `request.user` pelos guards. */
export interface AuthenticatedUser {
  id: string;
  email: string;
  role: UserRole;
  emailVerified: boolean;
}
