import { useState } from 'react';
import { ArrowUpDown, AlertTriangle } from 'lucide-react';
import type { FundRecord, SignalType } from '@/shared/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { cn, formatPercent } from '@/shared/lib/utils';

interface FundTableProps {
  funds: FundRecord[];
}

type SortKey = 'name' | 'category' | 'days' | 'bx' | 'fund_xirr' | 'alpha';

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

export function FundTable({ funds }: FundTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('alpha');
  const [asc, setAsc] = useState(false);

  function toggleSort(key: SortKey) {
    if (sortKey === key) setAsc((a) => !a);
    else {
      setSortKey(key);
      setAsc(key === 'name' || key === 'category');
    }
  }

  const sorted = [...funds].sort((a, b) => {
    const av = a[sortKey];
    const bv = b[sortKey];
    if (typeof av === 'number' && typeof bv === 'number') {
      return asc ? av - bv : bv - av;
    }
    return asc
      ? String(av ?? '').localeCompare(String(bv ?? ''))
      : String(bv ?? '').localeCompare(String(av ?? ''));
  });

  const SortHead = ({ k, label, className }: { k: SortKey; label: string; className?: string }) => (
    <TableHead className={className}>
      <button
        type="button"
        onClick={() => toggleSort(k)}
        className="inline-flex items-center gap-1.5 text-[var(--color-ink-soft)] hover:text-[var(--color-ink)] transition-colors"
      >
        {label}
        <ArrowUpDown
          className={cn(
            'size-3 opacity-50 transition-opacity',
            sortKey === k && 'opacity-100 text-[var(--color-brand-600)]'
          )}
        />
      </button>
    </TableHead>
  );

  return (
    <Card className="overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <SortHead k="name" label="Fund" />
            <SortHead k="category" label="Category" />
            <SortHead k="days" label="Age" />
            <SortHead k="bx" label="Bench %" className="text-right" />
            <SortHead k="fund_xirr" label="Fund %" className="text-right" />
            <SortHead k="alpha" label="Alpha" className="text-right" />
            <TableHead>Signal</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.map((f, i) => {
            const young = f.days < 730;
            const positive = f.alpha >= 0;
            return (
              <TableRow key={`${f.name}-${i}`}>
                <TableCell className="font-medium text-[var(--color-ink)] max-w-[280px] truncate">
                  {f.name}
                </TableCell>
                <TableCell className="text-[var(--color-ink-soft)] text-[12.5px]">
                  {f.category ?? ''}
                </TableCell>
                <TableCell
                  className={cn(
                    'font-mono text-[12.5px]',
                    young ? 'text-[var(--color-warning)]' : 'text-[var(--color-ink-soft)]'
                  )}
                >
                  <span className="inline-flex items-center gap-1">
                    {(f.days / 365).toFixed(1)}yr
                    {young && <AlertTriangle className="size-3" />}
                  </span>
                </TableCell>
                <TableCell className="text-right font-mono text-[12.5px] text-[var(--color-ink-soft)] tabular-nums">
                  {f.bx.toFixed(2)}%
                </TableCell>
                <TableCell className="text-right font-mono text-[12.5px] text-[var(--color-ink-2)] tabular-nums">
                  {f.fund_xirr.toFixed(2)}%
                </TableCell>
                <TableCell
                  className={cn(
                    'text-right font-mono font-semibold text-[13px] tabular-nums',
                    positive ? 'text-[var(--color-success)]' : 'text-[var(--color-danger)]'
                  )}
                >
                  {formatPercent(f.alpha, { sign: true })}
                </TableCell>
                <TableCell>
                  <Badge variant={signalToVariant[f.signal]}>{signalLabel[f.signal]}</Badge>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </Card>
  );
}
