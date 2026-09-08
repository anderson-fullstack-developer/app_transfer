import Link from 'next/link';

export default function AuthLayout({ children }: { children: React.ReactNode }): React.JSX.Element {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-5 py-10">
      <Link href="/" className="mb-8 text-sm font-semibold tracking-tight">
        app-transfer
      </Link>
      {children}
    </div>
  );
}
