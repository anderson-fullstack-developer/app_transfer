'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { formatMoney, type TransferListItem } from '@app/shared';
import { Alert, Card } from '@app/ui/components';
import { cn } from '@app/ui/lib/cn';
import { RequireAuth } from '@/components/require-auth';
import { AppShell } from '@/components/app-shell';
import { useAuth } from '@/lib/auth-context';
import { useStudentProfile } from '@/lib/queries';
import { apiFetch } from '@/lib/api-client';

const KYC_LABEL: Record<string, string> = {
  NOT_STARTED: 'Por iniciar',
  PENDING: 'Em análise',
  VERIFIED: 'Verificado',
  REJECTED: 'Rejeitado',
};

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

function RecentTransfers({ emptyHint }: { emptyHint: string }): React.JSX.Element {
  const { data, isLoading } = useQuery<TransferListItem[]>({
    queryKey: ['transfers'],
    queryFn: () => apiFetch<TransferListItem[]>('/transfers'),
  });

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[0, 1].map((i) => (
          <div key={i} className="h-14 animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
    );
  }

  if (!data || data.length === 0) {
    return <p className="text-sm text-muted-foreground">{emptyHint}</p>;
  }

  return (
    <ul className="space-y-1">
      {data.slice(0, 4).map((t) => (
        <li key={t.reference}>
          <Link
            href={`/transfers/${encodeURIComponent(t.reference)}`}
            className="flex items-center justify-between rounded-lg px-2 py-2 text-sm transition hover:bg-muted/60"
          >
            <span>
              <span className="font-medium">{t.counterpartyName}</span>{' '}
              <span className="text-muted-foreground">
                — {formatMoney(t.sourceAmountMinor, 'EUR')}
              </span>
            </span>
            <span
              className={cn(
                'rounded-full px-2 py-0.5 text-xs font-medium',
                t.status === 'DELIVERED'
                  ? 'bg-success/10 text-success'
                  : 'bg-muted text-muted-foreground',
              )}
            >
              {STATUS_LABEL[t.status] ?? t.status}
            </span>
          </Link>
        </li>
      ))}
      <li>
        <Link href="/transfers" className="mt-1 block px-2 text-xs text-primary hover:underline">
          Ver histórico completo →
        </Link>
      </li>
    </ul>
  );
}

function StudentDashboard(): React.JSX.Element {
  const { user } = useAuth();
  const { data: profile, isLoading } = useStudentProfile(user?.role === 'STUDENT');

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-muted-foreground">Bem-vindo</p>
        <h1 className="text-2xl font-semibold tracking-tight">
          {profile?.displayName ?? user?.email}
        </h1>
        {profile && <p className="text-sm text-primary">{profile.username}</p>}
      </div>

      {user && !user.emailVerified && (
        <Alert variant="info">
          Ainda não confirmaste o teu email. Verifica a caixa de entrada (ou o terminal, em
          desenvolvimento).
        </Alert>
      )}

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      ) : profile ? (
        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="space-y-1">
            <p className="text-sm text-muted-foreground">Onde estudas</p>
            <p className="font-semibold">
              {profile.city}, {profile.country}
            </p>
          </Card>
          <Card className="space-y-1">
            <p className="text-sm text-muted-foreground">Universidade</p>
            <p className="font-semibold">{profile.university}</p>
          </Card>
          <Card className="space-y-1">
            <p className="text-sm text-muted-foreground">Verificação (KYC)</p>
            <p className="font-semibold">{KYC_LABEL[profile.kycStatus] ?? profile.kycStatus}</p>
          </Card>
        </div>
      ) : (
        <Alert>Não foi possível carregar o perfil.</Alert>
      )}

      <Card>
        <p className="mb-2 font-medium">Últimas transferências</p>
        <RecentTransfers
          emptyHint={`Ainda não recebeste nada. Partilha o teu ${profile?.username ?? '@username'} com a família.`}
        />
      </Card>
    </div>
  );
}

function SenderDashboard(): React.JSX.Element {
  const { user } = useAuth();
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-muted-foreground">Bem-vindo</p>
        <h1 className="text-2xl font-semibold tracking-tight">{user?.email}</h1>
      </div>
      {user && !user.emailVerified && (
        <Alert variant="info">
          Ainda não confirmaste o teu email. Verifica a caixa de entrada (ou o terminal).
        </Alert>
      )}
      <Card className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-medium">Enviar dinheiro</p>
          <p className="text-sm text-muted-foreground">
            Pesquisa o @username do estudante e confirma a pessoa.
          </p>
        </div>
        <Link
          href="/send"
          className="inline-flex h-10 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground"
        >
          Enviar
        </Link>
      </Card>
      <Card>
        <p className="mb-2 font-medium">Transferências recentes</p>
        <RecentTransfers emptyHint="Ainda não fizeste nenhuma transferência." />
      </Card>
    </div>
  );
}

function Dashboard(): React.JSX.Element {
  const { user } = useAuth();
  return (
    <AppShell>
      {user?.role === 'STUDENT' ? (
        <StudentDashboard />
      ) : user?.role === 'ADMIN' ? (
        <Card>
          <p className="font-medium">Painel de administração</p>
          <p className="text-sm text-muted-foreground">Disponível numa fase posterior.</p>
        </Card>
      ) : (
        <SenderDashboard />
      )}
    </AppShell>
  );
}

export default function DashboardPage(): React.JSX.Element {
  return (
    <RequireAuth>
      <Dashboard />
    </RequireAuth>
  );
}
