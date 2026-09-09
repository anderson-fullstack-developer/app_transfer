'use client';

import { Alert, Card } from '@app/ui/components';
import { RequireAuth } from '@/components/require-auth';
import { AppShell } from '@/components/app-shell';
import { useAuth } from '@/lib/auth-context';
import { useStudentProfile } from '@/lib/queries';

const KYC_LABEL: Record<string, string> = {
  NOT_STARTED: 'Por iniciar',
  PENDING: 'Em análise',
  VERIFIED: 'Verificado',
  REJECTED: 'Rejeitado',
};

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
        <>
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

          <Card>
            <p className="font-medium">Total recebido</p>
            <p className="mt-1 text-3xl font-semibold tracking-tight">— MAD</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Ainda não recebeste transferências. Partilha o teu {profile.username} com a família.
            </p>
          </Card>
        </>
      ) : (
        <Alert>Não foi possível carregar o perfil.</Alert>
      )}
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
      <Card className="space-y-2">
        <p className="font-medium">Enviar dinheiro</p>
        <p className="text-sm text-muted-foreground">
          Pesquisa o @username do estudante, confirma e envia. Disponível na próxima fase.
        </p>
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
