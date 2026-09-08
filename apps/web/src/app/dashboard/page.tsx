'use client';

import { Alert, Button, Card } from '@app/ui/components';
import { RequireAuth } from '@/components/require-auth';
import { useAuth } from '@/lib/auth-context';

function Dashboard(): React.JSX.Element {
  const { user, logout } = useAuth();

  return (
    <main className="mx-auto max-w-2xl space-y-6 px-5 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Ola, {user?.email}</h1>
        <Button variant="secondary" size="sm" onClick={() => void logout()}>
          Terminar sessao
        </Button>
      </div>

      {user && !user.emailVerified && (
        <Alert variant="info">
          Ainda nao confirmaste o teu email. Verifica a caixa de entrada (ou o terminal, em dev).
        </Alert>
      )}

      <Card className="space-y-2">
        <p className="text-sm text-muted-foreground">Sessao ativa</p>
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
          <dt className="text-muted-foreground">Email</dt>
          <dd>{user?.email}</dd>
          <dt className="text-muted-foreground">Papel</dt>
          <dd>{user?.role}</dd>
          <dt className="text-muted-foreground">Email verificado</dt>
          <dd>{user?.emailVerified ? 'Sim' : 'Nao'}</dd>
        </dl>
      </Card>

      <p className="text-sm text-muted-foreground">
        O painel real (onboarding, envios, historico) chega nas proximas fases.
      </p>
    </main>
  );
}

export default function DashboardPage(): React.JSX.Element {
  return (
    <RequireAuth>
      <Dashboard />
    </RequireAuth>
  );
}
