'use client';

import { use } from 'react';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import Link from 'next/link';
import { formatMoney, type TransferView } from '@app/shared';
import { Alert, Button, Card } from '@app/ui/components';
import { RequireAuth } from '@/components/require-auth';
import { AppShell } from '@/components/app-shell';
import { TransferTimeline } from '@/components/transfer-timeline';
import { apiFetch, ApiError } from '@/lib/api-client';

function TrackingView({ reference }: { reference: string }): React.JSX.Element {
  const queryClient = useQueryClient();
  const [advancing, setAdvancing] = useState(false);
  const [devError, setDevError] = useState<string | null>(null);

  const {
    data: transfer,
    isLoading,
    error,
  } = useQuery<TransferView>({
    queryKey: ['transfers', reference],
    queryFn: () => apiFetch<TransferView>(`/transfers/${encodeURIComponent(reference)}`),
    refetchInterval: (query) => (query.state.data?.status === 'SENT_TO_PROVIDER' ? 4000 : false),
  });

  const advance = async (): Promise<void> => {
    setDevError(null);
    setAdvancing(true);
    try {
      await apiFetch(`/dev/mock/transfers/${encodeURIComponent(reference)}/advance`, {
        method: 'POST',
      });
      await queryClient.invalidateQueries({ queryKey: ['transfers', reference] });
    } catch (err) {
      setDevError(err instanceof ApiError ? err.message : 'Não foi possível avançar.');
    } finally {
      setAdvancing(false);
    }
  };

  if (isLoading) return <div className="mx-auto h-64 max-w-md animate-pulse rounded-xl bg-muted" />;
  if (error || !transfer) {
    return (
      <div className="mx-auto max-w-md space-y-3">
        <Alert>{error instanceof ApiError ? error.message : 'Transferência não encontrada.'}</Alert>
        <Link href="/dashboard" className="block text-sm text-primary hover:underline">
          Voltar ao painel
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md space-y-6">
      <div className="space-y-1 text-center">
        <p className="text-sm text-muted-foreground">Transferência criada</p>
        <h1 className="font-mono text-2xl font-semibold tracking-tight">{transfer.reference}</h1>
      </div>

      <Card className="space-y-1">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">Para</p>
        <p className="font-semibold">{transfer.counterpartyName}</p>
        {transfer.counterpartyUsername && (
          <p className="text-sm text-primary">{transfer.counterpartyUsername}</p>
        )}
        <div className="mt-3 flex items-baseline justify-between border-t border-border pt-3 text-sm">
          <span className="text-muted-foreground">
            {formatMoney(transfer.sourceAmountMinor, 'EUR')} enviados
          </span>
          <span className="font-semibold">
            {formatMoney(transfer.destinationAmountMinor, 'MAD')}
          </span>
        </div>
      </Card>

      <Card>
        <TransferTimeline transfer={transfer} />
      </Card>

      {transfer.status === 'SENT_TO_PROVIDER' && (
        <Card className="space-y-2 border-dashed">
          <p className="text-xs text-muted-foreground">
            Modo simulação — em produção isto avançaria sozinho quando o parceiro financeiro
            confirmasse a entrega.
          </p>
          {devError && <Alert>{devError}</Alert>}
          <Button
            variant="secondary"
            size="sm"
            className="w-full"
            loading={advancing}
            onClick={() => void advance()}
          >
            Simular confirmação de entrega
          </Button>
        </Card>
      )}

      <Link
        href="/transfers"
        className="block text-center text-sm text-muted-foreground hover:underline"
      >
        Ver histórico de transferências
      </Link>
    </div>
  );
}

export default function TransferTrackingPage({
  params,
}: {
  params: Promise<{ reference: string }>;
}): React.JSX.Element {
  const { reference } = use(params);
  return (
    <RequireAuth>
      <AppShell>
        <TrackingView reference={reference} />
      </AppShell>
    </RequireAuth>
  );
}
