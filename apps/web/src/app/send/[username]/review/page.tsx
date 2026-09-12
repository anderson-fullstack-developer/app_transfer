'use client';

import { use, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { formatMoney, normalizeUsername, type QuoteView, type TransferView } from '@app/shared';
import { Alert, Button, Card } from '@app/ui/components';
import { RequireAuth } from '@/components/require-auth';
import { AppShell } from '@/components/app-shell';
import { apiFetch, ApiError } from '@/lib/api-client';

function Row({
  label,
  value,
  strong,
}: {
  label: string;
  value: string;
  strong?: boolean;
}): React.JSX.Element {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={strong ? 'font-semibold' : ''}>{value}</dd>
    </div>
  );
}

function ReviewStep({ username }: { username: string }): React.JSX.Element {
  const router = useRouter();
  const normalized = normalizeUsername(username);
  const quoteId = useSearchParams().get('quote') ?? '';
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  // Uma so Idempotency-Key por tentativa de confirmacao: se o pedido falhar por
  // rede e o utilizador clicar outra vez, repete a MESMA key -> nunca duas transferencias.
  const idempotencyKey = useRef(crypto.randomUUID());

  const {
    data: quote,
    isLoading,
    error: loadError,
  } = useQuery<QuoteView>({
    queryKey: ['quotes', quoteId],
    queryFn: () => apiFetch<QuoteView>(`/quotes/${quoteId}`),
    enabled: !!quoteId,
    retry: false,
  });

  const expired = quote?.status === 'EXPIRED';
  const secondsLeft = useMemo(() => {
    if (!quote) return null;
    return Math.max(0, Math.round((new Date(quote.expiresAt).getTime() - Date.now()) / 1000));
  }, [quote]);

  if (!quoteId) {
    return (
      <div className="mx-auto max-w-md">
        <Alert>Falta a cotação. Volta a definir o valor.</Alert>
        <Link
          href={`/send/${encodeURIComponent(normalized)}/amount`}
          className="mt-3 block text-sm text-primary hover:underline"
        >
          Voltar
        </Link>
      </div>
    );
  }

  if (isLoading) {
    return <div className="mx-auto h-64 max-w-md animate-pulse rounded-xl bg-muted" />;
  }

  if (loadError || !quote) {
    return (
      <div className="mx-auto max-w-md space-y-3">
        <Alert>
          {loadError instanceof ApiError ? loadError.message : 'Cotação não encontrada.'}
        </Alert>
        <Link
          href={`/send/${encodeURIComponent(normalized)}/amount`}
          className="block text-sm text-primary hover:underline"
        >
          Criar nova cotação
        </Link>
      </div>
    );
  }

  const onConfirm = async (): Promise<void> => {
    setError(null);
    setConfirming(true);
    try {
      const transfer = await apiFetch<TransferView>('/transfers', {
        method: 'POST',
        body: { quoteId },
        headers: { 'Idempotency-Key': idempotencyKey.current },
      });
      router.push(`/transfers/${encodeURIComponent(transfer.reference)}`);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : 'Não foi possível confirmar a transferência.',
      );
    } finally {
      setConfirming(false);
    }
  };

  return (
    <div className="mx-auto max-w-md space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Rever transferência</h1>
        <p className="text-sm text-muted-foreground">Passo 4 de 5 · confirma antes de enviar</p>
      </div>

      <Card className="space-y-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Para</p>
          <p className="text-lg font-semibold">{quote.student.displayName}</p>
          <p className="text-sm text-primary">{quote.student.username}</p>
        </div>

        <dl className="space-y-2 rounded-lg bg-muted/60 p-3 text-sm">
          <Row label="Envias" value={formatMoney(quote.sourceAmountMinor, 'EUR')} />
          <Row label="Taxa" value={formatMoney(quote.feeAmountMinor, 'EUR')} />
          <Row label="Total debitado" value={formatMoney(quote.totalChargedMinor, 'EUR')} strong />
          <div className="my-1 border-t border-border" />
          <Row
            label="Câmbio"
            value={`1 EUR = ${Number(quote.exchangeRate).toLocaleString('pt-PT', { minimumFractionDigits: 2 })} MAD`}
          />
          <Row
            label={`${quote.student.displayName.split(' ')[0]} recebe`}
            value={formatMoney(quote.destinationAmountMinor, 'MAD')}
            strong
          />
        </dl>

        {expired ? (
          <Alert>
            Esta cotação expirou.{' '}
            <Link href={`/send/${encodeURIComponent(normalized)}/amount`} className="underline">
              Criar uma nova
            </Link>
            .
          </Alert>
        ) : (
          secondsLeft !== null && (
            <p className="text-center text-xs text-muted-foreground">
              Cotação válida por mais {Math.floor(secondsLeft / 60)} min {secondsLeft % 60}s
            </p>
          )
        )}

        {error && <Alert>{error}</Alert>}

        <Button
          className="w-full"
          disabled={expired}
          loading={confirming}
          onClick={() => void onConfirm()}
        >
          Confirmar envio
        </Button>
        <Link
          href={`/send/${encodeURIComponent(normalized)}`}
          className="block text-center text-sm text-muted-foreground hover:underline"
        >
          Cancelar
        </Link>
      </Card>
    </div>
  );
}

export default function ReviewPage({
  params,
}: {
  params: Promise<{ username: string }>;
}): React.JSX.Element {
  const { username } = use(params);
  return (
    <RequireAuth>
      <AppShell>
        <ReviewStep username={username} />
      </AppShell>
    </RequireAuth>
  );
}
