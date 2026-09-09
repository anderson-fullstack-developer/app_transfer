'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { type RegisterInput, registerSchema } from '@app/shared';
import { Alert, Button, Card, Field, Input } from '@app/ui/components';
import { cn } from '@app/ui/lib/cn';
import { useAuth } from '@/lib/auth-context';
import { ApiError } from '@/lib/api-client';
import { postAuthRoute } from '@/lib/post-auth-route';

const OPTIONS = [
  { value: 'STUDENT', title: 'Sou estudante', desc: 'Vou receber apoio da minha familia.' },
  { value: 'SENDER', title: 'Quero enviar dinheiro', desc: 'Vou apoiar um estudante.' },
] as const;

export default function RegisterPage(): React.JSX.Element {
  const router = useRouter();
  const { register: registerUser } = useAuth();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({ resolver: zodResolver(registerSchema) });

  const accountType = watch('accountType');

  const onSubmit = async (values: RegisterInput): Promise<void> => {
    setFormError(null);
    try {
      const user = await registerUser(values);
      router.push(postAuthRoute(user));
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Nao foi possivel criar a conta.');
    }
  };

  return (
    <Card className="space-y-5">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold">Criar conta</h1>
        <p className="text-sm text-muted-foreground">Como pretendes utilizar a plataforma?</p>
      </div>

      {formError && <Alert>{formError}</Alert>}

      <form onSubmit={(e) => void handleSubmit(onSubmit)(e)} className="space-y-4" noValidate>
        <div className="grid gap-2 sm:grid-cols-2">
          {OPTIONS.map((opt) => (
            <button
              type="button"
              key={opt.value}
              onClick={() => setValue('accountType', opt.value, { shouldValidate: true })}
              className={cn(
                'rounded-lg border p-3 text-left text-sm transition',
                accountType === opt.value
                  ? 'border-primary ring-2 ring-primary/30'
                  : 'border-border hover:bg-muted',
              )}
              aria-pressed={accountType === opt.value}
            >
              <span className="block font-medium">{opt.title}</span>
              <span className="block text-xs text-muted-foreground">{opt.desc}</span>
            </button>
          ))}
        </div>
        {errors.accountType && (
          <p className="text-xs text-red-600" role="alert">
            Escolhe uma opcao.
          </p>
        )}

        <Field label="Email" htmlFor="email" error={errors.email?.message}>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            aria-invalid={!!errors.email}
            {...register('email')}
          />
        </Field>

        <Field
          label="Password"
          htmlFor="password"
          hint="Pelo menos 8 caracteres."
          error={errors.password?.message}
        >
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            aria-invalid={!!errors.password}
            {...register('password')}
          />
        </Field>

        <Button type="submit" className="w-full" loading={isSubmitting}>
          Criar conta
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Ja tens conta?{' '}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Entrar
        </Link>
      </p>
    </Card>
  );
}
