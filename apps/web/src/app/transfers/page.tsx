'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { formatMoney, type TransferListItem } from '@app/shared';
import { Alert, Card } from '@app/ui/components';
import { cn } from '@app/ui/lib/cn';
import { RequireAuth } from '@/components/require-auth';
import { AppShell } from '@/components/app-shell';
import { apiFetch, ApiError } from '@/lib/api-client';

const STATUS_LABEL: Record<string, string> = {
  DRAFT: 'Pedido criado',
  AWAITING_PAYMENT: 'A aguardar pagamento',
  PAYMENT_PROCESSING: 'A processar pagamento',
  PAID: 'Pago',
  PROCESSING: 'A processar',
  SENT_TO_PROVIDER: 'Enviado',
  DELIVERED: 'Concluída',
  FAILED: 'Falhou',
  CANCELLED: 'Cancelada',
  REFUNDED: 'Reembolsada',
};

const STATUS_STYLE: Record<string, string> = {
  DELIVERED: 'bg-success/10 text-success',
  FAILED: 'bg-danger/10 text-danger',
  CANCELLED: 'bg-muted text-muted-foreground',
  REFUNDED: 'bg-muted text-muted-foreground',
};

function History(): React.JSX.Element {
  const { data, isLoading, error } = useQuery<TransferListItem[]>({
    queryKey: ['transfers'],
    queryFn: () => apiFetch<TransferListItem[]>('/transfers'),
  });

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Histórico</h1>

      {isLoading && (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      )}

      {error && (
        <Alert>{error instanceof ApiError ? error.message : 'Não foi possível carregar.'}</Alert>
      )}

      {data && data.length === 0 && (
        <Card className="text-center text-sm text-muted-foreground">
          Ainda não tens transferências.{' '}
          <Link href="/send" className="text-primary hover:underline">
            Enviar a primeira
          </Link>
        </Card>
      )}

      {data && data.length > 0 && (
        <ul className="space-y-2">
          {data.map((t) => (
            <li key={t.reference}>
              <Link
                href={`/transfers/${encodeURIComponent(t.reference)}`}
                className="flex items-center justify-between rounded-xl border border-border bg-surface p-4 shadow-card transition hover:bg-muted/40"
              >
                <div>
                  <p className="font-medium">{t.counterpartyName}</p>
                  <p className="font-mono text-xs text-muted-foreground">{t.reference}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{formatMoney(t.sourceAmountMinor, 'EUR')}</p>
                  <span
                    className={cn(
                      'mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium',
                      STATUS_STYLE[t.status] ?? 'bg-muted text-muted-foreground',
                    )}
                  >
                    {STATUS_LABEL[t.status] ?? t.status}
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function TransfersHistoryPage(): React.JSX.Element {
  return (
    <RequireAuth>
      <AppShell>
        <History />
      </AppShell>
    </RequireAuth>
  );
}
