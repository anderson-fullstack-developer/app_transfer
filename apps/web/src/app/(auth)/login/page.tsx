'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { type LoginInput, loginSchema } from '@app/shared';
import { Alert, Button, Card, Field, Input } from '@app/ui/components';
import { useAuth } from '@/lib/auth-context';
import { ApiError } from '@/lib/api-client';

function LoginForm(): React.JSX.Element {
  const router = useRouter();
  const params = useSearchParams();
  const { login } = useAuth();
  const [formError, setFormError] = useState<string | null>(null);
  const justReset = params.get('reset') === '1';

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (values: LoginInput): Promise<void> => {
    setFormError(null);
    try {
      await login(values);
      router.push(params.get('next') ?? '/dashboard');
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Nao foi possivel iniciar sessao.');
    }
  };

  return (
    <>
      {justReset && <Alert variant="success">Password alterada. Inicia sessao.</Alert>}
      {formError && <Alert>{formError}</Alert>}

      <form onSubmit={(e) => void handleSubmit(onSubmit)(e)} className="space-y-4" noValidate>
        <Field label="Email" htmlFor="email" error={errors.email?.message}>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            aria-invalid={!!errors.email}
            {...register('email')}
          />
        </Field>

        <Field label="Password" htmlFor="password" error={errors.password?.message}>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            aria-invalid={!!errors.password}
            {...register('password')}
          />
        </Field>

        <div className="text-right">
          <Link href="/forgot-password" className="text-xs text-primary hover:underline">
            Esqueci-me da password
          </Link>
        </div>

        <Button type="submit" className="w-full" loading={isSubmitting}>
          Entrar
        </Button>
      </form>
    </>
  );
}

export default function LoginPage(): React.JSX.Element {
  return (
    <Card className="space-y-5">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold">Entrar</h1>
        <p className="text-sm text-muted-foreground">Bem-vindo de volta.</p>
      </div>

      <Suspense fallback={<p className="text-sm text-muted-foreground">A carregar...</p>}>
        <LoginForm />
      </Suspense>

      <p className="text-center text-sm text-muted-foreground">
        Nao tens conta?{' '}
        <Link href="/register" className="font-medium text-primary hover:underline">
          Criar conta
        </Link>
      </p>
    </Card>
  );
}
