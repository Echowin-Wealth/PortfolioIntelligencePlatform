import { Container } from '@/shared/ui/Container';
import { SectionHeading } from '@/shared/ui/SectionHeading';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const faqs = [
  {
    q: 'Which statements does this work with?',
    a: 'Today, the report supports Echowin Wealth PDF statements — both individual and family reports. We\'re actively adding support for CAMS, KFinTech, and broker consolidated statements.',
  },
  {
    q: 'Is the alpha really comparable across funds?',
    a: 'Yes. Each fund is matched to its mandate-appropriate index — large cap to Nifty 50 TRI, multi cap to Nifty LargeMid 250 TRI, small cap to Nifty 500 TRI, and debt to a fixed CRISIL benchmark. Funds held under two years are flagged for review rather than scored.',
  },
  {
    q: 'How private is this really?',
    a: 'The PDF is parsed inside your browser using PDF.js — bytes never leave your device. Only the extracted fund holdings (no names beyond what\'s on your statement) are sent to a transient AI call, and we don\'t persist either the PDF or the analysis.',
  },
  {
    q: 'Can my advisor use this?',
    a: 'They probably already do — Echowin Wealth distributors run the same engine internally. Sign in via /admin if you have credentials, or share the downloaded PDF with whoever advises you.',
  },
  {
    q: 'How often should I run a report?',
    a: 'Quarterly is plenty. Alpha for a fund moves slowly — re-running monthly will mostly produce the same verdicts. Use it after a meaningful market move or before a portfolio review.',
  },
  {
    q: 'What does the recommendation actually mean?',
    a: 'Star: alpha ≥ 3% — strong performer. Good: alpha 0–3% — beating benchmark. Review: under-performing or too new to judge. Exit: lagging by 1%+ for over two years — consider switching. Thresholds are tunable from the admin console.',
  },
];

export function FAQ() {
  return (
    <section id="faq" className="relative py-24 sm:py-28">
      <Container size="md">
        <SectionHeading
          eyebrow="Questions"
          title={<>Everything you might want to ask.</>}
          description="If anything's missing, write to hello@echowin.in and we'll add it."
        />

        <div className="mt-12">
          <Accordion type="single" collapsible className="rounded-2xl bg-white ring-1 ring-[var(--color-line)] px-6 sm:px-8">
            {faqs.map((f, i) => (
              <AccordionItem
                key={i}
                value={`item-${i}`}
                className={i === faqs.length - 1 ? 'border-b-0' : ''}
              >
                <AccordionTrigger>{f.q}</AccordionTrigger>
                <AccordionContent>{f.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </Container>
    </section>
  );
}
