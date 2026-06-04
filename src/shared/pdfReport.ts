import { jsPDF } from 'jspdf';
import { registerReportFont } from './pdfFonts';
import type { FundRecord, AlphaThresholds, SignalType } from './types';

type RGB = readonly [number, number, number];

// ─── Theme tokens (mirror src/index.css) ────────────────────────────────────
const T = {
  bg: [255, 255, 255] as RGB,
  surface: [255, 255, 255] as RGB,
  surfaceMuted: [246, 249, 252] as RGB,
  surfaceStrong: [238, 242, 247] as RGB,
  ink: [10, 14, 26] as RGB,
  ink2: [26, 31, 54] as RGB,
  inkMuted: [66, 84, 102] as RGB,
  inkSoft: [107, 114, 128] as RGB,
  inkFaint: [156, 163, 175] as RGB,
  line: [227, 232, 238] as RGB,
  lineStrong: [214, 221, 230] as RGB,
  brand: [99, 91, 255] as RGB,
  brand600: [80, 70, 228] as RGB,
  brandSoft: [238, 240, 255] as RGB,
  success: [0, 184, 122] as RGB,
  successSoft: [231, 249, 241] as RGB,
  warning: [245, 158, 11] as RGB,
  warningSoft: [254, 249, 231] as RGB,
  danger: [239, 68, 68] as RGB,
  dangerSoft: [254, 242, 242] as RGB,
  info: [59, 130, 246] as RGB,
  infoSoft: [239, 246, 255] as RGB,
  gold: [217, 119, 6] as RGB,
} as const;

const SIGNAL_LABEL: Record<SignalType, string> = {
  STAR: 'STAR',
  GOOD: 'GOOD',
  REVIEW: 'REVIEW',
  EXIT: 'EXIT',
};

const SIGNAL_COLOR: Record<SignalType, RGB> = {
  STAR: T.gold,
  GOOD: T.info,
  REVIEW: T.warning,
  EXIT: T.danger,
};

const SIGNAL_SOFT: Record<SignalType, RGB> = {
  STAR: T.warningSoft,
  GOOD: T.infoSoft,
  REVIEW: T.warningSoft,
  EXIT: T.dangerSoft,
};

