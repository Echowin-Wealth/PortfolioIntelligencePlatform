import { Link } from 'react-router-dom';
import { Container } from '@/shared/ui/Container';
import { BrandLogo } from '@/shared/ui/BrandLogo';

const cols = [
  {
    title: 'Product',
    links: [
      { label: 'Analyze portfolio', href: '#analyze' },
      { label: 'How it works', href: '#how' },
      { label: 'Sample report', href: '#insights' },
      { label: 'FAQ', href: '#faq' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About Echowin', href: '#' },
      { label: 'Compliance', href: '#trust' },
      { label: 'Contact', href: 'mailto:hello@echowin.in' },
    ],
  },
  {
    title: 'Advisors',
    links: [
      { label: 'Sign in to console', to: '/admin' },
      { label: 'Distribution partners', href: '#' },
    ],
  },
];

export function Footer() {
  return (
    <footer className="relative border-t border-[var(--color-line)] bg-white">
      <Container size="xl" className="py-16">
        <div className="grid gap-10 md:grid-cols-[1.4fr_2fr]">
          <div className="max-w-sm">
            <BrandLogo variant="compact" />
            <p className="mt-4 text-[14px] leading-relaxed text-[var(--color-ink-muted)]">
              Echowin Wealth Private Limited — AMFI-registered mutual fund
              distributor. Independent, fee-aware, AI-assisted.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            {cols.map((col) => (
              <div key={col.title}>
                <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--color-ink-faint)]">
                  {col.title}
                </div>
                <ul className="mt-4 space-y-2.5">
                  {col.links.map((l) => {
                    if ('to' in l && l.to) {
                      return (
                        <li key={l.label}>
                          <Link
                            to={l.to}
                            className="text-[14px] text-[var(--color-ink-muted)] transition-colors hover:text-[var(--color-ink)]"
                          >
                            {l.label}
                          </Link>
                        </li>
                      );
                    }
                    return (
                      <li key={l.label}>
                        <a
                          href={'href' in l ? l.href : '#'}
                          className="text-[14px] text-[var(--color-ink-muted)] transition-colors hover:text-[var(--color-ink)]"
                        >
                          {l.label}
                        </a>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-3 border-t border-[var(--color-line)] pt-8 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-[12.5px] text-[var(--color-ink-soft)]">
            © {new Date().getFullYear()} Echowin Wealth Private Limited. Mutual
            fund investments are subject to market risks.
          </div>
          <div className="text-[11px] font-mono uppercase tracking-[0.1em] text-[var(--color-ink-faint)]">
            Built with care · v1.0
          </div>
        </div>
      </Container>
    </footer>
  );
}
