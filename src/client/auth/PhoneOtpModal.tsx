import { useState, type FormEvent } from 'react';
import { Loader2, Phone } from 'lucide-react';
import { supabase } from '@/shared/supabaseClient';
import { updateProfile } from '@/shared/profile';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';

type PhoneOtpModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  onVerified: () => void;
};

// Accept Indian numbers in a few common shapes; normalize to E.164 (+91XXXXXXXXXX).
function normalizePhone(raw: string): string | null {
  const digits = raw.replace(/\D+/g, '');
  if (digits.length === 10) return `+91${digits}`;
  if (digits.length === 12 && digits.startsWith('91')) return `+${digits}`;
  if (digits.length === 13 && raw.trim().startsWith('+91')) return `+${digits}`;
  return null;
}

export function PhoneOtpModal({ open, onOpenChange, userId, onVerified }: PhoneOtpModalProps) {
  const [step, setStep] = useState<'enter' | 'verify'>('enter');
  const [phoneInput, setPhoneInput] = useState('');
  const [phoneE164, setPhoneE164] = useState('');
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function sendOtp(e: FormEvent) {
    e.preventDefault();
    setError('');
    const normalized = normalizePhone(phoneInput);
    if (!normalized) {
      setError('Enter a valid 10-digit Indian mobile number.');
      return;
    }
    setLoading(true);
    const { error: updErr } = await supabase.auth.updateUser({ phone: normalized });
    setLoading(false);
    if (updErr) {
      setError(updErr.message);
      return;
    }
    setPhoneE164(normalized);
    setStep('verify');
  }

  async function verifyOtp(e: FormEvent) {
    e.preventDefault();
    setError('');
    if (token.trim().length < 4) {
      setError('Enter the OTP from the SMS.');
      return;
    }
    setLoading(true);
    const { error: verifyErr } = await supabase.auth.verifyOtp({
      phone: phoneE164,
      token: token.trim(),
      type: 'phone_change',
    });
    if (verifyErr) {
      setError(verifyErr.message);
      setLoading(false);
      return;
    }
    try {
      await updateProfile(userId, { phone: phoneE164, phone_verified: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save phone to profile.');
      setLoading(false);
      return;
    }
    setLoading(false);
    onVerified();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Phone className="size-4 text-[var(--color-brand-500)]" />
            Verify your phone
          </DialogTitle>
          <DialogDescription>
            {step === 'enter'
              ? 'We send a one-time code over SMS to keep your account secure. This is a one-time step.'
              : `Enter the 6-digit code we sent to ${phoneE164}.`}
          </DialogDescription>
        </DialogHeader>

        {step === 'enter' ? (
          <form onSubmit={sendOtp} className="mt-2 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="phone">Mobile number</Label>
              <Input
                id="phone"
                type="tel"
                inputMode="numeric"
                placeholder="98xxxxxxxx"
                value={phoneInput}
                onChange={(e) => setPhoneInput(e.target.value)}
                autoComplete="tel"
                required
              />
              <p className="text-[12px] text-[var(--color-ink-soft)]">
                Indian numbers only (we'll add +91 automatically).
              </p>
            </div>
            {error && (
              <Alert variant="danger">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <Button type="submit" size="lg" className="w-full" disabled={loading}>
              {loading ? <Loader2 className="size-4 animate-spin" /> : null}
              {loading ? 'Sending code…' : 'Send code'}
            </Button>
          </form>
        ) : (
          <form onSubmit={verifyOtp} className="mt-2 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="otp">One-time code</Label>
              <Input
                id="otp"
                type="text"
                inputMode="numeric"
                placeholder="123456"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                autoComplete="one-time-code"
                required
              />
            </div>
            {error && (
              <Alert variant="danger">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => {
                  setStep('enter');
                  setToken('');
                  setError('');
                }}
                className="text-[13px] font-medium text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]"
              >
                ← Use a different number
              </button>
              <Button type="submit" size="lg" disabled={loading}>
                {loading ? <Loader2 className="size-4 animate-spin" /> : null}
                {loading ? 'Verifying…' : 'Verify & continue'}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
