import * as React from 'react';
import * as TabsPrimitive from '@radix-ui/react-tabs';
import { cn } from '@/shared/lib/utils';

export const Tabs = TabsPrimitive.Root;

export const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      'inline-flex h-10 items-center gap-1 rounded-full bg-[var(--color-surface-muted)] p-1 ring-1 ring-inset ring-[var(--color-line)]',
      className
    )}
    {...props}
  />
));
TabsList.displayName = TabsPrimitive.List.displayName;

export const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      'inline-flex h-8 items-center justify-center whitespace-nowrap rounded-full px-4 text-[13px] font-medium text-[var(--color-ink-soft)]',
      'transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-500)]/40',
      'data-[state=active]:bg-white data-[state=active]:text-[var(--color-ink)] data-[state=active]:shadow-[var(--shadow-xs)]',
      className
    )}
    {...props}
  />
));
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

export const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      'mt-6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-500)]/40 rounded-2xl',
      className
    )}
    {...props}
  />
));
TabsContent.displayName = TabsPrimitive.Content.displayName;
