import * as React from 'react';
import { cn } from '@/shared/lib/utils';

interface StatCardProps {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  icon?: React.ReactNode;
  tone?: 'neutral' | 'brand' | 'success' | 'info' | 'warning' | 'danger';
  className?: string;
}

const toneRing: Record<NonNullable<StatCardProps['tone']>, string> = {
  neutral: 'before:bg-[var(--color-ink-faint)]/40',
  brand: 'before:bg-[linear-gradient(90deg,var(--color-brand-500),var(--color-violet),var(--color-cyan))]',
  success: 'before:bg-[var(--color-success)]',
  info: 'before:bg-[var(--color-info)]',
  warning: 'before:bg-[var(--color-warning)]',
  danger: 'before:bg-[var(--color-danger)]',
};

const toneText: Record<NonNullable<StatCardProps['tone']>, string> = {
  neutral: 'text-[var(--color-ink)]',
  brand: 'text-[var(--color-brand-700)]',
  success: 'text-[var(--color-success)]',
  info: 'text-[var(--color-info)]',
  warning: 'text-[var(--color-gold)]',
  danger: 'text-[var(--color-danger)]',
};

export function StatCard({
  label,
  value,
  hint,
  icon,
  tone = 'neutral',
  className,
}: StatCardProps) {
  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-2xl bg-white p-5 ring-1 ring-[var(--color-line)] transition-all',
        'hover:shadow-[var(--shadow-md)] hover:-translate-y-0.5',
        'before:absolute before:left-0 before:right-0 before:top-0 before:h-[3px]',
        toneRing[tone],
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--color-ink-soft)]">
          {label}
        </div>
        {icon && <div className="text-[var(--color-ink-faint)]">{icon}</div>}
      </div>
      <div className={cn('mt-3 font-display text-[28px] font-bold leading-none tracking-tight', toneText[tone])}>
        {value}
      </div>
      {hint && <div className="mt-2 text-[12px] text-[var(--color-ink-soft)]">{hint}</div>}
    </div>
  );
}
