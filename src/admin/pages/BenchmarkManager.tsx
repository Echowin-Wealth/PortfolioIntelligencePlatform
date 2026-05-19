import { useCallback, useEffect, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Plus, Save, Trash2, UploadCloud, AlertTriangle } from 'lucide-react';
import { supabase } from '@/shared/supabaseClient';
import { invalidateBenchmarkCache } from '@/shared/alphaEngine';
import type { BenchmarkEntry } from '@/shared/types';
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

type IndexCode = 'N50' | 'NLM' | 'N500' | 'DEBT';
const TABS: IndexCode[] = ['N50', 'NLM', 'N500', 'DEBT'];
const TAB_LABELS: Record<IndexCode, string> = {
  N50: 'Nifty 50 TRI',
  NLM: 'Nifty LargeMidcap 250 TRI',
  N500: 'Nifty 500 TRI',
  DEBT: 'CRISIL Debt (fixed 5.8%)',
};

function CSVImport({
  active,
  onImport,
}: {
  active: IndexCode;
  onImport: (rows: BenchmarkEntry[]) => void;
}) {
  const [preview, setPreview] = useState<BenchmarkEntry[]>([]);
  const [error, setError] = useState('');

  const onDrop = useCallback(
    (files: File[]) => {
      const file = files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string;
          const lines = text.split('\n').filter((l) => l.trim());
          const rows: BenchmarkEntry[] = [];
          for (const line of lines) {
            const [daysStr, xirrStr] = line.split(',').map((s) => s.trim());
            const days = parseInt(daysStr, 10);
            const xirr = parseFloat(xirrStr);
            if (!isNaN(days) && !isNaN(xirr)) {
              rows.push({ index_code: active, days, xirr });
            }
          }
          if (rows.length === 0) throw new Error('No valid rows found (expected: days,xirr)');
          setPreview(rows);
          setError('');
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Parse error');
          setPreview([]);
        }
      };
      reader.readAsText(file);
    },
    [active]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'text/csv': ['.csv'], 'text/plain': ['.txt'] },
    multiple: false,
  });

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
          Drop a CSV file or click to browse
        </div>
        <div className="mt-1 font-mono text-[11px] text-[var(--color-ink-soft)]">
          Format: <span className="text-[var(--color-brand-700)]">days,xirr</span> · one per line ·
          no header
        </div>
      </div>

      {error && (
        <Alert variant="danger">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {preview.length > 0 && (
        <div className="space-y-2 rounded-xl border border-[var(--color-line)] bg-[var(--color-surface-muted)] p-3">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-semibold text-[var(--color-success)]">
              ✓ {preview.length} rows parsed
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
                {r.days} days → {r.xirr}%
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

export function BenchmarkManager() {
  const [activeTab, setActiveTab] = useState<IndexCode>('N50');
  const [rows, setRows] = useState<BenchmarkEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [editValues, setEditValues] = useState<Record<string, string>>({});
  const [newDays, setNewDays] = useState('');
  const [newXirr, setNewXirr] = useState('');

  async function loadRows(code: IndexCode) {
    setLoading(true);
    const { data } = await supabase
      .from('benchmark_data')
      .select('*')
      .eq('index_code', code)
      .order('days', { ascending: false });
    setRows((data as BenchmarkEntry[]) ?? []);
    setEditValues({});
    setLoading(false);
  }

  useEffect(() => {
    loadRows(activeTab);
  }, [activeTab]);

  async function saveRow(row: BenchmarkEntry) {
    const val = editValues[String(row.days)];
    if (val === undefined) return;
    const xirr = parseFloat(val);
    if (isNaN(xirr)) {
      toast.error('Invalid value');
      return;
    }
    const { error } = await supabase
      .from('benchmark_data')
      .update({ xirr, updated_at: new Date().toISOString() })
      .eq('id', row.id ?? '');
    if (error) toast.error('Save failed');
    else {
      toast.success('Saved');
      invalidateBenchmarkCache();
      loadRows(activeTab);
    }
  }

  async function deleteRow(row: BenchmarkEntry) {
    const { error } = await supabase.from('benchmark_data').delete().eq('id', row.id ?? '');
    if (error) toast.error('Delete failed');
    else {
      toast.success('Deleted');
      invalidateBenchmarkCache();
      loadRows(activeTab);
    }
  }

  async function addRow() {
    const days = parseInt(newDays, 10);
    const xirr = parseFloat(newXirr);
    if (isNaN(days) || isNaN(xirr)) {
      toast.error('Invalid days or xirr');
      return;
    }
    const { error } = await supabase
      .from('benchmark_data')
      .upsert({ index_code: activeTab, days, xirr }, { onConflict: 'index_code,days' });
    if (error) toast.error('Failed to add');
    else {
      toast.success('Added');
      setNewDays('');
      setNewXirr('');
      invalidateBenchmarkCache();
      loadRows(activeTab);
    }
  }

  async function handleCSVImport(importRows: BenchmarkEntry[]) {
    const { error } = await supabase
      .from('benchmark_data')
      .upsert(importRows, { onConflict: 'index_code,days' });
    if (error) toast.error('Import failed');
    else {
      toast.success(`Imported ${importRows.length} rows`);
      invalidateBenchmarkCache();
      loadRows(activeTab);
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-[26px] font-bold tracking-tight text-[var(--color-ink)]">
          Benchmark manager
        </h1>
        <p className="mt-1 text-[14px] text-[var(--color-ink-muted)]">
          XIRR tables used by the alpha engine for benchmark comparisons.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as IndexCode)}>
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
                    Fixed 5.8% — no table editable
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
                      XIRR table
                      <span className="ml-2 font-mono text-[12px] text-[var(--color-ink-soft)]">
                        {rows.length} entries
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        placeholder="Days"
                        value={newDays}
                        onChange={(e) => setNewDays(e.target.value)}
                        className="h-9 w-24"
                      />
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="XIRR %"
                        value={newXirr}
                        onChange={(e) => setNewXirr(e.target.value)}
                        className="h-9 w-24"
                      />
                      <Button size="sm" onClick={addRow}>
                        <Plus className="size-3.5" /> Add
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
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Days held</TableHead>
                          <TableHead className="text-right">XIRR %</TableHead>
                          <TableHead>Last updated</TableHead>
                          <TableHead style={{ width: 160 }}>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {rows.map((r) => (
                          <TableRow key={r.days}>
                            <TableCell className="font-mono text-[var(--color-brand-700)]">
                              {r.days}
                            </TableCell>
                            <TableCell className="text-right">
                              <input
                                type="number"
                                step="0.01"
                                defaultValue={r.xirr}
                                onChange={(e) =>
                                  setEditValues((p) => ({ ...p, [String(r.days)]: e.target.value }))
                                }
                                className="w-20 rounded-md border border-[var(--color-line)] bg-white px-2 py-1 text-right font-mono text-[12px] text-[var(--color-ink)] transition-colors focus:border-[var(--color-brand-500)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-500)]/20"
                              />
                              <span className="ml-1 text-[var(--color-ink-soft)]">%</span>
                            </TableCell>
                            <TableCell className="text-[var(--color-ink-soft)]">
                              {r.updated_at
                                ? new Date(r.updated_at).toLocaleDateString('en-IN')
                                : '—'}
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => saveRow(r)}
                                  disabled={editValues[String(r.days)] === undefined}
                                >
                                  <Save className="size-3" /> Save
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="text-[var(--color-danger)] hover:bg-[var(--color-danger-soft)]"
                                  onClick={() => deleteRow(r)}
                                >
                                  <Trash2 className="size-3" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                        {rows.length === 0 && (
                          <TableRow>
                            <TableCell
                              colSpan={4}
                              className="py-10 text-center text-[var(--color-ink-soft)]"
                            >
                              No data yet. Import a CSV or add rows above.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  )}
                </Card>

                <Card className="overflow-hidden">
                  <div className="border-b border-[var(--color-line)] px-6 py-4 text-[14px] font-semibold text-[var(--color-ink)]">
                    CSV import
                  </div>
                  <div className="p-6">
                    <CSVImport active={activeTab} onImport={handleCSVImport} />
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
