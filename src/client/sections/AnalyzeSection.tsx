import { ArrowLeft, Check, FileBarChart2, Loader2, Sparkles } from 'lucide-react';
import type { FundRecord, AlphaThresholds } from '@/shared/types';
import { Container } from '@/shared/ui/Container';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { UploadZone } from '@/client/components/UploadZone';
import { ResultsView } from '@/client/components/ResultsView';
import { cn } from '@/shared/lib/utils';

type Step = 1 | 2 | 3;

interface AnalyzeSectionProps {
  step: Step;
  file: File | null;
  loading: boolean;
  progress: number;
  progressMsg: string;
  error: string;
  rateLimited: boolean;
  funds: FundRecord[];
  investorName: string;
  thresholds: AlphaThresholds;
  distributorName: string;
  onFile: (file: File) => void;
  onClear: () => void;
  onAnalyze: () => void;
  onReset: () => void;
}

const labels = ['Upload statement', 'AI analyses', 'Get verdict'];

export function AnalyzeSection(props: AnalyzeSectionProps) {
  const {
    step,
    file,
    loading,
    progress,
    progressMsg,
    error,
    rateLimited,
    funds,
    investorName,
    thresholds,
    distributorName,
    onFile,
    onClear,
    onAnalyze,
    onReset,
  } = props;

  const showResults = step === 3 && funds.length > 0;

  return (
    <section
      id="analyze"
      className="relative scroll-mt-20 py-20 sm:py-24 bg-[var(--color-surface-muted)]"
    >
      <Container size="xl">
        {/* Step indicator */}
        <div className="mx-auto mb-10 flex max-w-2xl items-center justify-between gap-2">
          {labels.map((label, i) => {
            const idx = (i + 1) as Step;
            const done = step > idx;
            const active = step === idx;
            return (
              <div key={label} className="flex flex-1 items-center">
                <div className="flex items-center gap-2.5">
                  <div
                    className={cn(
                      'grid size-8 place-items-center rounded-full text-[12px] font-semibold transition-all',
                      done && 'bg-[var(--color-brand-500)] text-white shadow-[0_4px_14px_-4px_rgba(99,91,255,0.55)]',
                      active && 'ring-2 ring-[var(--color-brand-500)]/30 bg-white text-[var(--color-brand-700)] ring-offset-2 ring-offset-[var(--color-surface-muted)]',
                      !done && !active && 'bg-white text-[var(--color-ink-faint)] ring-1 ring-inset ring-[var(--color-line)]'
                    )}
                  >
                    {done ? <Check className="size-4" /> : idx}
                  </div>
                  <span
                    className={cn(
                      'hidden text-[13px] font-medium sm:inline',
                      active || done ? 'text-[var(--color-ink)]' : 'text-[var(--color-ink-soft)]'
                    )}
                  >
                    {label}
                  </span>
                </div>
                {i < labels.length - 1 && (
                  <div
                    className={cn(
                      'mx-3 h-px flex-1 transition-colors',
                      step > idx ? 'bg-[var(--color-brand-500)]' : 'bg-[var(--color-line)]'
                    )}
                  />
                )}
              </div>
            );
          })}
        </div>

        {!showResults ? (
          <div className="mx-auto max-w-2xl">
            <Card className="brand-glow overflow-hidden bg-white/95 shadow-[var(--shadow-md)]">
              <div className="flex items-start justify-between gap-4 border-b border-[var(--color-line)] px-7 py-5">
                <div>
                  <div className="flex items-center gap-2">
                    <FileBarChart2 className="size-4 text-[var(--color-brand-600)]" />
                    <h3 className="text-[16px] font-semibold text-[var(--color-ink)]">
                      Upload your wealth statement
                    </h3>
                  </div>
                  <p className="mt-1 text-[13px] text-[var(--color-ink-muted)]">
                    Echowin PDF format · individual or family reports
                  </p>
                </div>
                <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-[var(--color-brand-50)] px-2.5 py-1 text-[11px] font-semibold text-[var(--color-brand-700)] ring-1 ring-inset ring-[var(--color-brand-100)]">
                  <Sparkles className="size-3" />
                  AI-assisted
                </span>
              </div>

              <div className="space-y-5 p-7">
                <UploadZone file={file} onFile={onFile} onClear={onClear} />

                {rateLimited && (
                  <Alert variant="warning">
                    <AlertDescription>
                      You've reached the limit of 3 free reports per day. Please try again tomorrow.
                    </AlertDescription>
                  </Alert>
                )}

                {error && (
                  <Alert variant="danger">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <Button
                  size="lg"
                  className="w-full"
                  disabled={!file || loading}
                  onClick={onAnalyze}
                >
                  {loading ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Analysing…
                    </>
                  ) : (
                    <>
                      <Sparkles className="size-4" />
                      Analyse my portfolio
                    </>
                  )}
                </Button>

                {loading && (
                  <div className="space-y-2.5">
                    <Progress value={progress} />
                    <div className="flex items-center gap-2 font-mono text-[12px] text-[var(--color-ink-soft)]">
                      <Loader2 className="size-3 animate-spin" />
                      <span>{progressMsg}</span>
                    </div>
                  </div>
                )}
              </div>
            </Card>

            <p className="mt-5 text-center text-[12px] text-[var(--color-ink-soft)]">
              Your PDF is parsed locally · only fund metadata is analyzed · nothing is stored
            </p>
          </div>
        ) : (
          <div className="mx-auto max-w-6xl">
            <ResultsView
              funds={funds}
              investorName={investorName}
              thresholds={thresholds}
              distributorName={distributorName}
            />
            <div className="mt-12 flex justify-center">
              <Button variant="outline" onClick={onReset}>
                <ArrowLeft className="size-4" />
                Analyse another portfolio
              </Button>
            </div>
          </div>
        )}
      </Container>
    </section>
  );
}
