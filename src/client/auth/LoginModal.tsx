import { useState } from 'react';
import { Loader2, ShieldCheck } from 'lucide-react';
import { supabase } from '@/shared/supabaseClient';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

type LoginModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function GoogleGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.75h3.57c2.08-1.92 3.28-4.74 3.28-8.07Z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.75c-.99.66-2.26 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z" />
      <path fill="#FBBC05" d="M5.84 14.12a6.6 6.6 0 0 1 0-4.24V7.04H2.18a11 11 0 0 0 0 9.92l3.66-2.84Z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.46 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.04l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38Z" />
    </svg>
  );
}

export function LoginModal({ open, onOpenChange }: LoginModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function signInWithGoogle() {
    setLoading(true);
    setError('');
    // OAuth 2.0 disallows URL fragments in redirect_uri (RFC 6749 §3.1.2),
    // and our app uses hash anchors like #analyze — so strip everything past
    // the path. Whatever URL we use here must ALSO be whitelisted under
    // Supabase Auth → URL Configuration → Redirect URLs.
    const redirectTo = window.location.origin + window.location.pathname;
    const { data, error: authError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo },
    });
    // Log so users can see what's happening in DevTools when the provider
    // isn't configured or the redirect URI isn't whitelisted.
    // eslint-disable-next-line no-console
    console.log('[google-oauth]', { data, error: authError, redirectTo });
    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }
    // If supabase-js returned without redirecting, surface that so the user
    // isn't left staring at an unresponsive button.
    setTimeout(() => {
      if (document.visibilityState === 'visible') {
        setLoading(false);
      }
    }, 4000);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Sign in to analyze your report</DialogTitle>
          <DialogDescription>
            We need to verify it's you so your report history stays in your
            account. We'll never share your details.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-2 space-y-4">
          <Button
            type="button"
            size="lg"
            variant="outline"
            className="w-full gap-2"
            onClick={signInWithGoogle}
            disabled={loading}
          >
            {loading ? <Loader2 className="size-4 animate-spin" /> : <GoogleGlyph />}
            {loading ? 'Redirecting…' : 'Continue with Google'}
          </Button>

          {error && (
            <Alert variant="danger">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <p className="flex items-center justify-center gap-1.5 text-[12px] text-[var(--color-ink-soft)]">
            <ShieldCheck className="size-3.5 text-[var(--color-success)]" />
            One-time phone verification follows.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
