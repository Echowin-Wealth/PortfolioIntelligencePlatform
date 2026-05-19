import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/shared/lib/utils';

const alertVariants = cva(
  'relative w-full rounded-xl border px-4 py-3 text-[13px] flex items-start gap-3 [&_svg]:size-4 [&_svg]:mt-0.5 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default:
          'border-[var(--color-line)] bg-white text-[var(--color-ink-2)]',
        info:
          'border-[var(--color-info-line)] bg-[var(--color-info-soft)] text-[var(--color-info)]',
        success:
          'border-[var(--color-success-line)] bg-[var(--color-success-soft)] text-[var(--color-success)]',
        warning:
          'border-[var(--color-warning-line)] bg-[var(--color-warning-soft)] text-[var(--color-gold)]',
        danger:
          'border-[var(--color-danger-line)] bg-[var(--color-danger-soft)] text-[var(--color-danger)]',
      },
    },
    defaultVariants: { variant: 'default' },
  }
);

export interface AlertProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof alertVariants> {}

export const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant, ...props }, ref) => (
    <div ref={ref} role="alert" className={cn(alertVariants({ variant }), className)} {...props} />
  )
);
Alert.displayName = 'Alert';

export const AlertTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h5 ref={ref} className={cn('font-semibold leading-tight', className)} {...props} />
  )
);
AlertTitle.displayName = 'AlertTitle';

export const AlertDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('leading-relaxed', className)} {...props} />
  )
);
AlertDescription.displayName = 'AlertDescription';
