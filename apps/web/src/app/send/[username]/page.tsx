'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { normalizeUsername, type FavoriteView, type PublicStudentView } from '@app/shared';
import { Alert, Button, Card } from '@app/ui/components';
import { RequireAuth } from '@/components/require-auth';
import { AppShell } from '@/components/app-shell';
import { apiFetch, ApiError } from '@/lib/api-client';

function FavoriteToggle({
  student,
  normalized,
}: {
  student: PublicStudentView;
  normalized: string;
}): React.JSX.Element {
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [favError, setFavError] = useState<string | null>(null);

  const { data: favorites } = useQuery<FavoriteView[]>({
    queryKey: ['favorites'],
    queryFn: () => apiFetch<FavoriteView[]>('/favorites'),
  });
  const existing = favorites?.find((f) => f.student.username === student.username);

  const toggle = async (): Promise<void> => {
    setFavError(null);
    setBusy(true);
    try {
      if (existing) {
        await apiFetch(`/favorites/${existing.id}`, { method: 'DELETE' });
      } else {
        await apiFetch('/favorites', { method: 'POST', body: { studentUsername: normalized } });
      }
      await queryClient.invalidateQueries({ queryKey: ['favorites'] });
    } catch (err) {
      setFavError(
        err instanceof ApiError ? err.message : 'Não foi possível atualizar os favoritos.',
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <Button variant="secondary" size="sm" loading={busy} onClick={() => void toggle()}>
        {existing ? '★ Nos favoritos' : '☆ Adicionar aos favoritos'}
      </Button>
      {favError && <p className="mt-2 text-xs text-danger">{favError}</p>}
    </div>
  );
}

function Confirm({ username }: { username: string }): React.JSX.Element {
  const normalized = normalizeUsername(username);
  const { data, error, isLoading } = useQuery<PublicStudentView>({
    queryKey: ['students', 'by-username', normalized],
    queryFn: () =>
      apiFetch<PublicStudentView>(`/students/by-username/${encodeURIComponent(normalized)}`),
  });

  if (isLoading) {
    return <div className="mx-auto h-40 max-w-md animate-pulse rounded-xl bg-muted" />;
  }

  if (error || !data) {
    return (
      <div className="mx-auto max-w-md space-y-4">
        <Alert>
          {error instanceof ApiError ? error.message : 'Não encontrámos esse estudante.'}
        </Alert>
        <Link href="/send" className="text-sm text-primary hover:underline">
          Voltar à pesquisa
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Confirma o destinatário</h1>
        <p className="text-sm text-muted-foreground">Passo 2 de 5</p>
      </div>

      <Card className="space-y-3">
        <div>
          <p className="text-lg font-semibold">{data.displayName}</p>
          <p className="text-sm text-primary">{data.username}</p>
          <p className="text-sm text-muted-foreground">
            {data.city}, {data.country}
          </p>
          {data.verified && (
            <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-xs font-medium text-success">
              ✓ Estudante verificado
            </span>
          )}
        </div>
        <FavoriteToggle student={data} normalized={normalized} />
      </Card>

      <div className="space-y-2">
        <Link
          href={`/send/${encodeURIComponent(normalized)}/amount`}
          className="flex h-11 w-full items-center justify-center rounded-lg bg-primary text-sm font-medium text-primary-foreground"
        >
          Continuar — definir o valor
        </Link>
        <Link
          href="/send"
          className="block text-center text-sm text-muted-foreground hover:underline"
        >
          Não é esta pessoa — pesquisar de novo
        </Link>
      </div>
    </div>
  );
}

export default function SendConfirmPage({
  params,
}: {
  params: Promise<{ username: string }>;
}): React.JSX.Element {
  const { username } = use(params);
  return (
    <RequireAuth>
      <AppShell>
        <Confirm username={username} />
      </AppShell>
    </RequireAuth>
  );
}
