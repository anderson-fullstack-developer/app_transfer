import { cn } from '@app/ui/lib/cn';
import { env } from '@/lib/env';

const steps = [
  'O estudante cria conta e escolhe um @username.',
  'A familia pesquisa o @username e confirma a pessoa certa.',
  'Escolhe o valor em EUR e ve a cotacao EUR -> MAD.',
  'Confirma. Ambos acompanham o estado da transferencia.',
];

export default function HomePage(): React.JSX.Element {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center gap-10 px-6 py-16">
      <header className="space-y-4">
        <span
          className={cn(
            'inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium',
            'bg-muted text-muted-foreground',
          )}
        >
          Modo {env.NEXT_PUBLIC_APP_MODE} — nenhuma transferencia representa dinheiro real
        </span>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Apoio financeiro para estudantes, simples e rastreavel.
        </h1>
        <p className="text-muted-foreground">
          Para estudantes sao-tomenses em Marrocos e as suas familias. Sem intermediarios informais:
          cada envio tem cotacao clara, estado e historico.
        </p>
      </header>

      <ol className="space-y-3">
        {steps.map((step, i) => (
          <li key={step} className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
              {i + 1}
            </span>
            <span className="text-sm leading-6">{step}</span>
          </li>
        ))}
      </ol>

      <div className="flex flex-wrap gap-3">
        <a
          href="/register"
          className="rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground"
        >
          Criar conta
        </a>
        <a href="/login" className="rounded-lg border px-5 py-2.5 text-sm font-medium">
          Entrar
        </a>
      </div>

      <footer className="text-xs text-muted-foreground">
        API: <code>{env.NEXT_PUBLIC_API_URL}</code>
      </footer>
    </main>
  );
}
