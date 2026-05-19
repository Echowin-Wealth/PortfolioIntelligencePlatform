import { motion } from 'framer-motion';
import { Upload, Cpu, FileBarChart2 } from 'lucide-react';
import { Container } from '@/shared/ui/Container';
import { SectionHeading } from '@/shared/ui/SectionHeading';

const steps = [
  {
    icon: Upload,
    title: 'Upload your statement',
    body: 'Drop your Echowin Wealth PDF. Everything is parsed locally in your browser — your statement never leaves your device unless you analyze it.',
  },
  {
    icon: Cpu,
    title: 'AI matches every fund',
    body: 'Each fund is mapped to the right benchmark — Nifty 50, LargeMid 250, Nifty 500, or debt — and the alpha is computed against age-adjusted XIRR.',
  },
  {
    icon: FileBarChart2,
    title: 'Get a verdict in 60s',
    body: 'Star, Good, Review, Exit — every fund tagged. Download a polished PDF for your records or share with your advisor.',
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

        <div className="mt-16 grid gap-5 md:grid-cols-3">
          {steps.map((step, i) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.5, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
              className="group relative rounded-2xl bg-white p-7 ring-1 ring-[var(--color-line)] transition-all hover:-translate-y-1 hover:shadow-[var(--shadow-md)]"
            >
              <div className="absolute right-6 top-6 font-mono text-[11px] font-semibold tracking-[0.1em] text-[var(--color-ink-faint)]">
                0{i + 1}
              </div>
              <div
                className="grid size-11 place-items-center rounded-xl text-white shadow-[0_10px_24px_-10px_rgba(99,91,255,0.6)]"
                style={{
                  background: 'linear-gradient(135deg, #635bff 0%, #7a5af8 60%, #00d4ff 100%)',
                }}
              >
                <step.icon className="size-5" />
              </div>
              <h3 className="mt-5 font-display text-[20px] font-semibold tracking-tight text-[var(--color-ink)]">
                {step.title}
              </h3>
              <p className="mt-2.5 text-[14.5px] leading-relaxed text-[var(--color-ink-muted)]">
                {step.body}
              </p>
            </motion.div>
          ))}
        </div>
      </Container>
    </section>
  );
}
