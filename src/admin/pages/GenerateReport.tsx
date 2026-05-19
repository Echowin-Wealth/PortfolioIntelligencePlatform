import { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  Download,
  FileText,
  Loader2,
  RotateCcw,
  Sparkles,
  UploadCloud,
  X,
} from 'lucide-react';
import { extractText } from '@/shared/pdfExtract';
import { processRawFunds } from '@/shared/alphaEngine';
import { generatePDF } from '@/shared/pdfReport';
import type { FundRecord, RawFundRecord, AlphaThresholds, SignalType } from '@/shared/types';
import { DEFAULT_THRESHOLDS } from '@/shared/types';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { StatCard } from '@/shared/ui/StatCard';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn, formatPercent } from '@/shared/lib/utils';

const EDGE_FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyse`;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

const signalToVariant = {
  STAR: 'warning',
  GOOD: 'info',
  REVIEW: 'neutral',
  EXIT: 'danger',
} as const satisfies Record<SignalType, string>;

const signalLabel: Record<SignalType, string> = {
  STAR: 'Star',
  GOOD: 'Good',
  REVIEW: 'Review',
  EXIT: 'Exit',
};

export function GenerateReport() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMsg, setProgressMsg] = useState('');
  const [funds, setFunds] = useState<FundRecord[]>([]);
  const [investorName, setInvestorName] = useState('');
  const [error, setError] = useState('');
  const [thresholds, setThresholds] = useState<AlphaThresholds>({ ...DEFAULT_THRESHOLDS });
  const [distName, setDistName] = useState('Echowin Wealth Private Limited');
  const [invNameOverride, setInvNameOverride] = useState('');

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (files) => {
      if (files[0]) setFile(files[0]);
    },
    accept: { 'application/pdf': ['.pdf'] },
    multiple: false,
  });

  async function run() {
    if (!file) return;
    setLoading(true);
    setError('');
    setProgress(8);
    setProgressMsg('Reading PDF…');

    try {
      const text = await extractText(file);
      setProgress(28);
      setProgressMsg('Claude is reading the PDF…');

      const res = await fetch(EDGE_FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'apikey': SUPABASE_ANON_KEY,
          'x-admin-token': 'true',
        },
        body: JSON.stringify({ text }),
      });

      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as Record<string, unknown>;
        throw new Error((body.error as string) ?? `Error ${res.status}`);
      }

      const data = (await res.json()) as { funds: RawFundRecord[] };
      setProgress(72);
      setProgressMsg('Applying alpha rules…');

      const processed = await processRawFunds(data.funds, thresholds);
      const name = invNameOverride.trim() || data.funds[0]?.investor_name || 'Client';
      setFunds(processed);
      setInvestorName(name);

      const meta = {
        investor: name,
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
          'x-admin-token': 'true',
        },
        body: JSON.stringify({ text: '_meta_only_', reportMeta: meta }),
      }).catch(() => {});

      setProgress(100);
      setProgressMsg('Done!');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setFile(null);
    setFunds([]);
    setInvestorName('');
    setError('');
    setProgress(0);
    setProgressMsg('');
  }

  const tiers: Record<string, FundRecord[]> = { STAR: [], GOOD: [], REVIEW: [], EXIT: [] };
  funds.forEach((f) => tiers[f.signal].push(f));
  const avgA = funds.length > 0 ? funds.reduce((s, f) => s + f.alpha, 0) / funds.length : 0;
  const avgX = funds.length > 0 ? funds.reduce((s, f) => s + f.fund_xirr, 0) / funds.length : 0;
  const today = new Date().toLocaleDateString('en-IN');

  return (
    <div className="space-y-8">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-[26px] font-bold tracking-tight text-[var(--color-ink)]">
            Generate report
          </h1>
          <p className="mt-1 text-[14px] text-[var(--color-ink-muted)]">
            Upload a PDF, tune thresholds, and export a branded alpha report.
          </p>
        </div>
        {funds.length > 0 && (
          <div className="flex gap-2">
            <Button
              onClick={async () => {
                try {
                  await generatePDF(funds, investorName, today, distName, thresholds);
                } catch (err) {
                  console.error('PDF generation failed', err);
                  setError(err instanceof Error ? err.message : 'PDF generation failed');
                }
              }}
            >
              <Download className="size-4" /> Download PDF
            </Button>
            <Button variant="outline" onClick={reset}>
              <RotateCcw className="size-4" /> Start over
            </Button>
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
        <div className="space-y-5">
          <Card className="overflow-hidden">
            <div className="border-b border-[var(--color-line)] px-5 py-3.5 text-[13px] font-semibold text-[var(--color-ink)]">
              Upload PDF
            </div>
            <div className="p-5">
              {!file ? (
                <div
                  {...getRootProps()}
                  className={cn(
                    'cursor-pointer rounded-xl border-2 border-dashed px-4 py-8 text-center transition-colors',
                    isDragActive
                      ? 'border-[var(--color-brand-500)] bg-[var(--color-brand-50)]'
                      : 'border-[var(--color-line)] hover:border-[var(--color-brand-400)] hover:bg-[var(--color-brand-50)]/40'
                  )}
                >
                  <input {...getInputProps()} />
                  <UploadCloud className="mx-auto size-7 text-[var(--color-ink-soft)]" />
                  <div className="mt-2.5 text-[13.5px] font-medium text-[var(--color-ink)]">
                    Drop Echowin Wealth PDF
                  </div>
                  <div className="mt-1 text-[12px] text-[var(--color-ink-soft)]">
                    or click to browse
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 rounded-xl border border-[var(--color-line)] bg-[var(--color-surface-muted)] p-3">
                  <div className="grid size-9 place-items-center rounded-lg bg-white text-[var(--color-brand-600)] ring-1 ring-inset ring-[var(--color-brand-100)]">
                    <FileText className="size-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13px] font-medium text-[var(--color-ink)]">
                      {file.name}
                    </div>
                    <div className="font-mono text-[11px] text-[var(--color-ink-soft)]">
                      {(file.size / 1024 / 1024).toFixed(1)} MB
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFile(null)}
                    className="grid size-7 place-items-center rounded-md text-[var(--color-ink-soft)] hover:bg-white hover:text-[var(--color-danger)]"
                  >
                    <X className="size-4" />
                  </button>
                </div>
              )}
            </div>
          </Card>

          <Card className="overflow-hidden">
            <div className="border-b border-[var(--color-line)] px-5 py-3.5 text-[13px] font-semibold text-[var(--color-ink)]">
              Settings
            </div>
            <div className="space-y-5 p-5">
              <div className="space-y-1.5">
                <Label htmlFor="inv">Investor name override</Label>
                <Input
                  id="inv"
                  value={invNameOverride}
                  onChange={(e) => setInvNameOverride(e.target.value)}
                  placeholder="Auto-detected from PDF"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="dist">Distributor name</Label>
                <Input
                  id="dist"
                  value={distName}
                  onChange={(e) => setDistName(e.target.value)}
                />
              </div>

              <div className="border-t border-[var(--color-line)] pt-4">
                <Label className="mb-3 inline-block">Thresholds</Label>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="th-star" className="text-[10.5px]">
                      Star ≥
                    </Label>
                    <Input
                      id="th-star"
                      type="number"
                      step="0.5"
                      value={thresholds.star}
                      onChange={(e) =>
                        setThresholds((t) => ({ ...t, star: Number(e.target.value) }))
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="th-exit" className="text-[10.5px]">
                      Exit &lt;
                    </Label>
                    <Input
                      id="th-exit"
                      type="number"
                      step="0.5"
                      value={thresholds.exit}
                      onChange={(e) =>
                        setThresholds((t) => ({ ...t, exit: Number(e.target.value) }))
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="th-age" className="text-[10.5px]">
                      New &lt; yrs
                    </Label>
                    <Input
                      id="th-age"
                      type="number"
                      step="0.5"
                      value={thresholds.age}
                      onChange={(e) =>
                        setThresholds((t) => ({ ...t, age: Number(e.target.value) }))
                      }
                    />
                  </div>
                </div>
              </div>

              {error && (
                <Alert variant="danger">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button className="w-full" disabled={!file || loading} onClick={run} size="lg">
                {loading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Processing…
                  </>
                ) : (
                  <>
                    <Sparkles className="size-4" />
                    Generate report
                  </>
                )}
              </Button>

              {loading && (
                <div className="space-y-2">
                  <Progress value={progress} />
                  <div className="flex items-center gap-2 font-mono text-[11.5px] text-[var(--color-ink-soft)]">
                    <Loader2 className="size-3 animate-spin" />
                    <span>{progressMsg}</span>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>

        {funds.length > 0 ? (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <StatCard label="Star" tone="warning" value={tiers.STAR.length} />
              <StatCard label="Good" tone="info" value={tiers.GOOD.length} />
              <StatCard label="Review" tone="neutral" value={tiers.REVIEW.length} />
              <StatCard label="Exit" tone="danger" value={tiers.EXIT.length} />
            </div>

            <div className="font-mono text-[12px] text-[var(--color-ink-soft)]">
              {investorName} · {funds.length} funds · XIRR {avgX.toFixed(2)}% · avg α{' '}
              <span
                className={
                  avgA >= 0 ? 'text-[var(--color-success)]' : 'text-[var(--color-danger)]'
                }
              >
                {formatPercent(avgA, { sign: true })}
              </span>
            </div>

            <Card className="overflow-hidden">
              <div className="border-b border-[var(--color-line)] px-6 py-3.5 text-[13px] font-semibold text-[var(--color-ink)]">
                Fund analysis
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fund</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Age</TableHead>
                    <TableHead className="text-right">Bench %</TableHead>
                    <TableHead className="text-right">Fund %</TableHead>
                    <TableHead className="text-right">Alpha</TableHead>
                    <TableHead>Signal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[...funds]
                    .sort((a, b) => b.alpha - a.alpha)
                    .map((f, i) => {
                      const young = f.days < 730;
                      const positive = f.alpha >= 0;
                      return (
                        <TableRow key={i}>
                          <TableCell className="font-medium text-[var(--color-ink)]">
                            {f.name}
                          </TableCell>
                          <TableCell className="text-[12px] text-[var(--color-ink-soft)]">
                            {f.category}
                          </TableCell>
                          <TableCell
                            className={cn(
                              'font-mono text-[12px]',
                              young ? 'text-[var(--color-warning)]' : 'text-[var(--color-ink-soft)]'
                            )}
                          >
                            {(f.days / 365).toFixed(1)}yr
                          </TableCell>
                          <TableCell className="text-right font-mono text-[var(--color-ink-soft)]">
                            {f.bx.toFixed(2)}%
                          </TableCell>
                          <TableCell className="text-right font-mono text-[var(--color-ink)]">
                            {f.fund_xirr.toFixed(2)}%
                          </TableCell>
                          <TableCell
                            className={cn(
                              'text-right font-mono font-semibold',
                              positive
                                ? 'text-[var(--color-success)]'
                                : 'text-[var(--color-danger)]'
                            )}
                          >
                            {formatPercent(f.alpha, { sign: true })}
                          </TableCell>
                          <TableCell>
                            <Badge variant={signalToVariant[f.signal]}>
                              {signalLabel[f.signal]}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                </TableBody>
              </Table>
            </Card>
          </div>
        ) : (
          <Card className="grid place-items-center p-16 text-center">
            <div>
              <div
                className="mx-auto grid size-14 place-items-center rounded-2xl text-white shadow-[0_10px_30px_-10px_rgba(99,91,255,0.55)]"
                style={{
                  background: 'linear-gradient(135deg, #635bff 0%, #7a5af8 60%, #00d4ff 100%)',
                }}
              >
                <Sparkles className="size-6" />
              </div>
              <div className="mt-4 text-[15px] font-semibold text-[var(--color-ink)]">
                Ready when you are
              </div>
              <div className="mt-1 text-[13px] text-[var(--color-ink-soft)]">
                Upload a PDF on the left and click <strong>Generate report</strong> to see results.
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
