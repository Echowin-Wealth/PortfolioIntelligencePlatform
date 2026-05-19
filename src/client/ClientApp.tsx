import { useState } from 'react';
import { extractText } from '@/shared/pdfExtract';
import { processRawFunds } from '@/shared/alphaEngine';
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

const EDGE_FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyse`;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

type Step = 1 | 2 | 3;

export function ClientApp() {
  const [file, setFile] = useState<File | null>(null);
  const [step, setStep] = useState<Step>(1);
  const [progress, setProgress] = useState(0);
  const [progressMsg, setProgressMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [funds, setFunds] = useState<FundRecord[]>([]);
  const [investorName, setInvestorName] = useState('');
  const [error, setError] = useState('');
  const [rateLimited, setRateLimited] = useState(false);

  const thresholds: AlphaThresholds = DEFAULT_THRESHOLDS;
  const distributorName = 'Echowin Wealth Private Limited';

  async function generate() {
    if (!file) return;
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
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'apikey': SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({ text }),
      });

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

      const data = (await res.json()) as { funds: RawFundRecord[] };
      setProgress(75);
      setProgressMsg('Applying alpha rules…');

      const processed = await processRawFunds(data.funds, thresholds);
      setFunds(processed);
      setInvestorName(data.funds[0]?.investor_name ?? 'Client');

      const meta = {
        investor: data.funds[0]?.investor_name ?? 'Client',
        fund_count: processed.length,
        avg_alpha:
          Math.round((processed.reduce((s, f) => s + f.alpha, 0) / processed.length) * 100) / 100,
        avg_xirr:
          Math.round((processed.reduce((s, f) => s + f.fund_xirr, 0) / processed.length) * 100) /
          100,
        star_count: processed.filter((f) => f.signal === 'STAR').length,
        exit_count: processed.filter((f) => f.signal === 'EXIT').length,
      };

      fetch(EDGE_FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'apikey': SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({ text: '_meta_only_', reportMeta: meta }),
      }).catch(() => {});

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
    </div>
  );
}
