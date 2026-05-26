import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Download, Loader2 } from 'lucide-react';
import { supabase } from '@/shared/supabaseClient';
import { processRawFunds } from '@/shared/alphaEngine';
import { generatePDF } from '@/shared/pdfReport';
import { DEFAULT_THRESHOLDS } from '@/shared/types';
import type { ReportHistory as ReportHistoryType } from '@/shared/types';
import { toast } from '@/components/ui/sonner';

type ProfileSummary = { name: string; email: string; phone: string | null };
type ReportHistoryRow = ReportHistoryType & { profiles?: ProfileSummary | null };
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatPercent } from '@/shared/lib/utils';

const PAGE_SIZE = 25;
const DISTRIBUTOR_NAME = 'Echowin Wealth Private Limited';

function reportDate(iso?: string) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' });
}

export function ReportHistory() {
  const [reports, setReports] = useState<ReportHistoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [query, setQuery] = useState('');
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  async function downloadPdf(row: ReportHistoryRow) {
    if (!row.id || !row.funds_json) return;
    setDownloadingId(row.id);
    try {
      // The PDF is rebuilt client-side from the raw funds stored at generation
      // time — no re-analysis or LLM call needed.
      const processed = await processRawFunds(row.funds_json, DEFAULT_THRESHOLDS);
      await generatePDF(
        processed,
        row.investor,
        reportDate(row.created_at),
        DISTRIBUTOR_NAME,
        DEFAULT_THRESHOLDS
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not generate the PDF.');
    } finally {
      setDownloadingId(null);
    }
  }

  useEffect(() => {
    async function load() {
      setLoading(true);

      const { data, error } = await supabase
        .from('report_history')
        .select('*')
        .order('created_at', { ascending: false })
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

      if (error) {
        console.error('Failed to load report history', error);
        setReports([]);
        setLoading(false);
        return;
      }

      const rows = (data as ReportHistoryRow[]) ?? [];

      // report_history.user_id references auth.users (not public.profiles), so
      // PostgREST can't embed profiles directly. Fetch the matching profiles in
      // a second query and merge. (Admin-generated rows have a null user_id and
      // simply have no profile to attach. Which profiles are visible is still
      // governed by RLS — see migration 004.)
      const userIds = [
        ...new Set(rows.map((r) => r.user_id).filter((id): id is string => Boolean(id))),
      ];
      if (userIds.length > 0) {
        const { data: profs, error: profErr } = await supabase
          .from('profiles')
          .select('id, name, email, phone')
          .in('id', userIds);
        if (profErr) {
          console.error('Failed to load profiles for report history', profErr);
        } else {
          const byId = new Map(
            (profs ?? []).map((p) => [(p as { id: string }).id, p as ProfileSummary & { id: string }])
          );
          for (const r of rows) {
            if (r.user_id) r.profiles = byId.get(r.user_id) ?? null;
          }
        }
      }

      setReports(rows);
      setLoading(false);
    }
    load();
  }, [page]);

  const filtered = query.trim()
    ? reports.filter((r) => {
        const q = query.trim().toLowerCase();
        return (
          r.investor.toLowerCase().includes(q) ||
          (r.profiles?.name ?? '').toLowerCase().includes(q) ||
          (r.profiles?.email ?? '').toLowerCase().includes(q) ||
          (r.profiles?.phone ?? '').toLowerCase().includes(q)
        );
      })
    : reports;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-[26px] font-bold tracking-tight text-[var(--color-ink)]">
          Report history
        </h1>
        <p className="mt-1 text-[14px] text-[var(--color-ink-muted)]">
          Every alpha report generated across the client portal and admin console.
        </p>
      </div>

      <Card className="overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-[var(--color-line)] px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <Input
            placeholder="Filter by investor, name, email, phone…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="max-w-xs"
          />
          <div className="flex items-center gap-3">
            <span className="font-mono text-[12px] text-[var(--color-ink-soft)]">
              Page {page + 1}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(Math.max(0, page - 1))}
              disabled={page === 0}
            >
              <ChevronLeft className="size-3.5" />
              Prev
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page + 1)}
              disabled={reports.length < PAGE_SIZE}
            >
              Next
              <ChevronRight className="size-3.5" />
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="space-y-2 p-6">
            {[0, 1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-12" />
            ))}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Investor</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead className="text-right">Funds</TableHead>
                <TableHead className="text-right">Avg XIRR</TableHead>
                <TableHead className="text-right">Avg α</TableHead>
                <TableHead className="text-right">Star</TableHead>
                <TableHead className="text-right">Exit</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Generated</TableHead>
                <TableHead className="text-right">PDF</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium text-[var(--color-ink)]">{r.investor}</TableCell>
                  <TableCell className="text-[var(--color-ink-2)]">{r.profiles?.name || '—'}</TableCell>
                  <TableCell className="text-[var(--color-ink-soft)]">{r.profiles?.email || '—'}</TableCell>
                  <TableCell className="font-mono text-[var(--color-ink-soft)]">{r.profiles?.phone || '—'}</TableCell>
                  <TableCell className="text-right font-mono">{r.fund_count}</TableCell>
                  <TableCell className="text-right font-mono">
                    {Number(r.avg_xirr).toFixed(2)}%
                  </TableCell>
                  <TableCell
                    className={
                      'text-right font-mono font-semibold ' +
                      (Number(r.avg_alpha) >= 0
                        ? 'text-[var(--color-success)]'
                        : 'text-[var(--color-danger)]')
                    }
                  >
                    {formatPercent(Number(r.avg_alpha), { sign: true })}
                  </TableCell>
                  <TableCell className="text-right font-mono text-[var(--color-gold)]">
                    {r.star_count}
                  </TableCell>
                  <TableCell
                    className={
                      'text-right font-mono ' +
                      (r.exit_count > 0
                        ? 'text-[var(--color-danger)]'
                        : 'text-[var(--color-ink-soft)]')
                    }
                  >
                    {r.exit_count}
                  </TableCell>
                  <TableCell>
                    <Badge variant={r.generated_by === 'admin' ? 'info' : 'success'}>
                      {r.generated_by}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-[var(--color-ink-soft)]">
                    {reportDate(r.created_at)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="gap-1.5"
                      disabled={!r.funds_json || downloadingId === r.id}
                      onClick={() => downloadPdf(r)}
                      title={r.funds_json ? 'Download PDF' : 'No stored data for this report'}
                    >
                      {downloadingId === r.id ? (
                        <Loader2 className="size-3.5 animate-spin" />
                      ) : (
                        <Download className="size-3.5" />
                      )}
                      PDF
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={12} className="py-10 text-center text-[var(--color-ink-soft)]">
                    {query ? `No matches for "${query}"` : 'No reports found.'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
