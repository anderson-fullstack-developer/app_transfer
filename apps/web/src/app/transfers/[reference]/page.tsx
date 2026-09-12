'use client';

import { use } from 'react';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import Link from 'next/link';
import { TRANSFER_TIMELINE_STEPS, formatMoney, type TransferView } from '@app/shared';
import { Alert, Button, Card } from '@app/ui/components';
import { cn } from '@app/ui/lib/cn';
import { RequireAuth } from '@/components/require-auth';
import { AppShell } from '@/components/app-shell';
import { apiFetch, ApiError } from '@/lib/api-client';

const STOPPED_STATUSES = ['FAILED', 'CANCELLED', 'REFUNDED'] as const;

const STEP_LABEL: Record<string, string> = {
  DRAFT: 'Pedido criado',
  AWAITING_PAYMENT: 'A aguardar pagamento',
  PAYMENT_PROCESSING: 'A processar pagamento',
  PAID: 'Pagamento confirmado',
  PROCESSING: 'A processar',
  SENT_TO_PROVIDER: 'Enviado',
  DELIVERED: 'Recebido',
};

function Timeline({ transfer }: { transfer: TransferView }): React.JSX.Element {
  const stopped = (STOPPED_STATUSES as readonly string[]).includes(transfer.status);
  const currentIndex = TRANSFER_TIMELINE_STEPS.indexOf(
    transfer.status as (typeof TRANSFER_TIMELINE_STEPS)[number],
  );

  if (stopped) {
    return (
      <Alert>
        Esta transferência não foi concluída (estado: <strong>{transfer.status}</strong>). Nenhum
        novo envio foi criado automaticamente.
      </Alert>
    );
  }

  return (
    <ol className="space-y-0">
      {TRANSFER_TIMELINE_STEPS.map((step, i) => {
        const done = i <= currentIndex;
        const isLast = i === TRANSFER_TIMELINE_STEPS.length - 1;
        return (
          <li key={step} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span
                className={cn(
                  'grid h-6 w-6 shrink-0 place-items-center rounded-full border-2 text-[10px] font-bold',
                  done
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border text-muted-foreground',
                )}
              >
                {done ? '✓' : ''}
              </span>
              {!isLast && (
                <span
                  className={cn('w-0.5 flex-1', done ? 'bg-primary' : 'bg-border')}
                  style={{ minHeight: 20 }}
                />
              )}
            </div>
            <p
              className={cn(
                'pb-5 text-sm',
                done ? 'font-medium text-foreground' : 'text-muted-foreground',
              )}
            >
              {STEP_LABEL[step] ?? step}
            </p>
          </li>
        );
      })}
    </ol>
  );
}

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
        <Timeline transfer={transfer} />
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
