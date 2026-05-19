import { useEffect, useState } from 'react';
import { Plus, Save, Trash2, X, Info } from 'lucide-react';
import { supabase } from '@/shared/supabaseClient';
import type { CategoryMapping as CategoryMappingType } from '@/shared/types';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from '@/components/ui/sonner';
import { cn } from '@/shared/lib/utils';

type BenchCode = 'N50' | 'NLM' | 'N500' | 'DEBT';

const BENCH_OPTIONS: { code: BenchCode; name: string; desc: string }[] = [
  { code: 'N50', name: 'Nifty 50 TRI', desc: 'Large cap, flexi cap, hybrid, FOF, sectoral' },
  { code: 'NLM', name: 'Nifty LargeMidcap 250 TRI', desc: 'Large & mid cap, mid cap funds' },
  { code: 'N500', name: 'Nifty 500 TRI', desc: 'Small cap funds' },
  { code: 'DEBT', name: 'CRISIL 5.8% (fixed)', desc: 'Debt, liquid, ultra-short, money market' },
];

const benchVariant: Record<BenchCode, 'success' | 'info' | 'brand' | 'warning'> = {
  N50: 'success',
  NLM: 'info',
  N500: 'brand',
  DEBT: 'warning',
};

export function CategoryMapping() {
  const [mappings, setMappings] = useState<CategoryMappingType[]>([]);
  const [selected, setSelected] = useState<CategoryMappingType | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newKeyword, setNewKeyword] = useState('');
  const [newCategory, setNewCategory] = useState('');

  async function load() {
    const { data } = await supabase.from('category_mappings').select('*').order('category');
    setMappings((data as CategoryMappingType[]) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function saveSelected() {
    if (!selected) return;
    setSaving(true);
    const op = selected.id
      ? supabase
          .from('category_mappings')
          .update({ benchmark: selected.benchmark, keywords: selected.keywords })
          .eq('id', selected.id)
      : supabase
          .from('category_mappings')
          .insert({
            category: selected.category,
            benchmark: selected.benchmark,
            keywords: selected.keywords,
          });
    const { error } = await op;
    if (error) toast.error('Save failed');
    else {
      toast.success('Saved');
      await load();
    }
    setSaving(false);
  }

  async function deleteMapping(id: string) {
    const { error } = await supabase.from('category_mappings').delete().eq('id', id);
    if (error) toast.error('Delete failed');
    else {
      toast.success('Deleted');
      setSelected(null);
      await load();
    }
  }

  function addKeyword() {
    if (!selected || !newKeyword.trim()) return;
    const kw = newKeyword.trim().toLowerCase();
    if (!selected.keywords.includes(kw)) {
      setSelected({ ...selected, keywords: [...selected.keywords, kw] });
    }
    setNewKeyword('');
  }

  function removeKeyword(kw: string) {
    if (!selected) return;
    setSelected({ ...selected, keywords: selected.keywords.filter((k) => k !== kw) });
  }

  function addNewCategory() {
    if (!newCategory.trim()) return;
    setSelected({ category: newCategory.trim(), benchmark: 'N50', keywords: [] });
    setNewCategory('');
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-[26px] font-bold tracking-tight text-[var(--color-ink)]">
          Category mapping
        </h1>
        <p className="mt-1 text-[14px] text-[var(--color-ink-muted)]">
          Decide which benchmark each fund category is scored against.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <div className="space-y-3">
          <Card className="overflow-hidden">
            <div className="border-b border-[var(--color-line)] px-4 py-3 text-[12px] font-semibold uppercase tracking-[0.08em] text-[var(--color-ink-soft)]">
              Fund categories ({mappings.length})
            </div>
            <div className="max-h-[480px] overflow-y-auto">
              {loading ? (
                <div className="space-y-2 p-3">
                  {[0, 1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-9" />
                  ))}
                </div>
              ) : (
                mappings.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setSelected({ ...m })}
                    className={cn(
                      'flex w-full items-center justify-between border-b border-[var(--color-line)] px-4 py-2.5 text-left transition-colors last:border-b-0',
                      selected?.id === m.id
                        ? 'bg-[var(--color-brand-50)]/70'
                        : 'hover:bg-[var(--color-surface-muted)]'
                    )}
                  >
                    <span className="truncate text-[13px] text-[var(--color-ink)]">{m.category}</span>
                    <Badge variant={benchVariant[m.benchmark]}>{m.benchmark}</Badge>
                  </button>
                ))
              )}
            </div>
          </Card>

          <div className="flex gap-2">
            <Input
              placeholder="New category name"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addNewCategory()}
            />
            <Button size="md" onClick={addNewCategory}>
              <Plus className="size-4" />
            </Button>
          </div>
        </div>

        {selected ? (
          <Card className="overflow-hidden">
            <div className="flex items-center justify-between border-b border-[var(--color-line)] px-6 py-4">
              <div className="text-[15px] font-semibold text-[var(--color-ink)]">
                {selected.category || 'New category'}
              </div>
              <div className="flex gap-2">
                {selected.id && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-[var(--color-danger)] hover:bg-[var(--color-danger-soft)]"
                    onClick={() => deleteMapping(selected.id!)}
                  >
                    <Trash2 className="size-3.5" />
                    Delete
                  </Button>
                )}
                <Button size="sm" onClick={saveSelected} disabled={saving}>
                  <Save className="size-3.5" />
                  {saving ? 'Saving…' : 'Save'}
                </Button>
              </div>
            </div>

            <div className="space-y-7 p-6">
              {!selected.id && (
                <div className="space-y-1.5">
                  <Label htmlFor="cat-name">Category name</Label>
                  <Input
                    id="cat-name"
                    value={selected.category}
                    onChange={(e) => setSelected({ ...selected, category: e.target.value })}
                  />
                </div>
              )}

              <div>
                <Label className="mb-3 inline-block">Benchmark index</Label>
                <div className="grid gap-3 sm:grid-cols-2">
                  {BENCH_OPTIONS.map((opt) => {
                    const active = selected.benchmark === opt.code;
                    return (
                      <button
                        type="button"
                        key={opt.code}
                        onClick={() => setSelected({ ...selected, benchmark: opt.code })}
                        className={cn(
                          'rounded-xl border bg-white px-4 py-4 text-left transition-all',
                          active
                            ? 'border-[var(--color-brand-500)] bg-[var(--color-brand-50)]/40 shadow-[0_0_0_3px_rgba(99,91,255,0.08)]'
                            : 'border-[var(--color-line)] hover:border-[var(--color-line-strong)]'
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <Badge variant={benchVariant[opt.code]}>{opt.code}</Badge>
                          {active && (
                            <span className="size-2 rounded-full bg-[var(--color-brand-500)]" />
                          )}
                        </div>
                        <div className="mt-2.5 text-[13.5px] font-medium text-[var(--color-ink)]">
                          {opt.name}
                        </div>
                        <div className="mt-1 text-[12px] leading-relaxed text-[var(--color-ink-soft)]">
                          {opt.desc}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <Label className="mb-3 inline-block">Match keywords</Label>
                <div className="mb-3 flex flex-wrap gap-2">
                  {selected.keywords.map((kw) => (
                    <span
                      key={kw}
                      className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-surface-muted)] py-1 pl-3 pr-1.5 text-[12px] text-[var(--color-ink-2)] ring-1 ring-inset ring-[var(--color-line)]"
                    >
                      {kw}
                      <button
                        type="button"
                        onClick={() => removeKeyword(kw)}
                        className="grid size-4 place-items-center rounded-full text-[var(--color-ink-soft)] hover:bg-white hover:text-[var(--color-danger)]"
                      >
                        <X className="size-3" />
                      </button>
                    </span>
                  ))}
                  {selected.keywords.length === 0 && (
                    <span className="text-[12px] text-[var(--color-ink-faint)]">
                      No keywords — uses default N50
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add keyword and press Enter…"
                    value={newKeyword}
                    onChange={(e) => setNewKeyword(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addKeyword())}
                  />
                  <Button variant="outline" size="md" onClick={addKeyword}>
                    Add
                  </Button>
                </div>
              </div>

              <Alert variant="info">
                <Info />
                <AlertDescription>
                  Categories are matched by checking if the fund's category string contains any
                  keyword (case-insensitive). If no match, the fund defaults to Nifty 50 TRI.
                </AlertDescription>
              </Alert>
            </div>
          </Card>
        ) : (
          <Card className="grid place-items-center p-16 text-center">
            <div>
              <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-[var(--color-surface-muted)] text-[var(--color-ink-soft)]">
                <Info className="size-5" />
              </div>
              <div className="mt-4 text-[14px] font-medium text-[var(--color-ink)]">
                Select a category to edit
              </div>
              <div className="mt-1 text-[13px] text-[var(--color-ink-soft)]">
                Pick from the list on the left or add a new one.
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
