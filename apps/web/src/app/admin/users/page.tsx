'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { type AdminUserListItem } from '@app/shared';
import { Alert, Card } from '@app/ui/components';
import { cn } from '@app/ui/lib/cn';
import { RequireAuth } from '@/components/require-auth';
import { AppShell } from '@/components/app-shell';
import { apiFetch, ApiError } from '@/lib/api-client';

const ROLE_STYLE: Record<string, string> = {
  ADMIN: 'bg-primary/10 text-primary',
  STUDENT: 'bg-success/10 text-success',
  SENDER: 'bg-muted text-muted-foreground',
};

function UsersTable(): React.JSX.Element {
  const { data, isLoading, error } = useQuery<AdminUserListItem[]>({
    queryKey: ['admin', 'users'],
    queryFn: () => apiFetch<AdminUserListItem[]>('/admin/users'),
  });

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Utilizadores</h1>
        <Link href="/admin" className="text-sm text-primary hover:underline">
          ← Painel
        </Link>
      </div>

      {error && (
        <Alert>{error instanceof ApiError ? error.message : 'Não foi possível carregar.'}</Alert>
      )}

      {isLoading && (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-12 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      )}

      {data && (
        <Card className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-3">Nome / @username</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Papel</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Criado em</th>
              </tr>
            </thead>
            <tbody>
              {data.map((u) => (
                <tr key={u.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3">
                    <span className="font-medium">{u.displayName ?? '—'}</span>
                    {u.username && (
                      <span className="ml-1 text-xs text-primary">{u.username}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        'rounded-full px-2 py-0.5 text-xs font-medium',
                        ROLE_STYLE[u.role] ?? 'bg-muted text-muted-foreground',
                      )}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{u.status}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(u.createdAt).toLocaleDateString('pt-PT')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}

export default function AdminUsersPage(): React.JSX.Element {
  return (
    <RequireAuth role="ADMIN">
      <AppShell>
        <UsersTable />
      </AppShell>
    </RequireAuth>
  );
}
