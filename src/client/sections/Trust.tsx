import { Lock, ShieldCheck, EyeOff, Zap } from 'lucide-react';
import { Container } from '@/shared/ui/Container';
import { SectionHeading } from '@/shared/ui/SectionHeading';

const items = [
  {
    icon: EyeOff,
    title: 'No statement is stored',
    body: 'PDFs are parsed in your browser. Only the extracted fund table is sent to our AI — and discarded after analysis.',
  },
  {
    icon: Lock,
    title: 'Encrypted in transit',
    body: 'Every request travels over TLS 1.3. Our edge function runs on Supabase with HSTS and strict CSP headers.',
  },
  {
    icon: ShieldCheck,
    title: 'AMFI-registered distribution',
    body: 'Echowin Wealth is a registered mutual fund distributor. The analysis you see is the same one our human advisors use.',
  },
  {
    icon: Zap,
    title: 'Three free reports per day',
    body: 'Rate-limited to prevent abuse — not to nudge you to upgrade. There is no upgrade.',
  },
];

export function Trust() {
  return (
    <section id="trust" className="relative py-24 sm:py-28 bg-[var(--color-surface-muted)]">
      <Container size="xl">
        <SectionHeading
          eyebrow="Privacy & trust"
          title={<>Your statement isn't training data.</>}
          description="Echowin Wealth was built by AMFI-registered distributors who took their own client privacy obligations and made them the product."
        />

        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((it) => (
            <div
              key={it.title}
              className="flex flex-col gap-3 rounded-2xl bg-white p-6 ring-1 ring-[var(--color-line)]"
            >
              <div className="grid size-9 place-items-center rounded-lg bg-[var(--color-success-soft)] text-[var(--color-success)] ring-1 ring-inset ring-[var(--color-success-line)]">
                <it.icon className="size-4" />
              </div>
              <h3 className="text-[15px] font-semibold text-[var(--color-ink)]">{it.title}</h3>
              <p className="text-[13.5px] leading-relaxed text-[var(--color-ink-muted)]">{it.body}</p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
