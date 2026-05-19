import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/shared/lib/utils';

const buttonVariants = cva(
  [
    'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full font-semibold',
    'transition-[transform,box-shadow,background-color,color,border-color] duration-200',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-500)]/40 focus-visible:ring-offset-2',
    'disabled:opacity-50 disabled:pointer-events-none select-none',
    'active:translate-y-px',
  ].join(' '),
  {
    variants: {
      variant: {
        primary: [
          'text-white shadow-[0_8px_24px_-8px_rgba(99,91,255,0.55)]',
          'bg-[linear-gradient(120deg,var(--color-brand-500)_0%,var(--color-violet)_55%,var(--color-cyan)_120%)]',
          'hover:shadow-[0_14px_34px_-10px_rgba(99,91,255,0.6)] hover:brightness-[1.02]',
        ].join(' '),
        secondary:
          'bg-white text-[var(--color-ink)] border border-[var(--color-line)] shadow-[var(--shadow-xs)] hover:border-[var(--color-line-strong)] hover:shadow-[var(--shadow-sm)]',
        ghost:
          'bg-transparent text-[var(--color-ink)] hover:bg-[var(--color-surface-muted)]',
        outline:
          'bg-white text-[var(--color-ink)] border border-[var(--color-line)] hover:border-[var(--color-brand-500)] hover:text-[var(--color-brand-600)]',
        ink:
          'bg-[var(--color-ink)] text-white hover:bg-[var(--color-ink-2)]',
        success:
          'bg-[var(--color-success)] text-white hover:brightness-110 shadow-[0_6px_18px_-6px_rgba(0,184,122,0.45)]',
        danger:
          'bg-[var(--color-danger)] text-white hover:brightness-110',
        link:
          'bg-transparent text-[var(--color-brand-600)] underline-offset-4 hover:underline px-0 h-auto',
      },
      size: {
        sm: 'h-8 px-3 text-[13px]',
        md: 'h-10 px-5 text-sm',
        lg: 'h-12 px-7 text-[15px]',
        xl: 'h-14 px-8 text-[16px]',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />
    );
  }
);
Button.displayName = 'Button';

export { buttonVariants };
