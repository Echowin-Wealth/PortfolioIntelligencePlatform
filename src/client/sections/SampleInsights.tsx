import { Container } from '@/shared/ui/Container';
import { SectionHeading } from '@/shared/ui/SectionHeading';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { TrendingUp, TrendingDown } from 'lucide-react';

const sampleFunds = [
  { name: 'Parag Parikh Flexi Cap', alpha: 4.82, signal: 'STAR' as const },
  { name: 'Mirae Asset Large Cap', alpha: 1.34, signal: 'GOOD' as const },
  { name: 'SBI Bluechip Fund', alpha: -0.41, signal: 'REVIEW' as const },
  { name: 'Aditya Birla Frontline', alpha: -2.18, signal: 'EXIT' as const },
];

const signalToVariant = {
  STAR: 'warning',
  GOOD: 'info',
  REVIEW: 'neutral',
  EXIT: 'danger',
} as const;

export function SampleInsights() {
  return (
    <section id="insights" className="relative py-24 sm:py-28">
      <Container size="xl">
        <SectionHeading
          eyebrow="Sample report"
          title={<>What you'll see in the first 60 seconds.</>}
          description="A glance reveals the outliers — the funds carrying the portfolio, and the ones quietly draining it."
        />

        <div className="mt-14 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <Card className="overflow-hidden">
            <div className="flex items-center justify-between border-b border-[var(--color-line)] px-6 py-4">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--color-ink-soft)]">
                  Fund-level alpha
                </div>
                <div className="mt-1 text-[15px] font-semibold text-[var(--color-ink)]">
                  Sample portfolio · 4 funds
                </div>
              </div>
              <Badge variant="brand">Live preview</Badge>
            </div>

            <div className="divide-y divide-[var(--color-line)]">
              {sampleFunds.map((f) => {
                const positive = f.alpha >= 0;
                return (
                  <div key={f.name} className="flex items-center justify-between gap-4 px-6 py-4">
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[14px] font-medium text-[var(--color-ink)]">
                        {f.name}
                      </div>
                      <div className="mt-0.5 text-[11px] font-mono uppercase tracking-wider text-[var(--color-ink-faint)]">
                        Equity · 3.2yr
                      </div>
                    </div>

                    <div className="hidden sm:block w-40">
                      <div className="relative h-1.5 rounded-full bg-[var(--color-surface-muted)]">
                        <div
                          className="absolute top-0 h-1.5 rounded-full"
                          style={{
                            width: `${Math.min(60, Math.abs(f.alpha) * 12)}%`,
                            left: positive ? '50%' : `${50 - Math.min(60, Math.abs(f.alpha) * 12)}%`,
                            background: positive
                              ? 'linear-gradient(90deg,var(--color-success),var(--color-mint))'
                              : 'linear-gradient(90deg,var(--color-danger),#ff8585)',
                          }}
                        />
                        <div className="absolute left-1/2 top-[-2px] h-2.5 w-px bg-[var(--color-ink-faint)]" />
                      </div>
                    </div>

                    <div
                      className={
                        'inline-flex items-center gap-1 font-mono text-[14px] font-semibold tabular-nums w-20 justify-end ' +
                        (positive ? 'text-[var(--color-success)]' : 'text-[var(--color-danger)]')
                      }
                    >
                      {positive ? (
                        <TrendingUp className="size-3.5" />
                      ) : (
                        <TrendingDown className="size-3.5" />
                      )}
                      {positive ? '+' : ''}
                      {f.alpha.toFixed(2)}%
                    </div>

                    <Badge variant={signalToVariant[f.signal]}>{f.signal}</Badge>
                  </div>
                );
              })}
            </div>
          </Card>

          <div className="flex flex-col gap-4">
            <Card className="p-6">
              <div className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--color-ink-soft)]">
                Tier split
              </div>
              <div className="mt-4 flex h-3 w-full overflow-hidden rounded-full">
                <div className="bg-[var(--color-warning)]" style={{ width: '25%' }} />
                <div className="bg-[var(--color-info)]" style={{ width: '25%' }} />
                <div className="bg-[var(--color-ink-faint)]" style={{ width: '25%' }} />
                <div className="bg-[var(--color-danger)]" style={{ width: '25%' }} />
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 text-[12px]">
                <div className="flex items-center gap-2">
                  <span className="size-2 rounded-full bg-[var(--color-warning)]" /> Star
                  <span className="ml-auto font-mono text-[var(--color-ink-2)]">1</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="size-2 rounded-full bg-[var(--color-info)]" /> Good
                  <span className="ml-auto font-mono text-[var(--color-ink-2)]">1</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="size-2 rounded-full bg-[var(--color-ink-faint)]" /> Review
                  <span className="ml-auto font-mono text-[var(--color-ink-2)]">1</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="size-2 rounded-full bg-[var(--color-danger)]" /> Exit
                  <span className="ml-auto font-mono text-[var(--color-ink-2)]">1</span>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--color-ink-soft)]">
                Action queue
              </div>
              <div className="mt-3 space-y-3 text-[13.5px] leading-relaxed text-[var(--color-ink-2)]">
                <div className="flex gap-2">
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-[var(--color-danger)]" />
                  <span>
                    <span className="font-semibold">Switch Aditya Birla Frontline.</span> Lagging
                    benchmark by 2.18% over 3yr.
                  </span>
                </div>
                <div className="flex gap-2">
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-[var(--color-warning)]" />
                  <span>
                    <span className="font-semibold">Increase SIP to Parag Parikh.</span> Sustained
                    star performance, +4.82%.
                  </span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </Container>
    </section>
  );
}
