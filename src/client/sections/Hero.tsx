import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, Sparkles, TrendingUp, TrendingDown } from 'lucide-react';
import { Container } from '@/shared/ui/Container';
import { GradientMesh } from '@/shared/ui/GradientMesh';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { staggerParent, staggerChild, staggerChildSlide, scaleIn } from '@/shared/lib/motion';

const credentials = [
  'AMFI Registered',
  'AI-assisted',
  'Bank-grade encryption',
  'No data stored',
  'TLS 1.3',
  'In-browser parsing',
];

const previewFunds = [
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

export function Hero() {
  const reduced = useReducedMotion();

  return (
    <section className="relative isolate overflow-hidden pt-12 pb-20 sm:pt-16 sm:pb-24">
      <GradientMesh variant="hero" />

      <Container size="xl" className="relative">
        <motion.div
          variants={staggerParent}
          initial="hidden"
          animate="visible"
          className="mx-auto flex max-w-3xl flex-col items-center text-center"
        >
          <motion.a
            variants={staggerChild}
            href="#analyze"
            className="inline-flex items-center gap-2 rounded-full bg-white/95 px-3.5 py-1.5 text-[12.5px] font-medium text-[var(--color-ink-2)] shadow-[0_2px_8px_-2px_rgba(15,23,42,0.12)] ring-1 ring-inset ring-white backdrop-blur transition-colors hover:bg-white"
          >
            <Sparkles className="size-3.5 text-[var(--color-brand-600)]" />
            <span className="font-semibold text-[var(--color-brand-700)]">New</span>
            Alpha intelligence for every fund you own
            <ArrowRight className="size-3.5" />
          </motion.a>

          <motion.h1
            variants={staggerChildSlide}
            className="font-display mt-7 text-balance text-[46px] font-bold leading-[1.02] tracking-[-0.035em] text-[#0a0e1a] sm:text-[68px] lg:text-[82px]"
          >
            Your wealth,{' '}
            <span className="text-gradient-brand">decoded.</span>
          </motion.h1>

          <motion.p
            variants={staggerChildSlide}
            className="text-pretty mt-6 max-w-xl text-[17px] font-medium leading-relaxed text-[#1a1f36] sm:text-[19px]"
          >
            Upload one PDF. In sixty seconds, see exactly which mutual funds
            are beating the benchmark, which are coasting, and which to
            replace — with the rationale to back every call.
          </motion.p>

          <motion.div
            variants={staggerChild}
            className="mt-9 flex flex-col items-center gap-3 sm:flex-row"
          >
            <Button asChild size="xl" className="w-full transition-transform hover:scale-[1.03] sm:w-auto">
              <a href="#analyze">
                Analyze my portfolio
                <ArrowRight className="size-4" />
              </a>
            </Button>
            <Button asChild variant="secondary" size="xl" className="w-full sm:w-auto">
              <a href="#how">See how it works</a>
            </Button>
          </motion.div>
        </motion.div>

        {/* Floating product mockup */}
        <motion.div
          variants={scaleIn}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.35 }}
          className="brand-glow relative mx-auto mt-14 max-w-4xl"
        >
          <motion.div
            animate={reduced ? undefined : { y: [0, -10, 0] }}
            transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
            className="overflow-hidden rounded-2xl border border-[var(--color-line)] bg-white shadow-[var(--shadow-lg)]"
          >
            <div className="flex items-center gap-2 border-b border-[var(--color-line)] bg-[var(--color-surface-muted)] px-4 py-3">
              <span className="size-2.5 rounded-full bg-[#ff5f57]" />
              <span className="size-2.5 rounded-full bg-[#febc2e]" />
              <span className="size-2.5 rounded-full bg-[#28c840]" />
              <span className="ml-3 text-[11px] font-mono uppercase tracking-[0.1em] text-[var(--color-ink-faint)]">
                Portfolio · Alpha report
              </span>
              <Badge variant="brand" className="ml-auto">Live preview</Badge>
            </div>
            <div className="divide-y divide-[var(--color-line)]">
              {previewFunds.map((f) => {
                const positive = f.alpha >= 0;
                return (
                  <div key={f.name} className="flex items-center justify-between gap-4 px-5 py-3.5">
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[13.5px] font-medium text-[var(--color-ink)]">
                        {f.name}
                      </div>
                      <div className="mt-0.5 text-[10.5px] font-mono uppercase tracking-wider text-[var(--color-ink-faint)]">
                        Equity · 3.2yr
                      </div>
                    </div>
                    <div className="hidden sm:block w-36">
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
                        'inline-flex items-center gap-1 font-mono text-[13.5px] font-semibold tabular-nums w-20 justify-end ' +
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
          </motion.div>
        </motion.div>

        {/* Credential marquee */}
        <div className="relative mt-14 overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_12%,#000_88%,transparent)]">
          <div className="marquee-track gap-x-10">
            {[...credentials, ...credentials].map((c, i) => (
              <div
                key={`${c}-${i}`}
                className="inline-flex shrink-0 items-center gap-2 text-[12.5px] font-semibold text-[var(--color-ink-2)]"
              >
                <span className="size-1.5 rounded-full bg-[var(--color-success)]" />
                {c}
              </div>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
