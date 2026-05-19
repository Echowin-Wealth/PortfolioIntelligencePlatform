import { ArrowRight, Sparkles } from 'lucide-react';
import { Container } from '@/shared/ui/Container';
import { GradientMesh } from '@/shared/ui/GradientMesh';
import { Button } from '@/components/ui/button';

const trustLogos = ['AMFI Registered', 'AI-assisted', 'Bank-grade encryption', 'No data stored'];

export function Hero() {
  return (
    <section className="relative isolate overflow-hidden pt-12 pb-20 sm:pt-16 sm:pb-28">
      <GradientMesh variant="hero" />

      <Container size="xl" className="relative">
        <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
          <a
            href="#analyze"
            className="inline-flex items-center gap-2 rounded-full bg-white/95 px-3.5 py-1.5 text-[12.5px] font-medium text-[var(--color-ink-2)] shadow-[0_2px_8px_-2px_rgba(15,23,42,0.12)] ring-1 ring-inset ring-white backdrop-blur transition-colors hover:bg-white"
          >
            <Sparkles className="size-3.5 text-[var(--color-brand-600)]" />
            <span className="font-semibold text-[var(--color-brand-700)]">New</span>
            Alpha intelligence for every fund you own
            <ArrowRight className="size-3.5" />
          </a>

          <h1 className="font-display mt-7 text-balance text-[46px] font-bold leading-[1.02] tracking-[-0.035em] text-[#0a0e1a] sm:text-[68px] lg:text-[82px]">
            Your wealth,{' '}
            <span className="text-gradient-brand">decoded.</span>
          </h1>

          <p className="text-pretty mt-6 max-w-xl text-[17px] font-medium leading-relaxed text-[#1a1f36] sm:text-[19px]">
            Upload one PDF. In sixty seconds, see exactly which mutual funds
            are beating the benchmark, which are coasting, and which to
            replace — with the rationale to back every call.
          </p>

          <div className="mt-9 flex flex-col items-center gap-3 sm:flex-row">
            <Button asChild size="xl" className="w-full sm:w-auto">
              <a href="#analyze">
                Analyze my portfolio
                <ArrowRight className="size-4" />
              </a>
            </Button>
            <Button asChild variant="secondary" size="xl" className="w-full sm:w-auto">
              <a href="#how">See how it works</a>
            </Button>
          </div>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-[12.5px] font-semibold text-[var(--color-ink-2)]">
            {trustLogos.map((t) => (
              <div key={t} className="inline-flex items-center gap-2">
                <span className="size-1.5 rounded-full bg-[var(--color-success)]" />
                {t}
              </div>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
