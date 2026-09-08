'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Alert, Card } from '@app/ui/components';
import { apiFetch, ApiError } from '@/lib/api-client';

function VerifyEmail(): React.JSX.Element {
  const token = useSearchParams().get('token') ?? '';
  const [state, setState] = useState<'loading' | 'ok' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    if (!token) {
      setState('error');
      setMessage('Link invalido.');
      return;
    }
    apiFetch('/auth/verify-email', { method: 'POST', body: { token }, skipRefresh: true })
      .then(() => setState('ok'))
      .catch((err: unknown) => {
        setState('error');
        setMessage(err instanceof ApiError ? err.message : 'Nao foi possivel confirmar o email.');
      });
  }, [token]);

  if (state === 'loading') return <p className="text-sm text-muted-foreground">A confirmar...</p>;
  if (state === 'ok') {
    return <Alert variant="success">Email confirmado. Ja podes usar a plataforma.</Alert>;
  }
  return <Alert>{message}</Alert>;
}

export default function VerifyEmailPage(): React.JSX.Element {
  return (
    <Card className="space-y-5">
      <h1 className="text-xl font-semibold">Confirmar email</h1>
      <Suspense fallback={<p className="text-sm text-muted-foreground">A carregar...</p>}>
        <VerifyEmail />
      </Suspense>
      <p className="text-center text-sm">
        <Link href="/dashboard" className="text-primary hover:underline">
          Ir para o painel
        </Link>
      </p>
    </Card>
  );
}
