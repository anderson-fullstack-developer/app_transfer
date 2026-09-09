'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { normalizeUsername, type PublicStudentView } from '@app/shared';
import { Alert, Button, Card, Field, Input } from '@app/ui/components';
import { RequireAuth } from '@/components/require-auth';
import { AppShell } from '@/components/app-shell';
import { apiFetch, ApiError } from '@/lib/api-client';

function SendSearch(): React.JSX.Element {
  const router = useRouter();
  const [value, setValue] = useState('');
  const [result, setResult] = useState<PublicStudentView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const search = async (): Promise<void> => {
    const normalized = normalizeUsername(value);
    setError(null);
    setResult(null);
    if (normalized.length < 3) {
      setError('Escreve o @username completo.');
      return;
    }
    setLoading(true);
    try {
      const found = await apiFetch<PublicStudentView>(
        `/students/by-username/${encodeURIComponent(normalized)}`,
      );
      setResult(found);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : 'Não foi possível pesquisar. Tenta novamente.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Enviar dinheiro</h1>
        <p className="text-sm text-muted-foreground">
          Para quem queres enviar? Escreve o <strong>@username</strong> do estudante.
        </p>
      </div>

      <Card className="space-y-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void search();
          }}
          className="space-y-3"
        >
          <Field label="@username do estudante" htmlFor="username" error={error ?? undefined}>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                @
              </span>
              <Input
                id="username"
                className="pl-7"
                placeholder="carlos"
                autoCapitalize="none"
                spellCheck={false}
                value={value}
                onChange={(e) => setValue(e.target.value)}
              />
            </div>
          </Field>
          <Button type="submit" className="w-full" loading={loading}>
            Pesquisar
          </Button>
        </form>
      </Card>

      {result && (
        <Card className="space-y-4">
          <p className="text-sm text-muted-foreground">Encontrámos:</p>
          <div>
            <p className="text-lg font-semibold">{result.displayName}</p>
            <p className="text-sm text-primary">{result.username}</p>
            <p className="text-sm text-muted-foreground">
              {result.city}, {result.country}
            </p>
            {result.verified && (
              <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-xs font-medium text-success">
                ✓ Estudante verificado
              </span>
            )}
          </div>
          <Button
            className="w-full"
            onClick={() =>
              router.push(`/send/${encodeURIComponent(normalizeUsername(result.username))}`)
            }
          >
            É esta pessoa — continuar
          </Button>
        </Card>
      )}

      {result === null && !error && (
        <Alert variant="info">
          Precisas de saber o @username. Não há listagem pública de estudantes.
        </Alert>
      )}
    </div>
  );
}

export default function SendPage(): React.JSX.Element {
  return (
    <RequireAuth>
      <AppShell>
        <SendSearch />
      </AppShell>
    </RequireAuth>
  );
}
