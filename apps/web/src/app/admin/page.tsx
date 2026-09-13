'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { formatMoney, type AdminStatsView } from '@app/shared';
import { Alert, Card } from '@app/ui/components';
import { RequireAuth } from '@/components/require-auth';
import { AppShell } from '@/components/app-shell';
import { apiFetch, ApiError } from '@/lib/api-client';

function StatCard({ label, value }: { label: string; value: string }): React.JSX.Element {
  return (
    <Card className="space-y-1">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="text-2xl font-semibold tracking-tight">{value}</p>
    </Card>
  );
}

function AdminHome(): React.JSX.Element {
  const { data, isLoading, error } = useQuery<AdminStatsView>({
    queryKey: ['admin', 'stats'],
    queryFn: () => apiFetch<AdminStatsView>('/admin/stats'),
  });

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Painel de administração</h1>
        <nav className="flex gap-4 text-sm">
          <Link href="/admin/users" className="text-primary hover:underline">
            Utilizadores
          </Link>
          <Link href="/admin/transfers" className="text-primary hover:underline">
            Transferências
          </Link>
        </nav>
      </div>

      {error && (
        <Alert>{error instanceof ApiError ? error.message : 'Não foi possível carregar.'}</Alert>
      )}

      {isLoading && (
        <div className="grid gap-4 sm:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      )}

      {data && (
        <div className="grid gap-4 sm:grid-cols-4">
          <StatCard label="Utilizadores" value={String(data.totalUsers)} />
          <StatCard label="Estudantes" value={String(data.totalStudents)} />
          <StatCard label="Remetentes" value={String(data.totalSenders)} />
          <StatCard label="Transferências" value={String(data.totalTransfers)} />
          <StatCard label="Volume (EUR)" value={formatMoney(data.volumeEurMinor, 'EUR')} />
          <StatCard label="Pendentes" value={String(data.pendingTransfers)} />
          <StatCard label="Falhadas" value={String(data.failedTransfers)} />
          <StatCard label="Concluídas" value={String(data.completedTransfers)} />
        </div>
      )}
    </div>
  );
}

export default function AdminPage(): React.JSX.Element {
  return (
    <RequireAuth role="ADMIN">
      <AppShell>
        <AdminHome />
      </AppShell>
    </RequireAuth>
  );
}
