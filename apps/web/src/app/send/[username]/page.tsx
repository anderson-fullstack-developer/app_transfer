'use client';

import { use } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { normalizeUsername, type PublicStudentView } from '@app/shared';
import { Alert, Card } from '@app/ui/components';
import { RequireAuth } from '@/components/require-auth';
import { AppShell } from '@/components/app-shell';
import { apiFetch, ApiError } from '@/lib/api-client';

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
