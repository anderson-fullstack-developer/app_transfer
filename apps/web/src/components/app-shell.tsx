'use client';

import Link from 'next/link';
import { Button } from '@app/ui/components';
import { useAuth } from '@/lib/auth-context';
import { NotificationBell } from './notification-bell';

/** Cabecalho comum das paginas autenticadas. */
export function AppShell({ children }: { children: React.ReactNode }): React.JSX.Element {
  const { user, logout } = useAuth();
  const initial = user?.email.charAt(0).toUpperCase() ?? '?';

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 border-b border-border bg-surface/80 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-5 py-3">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-sm font-semibold tracking-tight"
          >
            <span className="grid h-6 w-6 place-items-center rounded-md bg-primary text-primary-foreground">
              €
            </span>
            app-transfer
          </Link>
          <div className="flex items-center gap-2">
            <NotificationBell />
            <span
              className="grid h-8 w-8 place-items-center rounded-full bg-muted text-xs font-semibold"
              title={user?.email}
            >
              {initial}
            </span>
            <Button variant="ghost" size="sm" onClick={() => void logout()}>
              Sair
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-5 py-8">{children}</main>
    </div>
  );
}
