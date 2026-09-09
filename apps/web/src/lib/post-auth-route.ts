import { type AuthUser } from '@app/shared';

/** Para onde enviar o utilizador depois de autenticar / ao entrar numa rota protegida. */
export function postAuthRoute(user: AuthUser): '/onboarding' | '/dashboard' {
  if (user.role === 'STUDENT' && !user.onboardingComplete) return '/onboarding';
  return '/dashboard';
}
