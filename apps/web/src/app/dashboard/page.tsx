'use client';

import { Alert, Button, Card } from '@app/ui/components';
import { RequireAuth } from '@/components/require-auth';
import { useAuth } from '@/lib/auth-context';

const ROLE_LABEL: Record<string, string> = {
  STUDENT: 'Estudante',
  SENDER: 'Remetente',
  ADMIN: 'Administrador',
};

function Dashboard(): React.JSX.Element {
  const { user, logout } = useAuth();
  if (!user) return <></>;

  const initial = user.email.charAt(0).toUpperCase();

  return (
    <div className="min-h-screen">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-5 py-3">
          <span className="flex items-center gap-2 text-sm font-semibold tracking-tight">
            <span className="grid h-6 w-6 place-items-center rounded-md bg-primary text-primary-foreground">
              €
            </span>
            app-transfer
          </span>
          <div className="flex items-center gap-3">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-muted text-xs font-semibold">
              {initial}
            </span>
            <Button variant="ghost" size="sm" onClick={() => void logout()}>
              Sair
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl space-y-6 px-5 py-8">
        <div>
          <p className="text-sm text-muted-foreground">Bem-vindo</p>
          <h1 className="text-2xl font-semibold tracking-tight">{user.email}</h1>
        </div>

        {!user.emailVerified && (
          <Alert variant="info">
            Ainda não confirmaste o teu email. Verifica a caixa de entrada (ou o terminal, em
            desenvolvimento).
          </Alert>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <Card className="space-y-1">
            <p className="text-sm text-muted-foreground">Tipo de conta</p>
            <p className="text-lg font-semibold">{ROLE_LABEL[user.role] ?? user.role}</p>
          </Card>
          <Card className="space-y-1">
            <p className="text-sm text-muted-foreground">Email verificado</p>
            <p className="text-lg font-semibold">{user.emailVerified ? 'Sim' : 'Não'}</p>
          </Card>
        </div>

        <Card className="flex items-center justify-between gap-4">
          <div>
            <p className="font-medium">Completar o perfil</p>
            <p className="text-sm text-muted-foreground">
              O próximo passo (onboarding e escolha do @username) chega na próxima fase.
            </p>
          </div>
          <Button size="sm" disabled>
            Em breve
          </Button>
        </Card>
      </main>
    </div>
  );
}

export default function DashboardPage(): React.JSX.Element {
  return (
    <RequireAuth>
      <Dashboard />
    </RequireAuth>
  );
}
