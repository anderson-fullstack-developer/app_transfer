import { forwardRef } from 'react';
import { cn } from '../lib/cn';

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const Input = forwardRef<HTMLInputElement, InputProps>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      'flex h-11 w-full rounded-lg border border-border bg-background px-3 text-sm',
      'placeholder:text-muted-foreground',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1',
      'disabled:cursor-not-allowed disabled:opacity-50',
      'aria-[invalid=true]:border-red-500 aria-[invalid=true]:ring-red-500/30',
      className,
    )}
    {...props}
  />
));
Input.displayName = 'Input';
