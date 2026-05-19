import { ArrowRight } from 'lucide-react';
import { Container } from '@/shared/ui/Container';
import { GradientMesh } from '@/shared/ui/GradientMesh';
import { Button } from '@/components/ui/button';

export function CtaStrip() {
  return (
    <section className="relative isolate overflow-hidden py-24 sm:py-28">
      <Container size="xl">
        <div className="relative isolate overflow-hidden rounded-[28px] bg-[var(--color-ink)] px-8 py-16 sm:px-14 sm:py-20">
          <GradientMesh variant="cta" className="opacity-90" />
          <div className="relative flex flex-col items-center text-center text-white">
            <h2 className="font-display text-balance text-[34px] font-bold leading-[1.05] tracking-[-0.025em] sm:text-[48px]">
              Sixty seconds.{' '}
              <span className="text-gradient-brand">One PDF.</span>
              <br className="hidden sm:block" /> Every fund, decoded.
            </h2>
            <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-white/70 sm:text-[17px]">
              Stop guessing which funds are working. Start your free analysis
              now — no signup, no credit card.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="xl" variant="secondary" className="bg-white text-[var(--color-ink)]">
                <a href="#analyze">
                  Analyze my portfolio
                  <ArrowRight className="size-4" />
                </a>
              </Button>
              <Button asChild size="xl" variant="ghost" className="bg-white/10 text-white hover:bg-white/20">
                <a href="#how">See how it works</a>
              </Button>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
