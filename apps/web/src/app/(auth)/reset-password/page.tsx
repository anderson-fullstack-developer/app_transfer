'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Alert, Button, Card, Field, Input } from '@app/ui/components';
import { apiFetch, ApiError } from '@/lib/api-client';

const schema = z.object({
  password: z.string().min(8, 'A password tem de ter pelo menos 8 caracteres.').max(128),
});
type FormValues = z.infer<typeof schema>;

function ResetForm(): React.JSX.Element {
  const router = useRouter();
  const token = useSearchParams().get('token') ?? '';
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  if (!token) {
    return <Alert>Link invalido. Pede um novo link de reposicao.</Alert>;
  }

  const onSubmit = async (values: FormValues): Promise<void> => {
    setError(null);
    try {
      await apiFetch('/auth/reset-password', {
        method: 'POST',
        body: { token, password: values.password },
        skipRefresh: true,
      });
      router.push('/login?reset=1');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Nao foi possivel repor a password.');
    }
  };

  return (
    <form onSubmit={(e) => void handleSubmit(onSubmit)(e)} className="space-y-4" noValidate>
      {error && <Alert>{error}</Alert>}
      <Field label="Nova password" htmlFor="password" error={errors.password?.message}>
        <Input
          id="password"
          type="password"
          autoComplete="new-password"
          aria-invalid={!!errors.password}
          {...register('password')}
        />
      </Field>
      <Button type="submit" className="w-full" loading={isSubmitting}>
        Guardar nova password
      </Button>
    </form>
  );
}

export default function ResetPasswordPage(): React.JSX.Element {
  return (
    <Card className="space-y-5">
      <h1 className="text-xl font-semibold">Nova password</h1>
      <Suspense fallback={<p className="text-sm text-muted-foreground">A carregar...</p>}>
        <ResetForm />
      </Suspense>
      <p className="text-center text-sm">
        <Link href="/login" className="text-primary hover:underline">
          Voltar a entrar
        </Link>
      </p>
    </Card>
  );
}
