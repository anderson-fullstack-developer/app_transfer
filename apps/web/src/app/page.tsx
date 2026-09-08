import Link from 'next/link';
import { env } from '@/lib/env';

const steps = [
  { t: 'O estudante cria conta', d: 'e escolhe um identificador único: @nome.' },
  { t: 'A família pesquisa o @nome', d: 'e confirma que é a pessoa certa.' },
  { t: 'Escolhe o valor em EUR', d: 'e vê a cotação EUR → MAD, taxa e valor final.' },
  { t: 'Confirma e acompanha', d: 'ambos veem o estado e o histórico da transferência.' },
];

export default function HomePage(): React.JSX.Element {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16 sm:py-24">
      <header className="space-y-5">
        <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-muted-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-success" />
          Modo {env.NEXT_PUBLIC_APP_MODE} — nenhuma transferência representa dinheiro real
        </span>

        <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
          Apoio financeiro para estudantes, simples e rastreável.
        </h1>

        <p className="max-w-xl text-lg text-muted-foreground">
          Para estudantes são-tomenses em Marrocos e as suas famílias. Sem intermediários informais:
          cada envio tem cotação clara, estado e histórico.
        </p>

        <div className="flex flex-wrap gap-3 pt-2">
          <Link
            href="/register"
            className="inline-flex h-11 items-center justify-center rounded-lg bg-primary px-6 text-sm font-medium text-primary-foreground shadow-sm transition hover:brightness-110"
          >
            Criar conta
          </Link>
          <Link
            href="/login"
            className="inline-flex h-11 items-center justify-center rounded-lg border border-border bg-surface px-6 text-sm font-medium transition hover:bg-muted"
          >
            Entrar
          </Link>
        </div>
      </header>

      <ol className="mt-16 grid gap-4 sm:grid-cols-2">
        {steps.map((s, i) => (
          <li key={s.t} className="rounded-xl border border-border bg-surface p-5 shadow-card">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary/10 text-sm font-semibold text-primary">
              {i + 1}
            </span>
            <p className="mt-3 font-medium">{s.t}</p>
            <p className="text-sm text-muted-foreground">{s.d}</p>
          </li>
        ))}
      </ol>
    </main>
  );
}
