import { Upload, Cpu, FileBarChart2, Check } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Container } from '@/shared/ui/Container';
import { SectionHeading } from '@/shared/ui/SectionHeading';
import { Reveal } from '@/shared/ui/Reveal';

type Step = {
  icon: LucideIcon;
  title: string;
  body: string;
  bullets: string[];
};

const steps: Step[] = [
  {
    icon: Upload,
    title: 'Upload your statement',
    body: 'Drop your Echowin Wealth PDF. Everything is parsed locally in your browser — your statement never leaves your device unless you analyze it.',
    bullets: ['Drag & drop a PDF', 'Parsed in-browser with PDF.js', 'Individual or family reports'],
  },
  {
    icon: Cpu,
    title: 'AI matches every fund',
    body: 'Each fund is mapped to the right benchmark — Nifty 50, LargeMid 250, Nifty 500, or debt — and the alpha is computed against age-adjusted XIRR.',
    bullets: ['Mandate-aware benchmark mapping', 'Age-adjusted XIRR', 'Transient AI call, nothing stored'],
  },
  {
    icon: FileBarChart2,
    title: 'Get a verdict in 60s',
    body: 'Star, Good, Review, Exit — every fund tagged. Download a polished PDF for your records or share with your advisor.',
    bullets: ['4-tier per-fund verdict', 'Clear action items', 'Investor-ready PDF export'],
  },
];

export function HowItWorks() {
  return (
    <section id="how" className="relative py-24 sm:py-28">
      <Container size="xl">
        <SectionHeading
          eyebrow="How it works"
          title={<>Three steps to clarity.</>}
          description="A complete portfolio review with the discipline of an institutional analyst — without the meeting."
        />

        <div className="mt-20 flex flex-col gap-20 sm:gap-28">
          {steps.map((step, i) => {
            const flipped = i % 2 === 1;
            return (
              <div
                key={step.title}
                className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16"
              >
                {/* Text column */}
                <Reveal
                  variant={flipped ? 'right' : 'left'}
                  className={flipped ? 'lg:order-2' : ''}
                >
                  <div className="font-mono text-[12px] font-semibold tracking-[0.15em] text-[var(--color-brand-500)]">
                    STEP 0{i + 1}
                  </div>
                  <h3 className="mt-3 font-display text-[28px] font-bold leading-[1.1] tracking-[-0.02em] text-[var(--color-ink)] sm:text-[34px]">
                    {step.title}
                  </h3>
                  <p className="mt-4 max-w-md text-[15.5px] leading-relaxed text-[var(--color-ink-muted)]">
                    {step.body}
                  </p>
                  <ul className="mt-6 space-y-3">
                    {step.bullets.map((b) => (
                      <li key={b} className="flex items-center gap-3 text-[14.5px] font-medium text-[var(--color-ink-2)]">
                        <span className="grid size-5 place-items-center rounded-full bg-[var(--color-success-soft)] text-[var(--color-success)] ring-1 ring-inset ring-[var(--color-success-line)]">
                          <Check className="size-3" />
                        </span>
                        {b}
                      </li>
                    ))}
                  </ul>
                </Reveal>

                {/* Visual column */}
                <Reveal
                  variant={flipped ? 'left' : 'right'}
                  className={flipped ? 'lg:order-1' : ''}
                >
                  <div className="brand-glow relative overflow-hidden rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface-muted)] p-8">
                    <div
                      className="grid size-16 place-items-center rounded-2xl text-white shadow-[0_14px_30px_-12px_rgba(99,91,255,0.7)]"
                      style={{
                        background:
                          'linear-gradient(135deg, #635bff 0%, #7a5af8 60%, #00d4ff 100%)',
                      }}
                    >
                      <step.icon className="size-7" />
                    </div>
                    <div className="mt-6 h-2 w-3/4 rounded-full bg-white" />
                    <div className="mt-3 h-2 w-1/2 rounded-full bg-white/70" />
                    <div className="mt-3 h-2 w-2/3 rounded-full bg-white/50" />
                    <div className="absolute -right-6 -top-6 size-28 rounded-full bg-[var(--color-brand-100)] opacity-50 blur-2xl" />
                  </div>
                </Reveal>
              </div>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
