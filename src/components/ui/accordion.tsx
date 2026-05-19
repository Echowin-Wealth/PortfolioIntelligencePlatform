import * as React from 'react';
import * as AccordionPrimitive from '@radix-ui/react-accordion';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

export const Accordion = AccordionPrimitive.Root;

export const AccordionItem = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Item>
>(({ className, ...props }, ref) => (
  <AccordionPrimitive.Item
    ref={ref}
    className={cn('border-b border-[var(--color-line)]', className)}
    {...props}
  />
));
AccordionItem.displayName = AccordionPrimitive.Item.displayName;

export const AccordionTrigger = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <AccordionPrimitive.Header className="flex">
    <AccordionPrimitive.Trigger
      ref={ref}
      className={cn(
        'group flex flex-1 items-center justify-between py-5 text-left text-base font-semibold text-[var(--color-ink)]',
        'transition-colors hover:text-[var(--color-brand-600)]',
        className
      )}
      {...props}
    >
      {children}
      <ChevronDown className="size-4 shrink-0 text-[var(--color-ink-soft)] transition-transform duration-200 group-data-[state=open]:rotate-180" />
    </AccordionPrimitive.Trigger>
  </AccordionPrimitive.Header>
));
AccordionTrigger.displayName = AccordionPrimitive.Trigger.displayName;

export const AccordionContent = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <AccordionPrimitive.Content
    ref={ref}
    className="overflow-hidden text-[15px] leading-relaxed text-[var(--color-ink-muted)] data-[state=closed]:animate-[fade-in_0.2s_reverse] data-[state=open]:animate-[fade-up_0.2s_ease-out]"
    {...props}
  >
    <div className={cn('pb-5 pr-8', className)}>{children}</div>
  </AccordionPrimitive.Content>
));
AccordionContent.displayName = AccordionPrimitive.Content.displayName;
