'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { type AuthUser } from '@app/shared';
import { useAuth } from '@/lib/auth-context';

/**
 * Protege rotas do lado do cliente. A sessao vive em memoria + cookie httpOnly,
 * por isso a verificacao acontece aqui e nao no middleware do Next.
 * Estudantes sem perfil sao enviados para o onboarding.
 *
 * `role`, quando indicado, restringe a rota a esse papel — quem nao o tiver e
 * enviado para o dashboard. Isto e so conveniencia de UI: o RBAC que conta
 * de verdade corre sempre no backend (@Roles nos controllers).
 */
export function RequireAuth({
  children,
  role,
}: {
  children: React.ReactNode;
  role?: AuthUser['role'];
}): React.JSX.Element | null {
  const { status, user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const needsOnboarding =
    status === 'authenticated' && user?.role === 'STUDENT' && !user.onboardingComplete;
  const wrongRole = status === 'authenticated' && role !== undefined && user?.role !== role;

  useEffect(() => {
    if (status === 'anonymous') {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    } else if (needsOnboarding) {
      router.replace('/onboarding');
    } else if (wrongRole) {
      router.replace('/dashboard');
    }
  }, [status, needsOnboarding, wrongRole, router, pathname]);

  if (status !== 'authenticated' || needsOnboarding || wrongRole) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <span
          className="h-6 w-6 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent"
          aria-label="A carregar"
        />
      </div>
    );
  }
  return <>{children}</>;
}
