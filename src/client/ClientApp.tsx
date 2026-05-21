import { useEffect, useState } from 'react';
import { extractText } from '@/shared/pdfExtract';
import { processRawFunds } from '@/shared/alphaEngine';
import { supabase } from '@/shared/supabaseClient';
import { useAuth } from '@/shared/hooks/useAuth';
import { useProfile } from '@/shared/profile';
import type { FundRecord, AlphaThresholds, RawFundRecord } from '@/shared/types';
import { DEFAULT_THRESHOLDS } from '@/shared/types';

import { TopNav } from './sections/TopNav';
import { Hero } from './sections/Hero';
import { AnalyzeSection } from './sections/AnalyzeSection';
import { HowItWorks } from './sections/HowItWorks';
import { Features } from './sections/Features';
import { SampleInsights } from './sections/SampleInsights';
import { Trust } from './sections/Trust';
import { FAQ } from './sections/FAQ';
import { CtaStrip } from './sections/CtaStrip';
import { Footer } from './sections/Footer';
import { LoginModal } from './auth/LoginModal';
import { PhoneOtpModal } from './auth/PhoneOtpModal';
import { toast } from '@/components/ui/sonner';

const EDGE_FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyse`;
// Persists across the Google OAuth full-page redirect so we know to resume the
// analyze flow when the user lands back signed-in.
const ANALYZE_INTENT_KEY = 'echowin:analyzeIntent';

type Step = 1 | 2 | 3;

export function ClientApp() {
  const { session, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading, refresh: refreshProfile } = useProfile();

  const [file, setFile] = useState<File | null>(null);
  const [step, setStep] = useState<Step>(1);
  const [progress, setProgress] = useState(0);
  const [progressMsg, setProgressMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [funds, setFunds] = useState<FundRecord[]>([]);
  const [investorName, setInvestorName] = useState('');
  const [error, setError] = useState('');
  const [rateLimited, setRateLimited] = useState(false);

  // Auth gating
  const [loginOpen, setLoginOpen] = useState(false);
  const [otpOpen, setOtpOpen] = useState(false);

  const thresholds: AlphaThresholds = DEFAULT_THRESHOLDS;
  const distributorName = 'Echowin Wealth Private Limited';

  // Surface OAuth errors that Supabase pushes into the URL hash/query so
  // they don't manifest as a silent "page just refreshed" experience.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    const queryParams = new URLSearchParams(window.location.search);
    const errDesc =
      hashParams.get('error_description') ||
      queryParams.get('error_description') ||
      hashParams.get('error') ||
      queryParams.get('error');
    if (errDesc) {
      toast.error(`Sign-in failed: ${decodeURIComponent(errDesc)}`);
      window.sessionStorage.removeItem(ANALYZE_INTENT_KEY);
      // Strip the error params so a reload doesn't keep showing the toast.
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  // After the Google OAuth redirect we land back here with a fresh page. The
  // React `file` state is gone, so we can't auto-resume the analysis. Instead:
  //  - if phone isn't verified yet, open the OTP modal automatically
  //  - once everything is set, prompt the user to pick their PDF again
  useEffect(() => {
    if (authLoading || profileLoading) return;
    if (typeof window === 'undefined') return;
    const intent = window.sessionStorage.getItem(ANALYZE_INTENT_KEY);
    if (!intent || !session) return;

    if (!profile?.phone_verified) {
      setOtpOpen(true);
      return;
    }

    window.sessionStorage.removeItem(ANALYZE_INTENT_KEY);
    toast.success("You're all set — choose your PDF and click Analyze.");
    setTimeout(() => {
      document.getElementById('analyze')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  }, [authLoading, profileLoading, session, profile?.phone_verified]);

  async function generate() {
    if (!file) return;

    // Gate 1: signed in?
    if (!session) {
      window.sessionStorage.setItem(ANALYZE_INTENT_KEY, '1');
      setLoginOpen(true);
      return;
    }
    // Gate 2: phone verified?
    if (!profile?.phone_verified) {
      window.sessionStorage.setItem(ANALYZE_INTENT_KEY, '1');
      setOtpOpen(true);
      return;
    }

    setLoading(true);
    setError('');
    setRateLimited(false);
    setProgress(5);
    setProgressMsg('Reading PDF…');
    setStep(2);

    try {
      const text = await extractText(file);
      setProgress(30);
      setProgressMsg('Analysing with AI…');

      const res = await fetch(EDGE_FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY as string,
        },
        body: JSON.stringify({ text }),
      });

      if (res.status === 401 || res.status === 403) {
        const body = (await res.json().catch(() => ({}))) as Record<string, unknown>;
        if (body.error === 'phone_unverified') {
          setOtpOpen(true);
          setStep(1);
          setProgress(0);
          setProgressMsg('');
          return;
        }
        throw new Error((body.error as string) ?? 'Please sign in again.');
      }

      if (res.status === 429) {
        setRateLimited(true);
        setStep(1);
        setProgress(0);
        setProgressMsg('');
        return;
      }

      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as Record<string, unknown>;
        throw new Error((body.error as string) ?? `Error ${res.status}`);
      }

      const data = (await res.json()) as { funds: RawFundRecord[]; reportId?: string };
      setProgress(75);
      setProgressMsg('Applying alpha rules…');

      const processed = await processRawFunds(data.funds, thresholds);
      setFunds(processed);
      setInvestorName(data.funds[0]?.investor_name ?? 'Client');

      // Patch the report row created by the edge function with alpha metrics.
      // RLS allows self-update on rows where user_id = auth.uid().
      if (data.reportId && processed.length > 0) {
        const meta = {
          avg_alpha:
            Math.round((processed.reduce((s, f) => s + f.alpha, 0) / processed.length) * 100) / 100,
          avg_xirr:
            Math.round((processed.reduce((s, f) => s + f.fund_xirr, 0) / processed.length) * 100) /
            100,
          star_count: processed.filter((f) => f.signal === 'STAR').length,
          exit_count: processed.filter((f) => f.signal === 'EXIT').length,
        };
        void supabase.from('report_history').update(meta).eq('id', data.reportId);
      }

      setProgress(100);
      setProgressMsg('Done!');
      setStep(3);

      // Smooth scroll to results
      setTimeout(() => {
        document.getElementById('analyze')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 50);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong. Please try again.');
      setStep(1);
      setProgress(0);
      setProgressMsg('');
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setFile(null);
    setStep(1);
    setProgress(0);
    setProgressMsg('');
    setFunds([]);
    setInvestorName('');
    setError('');
    setRateLimited(false);
  }

  return (
    <div className="bg-white text-[var(--color-ink)]">
      <TopNav />
      <main>
        <Hero />
        <AnalyzeSection
          step={step}
          file={file}
          loading={loading}
          progress={progress}
          progressMsg={progressMsg}
          error={error}
          rateLimited={rateLimited}
          funds={funds}
          investorName={investorName}
          thresholds={thresholds}
          distributorName={distributorName}
          onFile={setFile}
          onClear={() => setFile(null)}
          onAnalyze={generate}
          onReset={reset}
        />
        <HowItWorks />
        <Features />
        <SampleInsights />
        <Trust />
        <FAQ />
        <CtaStrip />
      </main>
      <Footer />

      <LoginModal open={loginOpen} onOpenChange={setLoginOpen} />
      {session && (
        <PhoneOtpModal
          open={otpOpen}
          onOpenChange={(v) => {
            setOtpOpen(v);
            // Cancelling the OTP modal abandons the analyze intent.
            if (!v) window.sessionStorage.removeItem(ANALYZE_INTENT_KEY);
          }}
          userId={session.user.id}
          onVerified={async () => {
            await refreshProfile();
            setOtpOpen(false);
            window.sessionStorage.removeItem(ANALYZE_INTENT_KEY);
            toast.success("Phone verified — choose your PDF and click Analyze.");
            setTimeout(() => {
              document.getElementById('analyze')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 50);
          }}
        />
      )}
    </div>
  );
}
