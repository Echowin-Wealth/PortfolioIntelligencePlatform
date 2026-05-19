import { useEffect, useState } from 'react';
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { FileBarChart2, TrendingUp, Star, XCircle, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '@/shared/supabaseClient';
import type { ReportHistory } from '@/shared/types';
import { StatCard } from '@/shared/ui/StatCard';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatPercent } from '@/shared/lib/utils';

export function Dashboard() {
  const [stats, setStats] = useState({ total: 0, avgAlpha: 0, starPct: 0, exitPct: 0 });
  const [recent, setRecent] = useState<ReportHistory[]>([]);
  const [trend, setTrend] = useState<{ day: string; count: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('report_history')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (!data) {
        setLoading(false);
        return;
      }

      const total = data.length;
      const totalFunds = data.reduce((s, r) => s + Number(r.fund_count), 0);
      const avgAlpha =
        total > 0
          ? Math.round((data.reduce((s, r) => s + Number(r.avg_alpha), 0) / total) * 100) / 100
          : 0;
      const starPct =
        totalFunds > 0
          ? Math.round((data.reduce((s, r) => s + Number(r.star_count), 0) / totalFunds) * 100)
          : 0;
      const exitPct =
        totalFunds > 0
          ? Math.round((data.reduce((s, r) => s + Number(r.exit_count), 0) / totalFunds) * 100)
          : 0;

      const buckets = new Map<string, number>();
      for (const r of data) {
        if (!r.created_at) continue;
        const d = new Date(r.created_at);
        const key = `${d.getMonth() + 1}/${d.getDate()}`;
        buckets.set(key, (buckets.get(key) ?? 0) + 1);
      }
      const trendArr = Array.from(buckets.entries())
        .reverse()
        .slice(-14)
        .map(([day, count]) => ({ day, count }));

      setStats({ total, avgAlpha, starPct, exitPct });
      setRecent((data as ReportHistory[]).slice(0, 8));
      setTrend(trendArr);
      setLoading(false);
    }
    load();
  }, []);

  return (
    <div className="space-y-8">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-[26px] font-bold tracking-tight text-[var(--color-ink)]">
            Dashboard
          </h1>
          <p className="mt-1 text-[14px] text-[var(--color-ink-muted)]">
            Operational overview of report generation across the platform.
          </p>
        </div>
        <Button asChild size="md">
          <Link to="/admin/generate">
            New report <ArrowRight className="size-3.5" />
          </Link>
        </Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <StatCard
              label="Total reports"
              value={stats.total}
              hint="All time"
              tone="brand"
              icon={<FileBarChart2 className="size-4" />}
            />
            <StatCard
              label="Avg alpha"
              value={formatPercent(stats.avgAlpha, { sign: true })}
              hint="Across all reports"
              tone={stats.avgAlpha >= 0 ? 'success' : 'danger'}
              icon={<TrendingUp className="size-4" />}
            />
            <StatCard
              label="Star rate"
              value={`${stats.starPct}%`}
              hint="Funds in STAR tier"
              tone="warning"
              icon={<Star className="size-4" />}
            />
            <StatCard
              label="Exit rate"
              value={`${stats.exitPct}%`}
              hint="Funds in EXIT tier"
              tone="danger"
              icon={<XCircle className="size-4" />}
            />
          </div>

          <Card className="overflow-hidden">
            <div className="flex items-center justify-between border-b border-[var(--color-line)] px-6 py-4">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--color-ink-soft)]">
                  Last 14 days
                </div>
                <div className="mt-0.5 text-[15px] font-semibold text-[var(--color-ink)]">
                  Reports generated
                </div>
              </div>
              <div className="font-mono text-[13px] text-[var(--color-ink-2)]">
                {trend.reduce((s, t) => s + t.count, 0)} total
              </div>
            </div>
            <div className="px-3 pb-2 pt-4">
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={trend} margin={{ top: 4, right: 12, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="brandFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#635bff" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#635bff" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="day"
                    tick={{ fontSize: 10, fill: 'var(--color-ink-soft)', fontFamily: 'var(--font-mono)' }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis hide />
                  <Tooltip
                    contentStyle={{
                      border: '1px solid var(--color-line)',
                      borderRadius: 8,
                      background: 'white',
                      boxShadow: 'var(--shadow-md)',
                      fontSize: 12,
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="count"
                    stroke="#635bff"
                    strokeWidth={2}
                    fill="url(#brandFill)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card className="overflow-hidden">
            <div className="flex items-center justify-between border-b border-[var(--color-line)] px-6 py-4">
              <div className="text-[15px] font-semibold text-[var(--color-ink)]">Recent reports</div>
              <Button asChild variant="ghost" size="sm">
                <Link to="/admin/history">
                  View all <ArrowRight className="size-3" />
                </Link>
              </Button>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Investor</TableHead>
                  <TableHead className="text-right">Funds</TableHead>
                  <TableHead className="text-right">Avg α</TableHead>
                  <TableHead className="text-right">Star</TableHead>
                  <TableHead className="text-right">Exit</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recent.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium text-[var(--color-ink)]">
                      {r.investor}
                    </TableCell>
                    <TableCell className="text-right font-mono">{r.fund_count}</TableCell>
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
                    <TableCell className="text-right font-mono text-[var(--color-danger)]">
                      {r.exit_count}
                    </TableCell>
                    <TableCell>
                      <Badge variant={r.generated_by === 'admin' ? 'info' : 'success'}>
                        {r.generated_by}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-[var(--color-ink-soft)]">
                      {r.created_at ? new Date(r.created_at).toLocaleDateString('en-IN') : '—'}
                    </TableCell>
                  </TableRow>
                ))}
                {recent.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="py-10 text-center text-[var(--color-ink-soft)]">
                      No reports generated yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </>
      )}
    </div>
  );
}
