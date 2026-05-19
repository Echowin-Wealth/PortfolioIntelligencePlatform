import { cn } from '@/shared/lib/utils';

export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'rounded-md bg-[linear-gradient(110deg,var(--color-surface-muted)_8%,var(--color-surface-strong)_18%,var(--color-surface-muted)_33%)]',
        'bg-[length:200%_100%] animate-[shimmer_2s_linear_infinite]',
        className
      )}
      {...props}
    />
  );
}
