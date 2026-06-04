import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import {
  ArrowRight,
  FileText,
  LogOut,
  Menu,
  X,
  TrendingUp,
  Cpu,
  FileBarChart2,
  ShieldCheck,
  ChevronDown,
} from 'lucide-react';
import { Container } from '@/shared/ui/Container';
import { BrandLogo } from '@/shared/ui/BrandLogo';
import { Button } from '@/components/ui/button';
import { cn } from '@/shared/lib/utils';
import { useAuth } from '@/shared/hooks/useAuth';

// The "Product" entry expands into a mega-menu; the rest are flat anchors.
const productMenu = [
  {
    icon: TrendingUp,
    label: 'Alpha analysis',
    desc: 'Benchmark every fund against the right index',
    href: '#analyze',
  },
  {
    icon: Cpu,
    label: 'How it works',
    desc: 'AI mapping + age-adjusted XIRR in 60 seconds',
    href: '#how',
  },
  {
    icon: FileBarChart2,
    label: 'Sample report',
    desc: 'See the verdicts before you upload anything',
    href: '#insights',
  },
  {
    icon: ShieldCheck,
    label: 'Privacy & trust',
    desc: 'Parsed in-browser, never stored',
    href: '#trust',
  },
];

const flatLinks = [
  { label: 'How it works', href: '#how' },
  { label: 'Insights', href: '#insights' },
  { label: 'FAQ', href: '#faq' },
];

type TopNavProps = {
  onLogin: () => void;
};

export function TopNav({ onLogin }: TopNavProps) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { session, signOut } = useAuth();
  const reduced = useReducedMotion();

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
          {/* Product mega-menu */}
          <div
            className="relative"
            onMouseEnter={() => setMenuOpen(true)}
            onMouseLeave={() => setMenuOpen(false)}
          >
            <button
              type="button"
              className="group inline-flex items-center gap-1 rounded-full px-3.5 py-2 text-[13.5px] font-medium text-[var(--color-ink-muted)] transition-colors hover:text-[var(--color-ink)]"
              aria-expanded={menuOpen}
            >
              Product
              <ChevronDown
                className={cn(
                  'size-3.5 transition-transform duration-200',
                  menuOpen && 'rotate-180'
                )}
              />
            </button>

            <AnimatePresence>
              {menuOpen && (
                <motion.div
                  initial={reduced ? { opacity: 0 } : { opacity: 0, y: 8, scale: 0.98 }}
                  animate={reduced ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
                  exit={reduced ? { opacity: 0 } : { opacity: 0, y: 8, scale: 0.98 }}
                  transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                  className="absolute left-0 top-full pt-3"
                >
                  <div className="w-[420px] rounded-2xl border border-[var(--color-line)] bg-white p-2 shadow-[var(--shadow-lg)]">
                    <div className="grid grid-cols-1 gap-1">
                      {productMenu.map((item) => (
                        <a
                          key={item.href}
                          href={item.href}
                          onClick={() => setMenuOpen(false)}
                          className="group flex items-start gap-3 rounded-xl p-3 transition-colors hover:bg-[var(--color-surface-muted)]"
                        >
                          <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-lg bg-[var(--color-brand-50)] text-[var(--color-brand-600)] ring-1 ring-inset ring-[var(--color-brand-100)] transition-transform group-hover:scale-105">
                            <item.icon className="size-[18px]" />
                          </span>
                          <span>
                            <span className="block text-[14px] font-semibold text-[var(--color-ink)]">
                              {item.label}
                            </span>
                            <span className="mt-0.5 block text-[12.5px] leading-snug text-[var(--color-ink-muted)]">
                              {item.desc}
                            </span>
                          </span>
                        </a>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {flatLinks.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="group relative rounded-full px-3.5 py-2 text-[13.5px] font-medium text-[var(--color-ink-muted)] transition-colors hover:text-[var(--color-ink)]"
            >
              {l.label}
              <span className="pointer-events-none absolute inset-x-3.5 -bottom-0.5 h-px origin-left scale-x-0 bg-[var(--color-brand-500)] transition-transform duration-300 group-hover:scale-x-100" />
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
            <button
              type="button"
              onClick={onLogin}
              className="text-[13.5px] font-medium text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] transition-colors px-3"
            >
              Login
            </button>
          )}
          <Button asChild size="sm" className="h-9 transition-transform hover:scale-[1.03]">
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

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="md:hidden overflow-hidden border-t border-[var(--color-line)] bg-white"
          >
            <Container size="xl" className="flex flex-col gap-1 py-3">
              {[...productMenu.map((p) => ({ label: p.label, href: p.href })), ...flatLinks]
                // de-dup labels that appear in both lists
                .filter(
                  (l, i, arr) => arr.findIndex((x) => x.label === l.label) === i
                )
                .map((l) => (
                  <a
                    key={l.href + l.label}
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
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    onLogin();
                  }}
                  className="rounded-lg px-3 py-2.5 text-left text-sm font-medium text-[var(--color-ink-2)] hover:bg-[var(--color-surface-muted)]"
                >
                  Login
                </button>
              )}
              <Button asChild className="mt-2">
                <a href="#analyze" onClick={() => setOpen(false)}>
                  Analyze portfolio <ArrowRight className="size-4" />
                </a>
              </Button>
            </Container>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
