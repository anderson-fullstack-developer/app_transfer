'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { type ForgotPasswordInput, forgotPasswordSchema } from '@app/shared';
import { Alert, Button, Card, Field, Input } from '@app/ui/components';
import { apiFetch } from '@/lib/api-client';

export default function ForgotPasswordPage(): React.JSX.Element {
  const [done, setDone] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordInput>({ resolver: zodResolver(forgotPasswordSchema) });

  const onSubmit = async (values: ForgotPasswordInput): Promise<void> => {
    await apiFetch('/auth/forgot-password', { method: 'POST', body: values, skipRefresh: true });
    setDone(true);
  };

  return (
    <Card className="space-y-5">
      <h1 className="text-xl font-semibold">Repor password</h1>

      {done ? (
        <Alert variant="success">
          Se existir uma conta com esse email, enviamos um link para repor a password.
        </Alert>
      ) : (
        <form onSubmit={(e) => void handleSubmit(onSubmit)(e)} className="space-y-4" noValidate>
          <p className="text-sm text-muted-foreground">
            Indica o teu email e enviamos um link de reposicao.
          </p>
          <Field label="Email" htmlFor="email" error={errors.email?.message}>
            <Input id="email" type="email" aria-invalid={!!errors.email} {...register('email')} />
          </Field>
          <Button type="submit" className="w-full" loading={isSubmitting}>
            Enviar link
          </Button>
        </form>
      )}

      <p className="text-center text-sm">
        <Link href="/login" className="text-primary hover:underline">
          Voltar a entrar
        </Link>
      </p>
    </Card>
  );
}
