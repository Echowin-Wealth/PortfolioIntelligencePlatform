import * as React from 'react';
import { cn } from '@/shared/lib/utils';

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type = 'text', ...props }, ref) => (
    <input
      ref={ref}
      type={type}
      className={cn(
        'h-10 w-full rounded-lg border border-[var(--color-line)] bg-white px-3.5 text-sm text-[var(--color-ink)]',
        'placeholder:text-[var(--color-ink-faint)]',
        'transition-[border-color,box-shadow] duration-150',
        'focus:outline-none focus:border-[var(--color-brand-500)] focus:ring-2 focus:ring-[var(--color-brand-500)]/20',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      {...props}
    />
  )
);
Input.displayName = 'Input';
