'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

/**
 * Protege rotas do lado do cliente. A sessao vive em memoria + cookie httpOnly,
 * por isso a verificacao acontece aqui e nao no middleware do Next.
 */
export function RequireAuth({ children }: { children: React.ReactNode }): React.JSX.Element | null {
  const { status } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status === 'anonymous') {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [status, router, pathname]);

  if (status !== 'authenticated') {
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
