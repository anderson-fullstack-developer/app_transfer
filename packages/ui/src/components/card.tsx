import { cn } from '../lib/cn';

export function Card({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>): React.JSX.Element {
  return (
    <div
      className={cn('rounded-xl border border-border bg-surface p-6 shadow-card', className)}
      {...props}
    />
  );
}

const alertStyles = {
  error: 'border-danger/25 bg-danger/10 text-danger',
  success: 'border-success/25 bg-success/10 text-success',
  info: 'border-border bg-muted text-muted-foreground',
} as const;

export function Alert({
  variant = 'error',
  children,
}: {
  variant?: keyof typeof alertStyles;
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <div
      className={cn(
        'flex items-start gap-2 rounded-lg border px-3 py-2.5 text-sm',
        alertStyles[variant],
      )}
      role="alert"
    >
      <span aria-hidden className="mt-0.5 shrink-0 text-xs">
        {variant === 'success' ? '✓' : variant === 'info' ? 'ℹ' : '!'}
      </span>
      <span>{children}</span>
    </div>
  );
}
