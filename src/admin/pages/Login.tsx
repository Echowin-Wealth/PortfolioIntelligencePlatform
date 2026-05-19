import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Loader2, ShieldCheck } from 'lucide-react';
import { supabase } from '@/shared/supabaseClient';
import { GradientMesh } from '@/shared/ui/GradientMesh';
import { BrandLogo } from '@/shared/ui/BrandLogo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError) setError(authError.message);
    setLoading(false);
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.15fr_1fr] bg-white">
      {/* Left: brand panel */}
      <div className="relative isolate hidden overflow-hidden lg:flex lg:flex-col">
        <GradientMesh variant="hero" />
        <div className="relative z-10 flex h-full flex-col p-10 xl:p-16">
          <BrandLogo variant="compact" />
          <div className="mt-auto max-w-md">
            <h1 className="font-display text-balance text-[44px] font-bold leading-[1.05] tracking-[-0.025em] text-[var(--color-ink)] xl:text-[56px]">
              Decode every fund.{' '}
              <span className="text-gradient-brand">In sixty seconds.</span>
            </h1>
            <p className="mt-5 text-[15px] leading-relaxed text-[var(--color-ink-muted)] xl:text-[17px]">
              The Echowin admin console — manage benchmarks, run reports, and
              audit the alpha engine your clients see.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 text-[12.5px] font-medium text-[var(--color-ink-soft)]">
              <span className="inline-flex items-center gap-2">
                <ShieldCheck className="size-3.5 text-[var(--color-success)]" />
                Supabase auth · TLS 1.3
              </span>
              <span className="inline-flex items-center gap-2">
                <span className="size-1.5 rounded-full bg-[var(--color-brand-500)]" />
                AMFI registered
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Right: form panel */}
      <div className="flex flex-col justify-center px-6 py-12 sm:px-12 lg:px-16">
        <div className="mx-auto w-full max-w-sm">
          <div className="mb-2 lg:hidden">
            <BrandLogo variant="compact" />
          </div>
          <h2 className="font-display text-[28px] font-bold tracking-tight text-[var(--color-ink)]">
            Sign in to the console
          </h2>
          <p className="mt-1.5 text-[14px] text-[var(--color-ink-muted)]">
            Use your Echowin admin credentials.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@echowin.in"
                required
                autoComplete="email"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                required
                autoComplete="current-password"
              />
            </div>

            {error && (
              <Alert variant="danger">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" size="lg" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Signing in…
                </>
              ) : (
                <>
                  Sign in <ArrowRight className="size-4" />
                </>
              )}
            </Button>
          </form>

          <p className="mt-6 text-center text-[12.5px] text-[var(--color-ink-soft)]">
            Admin access only. Contact your system administrator to request access.
          </p>

          <div className="mt-8 border-t border-[var(--color-line)] pt-6 text-center">
            <Link
              to="/"
              className="text-[13px] font-medium text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]"
            >
              ← Back to client portal
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
