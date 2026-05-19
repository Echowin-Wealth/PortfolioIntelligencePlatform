import * as React from 'react';
import { cn } from '@/shared/lib/utils';

interface SectionHeadingProps {
  eyebrow?: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  align?: 'left' | 'center';
  className?: string;
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = 'center',
  className,
}: SectionHeadingProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-4',
        align === 'center' ? 'items-center text-center mx-auto max-w-2xl' : 'items-start text-left',
        className
      )}
    >
      {eyebrow && (
        <span className="inline-flex items-center gap-2 rounded-full bg-[var(--color-brand-50)] px-3 py-1 text-[12px] font-semibold uppercase tracking-[0.12em] text-[var(--color-brand-700)] ring-1 ring-inset ring-[var(--color-brand-100)]">
          <span className="size-1.5 rounded-full bg-[var(--color-brand-500)]" />
          {eyebrow}
        </span>
      )}
      <h2 className="font-display text-balance text-3xl font-bold leading-[1.08] tracking-[-0.025em] text-[var(--color-ink)] sm:text-4xl lg:text-5xl">
        {title}
      </h2>
      {description && (
        <p className="text-pretty text-[15px] leading-relaxed text-[var(--color-ink-muted)] sm:text-[16px] max-w-2xl">
          {description}
        </p>
      )}
    </div>
  );
}
