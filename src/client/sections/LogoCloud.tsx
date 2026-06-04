import { Container } from '@/shared/ui/Container';

// Benchmark indices each fund mandate is measured against — mirrors the
// BenchmarkIndex set in shared/types.ts (N50, NLM250, N500, MIDSMALL, GOLD, SILVER, DEBT).
const logos = [
  'Nifty 50 TRI',
  'Nifty LargeMid 250',
  'Nifty 500 TRI',
  'Midcap & Smallcap',
  'Gold',
  'Silver',
  'Debt',
];

export function LogoCloud() {
  return (
    <section className="relative border-y border-[var(--color-line)] bg-[var(--color-surface-muted)] py-10">
      <Container size="xl">
        <p className="text-center text-[11.5px] font-semibold uppercase tracking-[0.16em] text-[var(--color-ink-faint)]">
          Benchmarked against the indices that actually fit each mandate
        </p>
        <div className="relative mt-7 overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_10%,#000_90%,transparent)]">
          <div className="marquee-track gap-x-14">
            {[...logos, ...logos].map((l, i) => (
              <span
                key={`${l}-${i}`}
                className="shrink-0 font-display text-[18px] font-bold tracking-tight text-[var(--color-ink-faint)] transition-colors hover:text-[var(--color-ink-2)] sm:text-[22px]"
              >
                {l}
              </span>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
