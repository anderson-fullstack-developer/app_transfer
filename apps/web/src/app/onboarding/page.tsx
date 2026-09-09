'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  type StudentProfileInput,
  type StudentProfileView,
  studentProfileSchema,
} from '@app/shared';
import { Alert, Button, Card, Field, Input } from '@app/ui/components';
import { cn } from '@app/ui/lib/cn';
import { useAuth } from '@/lib/auth-context';
import { apiFetch, ApiError } from '@/lib/api-client';
import { useUsernameAvailability } from '@/lib/use-username-availability';

export default function OnboardingPage(): React.JSX.Element {
  const router = useRouter();
  const { user, status, refresh } = useAuth();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<StudentProfileInput>({ resolver: zodResolver(studentProfileSchema) });

  const usernameValue = watch('username') ?? '';
  const availability = useUsernameAvailability(usernameValue);

  // Routing: so estudantes sem perfil ficam aqui.
  useEffect(() => {
    if (status === 'anonymous') router.replace('/login');
    else if (status === 'authenticated' && user) {
      if (user.role !== 'STUDENT' || user.onboardingComplete) router.replace('/dashboard');
    }
  }, [status, user, router]);

  if (status !== 'authenticated' || !user || user.role !== 'STUDENT' || user.onboardingComplete) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <span className="h-6 w-6 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
      </div>
    );
  }

  const onSubmit = async (values: StudentProfileInput): Promise<void> => {
    setFormError(null);
    if (availability.status === 'taken' || availability.status === 'invalid') {
      setFormError('Escolhe um @username disponivel.');
      return;
    }
    try {
      await apiFetch<StudentProfileView>('/students/me', { method: 'POST', body: values });
      await refresh();
      router.replace('/dashboard');
    } catch (err) {
      if (err instanceof ApiError && err.details) {
        const first = Object.values(err.details)[0]?.[0];
        setFormError(first ?? err.message);
      } else {
        setFormError(err instanceof ApiError ? err.message : 'Nao foi possivel guardar o perfil.');
      }
    }
  };

  return (
    <div className="auth-bg min-h-screen px-5 py-10">
      <div className="mx-auto max-w-lg space-y-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Completa o teu perfil</h1>
          <p className="text-sm text-muted-foreground">
            A tua família vai encontrar-te pelo teu <strong>@username</strong>.
          </p>
        </div>

        <Card>
          {formError && (
            <div className="mb-4">
              <Alert>{formError}</Alert>
            </div>
          )}

          <form onSubmit={(e) => void handleSubmit(onSubmit)(e)} className="space-y-4" noValidate>
            <Field label="Nome completo" htmlFor="fullName" error={errors.fullName?.message}>
              <Input id="fullName" autoComplete="name" {...register('fullName')} />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Data de nascimento"
                htmlFor="dateOfBirth"
                error={errors.dateOfBirth?.message}
              >
                <Input id="dateOfBirth" type="date" {...register('dateOfBirth')} />
              </Field>
              <Field
                label="Telefone"
                htmlFor="phone"
                hint="+212600112233"
                error={errors.phone?.message}
              >
                <Input id="phone" type="tel" placeholder="+212..." {...register('phone')} />
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="País" htmlFor="country" error={errors.country?.message}>
                <Input id="country" defaultValue="Morocco" {...register('country')} />
              </Field>
              <Field label="Cidade" htmlFor="city" error={errors.city?.message}>
                <Input id="city" {...register('city')} />
              </Field>
            </div>

            <Field label="Universidade" htmlFor="university" error={errors.university?.message}>
              <Input id="university" {...register('university')} />
            </Field>

            <Field
              label="@username"
              htmlFor="username"
              error={errors.username?.message}
              hint="3 a 30 caracteres: letras, números, ponto e underscore."
            >
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  @
                </span>
                <Input
                  id="username"
                  className="pl-7"
                  autoComplete="off"
                  autoCapitalize="none"
                  spellCheck={false}
                  aria-invalid={
                    availability.status === 'taken' || availability.status === 'invalid'
                  }
                  {...register('username')}
                />
              </div>
              <UsernameHint state={availability} />
            </Field>

            <Button
              type="submit"
              className="w-full"
              loading={isSubmitting}
              disabled={availability.status === 'checking'}
            >
              Guardar e continuar
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}

function UsernameHint({
  state,
}: {
  state: ReturnType<typeof useUsernameAvailability>;
}): React.JSX.Element | null {
  if (state.status === 'idle') return null;
  const map = {
    checking: { text: 'A verificar...', cls: 'text-muted-foreground' },
    available: {
      text: `${state.status === 'available' ? state.username : ''} está disponível ✓`,
      cls: 'text-success',
    },
    taken: { text: state.status === 'taken' ? state.reason : '', cls: 'text-danger' },
    invalid: { text: state.status === 'invalid' ? state.reason : '', cls: 'text-danger' },
  } as const;
  const item = map[state.status];
  return <p className={cn('text-xs font-medium', item.cls)}>{item.text}</p>;
}
