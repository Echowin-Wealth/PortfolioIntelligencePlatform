import { useCallback, useEffect, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import * as XLSX from 'xlsx';
import { Plus, Trash2, UploadCloud, AlertTriangle } from 'lucide-react';
import { supabase } from '@/shared/supabaseClient';
import { invalidateBenchmarkCache, parseFlexibleDate } from '@/shared/alphaEngine';
import type { BenchmarkIndex, BenchmarkPrice } from '@/shared/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from '@/components/ui/sonner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/shared/lib/utils';

type TabCode = BenchmarkIndex | 'DEBT';
const TABS: TabCode[] = ['N50', 'NLM', 'N500', 'DEBT'];
const TAB_LABELS: Record<TabCode, string> = {
  N50: 'Nifty 50 TRI',
  NLM: 'Nifty LargeMidcap 250 TRI',
  N500: 'Nifty 500 TRI',
  DEBT: 'CRISIL Debt (fixed 5.8%)',
};

const CHUNK = 500;

/** Convert a parsed date/value pair into a benchmark_prices row, or null to skip (e.g. header). */
function toRow(active: BenchmarkIndex, dateCell: unknown, valCell: unknown): BenchmarkPrice | null {
  const t =
    dateCell instanceof Date
      ? Date.UTC(dateCell.getUTCFullYear(), dateCell.getUTCMonth(), dateCell.getUTCDate())
      : parseFlexibleDate(String(dateCell ?? ''));
  if (t === null) return null;

  const v =
    typeof valCell === 'number' ? valCell : parseFloat(String(valCell ?? '').replace(/,/g, ''));
  if (!isFinite(v)) return null;

  return {
    index_code: active,
    date: new Date(t).toISOString().slice(0, 10),
    tri_close: v,
  };
}

function SeriesImport({
  active,
  onImport,
}: {
  active: BenchmarkIndex;
  onImport: (rows: BenchmarkPrice[]) => void;
}) {
  const [preview, setPreview] = useState<BenchmarkPrice[]>([]);
  const [error, setError] = useState('');

  const parseRows = useCallback(
    (cells: [unknown, unknown][]): BenchmarkPrice[] => {
      const rows: BenchmarkPrice[] = [];
      for (const [d, v] of cells) {
        const row = toRow(active, d, v);
        if (row) rows.push(row);
      }
      return rows;
    },
    [active]
  );

  const onDrop = useCallback(
    async (files: File[]) => {
      const file = files[0];
      if (!file) return;
      setError('');
      try {
        const isExcel = /\.xlsx?$/i.test(file.name);
        let cells: [unknown, unknown][];
        if (isExcel) {
          const buf = await file.arrayBuffer();
          const wb = XLSX.read(buf, { type: 'array', cellDates: true });
          const ws = wb.Sheets[wb.SheetNames[0]];
          const grid = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, raw: true, defval: '' });
          cells = grid.map((r) => [r[0], r[1]]);
        } else {
          const text = await file.text();
          cells = text
            .split(/\r?\n/)
            .filter((l) => l.trim())
            .map((line) => {
              const parts = line.split(',');
              return [parts[0]?.trim(), parts[1]?.trim()] as [unknown, unknown];
            });
        }
        const rows = parseRows(cells);
        if (rows.length === 0) {
          throw new Error('No valid rows found (expected columns: Date, TRI Close)');
        }
        setPreview(rows);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Parse error');
        setPreview([]);
      }
    },
    [parseRows]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'text/plain': ['.txt'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
    },
    multiple: false,
  });

  const first = preview[0];
  const last = preview[preview.length - 1];

  return (
    <div className="space-y-3">
      <div
        {...getRootProps()}
        className={cn(
          'cursor-pointer rounded-xl border-2 border-dashed px-4 py-6 text-center transition-colors',
          isDragActive
            ? 'border-[var(--color-brand-500)] bg-[var(--color-brand-50)]'
            : 'border-[var(--color-line)] hover:border-[var(--color-brand-400)] hover:bg-[var(--color-brand-50)]/40'
        )}
      >
        <input {...getInputProps()} />
        <UploadCloud className="mx-auto size-6 text-[var(--color-ink-soft)]" />
        <div className="mt-2 text-[13px] font-medium text-[var(--color-ink)]">
          Drop an .xlsx or .csv file or click to browse
        </div>
        <div className="mt-1 font-mono text-[11px] text-[var(--color-ink-soft)]">
          Columns: <span className="text-[var(--color-brand-700)]">Date, TRI Close</span> · a
          header row is auto-skipped
        </div>
      </div>

      {error && (
        <Alert variant="danger">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {preview.length > 0 && first && last && (
        <div className="space-y-2 rounded-xl border border-[var(--color-line)] bg-[var(--color-surface-muted)] p-3">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-semibold text-[var(--color-success)]">
              ✓ {preview.length} rows · {first.date} → {last.date}
            </span>
            <Button
              size="sm"
              onClick={() => {
                onImport(preview);
                setPreview([]);
              }}
            >
              Import {preview.length} into {active}
            </Button>
          </div>
          <div className="max-h-32 overflow-auto rounded-lg bg-white p-3 font-mono text-[11.5px] text-[var(--color-ink-2)]">
            {preview.slice(0, 8).map((r, i) => (
              <div key={i}>
                {r.date} → {r.tri_close}
              </div>
            ))}
            {preview.length > 8 && (
              <div className="text-[var(--color-ink-faint)]">…and {preview.length - 8} more</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

interface SeriesSummary {
  count: number;
  first: string | null;
  last: string | null;
  latestValue: number | null;
}

export function BenchmarkManager() {
  const [activeTab, setActiveTab] = useState<TabCode>('N50');
  const [recent, setRecent] = useState<BenchmarkPrice[]>([]);
  const [summary, setSummary] = useState<SeriesSummary>({
    count: 0,
    first: null,
    last: null,
    latestValue: null,
  });
  const [loading, setLoading] = useState(true);
  const [newDate, setNewDate] = useState('');
  const [newVal, setNewVal] = useState('');

  const loadData = useCallback(async (code: TabCode) => {
    if (code === 'DEBT') {
      setLoading(false);
      return;
    }
    setLoading(true);
    const [recentRes, countRes, earliestRes] = await Promise.all([
      supabase
        .from('benchmark_prices')
        .select('*')
        .eq('index_code', code)
        .order('date', { ascending: false })
        .limit(50),
      supabase
        .from('benchmark_prices')
        .select('id', { count: 'exact', head: true })
        .eq('index_code', code),
      supabase
        .from('benchmark_prices')
        .select('date')
        .eq('index_code', code)
        .order('date', { ascending: true })
        .limit(1),
    ]);
    const rows = (recentRes.data as BenchmarkPrice[]) ?? [];
    setRecent(rows);
    setSummary({
      count: countRes.count ?? rows.length,
      first: (earliestRes.data?.[0] as { date: string } | undefined)?.date ?? null,
      last: rows[0]?.date ?? null,
      latestValue: rows[0]?.tri_close ?? null,
    });
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData(activeTab);
  }, [activeTab, loadData]);

  async function handleImport(rows: BenchmarkPrice[]) {
    if (activeTab === 'DEBT') return;
    let imported = 0;
    for (let i = 0; i < rows.length; i += CHUNK) {
      const chunk = rows.slice(i, i + CHUNK);
      const { error } = await supabase
        .from('benchmark_prices')
        .upsert(chunk, { onConflict: 'index_code,date' });
      if (error) {
        toast.error(`Import failed after ${imported} rows`);
        break;
      }
      imported += chunk.length;
    }
    if (imported > 0) {
      toast.success(`Imported ${imported} rows`);
      invalidateBenchmarkCache();
      loadData(activeTab);
    }
  }

  async function addRow() {
    if (activeTab === 'DEBT') return;
    const t = parseFlexibleDate(newDate);
    const val = parseFloat(newVal);
    if (t === null || isNaN(val)) {
      toast.error('Invalid date or value');
      return;
    }
    const { error } = await supabase
      .from('benchmark_prices')
      .upsert(
        {
          index_code: activeTab,
          date: new Date(t).toISOString().slice(0, 10),
          tri_close: val,
        },
        { onConflict: 'index_code,date' }
      );
    if (error) toast.error('Failed to add');
    else {
      toast.success('Added');
      setNewDate('');
      setNewVal('');
      invalidateBenchmarkCache();
      loadData(activeTab);
    }
  }

  async function deleteRow(row: BenchmarkPrice) {
    const { error } = await supabase.from('benchmark_prices').delete().eq('id', row.id ?? '');
    if (error) toast.error('Delete failed');
    else {
      toast.success('Deleted');
      invalidateBenchmarkCache();
      loadData(activeTab);
    }
  }

  async function clearAll() {
    if (activeTab === 'DEBT') return;
    if (!confirm(`Delete all TRI rows for ${activeTab}? This cannot be undone.`)) return;
    const { error } = await supabase.from('benchmark_prices').delete().eq('index_code', activeTab);
    if (error) toast.error('Clear failed');
    else {
      toast.success(`Cleared ${activeTab}`);
      invalidateBenchmarkCache();
      loadData(activeTab);
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-[26px] font-bold tracking-tight text-[var(--color-ink)]">
          Benchmark manager
        </h1>
        <p className="mt-1 text-[14px] text-[var(--color-ink-muted)]">
          TRI price series used by the alpha engine. Benchmark XIRR is computed from each fund's
          start date to the latest date in the series.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabCode)}>
        <TabsList>
          {TABS.map((t) => (
            <TabsTrigger key={t} value={t}>
              {t}
            </TabsTrigger>
          ))}
        </TabsList>

        {TABS.map((t) => (
          <TabsContent key={t} value={t} className="space-y-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-[14px] font-semibold text-[var(--color-ink)]">
                  {TAB_LABELS[t]}
                </div>
                {t === 'DEBT' && (
                  <div className="mt-1 inline-flex items-center gap-1.5 text-[12px] text-[var(--color-warning)]">
                    <AlertTriangle className="size-3" />
                    Fixed 5.8% — no TRI series
                  </div>
                )}
              </div>
              <Badge variant="brand">{t}</Badge>
            </div>

            {t !== 'DEBT' && (
              <>
                <Card className="overflow-hidden">
                  <div className="flex flex-col gap-3 border-b border-[var(--color-line)] px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="text-[14px] font-semibold text-[var(--color-ink)]">
                      TRI series
                      <span className="ml-2 font-mono text-[12px] text-[var(--color-ink-soft)]">
                        {summary.count} rows
                        {summary.first && summary.last
                          ? ` · ${summary.first} → ${summary.last}`
                          : ''}
                        {summary.latestValue != null
                          ? ` · latest ${summary.latestValue}`
                          : ''}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Input
                        type="date"
                        placeholder="Date"
                        value={newDate}
                        onChange={(e) => setNewDate(e.target.value)}
                        className="h-9 w-40"
                      />
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="TRI Close"
                        value={newVal}
                        onChange={(e) => setNewVal(e.target.value)}
                        className="h-9 w-28"
                      />
                      <Button size="sm" onClick={addRow}>
                        <Plus className="size-3.5" /> Add
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-[var(--color-danger)] hover:bg-[var(--color-danger-soft)]"
                        onClick={clearAll}
                        disabled={summary.count === 0}
                      >
                        <Trash2 className="size-3.5" /> Clear all
                      </Button>
                    </div>
                  </div>

                  {loading ? (
                    <div className="space-y-2 p-6">
                      {[0, 1, 2].map((i) => (
                        <Skeleton key={i} className="h-10" />
                      ))}
                    </div>
                  ) : (
                    <>
                      <div className="px-6 pt-3 text-[12px] text-[var(--color-ink-soft)]">
                        Showing the {Math.min(recent.length, 50)} most recent rows.
                      </div>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead className="text-right">TRI Close</TableHead>
                            <TableHead style={{ width: 80 }}>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {recent.map((r) => (
                            <TableRow key={r.id ?? r.date}>
                              <TableCell className="font-mono text-[var(--color-brand-700)]">
                                {r.date}
                              </TableCell>
                              <TableCell className="text-right font-mono">{r.tri_close}</TableCell>
                              <TableCell>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="text-[var(--color-danger)] hover:bg-[var(--color-danger-soft)]"
                                  onClick={() => deleteRow(r)}
                                >
                                  <Trash2 className="size-3" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                          {recent.length === 0 && (
                            <TableRow>
                              <TableCell
                                colSpan={3}
                                className="py-10 text-center text-[var(--color-ink-soft)]"
                              >
                                No data yet. Import an .xlsx/.csv or add rows above.
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </>
                  )}
                </Card>

                <Card className="overflow-hidden">
                  <div className="border-b border-[var(--color-line)] px-6 py-4 text-[14px] font-semibold text-[var(--color-ink)]">
                    Import TRI series
                  </div>
                  <div className="p-6">
                    <SeriesImport active={activeTab as BenchmarkIndex} onImport={handleImport} />
                  </div>
                </Card>
              </>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
