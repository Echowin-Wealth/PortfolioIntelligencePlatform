import { motion } from 'framer-motion';
import {
  TrendingUp,
  Target,
  Activity,
  ListChecks,
  FileDown,
  Shield,
} from 'lucide-react';
import { Container } from '@/shared/ui/Container';
import { SectionHeading } from '@/shared/ui/SectionHeading';

const features = [
  {
    icon: TrendingUp,
    title: 'Alpha that means something',
    body: 'Every fund\'s XIRR is benchmarked against the index that actually fits its mandate — not a generic Nifty comparison.',
  },
  {
    icon: Target,
    title: 'Right benchmark, every time',
    body: 'Large cap → Nifty 50. Multi cap → LargeMid 250. Small cap → Nifty 500. Debt → CRISIL 5.8%. Mapped automatically.',
  },
  {
    icon: Activity,
    title: 'Age-adjusted scoring',
    body: 'Funds under two years are flagged for review, not judged. Long-tenure underperformers are surfaced for action.',
  },
  {
    icon: ListChecks,
    title: 'Action items, not jargon',
    body: 'Hold, increase SIP, monitor, switch — clear recommendations with the alpha math behind every call.',
  },
  {
    icon: FileDown,
    title: 'Investor-ready PDF',
    body: 'Download a polished, branded report you can hand to your advisor, your spouse, or your CA — no spreadsheet wrangling.',
  },
  {
    icon: Shield,
    title: 'Private by design',
    body: 'PDFs are parsed in-browser and analyzed via a transient AI call. We don\'t persist your statement or your holdings.',
  },
];

export function Features() {
  return (
    <section className="relative py-24 sm:py-28 bg-[var(--color-surface-muted)]">
      <Container size="xl">
        <SectionHeading
          eyebrow="What you get"
          title={<>An institutional lens, in your browser.</>}
          description="The decisions a fee-only RIA would help you make — encoded into a single report."
        />

        <div className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.45, delay: (i % 3) * 0.06, ease: [0.16, 1, 0.3, 1] }}
              className="group relative rounded-2xl bg-white p-6 ring-1 ring-[var(--color-line)] transition-all hover:shadow-[var(--shadow-md)] hover:-translate-y-0.5"
            >
              <div className="grid size-10 place-items-center rounded-lg bg-[var(--color-brand-50)] text-[var(--color-brand-600)] ring-1 ring-inset ring-[var(--color-brand-100)]">
                <f.icon className="size-5" />
              </div>
              <h3 className="mt-4 text-[16px] font-semibold text-[var(--color-ink)]">{f.title}</h3>
              <p className="mt-1.5 text-[14px] leading-relaxed text-[var(--color-ink-muted)]">
                {f.body}
              </p>
            </motion.div>
          ))}
        </div>
      </Container>
    </section>
  );
}