const SIGNAL_ACTION: Record<SignalType, string> = {
  STAR: 'Hold / increase allocation',
  GOOD: 'Hold, monitor quarterly',
  REVIEW: 'Watch - reassess 1-2Q',
  EXIT: 'Consider switching out',
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Group FundRecord array by investor_name, preserving insertion order. */
function groupByInvestor(funds: FundRecord[]): Map<string, FundRecord[]> {
  const map = new Map<string, FundRecord[]>();
  for (const f of funds) {
    const key = (f.investor_name ?? 'Client').trim() || 'Client';
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(f);
  }
  return map;
}

/**
 * Derive a short family label from investor names.
 * If all share the same surname → "Surname Family".
 * Otherwise → first name + "& Others".
 */
function deriveFamilyName(names: string[]): string {
  if (names.length === 0) return 'Family';
  if (names.length === 1) return names[0];
  const surnames = names.map(n => n.trim().split(/\s+/).pop() ?? '');
  const allSame = surnames.every(s => s !== '' && s === surnames[0]);
  return allSame ? `${surnames[0]} Family` : `${names[0]} & Others`;
}

// ─── Public API ───────────────────────────────────────────────────────────────
/**
 * Generate and download an Alpha Report PDF.
 *
 * Backward compatible: single-investor PDFs are rendered exactly as before.
 * For family reports (funds from multiple investor_names), a Family Summary
 * page is prepended and each investor gets their own section.
 */
export async function generatePDF(
  funds: FundRecord[],
  investorName: string,
  reportDate: string,
  distributorName: string,
  thresholds: AlphaThresholds
): Promise<void> {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const FONT = await registerReportFont(doc);

  // ─── Page geometry ────────────────────────────────────────────────────────
  const W = 210;
  const H = 297;
  const M = 15;
  const CW = W - 2 * M;
  const FOOTER_H = 14;
  const BOTTOM_Y = H - FOOTER_H;

  let y = 0;

  // ─── Low-level drawing helpers ────────────────────────────────────────────
  const sf = (c: RGB) => doc.setFillColor(c[0], c[1], c[2]);
  const st = (c: RGB) => doc.setTextColor(c[0], c[1], c[2]);
  const sd = (c: RGB) => doc.setDrawColor(c[0], c[1], c[2]);
  const font = (w: 'normal' | 'bold' = 'normal') => doc.setFont(FONT, w);
  const fs = (n: number) => doc.setFontSize(n);
  const WHITE: RGB = [255, 255, 255];

  function card(x: number, yy: number, w: number, h: number, fill: RGB = T.surface) {
    sf(fill);
    sd(T.line);
    doc.setLineWidth(0.2);
    doc.roundedRect(x, yy, w, h, 2, 2, 'FD');
  }

  /** Add an overflow page (no header strip — same as original behaviour). */
  function addOverflowPage() {
    doc.addPage();
    sf(T.bg);
    doc.rect(0, 0, W, H, 'F');
    y = M;
  }

  function chk(need: number) {
    if (y + need > BOTTOM_Y - 4) addOverflowPage();
  }

  /** Draw the top brand/date strip and reset y to 22. */
  function drawHeaderStrip() {
    fs(8); font('bold'); st(T.brand600);
    doc.text('ALPHAGEN', M, 11);
    fs(7); font('normal'); st(T.inkSoft);
    doc.text(distributorName.toUpperCase(), W / 2, 11, { align: 'center' });
    doc.text(reportDate, W - M, 11, { align: 'right' });
    sd(T.lineStrong); doc.setLineWidth(0.2);
    doc.line(M, 14, W - M, 14);
    y = 22;
  }

  // ─── Family detection ─────────────────────────────────────────────────────
  const byInvestor = groupByInvestor(funds);
  const isFamilyReport = byInvestor.size > 1;
  const investorNames = [...byInvestor.keys()];
  const familyLabel = isFamilyReport
    ? deriveFamilyName(investorNames)
    : (investorName || investorNames[0] || 'Client');

  const sectionRanges: Array<{ startPage: number; endPage: number; label: string }> = [];

  // ─── Per-investor content renderer ────────────────────────────────────────
  function renderInvestorContent(iName: string, iFunds: FundRecord[]) {
    // Tier bucketing + stats
    const tiers: Record<SignalType, FundRecord[]> = { STAR: [], GOOD: [], REVIEW: [], EXIT: [] };
    iFunds.forEach(f => tiers[f.signal].push(f));
    const avgA = iFunds.reduce((s, f) => s + f.alpha, 0) / iFunds.length;
    const avgX = iFunds.reduce((s, f) => s + f.fund_xirr, 0) / iFunds.length;
    const hitRate = Math.round((iFunds.filter(f => f.alpha > 0).length / iFunds.length) * 100);

    // Title block
    fs(7); font('bold'); st(T.brand600);
    doc.text(`ALPHA REPORT  ·  ${reportDate.toUpperCase()}`, M, y);
    y += 7;

    fs(20); font('bold'); st(T.ink);
    doc.text(iName, M, y);
    y += 6;

    fs(8); font('normal'); st(T.inkMuted);
    const subline =
      `${iFunds.length} funds analysed   ·   portfolio XIRR ${avgX.toFixed(2)}%   ·   ` +
      `average alpha ${avgA >= 0 ? '+' : ''}${avgA.toFixed(2)}%   ·   ${hitRate}% hit rate`;
    doc.text(subline, M, y);
    y += 10;

    // KPI scorecard (6 tiles)
    {
      const GAP = 3;
      const tileW = (CW - GAP * 5) / 6;
      const tileH = 16;
      const ms: Array<{ l: string; v: string; c: RGB }> = [
        { l: 'Total funds', v: String(iFunds.length), c: T.ink },
        { l: 'XIRR', v: `${avgX.toFixed(2)}%`, c: T.info },
        { l: 'Avg alpha', v: `${avgA >= 0 ? '+' : ''}${avgA.toFixed(2)}%`, c: avgA >= 0 ? T.success : T.danger },
        { l: 'Star', v: String(tiers.STAR.length), c: T.gold },
        { l: 'Good', v: String(tiers.GOOD.length), c: T.info },
        { l: 'Exit', v: String(tiers.EXIT.length), c: tiers.EXIT.length ? T.danger : T.success },
      ];
      ms.forEach((m, i) => {
        const cx = M + i * (tileW + GAP);
        card(cx, y, tileW, tileH);
        fs(13); font('bold'); st(m.c);
        doc.text(m.v, cx + tileW / 2, y + 9, { align: 'center' });
        fs(6); font('normal'); st(T.inkSoft);
        doc.text(m.l.toUpperCase(), cx + tileW / 2, y + 13.5, { align: 'center' });
      });
      y += tileH + 6;
    }

    // Tier row (4 tiles)
    {
      const GAP = 3;
      const tileW = (CW - GAP * 3) / 4;
      const tileH = 22;
      (['STAR', 'GOOD', 'REVIEW', 'EXIT'] as SignalType[]).forEach((sig, i) => {
        const cx = M + i * (tileW + GAP);
        card(cx, y, tileW, tileH, SIGNAL_SOFT[sig]);
        fs(8); font('bold'); st(SIGNAL_COLOR[sig]);
        doc.text(SIGNAL_LABEL[sig], cx + tileW / 2, y + 7, { align: 'center' });
        fs(16); font('bold'); st(T.ink);
        doc.text(String(tiers[sig].length), cx + tileW / 2, y + 14, { align: 'center' });
        fs(6); font('normal'); st(T.inkSoft);
        doc.text(SIGNAL_ACTION[sig], cx + tileW / 2, y + 19, { align: 'center' });
      });
      y += tileH + 8;
    }

    // Fund analysis table header bar
    chk(16); // header bar (8) + column header row (6.5) + small buffer
    sf(T.brand);
    doc.roundedRect(M, y, CW, 8, 1.5, 1.5, 'F');
    fs(8); font('bold'); st(WHITE);
    doc.text('COMPLETE FUND ANALYSIS', M + 3, y + 5.4);
    fs(6); font('normal');
    doc.text(`Sorted by alpha  ·  ${iFunds.length} positions`, W - M - 3, y + 5.4, { align: 'right' });
    y += 8;

    // Columns — widths sum to CW exactly
    const cols = [
      { h: 'Fund',     x: M,        w: 64, align: 'left'   as const },
      { h: 'Category', x: M + 64,   w: 26, align: 'left'   as const },
      { h: 'Since',    x: M + 90,   w: 16, align: 'left'   as const },
      { h: 'Age',      x: M + 106,  w: 12, align: 'left'   as const },
      { h: 'Bench %',  x: M + 118,  w: 14, align: 'right'  as const },
      { h: 'Fund %',   x: M + 132,  w: 14, align: 'right'  as const },
      { h: 'Alpha',    x: M + 146,  w: 16, align: 'right'  as const },
      { h: 'Signal',   x: M + 162,  w: 18, align: 'center' as const },
    ];
    const PAD = 1.5;

    function colTextX(col: typeof cols[number]): number {
      if (col.align === 'left') return col.x + PAD;
      if (col.align === 'right') return col.x + col.w - PAD;
      return col.x + col.w / 2;
    }

    // Column header row
    sf(T.surfaceStrong);
    doc.rect(M, y, CW, 6.5, 'F');
    fs(6); font('bold'); st(T.inkSoft);
    cols.forEach(c => doc.text(c.h.toUpperCase(), colTextX(c), y + 4.4, { align: c.align }));
    y += 6.5;

    // Fund rows
    const sortedFunds = [...iFunds].sort((a, b) => b.alpha - a.alpha);
    sortedFunds.forEach((f, i) => {
      chk(7);
      const rowY = y;
      const rowH = 6.5;
      sf(i % 2 === 0 ? T.surface : T.surfaceMuted);
      doc.rect(M, rowY, CW, rowH, 'F');

      const nameMaxW = cols[0].w - PAD * 2;
      fs(7); font('bold'); st(T.ink);
      doc.text((doc.splitTextToSize(f.name, nameMaxW) as string[])[0] ?? '', colTextX(cols[0]), rowY + 4.4);

      fs(6.5); font('normal'); st(T.inkSoft);
      doc.text((doc.splitTextToSize(f.category ?? '', cols[1].w - PAD * 2) as string[])[0] ?? '', colTextX(cols[1]), rowY + 4.4);

      st(T.inkMuted);
      doc.text(f.inv_date ?? '', colTextX(cols[2]), rowY + 4.4);

      st(f.days < 730 ? T.warning : T.inkMuted);
      doc.text(`${(f.days / 365).toFixed(1)}yr`, colTextX(cols[3]), rowY + 4.4);

      font('normal'); st(T.inkSoft);
      doc.text(`${f.bx.toFixed(2)}%`, colTextX(cols[4]), rowY + 4.4, { align: 'right' });

      st(T.ink);
      doc.text(`${f.fund_xirr.toFixed(2)}%`, colTextX(cols[5]), rowY + 4.4, { align: 'right' });

      font('bold'); st(f.alpha >= 0 ? T.success : T.danger);
      doc.text(`${f.alpha >= 0 ? '+' : ''}${f.alpha.toFixed(2)}%`, colTextX(cols[6]), rowY + 4.4, { align: 'right' });

      const badgeW = 14, badgeH = 4.8;
      const badgeX = cols[7].x + (cols[7].w - badgeW) / 2;
      const badgeY = rowY + (rowH - badgeH) / 2;
      sf(SIGNAL_SOFT[f.signal]);
      doc.roundedRect(badgeX, badgeY, badgeW, badgeH, 1.2, 1.2, 'F');
      fs(6); font('bold'); st(SIGNAL_COLOR[f.signal]);
      doc.text(SIGNAL_LABEL[f.signal], badgeX + badgeW / 2, badgeY + 3.4, { align: 'center' });

      y += rowH;
    });
    y += 8;

    // EXIT detail section
    if (tiers.EXIT.length) {
      chk(22);
      sf(T.dangerSoft);
      doc.roundedRect(M, y, CW, 8, 1.5, 1.5, 'F');
      fs(8); font('bold'); st(T.danger);
      doc.text('EXIT CANDIDATES — CONSIDER SWITCHING', M + 3, y + 5.4);
      y += 10;

      tiers.EXIT.forEach(f => {
        chk(10);
        card(M, y, CW, 8, T.surface);
        const exitMetrics = `Alpha ${f.alpha >= 0 ? '+' : ''}${f.alpha.toFixed(2)}%   Fund ${f.fund_xirr.toFixed(2)}% vs Bench ${f.bx.toFixed(2)}%   Held ${(f.days / 365).toFixed(1)}yr`;
        fs(6.5); font('normal'); st(T.inkSoft);
        doc.text(exitMetrics, W - M - 3, y + 5.2, { align: 'right' });
        // Truncate name so it never collides with the right-aligned metrics.
        // CW * 0.55 ≈ 99mm keeps a safe gap even for the longest metric strings.
        const exitNameMaxW = CW * 0.55;
        fs(7); font('bold'); st(T.danger);
        const exitName = (doc.splitTextToSize(`EXIT   ${f.name}`, exitNameMaxW) as string[])[0] ?? '';
        doc.text(exitName, M + 3, y + 5.2);
        y += 9.5;
      });
      y += 4;
    }

    // REVIEW detail section
    if (tiers.REVIEW.length) {
      chk(22);
      sf(T.warningSoft);
      doc.roundedRect(M, y, CW, 8, 1.5, 1.5, 'F');
      fs(8); font('bold'); st(T.warning);
      doc.text('REVIEW — MONITOR CLOSELY', M + 3, y + 5.4);
      y += 10;

      tiers.REVIEW.forEach(f => {
        chk(10);
        card(M, y, CW, 8, T.surface);
        const note = f.days < 730 ? ' (< 2yr)' : '';
        const rvwMetrics = `Alpha ${f.alpha >= 0 ? '+' : ''}${f.alpha.toFixed(2)}%   ${f.fund_xirr.toFixed(2)}% vs ${f.bx.toFixed(2)}%   ${(f.days / 365).toFixed(1)}yr${note}`;
        fs(6.5); font('normal'); st(T.inkSoft);
        doc.text(rvwMetrics, W - M - 3, y + 5.2, { align: 'right' });
        const rvwNameMaxW = CW * 0.55;
        fs(7); font('bold'); st(T.warning);
        const rvwName = (doc.splitTextToSize(`REVIEW   ${f.name}`, rvwNameMaxW) as string[])[0] ?? '';
        doc.text(rvwName, M + 3, y + 5.2);
        y += 9.5;
      });
      y += 4;
    }

    // Key insights
    chk(48); // header bar (8) + gap (6) + at least one 2-line bullet (12) + margin
    sf(T.brand);
    doc.roundedRect(M, y, CW, 8, 1.5, 1.5, 'F');
    fs(8); font('bold'); st(WHITE);
    doc.text('KEY INSIGHTS', M + 3, y + 5.4);
    y += 14;

    const insights: Array<[RGB, string]> = [
      [T.brand600, `${iFunds.length} funds  ·  XIRR ${avgX.toFixed(2)}%  ·  Avg Alpha ${avgA >= 0 ? '+' : ''}${avgA.toFixed(2)}%  ·  ${hitRate}% hit rate`],
    ];
    if (tiers.EXIT.length) {
      insights.push([T.danger, `${tiers.EXIT.length} EXIT candidates - alpha < ${thresholds.exit}% with >= ${thresholds.age}yr holding`]);
    }
    if (tiers.REVIEW.length) {
      insights.push([T.warning, `${tiers.REVIEW.length} REVIEW funds — ${tiers.REVIEW.filter(f => f.days < 730).length} new (<${thresholds.age}yr), ${tiers.REVIEW.filter(f => f.days >= 730).length} borderline`]);
    }
    if (tiers.STAR.length) {
      insights.push([T.gold, `${tiers.STAR.length} STAR funds delivering strong alpha — hold and consider increasing SIP`]);
    }

    insights.forEach(([c, t]) => {
      // Set font first so splitTextToSize uses the correct metrics.
      fs(8); font('normal');
      const lines = doc.splitTextToSize(t, CW - 8) as string[];
      const rowH = lines.length * 4.2 + 2;
      // chk uses the actual line height so a 2-line bullet never overflows.
      chk(rowH + 2);
      sf(c);
      // Keep the bullet dot at least 1.5mm below the page top on overflow pages.
      doc.circle(M + 2.5, Math.max(y - 1.2, M + 1.5), 0.8, 'F');
      st(T.ink);
      doc.text(lines, M + 6, y);
      y += rowH;
    });
  }

  // ─── Render ───────────────────────────────────────────────────────────────
  sf(T.bg);
  doc.rect(0, 0, W, H, 'F');
  drawHeaderStrip();

  if (isFamilyReport) {
    // ── Family Summary Page ───────────────────────────────────────────────
    const summaryStart = 1;

    fs(7); font('bold'); st(T.brand600);
    doc.text(`FAMILY ALPHA REPORT  ·  ${reportDate.toUpperCase()}`, M, y);
    y += 7;

    fs(20); font('bold'); st(T.ink);
    doc.text(familyLabel, M, y);
    y += 6;

    fs(8); font('normal'); st(T.inkMuted);
    doc.text(
      `${byInvestor.size} investors  ·  ${funds.length} total funds  ·  ${reportDate}`,
      M, y
    );
    y += 10;

    // Family-level KPI tiles
    const famAvgA = funds.reduce((s, f) => s + f.alpha, 0) / funds.length;
    const famAvgX = funds.reduce((s, f) => s + f.fund_xirr, 0) / funds.length;
    // const famHitRate = Math.round((funds.filter(f => f.alpha > 0).length / funds.length) * 100);
    const famStars = funds.filter(f => f.signal === 'STAR').length;
    const famExits = funds.filter(f => f.signal === 'EXIT').length;

    {
      const GAP = 3;
      const tileW = (CW - GAP * 5) / 6;
      const tileH = 16;
      const kpis: Array<{ l: string; v: string; c: RGB }> = [
        { l: 'Investors',   v: String(byInvestor.size),                                      c: T.brand },
        { l: 'Total funds', v: String(funds.length),                                          c: T.ink },
        { l: 'Family XIRR', v: `${famAvgX.toFixed(2)}%`,                                     c: T.info },
        { l: 'Family alpha', v: `${famAvgA >= 0 ? '+' : ''}${famAvgA.toFixed(2)}%`,           c: famAvgA >= 0 ? T.success : T.danger },
        { l: 'Star',        v: String(famStars),                                              c: T.gold },
        { l: 'Exit',        v: String(famExits),                                              c: famExits ? T.danger : T.success },
      ];
      kpis.forEach((m, i) => {
        const cx = M + i * (tileW + GAP);
        card(cx, y, tileW, tileH);
        fs(13); font('bold'); st(m.c);
        doc.text(m.v, cx + tileW / 2, y + 9, { align: 'center' });
        fs(6); font('normal'); st(T.inkSoft);
        doc.text(m.l.toUpperCase(), cx + tileW / 2, y + 13.5, { align: 'center' });
      });
      y += tileH + 8;
    }

    // Investor summary table
    sf(T.brand);
    doc.roundedRect(M, y, CW, 8, 1.5, 1.5, 'F');
    fs(8); font('bold'); st(WHITE);
    doc.text('INVESTOR SUMMARY', M + 3, y + 5.4);
    fs(6); font('normal');
    doc.text(`${byInvestor.size} investors — click Download PDF for full per-investor analysis`, W - M - 3, y + 5.4, { align: 'right' });
    y += 8;

    // Summary table columns
    const sCols = [
      { h: 'Investor',  x: M,        w: 52, align: 'left'   as const },
      { h: 'Funds',     x: M + 52,   w: 18, align: 'right'  as const },
      { h: 'XIRR %',   x: M + 70,   w: 23, align: 'right'  as const },
      { h: 'Avg Alpha', x: M + 93,   w: 23, align: 'right'  as const },
      { h: 'Star',      x: M + 116,  w: 16, align: 'center' as const },
      { h: 'Good',      x: M + 132,  w: 16, align: 'center' as const },
      { h: 'Review',    x: M + 148,  w: 16, align: 'center' as const },
      { h: 'Exit',      x: M + 164,  w: 16, align: 'center' as const },
    ];
    const SPAD = 1.5;

    sf(T.surfaceStrong);
    doc.rect(M, y, CW, 6.5, 'F');
    fs(6); font('bold'); st(T.inkSoft);
    sCols.forEach(c => {
      const tx = c.align === 'left' ? c.x + SPAD : c.align === 'right' ? c.x + c.w - SPAD : c.x + c.w / 2;
      doc.text(c.h.toUpperCase(), tx, y + 4.4, { align: c.align });
    });
    y += 6.5;

    let rowIdx = 0;
    for (const [iName, iFunds] of byInvestor) {
      const iAvgA = iFunds.reduce((s, f) => s + f.alpha, 0) / iFunds.length;
      const iAvgX = iFunds.reduce((s, f) => s + f.fund_xirr, 0) / iFunds.length;
      const iTiers: Record<SignalType, number> = { STAR: 0, GOOD: 0, REVIEW: 0, EXIT: 0 };
      iFunds.forEach(f => iTiers[f.signal]++);
      const rowH = 7.5;

      sf(rowIdx % 2 === 0 ? T.surface : T.surfaceMuted);
      doc.rect(M, y, CW, rowH, 'F');

      fs(7); font('bold'); st(T.ink);
      doc.text(iName, sCols[0].x + SPAD, y + 5);

      fs(6.5); font('normal');
      st(T.inkMuted);
      doc.text(String(iFunds.length), sCols[1].x + sCols[1].w - SPAD, y + 5, { align: 'right' });
      st(T.info);
      doc.text(`${iAvgX.toFixed(2)}%`, sCols[2].x + sCols[2].w - SPAD, y + 5, { align: 'right' });
      st(iAvgA >= 0 ? T.success : T.danger);
      doc.text(`${iAvgA >= 0 ? '+' : ''}${iAvgA.toFixed(2)}%`, sCols[3].x + sCols[3].w - SPAD, y + 5, { align: 'right' });
      st(T.gold);
      doc.text(String(iTiers.STAR), sCols[4].x + sCols[4].w / 2, y + 5, { align: 'center' });
      st(T.info);
      doc.text(String(iTiers.GOOD), sCols[5].x + sCols[5].w / 2, y + 5, { align: 'center' });
      st(T.warning);
      doc.text(String(iTiers.REVIEW), sCols[6].x + sCols[6].w / 2, y + 5, { align: 'center' });
      st(iTiers.EXIT > 0 ? T.danger : T.inkSoft);
      doc.text(String(iTiers.EXIT), sCols[7].x + sCols[7].w / 2, y + 5, { align: 'center' });

      y += rowH;
      rowIdx++;
    }

    sectionRanges.push({ startPage: summaryStart, endPage: doc.getNumberOfPages(), label: `${familyLabel} — Family Summary` });

    // ── Per-investor sections ─────────────────────────────────────────────
    for (const [iName, iFunds] of byInvestor) {
      const sectionStart = doc.getNumberOfPages() + 1;

      // Each investor starts on a fresh page with the standard header strip.
      doc.addPage();
      sf(T.bg);
      doc.rect(0, 0, W, H, 'F');
      drawHeaderStrip();

      // Investor section divider banner
      sf(T.brand);
      doc.roundedRect(M, y, CW, 14, 2, 2, 'F');
      fs(6.5); font('normal'); st(WHITE);
      doc.text('INVESTOR SECTION', M + 4, y + 5);
      fs(12); font('bold'); st(WHITE);
      doc.text(iName, M + 4, y + 11.5);
      y += 18;

      renderInvestorContent(iName, iFunds);

      sectionRanges.push({ startPage: sectionStart, endPage: doc.getNumberOfPages(), label: iName });
    }
  } else {
    // ── Single investor — identical to the original layout ────────────────
    renderInvestorContent(investorName || investorNames[0] || 'Client', funds);
    sectionRanges.push({ startPage: 1, endPage: doc.getNumberOfPages(), label: investorName || 'Client' });
  }

  // ─── Disclaimer (once, at the very end) ───────────────────────────────────
  chk(20);
  y += 4;
  sd(T.line); doc.setLineWidth(0.2);
  doc.line(M, y, W - M, y);
  y += 5;
  fs(5.5); font('normal'); st(T.inkFaint);
  const disc =
    `Revised Rules: <${thresholds.age}yr -> REVIEW; >= ${thresholds.age}yr & Alpha < ${thresholds.exit}% -> EXIT; ` +
    `0 to ${thresholds.star}% -> GOOD; >= ${thresholds.star}% -> STAR. Alpha = Fund XIRR - Benchmark XIRR. ` +
    `Benchmarks: Nifty 50 TRI (Large/Flexi/Sectoral/Hybrid/FOF/L&M Cap), NLM250 TRI (Mid Cap), ` +
    `Nifty500 TRI (Small Cap), Nifty MidSmallcap 400 TRI (Mid & Small Cap), ` +
    `Gold Price (Gold), Silver Price (Silver), CRISIL 5.8% (Debt). ` +
    `Mutual fund investments are subject to market risk. ` +
    `Informational only; not investment advice. Prepared by ${distributorName}. Generated: ${reportDate}.`;
  doc.text(doc.splitTextToSize(disc, CW) as string[], M, y);

  // ─── Footer on every page (label is per-section for family reports) ────────
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    sd(T.line); doc.setLineWidth(0.2);
    doc.line(M, H - 10, W - M, H - 10);
    fs(6); font('normal'); st(T.inkSoft);
    doc.text(`${distributorName}  ·  care@echowin.in`, M, H - 5);

    const pageLabel =
      sectionRanges.find(r => p >= r.startPage && p <= r.endPage)?.label ??
      (investorName || 'Client');
    doc.text(
      `Page ${p} of ${totalPages}  ·  ${pageLabel}  ·  AlphaGen  ·  ${reportDate}`,
      W - M, H - 5,
      { align: 'right' }
    );
  }

  // ─── Save ─────────────────────────────────────────────────────────────────
  const safeName = familyLabel.replace(/[^a-z0-9]/gi, '_');
  doc.save(`Alpha_Report_${safeName}_${reportDate.replace(/[^0-9]/g, '')}.pdf`);
}
