import { cn } from '../lib/cn';

export function Card({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>): React.JSX.Element {
  return (
    <div
      className={cn('rounded-xl border border-border bg-background p-6 shadow-sm', className)}
      {...props}
    />
  );
}

export function Alert({
  variant = 'error',
  children,
}: {
  variant?: 'error' | 'success' | 'info';
  children: React.ReactNode;
}): React.JSX.Element {
  const styles = {
    error: 'border-red-200 bg-red-50 text-red-800',
    success: 'border-green-200 bg-green-50 text-green-800',
    info: 'border-border bg-muted text-muted-foreground',
  } as const;
  return (
    <div className={cn('rounded-lg border px-3 py-2 text-sm', styles[variant])} role="alert">
      {children}
    </div>
  );
}
