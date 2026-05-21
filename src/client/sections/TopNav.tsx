import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, FileText, LogOut, Menu, X } from 'lucide-react';
import { Container } from '@/shared/ui/Container';
import { BrandLogo } from '@/shared/ui/BrandLogo';
import { Button } from '@/components/ui/button';
import { cn } from '@/shared/lib/utils';
import { useAuth } from '@/shared/hooks/useAuth';

const links = [
  { label: 'Product', href: '#analyze' },
  { label: 'How it works', href: '#how' },
  { label: 'Insights', href: '#insights' },
  { label: 'Security', href: '#trust' },
  { label: 'FAQ', href: '#faq' },
];

export function TopNav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { session, signOut } = useAuth();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={cn(
        'sticky top-0 z-50 w-full transition-all duration-300',
        scrolled
          ? 'border-b border-[var(--color-line)]/80 bg-white/80 backdrop-blur-xl supports-[backdrop-filter]:bg-white/65'
          : 'border-b border-transparent bg-transparent'
      )}
    >
      <Container size="xl" className="flex h-16 items-center justify-between">
        <a href="#" className="flex items-center" aria-label="Echowin Wealth">
          <BrandLogo variant="compact" />
        </a>

        <nav className="hidden md:flex items-center gap-1">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="rounded-full px-3.5 py-2 text-[13.5px] font-medium text-[var(--color-ink-muted)] transition-colors hover:text-[var(--color-ink)] hover:bg-[var(--color-surface-muted)]"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-2">
          {session ? (
            <>
              <Link
                to="/my-reports"
                className="inline-flex items-center gap-1.5 text-[13.5px] font-medium text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] transition-colors px-3"
              >
                <FileText className="size-3.5" /> My reports
              </Link>
              <button
                type="button"
                onClick={() => signOut()}
                className="inline-flex items-center gap-1.5 text-[13.5px] font-medium text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] transition-colors px-3"
              >
                <LogOut className="size-3.5" /> Sign out
              </button>
            </>
          ) : (
            <Link
              to="/admin"
              className="text-[13.5px] font-medium text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] transition-colors px-3"
            >
              Admin
            </Link>
          )}
          <Button asChild size="sm" className="h-9">
            <a href="#analyze">
              Analyze portfolio <ArrowRight className="size-3.5" />
            </a>
          </Button>
        </div>

        <button
          className="md:hidden inline-flex size-9 items-center justify-center rounded-lg text-[var(--color-ink)] hover:bg-[var(--color-surface-muted)]"
          aria-label="Toggle menu"
          onClick={() => setOpen((o) => !o)}
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </Container>

      {open && (
        <div className="md:hidden border-t border-[var(--color-line)] bg-white">
          <Container size="xl" className="flex flex-col gap-1 py-3">
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-[var(--color-ink-2)] hover:bg-[var(--color-surface-muted)]"
              >
                {l.label}
              </a>
            ))}
            {session ? (
              <>
                <Link
                  to="/my-reports"
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-3 py-2.5 text-sm font-medium text-[var(--color-ink-2)] hover:bg-[var(--color-surface-muted)]"
                >
                  My reports
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    void signOut();
                  }}
                  className="rounded-lg px-3 py-2.5 text-left text-sm font-medium text-[var(--color-ink-2)] hover:bg-[var(--color-surface-muted)]"
                >
                  Sign out
                </button>
              </>
            ) : (
              <Link
                to="/admin"
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-[var(--color-ink-2)] hover:bg-[var(--color-surface-muted)]"
              >
                Admin
              </Link>
            )}
            <Button asChild className="mt-2">
              <a href="#analyze" onClick={() => setOpen(false)}>
                Analyze portfolio <ArrowRight className="size-4" />
              </a>
            </Button>
          </Container>
        </div>
      )}
    </header>
  );
}
