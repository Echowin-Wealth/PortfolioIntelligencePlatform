import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '@/shared/supabaseClient';
import type { ReportHistory as ReportHistoryType } from '@/shared/types';

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

export function ReportHistory() {
  const [reports, setReports] = useState<ReportHistoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [query, setQuery] = useState('');

  useEffect(() => {
    async function load() {
      setLoading(true);
      const { data } = await supabase
        .from('report_history')
        .select('*, profiles(name, email, phone)')
        .order('created_at', { ascending: false })
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
      setReports((data as ReportHistoryRow[]) ?? []);
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
                    {r.created_at
                      ? new Date(r.created_at).toLocaleString('en-IN', {
                          dateStyle: 'short',
                          timeStyle: 'short',
                        })
                      : '—'}
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={11} className="py-10 text-center text-[var(--color-ink-soft)]">
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
