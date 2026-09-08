import Link from 'next/link';

export default function AuthLayout({ children }: { children: React.ReactNode }): React.JSX.Element {
  return (
    <div className="auth-bg flex min-h-screen flex-col items-center justify-center px-5 py-10">
      <div className="w-full max-w-md">
        <Link
          href="/"
          className="mb-6 flex items-center justify-center gap-2 text-sm font-semibold tracking-tight"
        >
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-primary text-primary-foreground">
            €
          </span>
          app-transfer
        </Link>
        {children}
        <p className="mt-6 text-center text-xs text-muted-foreground">
          Modo simulação · nenhuma transferência é dinheiro real
        </p>
      </div>
    </div>
  );
}
