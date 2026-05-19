import {
  Bar,
  BarChart,
  Cell,
  PieChart,
  Pie,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import type { FundRecord, SignalType } from '@/shared/types';
import { Card } from '@/components/ui/card';
import { truncate } from '@/shared/lib/utils';

interface AlphaChartsProps {
  funds: FundRecord[];
}

const signalColors: Record<SignalType, string> = {
  STAR: '#f59e0b',
  GOOD: '#3b82f6',
  REVIEW: '#9ca3af',
  EXIT: '#ef4444',
};

const signalLabels: Record<SignalType, string> = {
  STAR: 'Star',
  GOOD: 'Good',
  REVIEW: 'Review',
  EXIT: 'Exit',
};

interface BarTooltipProps {
  active?: boolean;
  payload?: { payload: { name: string; alpha: number; signal: SignalType } }[];
}

function BarTooltip({ active, payload }: BarTooltipProps) {
  if (!active || !payload || !payload.length) return null;
  const d = payload[0].payload;
  const positive = d.alpha >= 0;
  return (
    <div className="rounded-lg border border-[var(--color-line)] bg-white px-3 py-2 shadow-[var(--shadow-md)]">
      <div className="text-[12.5px] font-medium text-[var(--color-ink)]">{d.name}</div>
      <div className="mt-0.5 font-mono text-[11.5px]">
        <span className={positive ? 'text-[var(--color-success)]' : 'text-[var(--color-danger)]'}>
          α {positive ? '+' : ''}{d.alpha.toFixed(2)}%
        </span>
        <span className="ml-2 text-[var(--color-ink-soft)]">{signalLabels[d.signal]}</span>
      </div>
    </div>
  );
}

interface PieTooltipProps {
  active?: boolean;
  payload?: { payload: { label: string; value: number; color: string } }[];
}

function PieTooltipFn({ active, payload }: PieTooltipProps) {
  if (!active || !payload || !payload.length) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-lg border border-[var(--color-line)] bg-white px-3 py-2 shadow-[var(--shadow-md)]">
      <div className="flex items-center gap-2 text-[12.5px]">
        <span className="size-2 rounded-full" style={{ background: d.color }} />
        <span className="font-medium text-[var(--color-ink)]">{d.label}</span>
        <span className="font-mono text-[var(--color-ink-soft)]">{d.value} funds</span>
      </div>
    </div>
  );
}

export function AlphaCharts({ funds }: AlphaChartsProps) {
  const sorted = [...funds]
    .sort((a, b) => b.alpha - a.alpha)
    .map((f) => ({
      name: truncate(f.name, 20),
      fullName: f.name,
      alpha: Number(f.alpha.toFixed(2)),
      signal: f.signal,
    }));

  const tiers = { STAR: 0, GOOD: 0, REVIEW: 0, EXIT: 0 };
  funds.forEach((f) => {
    tiers[f.signal]++;
  });

  const tierData = (Object.keys(tiers) as SignalType[])
    .filter((k) => tiers[k] > 0)
    .map((k) => ({
      label: signalLabels[k],
      value: tiers[k],
      color: signalColors[k],
    }));

  return (
    <div className="grid gap-4 lg:grid-cols-[1.7fr_1fr]">
      <Card className="overflow-hidden">
        <div className="border-b border-[var(--color-line)] px-6 py-4">
          <div className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--color-ink-soft)]">
            Alpha by fund
          </div>
        </div>
        <div className="px-2 pb-4 pt-3">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={sorted} margin={{ top: 8, right: 16, bottom: 24, left: 0 }}>
              <CartesianGrid stroke="var(--color-line)" vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 10, fill: 'var(--color-ink-soft)', fontFamily: 'var(--font-mono)' }}
                tickLine={false}
                axisLine={{ stroke: 'var(--color-line)' }}
                interval={0}
                angle={-30}
                dy={10}
                height={50}
              />
              <YAxis
                tick={{ fontSize: 10, fill: 'var(--color-ink-soft)', fontFamily: 'var(--font-mono)' }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `${v}%`}
              />
              <Tooltip cursor={{ fill: 'var(--color-surface-muted)' }} content={<BarTooltip />} />
              <Bar dataKey="alpha" radius={[6, 6, 2, 2]}>
                {sorted.map((d, i) => (
                  <Cell key={i} fill={signalColors[d.signal]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="border-b border-[var(--color-line)] px-6 py-4">
          <div className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--color-ink-soft)]">
            Tier split
          </div>
        </div>
        <div className="flex h-[260px] items-center justify-center px-4 pb-4 pt-3">
          {tierData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip content={<PieTooltipFn />} />
                <Pie
                  data={tierData}
                  dataKey="value"
                  nameKey="label"
                  innerRadius={50}
                  outerRadius={88}
                  strokeWidth={2}
                  stroke="white"
                  paddingAngle={2}
                >
                  {tierData.map((d, i) => (
                    <Cell key={i} fill={d.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-[12px] text-[var(--color-ink-soft)]">No data</div>
          )}
        </div>
        <div className="grid grid-cols-2 gap-2 px-6 pb-5 text-[12px]">
          {(Object.keys(tiers) as SignalType[]).map((k) => (
            <div key={k} className="flex items-center gap-2">
              <span className="size-2 rounded-full" style={{ background: signalColors[k] }} />
              <span className="text-[var(--color-ink-muted)]">{signalLabels[k]}</span>
              <span className="ml-auto font-mono font-semibold text-[var(--color-ink)]">{tiers[k]}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
