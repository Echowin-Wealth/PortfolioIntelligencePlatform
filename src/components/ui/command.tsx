import * as React from 'react';
import { Command as CommandPrimitive } from 'cmdk';
import { Search } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { Dialog, DialogContent } from './dialog';

export const Command = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive>
>(({ className, ...props }, ref) => (
  <CommandPrimitive
    ref={ref}
    className={cn('flex h-full w-full flex-col overflow-hidden rounded-xl bg-white text-[var(--color-ink)]', className)}
    {...props}
  />
));
Command.displayName = CommandPrimitive.displayName;

export interface CommandDialogProps extends React.ComponentProps<typeof Dialog> {
  children: React.ReactNode;
}

export function CommandDialog({ children, ...props }: CommandDialogProps) {
  return (
    <Dialog {...props}>
      <DialogContent className="overflow-hidden p-0 shadow-[var(--shadow-lg)] max-w-xl">
        <Command className="[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-2 [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wide [&_[cmdk-group-heading]]:text-[var(--color-ink-faint)]">
          {children}
        </Command>
      </DialogContent>
    </Dialog>
  );
}

export const CommandInput = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Input>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Input>
>(({ className, ...props }, ref) => (
  <div className="flex items-center border-b border-[var(--color-line)] px-4" cmdk-input-wrapper="">
    <Search className="mr-2 size-4 shrink-0 text-[var(--color-ink-faint)]" />
    <CommandPrimitive.Input
      ref={ref}
      className={cn(
        'flex h-12 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-[var(--color-ink-faint)] disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      {...props}
    />
  </div>
));
CommandInput.displayName = CommandPrimitive.Input.displayName;

export const CommandList = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.List>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.List
    ref={ref}
    className={cn('max-h-[320px] overflow-y-auto overflow-x-hidden p-2', className)}
    {...props}
  />
));
CommandList.displayName = CommandPrimitive.List.displayName;

export const CommandEmpty = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Empty>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Empty>
>((props, ref) => (
  <CommandPrimitive.Empty
    ref={ref}
    className="py-6 text-center text-sm text-[var(--color-ink-soft)]"
    {...props}
  />
));
CommandEmpty.displayName = CommandPrimitive.Empty.displayName;

export const CommandGroup = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Group>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Group>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.Group
    ref={ref}
    className={cn('overflow-hidden p-1 text-[var(--color-ink-2)]', className)}
    {...props}
  />
));
CommandGroup.displayName = CommandPrimitive.Group.displayName;

export const CommandSeparator = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.Separator
    ref={ref}
    className={cn('mx-2 h-px bg-[var(--color-line)]', className)}
    {...props}
  />
));
CommandSeparator.displayName = CommandPrimitive.Separator.displayName;

export const CommandItem = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Item>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.Item
    ref={ref}
    className={cn(
      'relative flex cursor-pointer select-none items-center gap-2 rounded-md px-3 py-2 text-[13px] outline-none transition-colors',
      'data-[selected=true]:bg-[var(--color-surface-muted)] data-[selected=true]:text-[var(--color-ink)]',
      'data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50',
      className
    )}
    {...props}
  />
));
CommandItem.displayName = CommandPrimitive.Item.displayName;

export const CommandShortcut = ({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) => (
  <span className={cn('ml-auto text-[11px] tracking-wider text-[var(--color-ink-faint)]', className)} {...props} />
);
