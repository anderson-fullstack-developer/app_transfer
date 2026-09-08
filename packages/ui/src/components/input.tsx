import { forwardRef } from 'react';
import { cn } from '../lib/cn';

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const Input = forwardRef<HTMLInputElement, InputProps>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      'flex h-11 w-full rounded-lg border border-border bg-surface px-3.5 text-sm text-foreground',
      'shadow-sm transition-colors',
      'placeholder:text-muted-foreground/70',
      'focus-visible:border-primary focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/15',
      'disabled:cursor-not-allowed disabled:opacity-50',
      'aria-[invalid=true]:border-danger aria-[invalid=true]:focus-visible:ring-danger/20',
      className,
    )}
    {...props}
  />
));
Input.displayName = 'Input';
