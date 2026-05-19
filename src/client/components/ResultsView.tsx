import { Download, Star, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import type { FundRecord, AlphaThresholds } from '@/shared/types';
import { AlphaCharts } from './AlphaCharts';
import { ActionItems } from './ActionItems';
import { FundTable } from './FundTable';
import { generatePDF } from '@/shared/pdfReport';
import { Button } from '@/components/ui/button';
import { StatCard } from '@/shared/ui/StatCard';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { formatPercent } from '@/shared/lib/utils';

interface ResultsViewProps {
  funds: FundRecord[];
  investorName: string;
  thresholds: AlphaThresholds;
  distributorName: string;
}

export function ResultsView({
  funds,
  investorName,
  thresholds,
  distributorName,
}: ResultsViewProps) {
  const tiers: Record<string, FundRecord[]> = { STAR: [], GOOD: [], REVIEW: [], EXIT: [] };
  funds.forEach((f) => tiers[f.signal].push(f));

  const avgA = funds.reduce((s, f) => s + f.alpha, 0) / funds.length;
  const avgX = funds.reduce((s, f) => s + f.fund_xirr, 0) / funds.length;
  const hitRate = Math.round((funds.filter((f) => f.alpha > 0).length / funds.length) * 100);
  const today = new Date().toLocaleDateString('en-IN');

  async function handleDownload() {
    try {
      await generatePDF(funds, investorName, today, distributorName, thresholds);
    } catch (err) {
      console.error('PDF generation failed', err);
      alert(err instanceof Error ? err.message : 'PDF generation failed');
    }
  }

  return (
    <div className="animate-[fade-up_0.5s_var(--ease-spring)]">
      {/* Investor header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--color-brand-600)]">
            Alpha report · {today}
          </div>
          <h2 className="font-display mt-2 text-[28px] font-bold leading-tight tracking-[-0.02em] text-[var(--color-ink)] sm:text-[34px]">
            {investorName}
          </h2>
          <p className="mt-2 text-[13.5px] text-[var(--color-ink-muted)]">
            <span className="font-mono">{funds.length}</span> funds analyzed · portfolio XIRR{' '}
            <span className="font-mono font-semibold text-[var(--color-ink)]">{avgX.toFixed(2)}%</span> ·
            average alpha{' '}
            <span
              className={
                'font-mono font-semibold ' +
                (avgA >= 0 ? 'text-[var(--color-success)]' : 'text-[var(--color-danger)]')
              }
            >
              {formatPercent(avgA, { sign: true })}
            </span>{' '}
            · <span className="font-mono">{hitRate}%</span> hit rate
          </p>
        </div>
        <Button onClick={handleDownload} size="lg" className="self-start sm:self-auto">
          <Download className="size-4" />
          Download PDF report
        </Button>
      </div>

      {/* KPI tiles */}
      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard
          label="Star"
          tone="warning"
          value={tiers.STAR.length}
          icon={<Star className="size-4" />}
        />
        <StatCard
          label="Good"
          tone="info"
          value={tiers.GOOD.length}
          icon={<CheckCircle2 className="size-4" />}
        />
        <StatCard
          label="Review"
          tone="neutral"
          value={tiers.REVIEW.length}
          icon={<AlertTriangle className="size-4" />}
        />
        <StatCard
          label="Exit"
          tone="danger"
          value={tiers.EXIT.length}
          icon={<XCircle className="size-4" />}
        />
        <StatCard
          label="Avg alpha"
          tone={avgA >= 0 ? 'success' : 'danger'}
          value={formatPercent(avgA, { sign: true })}
          hint={`${hitRate}% beating benchmark`}
        />
        <StatCard label="Total funds" value={funds.length} hint="In this report" />
      </div>

      {/* Tabs for detailed view */}
      <Tabs defaultValue="overview" className="mt-10">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="actions">Actions</TabsTrigger>
          <TabsTrigger value="funds">All funds</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <AlphaCharts funds={funds} />
          <ActionItems funds={funds} thresholds={thresholds} />
        </TabsContent>

        <TabsContent value="actions">
          <ActionItems funds={funds} thresholds={thresholds} />
        </TabsContent>

        <TabsContent value="funds">
          <FundTable funds={funds} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
