import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { ArrowLeft, Download, FileText, Loader2 } from 'lucide-react';
import { supabase } from '@/shared/supabaseClient';
import { useAuth } from '@/shared/hooks/useAuth';
import { processRawFunds } from '@/shared/alphaEngine';
import { generatePDF } from '@/shared/pdfReport';
import { DEFAULT_THRESHOLDS } from '@/shared/types';
import type { ReportHistory } from '@/shared/types';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

const DISTRIBUTOR_NAME = 'Echowin Wealth Private Limited';

function formatDate(iso?: string) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function MyReports() {
  const { session, loading: authLoading } = useAuth();
  const [rows, setRows] = useState<ReportHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!session) {
      setLoading(false);
      return;
    }
    (async () => {
      const { data, error: fetchErr } = await supabase
        .from('report_history')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });
      if (fetchErr) setError(fetchErr.message);
      else setRows((data as ReportHistory[]) ?? []);
      setLoading(false);
    })();
  }, [authLoading, session]);

  if (!authLoading && !session) {
    return <Navigate to="/" replace />;
  }

  async function downloadPdf(row: ReportHistory) {
    if (!row.id || !row.funds_json) return;
    setDownloadingId(row.id);
    setError('');
    try {
      const processed = await processRawFunds(row.funds_json, DEFAULT_THRESHOLDS);
      await generatePDF(
        processed,
        row.investor,
        formatDate(row.created_at),
        DISTRIBUTOR_NAME,
        DEFAULT_THRESHOLDS
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not generate PDF.');
    } finally {
      setDownloadingId(null);
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]"
        >
          <ArrowLeft className="size-3.5" /> Back to home
        </Link>

        <h1 className="mt-4 font-display text-[28px] font-bold tracking-tight text-[var(--color-ink)]">
          My reports
        </h1>
        <p className="mt-1 text-[14px] text-[var(--color-ink-muted)]">
          Every report you've generated. Re-download the PDF anytime — no new
          analysis required.
        </p>

        {error && (
          <Alert variant="danger" className="mt-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {loading ? (
          <div className="mt-10 flex items-center gap-2 text-[13px] text-[var(--color-ink-soft)]">
            <Loader2 className="size-4 animate-spin" /> Loading your reports…
          </div>
        ) : rows.length === 0 ? (
          <div className="mt-10 rounded-lg border border-dashed border-[var(--color-line)] p-10 text-center">
            <FileText className="mx-auto size-6 text-[var(--color-ink-faint)]" />
            <p className="mt-3 text-[14px] text-[var(--color-ink-muted)]">
              No reports yet. Upload a PDF on the home page to generate your
              first one.
            </p>
          </div>
        ) : (
          <ul className="mt-6 divide-y divide-[var(--color-line)] rounded-lg border border-[var(--color-line)]">
            {rows.map((row) => (
              <li key={row.id} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="truncate text-[15px] font-semibold text-[var(--color-ink)]">
                    {row.investor}
                  </div>
                  <div className="mt-0.5 text-[12.5px] text-[var(--color-ink-soft)]">
                    {row.fund_count} fund{row.fund_count === 1 ? '' : 's'} ·{' '}
                    {formatDate(row.created_at)}
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="shrink-0 gap-2"
                  disabled={!row.funds_json || downloadingId === row.id}
                  onClick={() => downloadPdf(row)}
                >
                  {downloadingId === row.id ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Download className="size-4" />
                  )}
                  {downloadingId === row.id ? 'Generating…' : 'Download PDF'}
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
