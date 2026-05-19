import { cn } from '@/shared/lib/utils';

interface BrandLogoProps {
  className?: string;
  variant?: 'default' | 'compact';
}

export function BrandLogo({ className, variant = 'default' }: BrandLogoProps) {
  return (
    <div className={cn('inline-flex items-center gap-2.5', className)}>
      <img
        src="/logo.png"
        alt="Echowin Wealth"
        className="size-36 rounded-[10px] object-contain"
      />
      {variant === 'default' && (
        <span className="font-display text-[17px] font-semibold tracking-tight text-[var(--color-ink)] leading-none">
          Echowin
          <span className="text-[var(--color-brand-600)]">.</span>
          <span className="text-[var(--color-ink-muted)] font-medium">wealth</span>
        </span>
      )}
    </div>
  );
}
