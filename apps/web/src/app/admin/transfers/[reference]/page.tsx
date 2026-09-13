'use client';

import { use } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { formatMoney, type TransferView } from '@app/shared';
import { Alert, Card } from '@app/ui/components';
import { RequireAuth } from '@/components/require-auth';
import { AppShell } from '@/components/app-shell';
import { TransferTimeline } from '@/components/transfer-timeline';
import { apiFetch, ApiError } from '@/lib/api-client';

function Row({ label, value }: { label: string; value: string }): React.JSX.Element {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}

function AdminTransferDetail({ reference }: { reference: string }): React.JSX.Element {
  const {
    data: transfer,
    isLoading,
    error,
  } = useQuery<TransferView>({
    queryKey: ['admin', 'transfers', reference],
    queryFn: () => apiFetch<TransferView>(`/admin/transfers/${encodeURIComponent(reference)}`),
  });

  if (isLoading) {
    return <div className="mx-auto h-64 max-w-md animate-pulse rounded-xl bg-muted" />;
  }

  if (error || !transfer) {
    return (
      <div className="mx-auto max-w-md space-y-3">
        <Alert>{error instanceof ApiError ? error.message : 'Transferência não encontrada.'}</Alert>
        <Link href="/admin/transfers" className="block text-sm text-primary hover:underline">
          Voltar à lista
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/admin/transfers" className="text-sm text-primary hover:underline">
          ← Transferências
        </Link>
      </div>

      <div className="space-y-1 text-center">
        <p className="text-sm text-muted-foreground">Transferência</p>
        <h1 className="font-mono text-2xl font-semibold tracking-tight">{transfer.reference}</h1>
      </div>

      <Card className="space-y-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Para</p>
          <p className="font-semibold">{transfer.counterpartyName}</p>
          {transfer.counterpartyUsername && (
            <p className="text-sm text-primary">{transfer.counterpartyUsername}</p>
          )}
        </div>
        <dl className="space-y-2 rounded-lg bg-muted/60 p-3 text-sm">
          <Row label="Enviado (EUR)" value={formatMoney(transfer.sourceAmountMinor, 'EUR')} />
          <Row label="Fee" value={formatMoney(transfer.feeAmountMinor, 'EUR')} />
          <Row label="Total debitado" value={formatMoney(transfer.totalChargedMinor, 'EUR')} />
          <Row label="Recebido (MAD)" value={formatMoney(transfer.destinationAmountMinor, 'MAD')} />
          <Row label="Câmbio" value={transfer.exchangeRate} />
          <Row label="Provider" value={transfer.provider} />
          <Row label="Estado" value={transfer.status} />
        </dl>
      </Card>

      <Card>
        <p className="mb-2 font-medium">Timeline</p>
        <TransferTimeline transfer={transfer} />
      </Card>
    </div>
  );
}

export default function AdminTransferDetailPage({
  params,
}: {
  params: Promise<{ reference: string }>;
}): React.JSX.Element {
  const { reference } = use(params);
  return (
    <RequireAuth role="ADMIN">
      <AppShell>
        <AdminTransferDetail reference={reference} />
      </AppShell>
    </RequireAuth>
  );
}
