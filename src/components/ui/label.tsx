import * as React from 'react';
import * as LabelPrimitive from '@radix-ui/react-label';
import { cn } from '@/shared/lib/utils';

export const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>
>(({ className, ...props }, ref) => (
  <LabelPrimitive.Root
    ref={ref}
    className={cn(
      'text-[12px] font-medium text-[var(--color-ink-muted)] tracking-wide',
      'peer-disabled:cursor-not-allowed peer-disabled:opacity-50',
      className
    )}
    {...props}
  />
));
Label.displayName = LabelPrimitive.Root.displayName;
