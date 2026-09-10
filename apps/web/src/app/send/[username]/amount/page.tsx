'use client';

import { use, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  type PublicStudentView,
  type QuoteRateInfo,
  type QuoteView,
  computeQuoteBreakdown,
  formatMoney,
  normalizeUsername,
} from '@app/shared';
import { Alert, Button, Card, Field, Input } from '@app/ui/components';
import { RequireAuth } from '@/components/require-auth';
import { AppShell } from '@/components/app-shell';
import { apiFetch, ApiError } from '@/lib/api-client';

function AmountStep({ username }: { username: string }): React.JSX.Element {
  const router = useRouter();
  const normalized = normalizeUsername(username);
  const [amount, setAmount] = useState('');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const studentQuery = useQuery<PublicStudentView>({
    queryKey: ['students', 'by-username', normalized],
    queryFn: () =>
      apiFetch<PublicStudentView>(`/students/by-username/${encodeURIComponent(normalized)}`),
  });
  const rateQuery = useQuery<QuoteRateInfo>({
    queryKey: ['quotes', 'rate'],
    queryFn: () => apiFetch<QuoteRateInfo>('/quotes/rate'),
    staleTime: 60_000,
  });

  const rate = rateQuery.data;

  const { preview, amountError } = useMemo(() => {
    if (!rate) return { preview: null, amountError: null };
    const cleaned = amount.trim().replace(',', '.');
    if (!/^\d{1,7}(\.\d{1,2})?$/.test(cleaned) || Number(cleaned) <= 0) {
      return { preview: null, amountError: amount ? 'Introduz um valor válido.' : null };
    }
    const minor = Math.round(Number(cleaned) * 100);
    if (minor < rate.minSourceMinor || minor > rate.maxSourceMinor) {
      return {
        preview: null,
        amountError: `Entre ${formatMoney(rate.minSourceMinor, 'EUR')} e ${formatMoney(
          rate.maxSourceMinor,
          'EUR',
        )}.`,
      };
    }
    return {
      preview: computeQuoteBreakdown(
        cleaned,
        rate.exchangeRate,
        rate.feePercent,
        rate.fixedFeeMinor,
      ),
      amountError: null,
    };
  }, [amount, rate]);

  const onContinue = async (): Promise<void> => {
    if (!preview) return;
    setSubmitError(null);
    setSubmitting(true);
    try {
      const quote = await apiFetch<QuoteView>('/quotes', {
        method: 'POST',
        body: { studentUsername: normalized, amount: amount.trim().replace(',', '.') },
      });
      router.push(`/send/${encodeURIComponent(normalized)}/review?quote=${quote.id}`);
    } catch (err) {
      setSubmitError(err instanceof ApiError ? err.message : 'Não foi possível criar a cotação.');
    } finally {
      setSubmitting(false);
    }
  };

  const student = studentQuery.data;

  return (
    <div className="mx-auto max-w-md space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Quanto queres enviar?</h1>
        <p className="text-sm text-muted-foreground">
          Passo 3 de 5 · para {student?.displayName ?? normalized}
        </p>
      </div>

      <Card className="space-y-4">
        <Field label="Valor a enviar (EUR)" htmlFor="amount" error={amountError ?? undefined}>
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
              €
            </span>
            <Input
              id="amount"
              className="pl-7 text-lg"
              inputMode="decimal"
              placeholder="100,00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              autoFocus
            />
          </div>
        </Field>

        {preview && student ? (
          <dl className="space-y-2 rounded-lg bg-muted/60 p-3 text-sm">
            <Row label="Envias" value={formatMoney(preview.sourceAmountMinor, 'EUR')} />
            <Row label="Taxa" value={formatMoney(preview.feeAmountMinor, 'EUR')} />
            <Row
              label="Total debitado"
              value={formatMoney(preview.totalChargedMinor, 'EUR')}
              strong
            />
            <div className="my-1 border-t border-border" />
            <Row
              label="Câmbio"
              value={`1 EUR = ${Number(preview.exchangeRate).toLocaleString('pt-PT', {
                minimumFractionDigits: 2,
              })} MAD`}
            />
            <Row
              label={`${student.displayName.split(' ')[0]} recebe`}
              value={formatMoney(preview.destinationAmountMinor, 'MAD')}
              strong
            />
          </dl>
        ) : (
          <p className="text-sm text-muted-foreground">
            Escreve o valor para ver a cotação. A cotação final é criada ao continuar e é válida
            durante 10 minutos.
          </p>
        )}

        {submitError && <Alert>{submitError}</Alert>}

        <Button
          className="w-full"
          disabled={!preview}
          loading={submitting}
          onClick={() => void onContinue()}
        >
          Continuar
        </Button>
        <Link
          href={`/send/${encodeURIComponent(normalized)}`}
          className="block text-center text-sm text-muted-foreground hover:underline"
        >
          Voltar
        </Link>
      </Card>
    </div>
  );
}

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

export default function AmountPage({
  params,
}: {
  params: Promise<{ username: string }>;
}): React.JSX.Element {
  const { username } = use(params);
  return (
    <RequireAuth>
      <AppShell>
        <AmountStep username={username} />
      </AppShell>
    </RequireAuth>
  );
}
