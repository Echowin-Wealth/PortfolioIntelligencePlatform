import { useCallback, useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Quote } from 'lucide-react';
import { Container } from '@/shared/ui/Container';
import { SectionHeading } from '@/shared/ui/SectionHeading';
import { Reveal } from '@/shared/ui/Reveal';
import { CountUp } from '@/shared/ui/CountUp';

const testimonials = [
  {
    quote:
      'I had eleven funds and no idea which were actually pulling their weight. This flagged two laggards I\'d been holding for years in under a minute.',
    name: 'Rohan M.',
    role: 'Self-directed investor, Pune',
  },
  {
    quote:
      'The benchmark mapping is the part nobody else gets right. Seeing each fund judged against the index it should be judged against changed how I rebalance.',
    name: 'Aishwarya K.',
    role: 'Salaried professional, Bengaluru',
  },
  {
    quote:
      'I hand the PDF straight to my CA now. Clear verdicts, the alpha math behind each one, nothing to argue with.',
    name: 'Suresh T.',
    role: 'Retiree, Chennai',
  },
];

const stats = [
  { to: 60, suffix: 's', label: 'To a full verdict' },
  { to: 4, suffix: '-tier', label: 'Per-fund rating' },
  { to: 0, label: 'Statements stored' },
  { to: 3, suffix: '/day', label: 'Free reports' },
];

export function Testimonials() {
  const [index, setIndex] = useState(0);
  const [dir, setDir] = useState(0);
  const reduced = useReducedMotion();
  const count = testimonials.length;

  const go = useCallback(
    (next: number) => {
      setDir(next > index || (index === count - 1 && next === 0) ? 1 : -1);
      setIndex((next + count) % count);
    },
    [index, count]
  );

  // Auto-advance, paused when the user prefers reduced motion.
  useEffect(() => {
    if (reduced) return;
    const id = setInterval(() => {
      setDir(1);
      setIndex((i) => (i + 1) % count);
    }, 6000);
    return () => clearInterval(id);
  }, [reduced, count]);

  const t = testimonials[index];

  return (
    <section className="relative py-24 sm:py-28 bg-[var(--color-surface-muted)]">
      <Container size="xl">
        <SectionHeading
          eyebrow="Loved by investors"
          title={<>Clarity people actually act on.</>}
          description="Built by AMFI-registered distributors, used by the people whose money is on the line."
        />

        {/* Stats strip */}
        <Reveal className="mx-auto mt-12 grid max-w-3xl grid-cols-2 gap-4 sm:grid-cols-4">
          {stats.map((s) => (
            <div
              key={s.label}
              className="rounded-2xl bg-white p-5 text-center ring-1 ring-[var(--color-line)]"
            >
              <div className="font-display text-[30px] font-bold tracking-tight text-[var(--color-ink)]">
                <CountUp to={s.to} suffix={s.suffix} />
              </div>
              <div className="mt-1 text-[12.5px] font-medium text-[var(--color-ink-muted)]">
                {s.label}
              </div>
            </div>
          ))}
        </Reveal>

        {/* Carousel */}
        <Reveal className="mx-auto mt-12 max-w-3xl">
          <div className="relative overflow-hidden rounded-2xl bg-white p-8 ring-1 ring-[var(--color-line)] sm:p-12">
            <Quote className="size-9 text-[var(--color-brand-200)]" />
            <div className="relative mt-4 h-[240px] sm:h-[170px]">
              <AnimatePresence mode="wait" custom={dir}>
                <motion.div
                  key={index}
                  custom={dir}
                  initial={reduced ? { opacity: 0 } : { opacity: 0, x: dir * 40 }}
                  animate={reduced ? { opacity: 1 } : { opacity: 1, x: 0 }}
                  exit={reduced ? { opacity: 0 } : { opacity: 0, x: dir * -40 }}
                  transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  drag={reduced ? false : 'x'}
                  dragConstraints={{ left: 0, right: 0 }}
                  dragElastic={0.2}
                  onDragEnd={(_, info) => {
                    if (info.offset.x < -60) go(index + 1);
                    else if (info.offset.x > 60) go(index - 1);
                  }}
                >
                  <p className="text-pretty text-[18px] font-medium leading-relaxed text-[var(--color-ink)] sm:text-[21px]">
                    “{t.quote}”
                  </p>
                  <div className="mt-6 text-[14px]">
                    <span className="font-semibold text-[var(--color-ink)]">{t.name}</span>
                    <span className="text-[var(--color-ink-muted)]"> · {t.role}</span>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="mt-8 flex items-center justify-between">
              <div className="flex gap-2">
                {testimonials.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    aria-label={`Show testimonial ${i + 1}`}
                    onClick={() => go(i)}
                    className={
                      'h-2 rounded-full transition-all duration-300 ' +
                      (i === index
                        ? 'w-6 bg-[var(--color-brand-500)]'
                        : 'w-2 bg-[var(--color-line-strong)] hover:bg-[var(--color-ink-faint)]')
                    }
                  />
                ))}
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  aria-label="Previous testimonial"
                  onClick={() => go(index - 1)}
                  className="grid size-9 place-items-center rounded-full ring-1 ring-[var(--color-line)] text-[var(--color-ink-muted)] transition-colors hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-ink)]"
                >
                  <ChevronLeft className="size-4" />
                </button>
                <button
                  type="button"
                  aria-label="Next testimonial"
                  onClick={() => go(index + 1)}
                  className="grid size-9 place-items-center rounded-full ring-1 ring-[var(--color-line)] text-[var(--color-ink-muted)] transition-colors hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-ink)]"
                >
                  <ChevronRight className="size-4" />
                </button>
              </div>
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
