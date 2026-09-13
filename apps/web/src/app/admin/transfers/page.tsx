'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { TransferStatus, formatMoney, type AdminTransferListItem } from '@app/shared';
import { Alert, Card, Input } from '@app/ui/components';
import { cn } from '@app/ui/lib/cn';
import { RequireAuth } from '@/components/require-auth';
import { AppShell } from '@/components/app-shell';
import { apiFetch, ApiError } from '@/lib/api-client';

const STATUS_STYLE: Record<string, string> = {
  DELIVERED: 'bg-success/10 text-success',
  FAILED: 'bg-danger/10 text-danger',
  CANCELLED: 'bg-muted text-muted-foreground',
  REFUNDED: 'bg-muted text-muted-foreground',
};

interface Filters {
  status: string;
  username: string;
  reference: string;
  dateFrom: string;
  dateTo: string;
}

const EMPTY_FILTERS: Filters = { status: '', username: '', reference: '', dateFrom: '', dateTo: '' };

function buildQuery(filters: Filters): string {
  const params = new URLSearchParams();
  if (filters.status) params.set('status', filters.status);
  if (filters.username) params.set('username', filters.username);
  if (filters.reference) params.set('reference', filters.reference);
  if (filters.dateFrom) params.set('dateFrom', filters.dateFrom);
  if (filters.dateTo) params.set('dateTo', filters.dateTo);
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

function TransfersTable(): React.JSX.Element {
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);

  const { data, isLoading, error } = useQuery<AdminTransferListItem[]>({
    queryKey: ['admin', 'transfers', filters],
    queryFn: () => apiFetch<AdminTransferListItem[]>(`/admin/transfers${buildQuery(filters)}`),
  });

  const setField = (field: keyof Filters) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setFilters((f) => ({ ...f, [field]: e.target.value }));

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Transferências</h1>
        <Link href="/admin" className="text-sm text-primary hover:underline">
          ← Painel
        </Link>
      </div>

      <Card className="grid gap-3 sm:grid-cols-5">
        <select
          value={filters.status}
          onChange={setField('status')}
          className="flex h-11 w-full rounded-lg border border-border bg-surface px-3.5 text-sm"
        >
          <option value="">Todos os estados</option>
          {Object.values(TransferStatus).map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <Input placeholder="@username" value={filters.username} onChange={setField('username')} />
        <Input placeholder="Referência (TRF-...)" value={filters.reference} onChange={setField('reference')} />
        <Input type="date" value={filters.dateFrom} onChange={setField('dateFrom')} />
        <Input type="date" value={filters.dateTo} onChange={setField('dateTo')} />
      </Card>

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

      {data && data.length === 0 && (
        <Card className="text-center text-sm text-muted-foreground">
          Nenhuma transferência encontrada com estes filtros.
        </Card>
      )}

      {data && data.length > 0 && (
        <Card className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-3">Referência</th>
                <th className="px-4 py-3">Remetente</th>
                <th className="px-4 py-3">Estudante</th>
                <th className="px-4 py-3">EUR</th>
                <th className="px-4 py-3">MAD</th>
                <th className="px-4 py-3">Provider</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Data</th>
              </tr>
            </thead>
            <tbody>
              {data.map((t) => (
                <tr key={t.reference} className="border-b border-border last:border-0">
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/transfers/${encodeURIComponent(t.reference)}`}
                      className="font-mono text-xs text-primary hover:underline"
                    >
                      {t.reference}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <p>{t.senderDisplayName}</p>
                    <p className="text-xs text-muted-foreground">{t.senderEmail}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p>{t.studentDisplayName}</p>
                    <p className="text-xs text-primary">{t.studentUsername}</p>
                  </td>
                  <td className="px-4 py-3">{formatMoney(t.sourceAmountMinor, 'EUR')}</td>
                  <td className="px-4 py-3">{formatMoney(t.destinationAmountMinor, 'MAD')}</td>
                  <td className="px-4 py-3 text-muted-foreground">{t.provider}</td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        'rounded-full px-2 py-0.5 text-xs font-medium',
                        STATUS_STYLE[t.status] ?? 'bg-muted text-muted-foreground',
                      )}
                    >
                      {t.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(t.createdAt).toLocaleDateString('pt-PT')}
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

export default function AdminTransfersPage(): React.JSX.Element {
  return (
    <RequireAuth role="ADMIN">
      <AppShell>
        <TransfersTable />
      </AppShell>
    </RequireAuth>
  );
}
