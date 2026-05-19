import { Star, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import type { FundRecord, AlphaThresholds } from '@/shared/types';
import { cn } from '@/shared/lib/utils';

interface ActionItemsProps {
  funds: FundRecord[];
  thresholds: AlphaThresholds;
}

interface Item {
  tone: 'star' | 'good' | 'review' | 'exit';
  Icon: typeof Star;
  title: React.ReactNode;
  body?: React.ReactNode;
}

const toneStyles: Record<Item['tone'], { ring: string; iconBg: string; iconText: string }> = {
  star: {
    ring: 'ring-[var(--color-warning-line)]',
    iconBg: 'bg-[var(--color-warning-soft)]',
    iconText: 'text-[var(--color-gold)]',
  },
  good: {
    ring: 'ring-[var(--color-info-line)]',
    iconBg: 'bg-[var(--color-info-soft)]',
    iconText: 'text-[var(--color-info)]',
  },
  review: {
    ring: 'ring-[var(--color-line-strong)]',
    iconBg: 'bg-[var(--color-surface-muted)]',
    iconText: 'text-[var(--color-ink-muted)]',
  },
  exit: {
    ring: 'ring-[var(--color-danger-line)]',
    iconBg: 'bg-[var(--color-danger-soft)]',
    iconText: 'text-[var(--color-danger)]',
  },
};

export function ActionItems({ funds, thresholds }: ActionItemsProps) {
  const tiers: Record<string, FundRecord[]> = { STAR: [], GOOD: [], REVIEW: [], EXIT: [] };
  funds.forEach((f) => tiers[f.signal].push(f));
  const newFunds = tiers.REVIEW.filter((f) => f.days < 730);
  const oldReview = tiers.REVIEW.filter((f) => f.days >= 730);

  const items: Item[] = [];

  if (tiers.EXIT.length > 0) {
    items.push({
      tone: 'exit',
      Icon: XCircle,
      title: (
        <>
          <strong className="font-semibold text-[var(--color-ink)]">
            {tiers.EXIT.length} EXIT {tiers.EXIT.length === 1 ? 'fund' : 'funds'}
          </strong>{' '}
          — underperforming benchmark by more than {Math.abs(thresholds.exit)}% over {thresholds.age}+
          years. Consider switching.
        </>
      ),
      body: [...tiers.EXIT]
        .sort((a, b) => a.alpha - b.alpha)
        .slice(0, 4)
        .map((f) => `${f.name.slice(0, 28)} (${f.alpha >= 0 ? '+' : ''}${f.alpha.toFixed(2)}%)`)
        .join(' · '),
    });
  }

  if (newFunds.length > 0) {
    items.push({
      tone: 'review',
      Icon: AlertTriangle,
      title: (
        <>
          <strong className="font-semibold text-[var(--color-ink)]">
            {newFunds.length} new {newFunds.length === 1 ? 'fund' : 'funds'}
          </strong>{' '}
          held under {thresholds.age} years — too early to judge. Reassess at the {thresholds.age}-year mark.
        </>
      ),
    });
  }

  if (oldReview.length > 0) {
    items.push({
      tone: 'review',
      Icon: AlertTriangle,
      title: (
        <>
          <strong className="font-semibold text-[var(--color-ink)]">
            {oldReview.length} {oldReview.length === 1 ? 'fund' : 'funds'} underperforming benchmark
          </strong>{' '}
          — monitor for 1–2 quarters before taking action.
        </>
      ),
      body: oldReview.map((f) => f.name.slice(0, 28)).join(' · '),
    });
  }

  if (tiers.GOOD.length > 0) {
    items.push({
      tone: 'good',
      Icon: CheckCircle2,
      title: (
        <>
          <strong className="font-semibold text-[var(--color-ink)]">
            {tiers.GOOD.length} GOOD {tiers.GOOD.length === 1 ? 'fund' : 'funds'}
          </strong>{' '}
          — beating benchmark by 0–{thresholds.star}%. Hold and monitor quarterly.
        </>
      ),
    });
  }

  if (tiers.STAR.length > 0) {
    items.push({
      tone: 'star',
      Icon: Star,
      title: (
        <>
          <strong className="font-semibold text-[var(--color-ink)]">
            {tiers.STAR.length} STAR {tiers.STAR.length === 1 ? 'fund' : 'funds'}
          </strong>{' '}
          — alpha of {thresholds.star}%+. Strong performers. Consider increasing SIP allocation.
        </>
      ),
      body: `Top: ${[...tiers.STAR]
        .sort((a, b) => b.alpha - a.alpha)
        .slice(0, 3)
        .map((f) => `${f.name.slice(0, 22)} (+${f.alpha.toFixed(1)}%)`)
        .join(' · ')}`,
    });
  }

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-[var(--color-line)] bg-white p-8 text-center text-[13px] text-[var(--color-ink-soft)]">
        No action items.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((it, i) => {
        const styles = toneStyles[it.tone];
        return (
          <div
            key={i}
            className={cn(
              'flex gap-4 rounded-2xl bg-white p-5 ring-1',
              styles.ring
            )}
          >
            <div className={cn('grid size-9 place-items-center rounded-lg shrink-0', styles.iconBg, styles.iconText)}>
              <it.Icon className="size-4" />
            </div>
            <div className="min-w-0 flex-1 text-[14px] leading-relaxed text-[var(--color-ink-2)]">
              {it.title}
              {it.body && (
                <div className="mt-1.5 font-mono text-[11.5px] text-[var(--color-ink-soft)] truncate">
                  {it.body}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
