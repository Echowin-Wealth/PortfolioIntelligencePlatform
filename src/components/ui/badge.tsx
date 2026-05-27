import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/shared/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold tracking-wide whitespace-nowrap',
  {
    variants: {
      variant: {
        neutral:
          'bg-[var(--color-surface-strong)] text-[var(--color-ink-muted)] ring-1 ring-inset ring-[var(--color-line)]',
        brand:
          'bg-[var(--color-brand-50)] text-[var(--color-brand-700)] ring-1 ring-inset ring-[var(--color-brand-100)]',
        success:
          'bg-[var(--color-success-soft)] text-[var(--color-success)] ring-1 ring-inset ring-[var(--color-success-line)]',
        info:
          'bg-[var(--color-info-soft)] text-[var(--color-info)] ring-1 ring-inset ring-[var(--color-info-line)]',
        warning:
          'bg-[var(--color-warning-soft)] text-[var(--color-gold)] ring-1 ring-inset ring-[var(--color-warning-line)]',
        danger:
          'bg-[var(--color-danger-soft)] text-[var(--color-danger)] ring-1 ring-inset ring-[var(--color-danger-line)]',
        gold:
          'bg-[var(--color-gold-soft)] text-[var(--color-gold)] ring-1 ring-inset ring-[var(--color-gold-line)]',
        silver:
          'bg-[var(--color-silver-soft)] text-[var(--color-silver)] ring-1 ring-inset ring-[var(--color-silver-line)]',
        outline:
          'bg-white text-[var(--color-ink-muted)] ring-1 ring-inset ring-[var(--color-line)]',
      },
    },
    defaultVariants: { variant: 'neutral' },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { badgeVariants };
