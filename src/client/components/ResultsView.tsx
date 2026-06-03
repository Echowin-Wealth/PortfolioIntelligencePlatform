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

/** Group FundRecord array by investor_name. */
function groupByInvestor(funds: FundRecord[]): Map<string, FundRecord[]> {
  const map = new Map<string, FundRecord[]>();
  for (const f of funds) {
    const key = (f.investor_name ?? 'Client').trim() || 'Client';
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(f);
  }
  return map;
}

export function ResultsView({
  funds,
  investorName,
  thresholds,
  distributorName,
}: ResultsViewProps) {
  const byInvestor = groupByInvestor(funds);
  const isFamilyReport = byInvestor.size > 1;

  const tiers: Record<string, FundRecord[]> = { STAR: [], GOOD: [], REVIEW: [], EXIT: [] };
  funds.forEach(f => tiers[f.signal].push(f));
  const avgA = funds.reduce((s, f) => s + f.alpha, 0) / funds.length;
  const avgX = funds.reduce((s, f) => s + f.fund_xirr, 0) / funds.length;
  const hitRate = Math.round((funds.filter(f => f.alpha > 0).length / funds.length) * 100);
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
      {/* Report header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--color-brand-600)]">
            {isFamilyReport ? 'Family alpha report' : 'Alpha report'} · {today}
          </div>
          <h2 className="font-display mt-2 text-[28px] font-bold leading-tight tracking-[-0.02em] text-[var(--color-ink)] sm:text-[34px]">
            {investorName}
          </h2>
          <p className="mt-2 text-[13.5px] text-[var(--color-ink-muted)]">
            {isFamilyReport ? (
              <>
                <span className="font-mono">{byInvestor.size}</span> investors ·{' '}
              </>
            ) : null}
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
          {isFamilyReport ? 'Download Family PDF' : 'Download PDF report'}
        </Button>
      </div>

      {/* KPI tiles */}
      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard label="Star" tone="warning" value={tiers.STAR.length} icon={<Star className="size-4" />} />
        <StatCard label="Good" tone="info" value={tiers.GOOD.length} icon={<CheckCircle2 className="size-4" />} />
        <StatCard label="Review" tone="neutral" value={tiers.REVIEW.length} icon={<AlertTriangle className="size-4" />} />
        <StatCard label="Exit" tone="danger" value={tiers.EXIT.length} icon={<XCircle className="size-4" />} />
        <StatCard
          label="Avg alpha"
          tone={avgA >= 0 ? 'success' : 'danger'}
          value={formatPercent(avgA, { sign: true })}
          hint={`${hitRate}% beating benchmark`}
        />
        <StatCard label="Total funds" value={funds.length} hint={isFamilyReport ? `Across ${byInvestor.size} investors` : 'In this report'} />
      </div>

      {/* Tabs for detailed view */}
      <Tabs defaultValue={isFamilyReport ? 'investors' : 'overview'} className="mt-10">
        <TabsList>
          {isFamilyReport && <TabsTrigger value="investors">By Investor</TabsTrigger>}
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="actions">Actions</TabsTrigger>
          <TabsTrigger value="funds">All funds</TabsTrigger>
        </TabsList>

        {isFamilyReport && (
          <TabsContent value="investors" className="space-y-10">
            {[...byInvestor.entries()].map(([iName, iFunds]) => {
              const iTiers: Record<string, FundRecord[]> = { STAR: [], GOOD: [], REVIEW: [], EXIT: [] };
              iFunds.forEach(f => iTiers[f.signal].push(f));
              const iAvgA = iFunds.reduce((s, f) => s + f.alpha, 0) / iFunds.length;
              const iAvgX = iFunds.reduce((s, f) => s + f.fund_xirr, 0) / iFunds.length;
              const iHitRate = Math.round((iFunds.filter(f => f.alpha > 0).length / iFunds.length) * 100);

              return (
                <div key={iName}>
                  {/* Investor header */}
                  <div className="flex items-end justify-between gap-4 border-b border-[var(--color-line)] pb-3 mb-5">
                    <div>
                      <h3 className="text-[20px] font-bold text-[var(--color-ink)]">{iName}</h3>
                      <p className="mt-1 text-[13px] text-[var(--color-ink-muted)]">
                        <span className="font-mono">{iFunds.length}</span> funds ·{' '}
                        XIRR <span className="font-mono font-semibold text-[var(--color-ink)]">{iAvgX.toFixed(2)}%</span> ·{' '}
                        avg alpha{' '}
                        <span
                          className={
                            'font-mono font-semibold ' +
                            (iAvgA >= 0 ? 'text-[var(--color-success)]' : 'text-[var(--color-danger)]')
                          }
                        >
                          {formatPercent(iAvgA, { sign: true })}
                        </span>{' '}
                        · <span className="font-mono">{iHitRate}%</span> hit rate
                      </p>
                    </div>
                  </div>

                  {/* Per-investor signal tiles */}
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 mb-6">
                    <StatCard label="Star" tone="warning" value={iTiers.STAR.length} icon={<Star className="size-4" />} />
                    <StatCard label="Good" tone="info" value={iTiers.GOOD.length} icon={<CheckCircle2 className="size-4" />} />
                    <StatCard label="Review" tone="neutral" value={iTiers.REVIEW.length} icon={<AlertTriangle className="size-4" />} />
                    <StatCard label="Exit" tone="danger" value={iTiers.EXIT.length} icon={<XCircle className="size-4" />} />
                  </div>

                  {/* Per-investor fund table */}
                  <FundTable funds={iFunds} />
                </div>
              );
            })}
          </TabsContent>
        )}

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
