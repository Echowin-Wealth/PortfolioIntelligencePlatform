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

export async function generatePDF(
  funds: FundRecord[],
  investorName: string,
  reportDate: string,
  distributorName: string,
  thresholds: AlphaThresholds
): Promise<void> {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const FONT = await registerReportFont(doc);

  // Page geometry
  const W = 210;
  const H = 297;
  const M = 15;                 // side margin
  const CW = W - 2 * M;         // content width = 180
  const FOOTER_H = 14;
  const BOTTOM_Y = H - FOOTER_H;

  let y = 0;

  // ─── Drawing helpers ────────────────────────────────────────────────────
  const sf = (c: RGB) => doc.setFillColor(c[0], c[1], c[2]);
  const st = (c: RGB) => doc.setTextColor(c[0], c[1], c[2]);
  const sd = (c: RGB) => doc.setDrawColor(c[0], c[1], c[2]);
  const font = (w: 'normal' | 'bold' = 'normal') => doc.setFont(FONT, w);
  const fs = (n: number) => doc.setFontSize(n);

  function card(x: number, yy: number, w: number, h: number, fill: RGB = T.surface) {
    sf(fill);
    sd(T.line);
    doc.setLineWidth(0.2);
    doc.roundedRect(x, yy, w, h, 2, 2, 'FD');
  }

  function chk(need: number) {
    if (y + need > BOTTOM_Y - 4) newPage();
  }

  function newPage() {
    doc.addPage();
    sf(T.bg);
    doc.rect(0, 0, W, H, 'F');
    y = M;
  }

  // ─── Tier bucketing + stats ─────────────────────────────────────────────
  const tiers: Record<SignalType, FundRecord[]> = { STAR: [], GOOD: [], REVIEW: [], EXIT: [] };
  funds.forEach((f) => tiers[f.signal].push(f));
  const avgA = funds.reduce((s, f) => s + f.alpha, 0) / funds.length;
  const avgX = funds.reduce((s, f) => s + f.fund_xirr, 0) / funds.length;
  const hitRate = Math.round((funds.filter((f) => f.alpha > 0).length / funds.length) * 100);

  // ─── Page 1 background ──────────────────────────────────────────────────
  sf(T.bg);
  doc.rect(0, 0, W, H, 'F');

  // ─── Header strip ───────────────────────────────────────────────────────
  // Thin line under header, no fill — keep the page airy
  fs(8); font('bold'); st(T.brand600);
  doc.text('ALPHAGEN', M, 11);
  fs(7); font('normal'); st(T.inkSoft);
  doc.text(distributorName.toUpperCase(), W / 2, 11, { align: 'center' });
  doc.text(reportDate, W - M, 11, { align: 'right' });
  sd(T.lineStrong); doc.setLineWidth(0.2);
  doc.line(M, 14, W - M, 14);

  y = 22;

  // ─── Title block ────────────────────────────────────────────────────────
  fs(7); font('bold'); st(T.brand600);
  doc.text(`ALPHA REPORT  ·  ${reportDate.toUpperCase()}`, M, y);
  y += 7;

  fs(20); font('bold'); st(T.ink);
  doc.text(investorName, M, y);
  y += 6;

  fs(8); font('normal'); st(T.inkMuted);
  const subline =
    `${funds.length} funds analysed   ·   portfolio XIRR ${avgX.toFixed(2)}%   ·   ` +
    `average alpha ${avgA >= 0 ? '+' : ''}${avgA.toFixed(2)}%   ·   ${hitRate}% hit rate`;
  doc.text(subline, M, y);
  y += 10;

  // ─── KPI scorecard (6 tiles) ────────────────────────────────────────────
  {
    const GAP = 3;
    const tileW = (CW - GAP * 5) / 6;
    const tileH = 16;
    const ms: Array<{ l: string; v: string; c: RGB }> = [
      { l: 'Total funds', v: String(funds.length), c: T.ink },
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

  // ─── Tier row (4 tiles) ─────────────────────────────────────────────────
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

  // ─── Fund analysis table ────────────────────────────────────────────────
  // Header bar
  sf(T.brand);
  doc.roundedRect(M, y, CW, 8, 1.5, 1.5, 'F');
  fs(8); font('bold'); st([255, 255, 255]);
  doc.text('COMPLETE FUND ANALYSIS', M + 3, y + 5.4);
  fs(6); font('normal');
  doc.text(`Sorted by alpha  ·  ${funds.length} positions`, W - M - 3, y + 5.4, { align: 'right' });
  y += 8;

  // Columns — sum equals CW exactly, single 1mm internal padding convention
  const cols = [
    { h: 'Fund',     x: M,             w: 64, align: 'left'  as const },
    { h: 'Category', x: M + 64,        w: 26, align: 'left'  as const },
    { h: 'Since',    x: M + 90,        w: 16, align: 'left'  as const },
    { h: 'Age',      x: M + 106,       w: 12, align: 'left'  as const },
    { h: 'Bench %',  x: M + 118,       w: 14, align: 'right' as const },
    { h: 'Fund %',   x: M + 132,       w: 14, align: 'right' as const },
    { h: 'Alpha',    x: M + 146,       w: 16, align: 'right' as const },
    { h: 'Signal',   x: M + 162,       w: 18, align: 'center' as const },
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
  cols.forEach((c) => {
    doc.text(c.h.toUpperCase(), colTextX(c), y + 4.4, { align: c.align });
  });
  y += 6.5;

  // Rows
  const sortedFunds = [...funds].sort((a, b) => b.alpha - a.alpha);
  sortedFunds.forEach((f, i) => {
    chk(7);
    const rowY = y;
    const rowH = 6.5;
    sf(i % 2 === 0 ? T.surface : T.surfaceMuted);
    doc.rect(M, rowY, CW, rowH, 'F');

    // Fund name — truncate against actual column width
    fs(7); font('bold'); st(T.ink);
    const nameMaxW = cols[0].w - PAD * 2;
    const nameLines = doc.splitTextToSize(f.name, nameMaxW) as string[];
    doc.text(nameLines[0] ?? '', colTextX(cols[0]), rowY + 4.4);

    // Category
    fs(6.5); font('normal'); st(T.inkSoft);
    const catMaxW = cols[1].w - PAD * 2;
    const catLines = doc.splitTextToSize(f.category ?? '', catMaxW) as string[];
    doc.text(catLines[0] ?? '', colTextX(cols[1]), rowY + 4.4);

    // Since
    fs(6.5); font('normal'); st(T.inkMuted);
    doc.text(f.inv_date ?? '', colTextX(cols[2]), rowY + 4.4);

    // Age
    const young = f.days < 730;
    st(young ? T.warning : T.inkMuted);
    doc.text(`${(f.days / 365).toFixed(1)}yr`, colTextX(cols[3]), rowY + 4.4);

    // Bench %
    font('normal'); st(T.inkSoft);
    doc.text(`${f.bx.toFixed(2)}%`, colTextX(cols[4]), rowY + 4.4, { align: 'right' });

    // Fund %
    st(T.ink);
    doc.text(`${f.fund_xirr.toFixed(2)}%`, colTextX(cols[5]), rowY + 4.4, { align: 'right' });

    // Alpha
    font('bold'); st(f.alpha >= 0 ? T.success : T.danger);
    doc.text(
      `${f.alpha >= 0 ? '+' : ''}${f.alpha.toFixed(2)}%`,
      colTextX(cols[6]),
      rowY + 4.4,
      { align: 'right' }
    );

    // Signal badge
    const badgeW = 14;
    const badgeH = 4.8;
    const badgeX = cols[7].x + (cols[7].w - badgeW) / 2;
    const badgeY = rowY + (rowH - badgeH) / 2;
    sf(SIGNAL_SOFT[f.signal]);
    doc.roundedRect(badgeX, badgeY, badgeW, badgeH, 1.2, 1.2, 'F');
    fs(6); font('bold'); st(SIGNAL_COLOR[f.signal]);
    doc.text(SIGNAL_LABEL[f.signal], badgeX + badgeW / 2, badgeY + 3.4, { align: 'center' });

    y += rowH;
  });

  // Table outer hairline border
  sd(T.line); doc.setLineWidth(0.2);
  doc.rect(M, y - rowsHeight(sortedFunds.length), CW, rowsHeight(sortedFunds.length));
  y += 8;

  // ─── EXIT detail section ────────────────────────────────────────────────
  if (tiers.EXIT.length) {
    chk(22);
    sf(T.dangerSoft);
    doc.roundedRect(M, y, CW, 8, 1.5, 1.5, 'F');
    fs(8); font('bold'); st(T.danger);
    doc.text('EXIT CANDIDATES — CONSIDER SWITCHING', M + 3, y + 5.4);
    y += 10;

    tiers.EXIT.forEach((f) => {
      chk(10);
      card(M, y, CW, 8, T.surface);
      fs(7); font('bold'); st(T.danger);
      doc.text(`EXIT   ${f.name}`, M + 3, y + 5.2);
      fs(6.5); font('normal'); st(T.inkSoft);
      doc.text(
        `Alpha ${f.alpha >= 0 ? '+' : ''}${f.alpha.toFixed(2)}%   Fund ${f.fund_xirr.toFixed(2)}% vs Bench ${f.bx.toFixed(2)}%   Held ${(f.days / 365).toFixed(1)}yr`,
        W - M - 3,
        y + 5.2,
        { align: 'right' }
      );
      y += 9.5;
    });
    y += 4;
  }

  // ─── REVIEW detail section ──────────────────────────────────────────────
  if (tiers.REVIEW.length) {
    chk(22);
    sf(T.warningSoft);
    doc.roundedRect(M, y, CW, 8, 1.5, 1.5, 'F');
    fs(8); font('bold'); st(T.warning);
    doc.text('REVIEW — MONITOR CLOSELY', M + 3, y + 5.4);
    y += 10;

    tiers.REVIEW.forEach((f) => {
      chk(10);
      card(M, y, CW, 8, T.surface);
      fs(7); font('bold'); st(T.warning);
      doc.text(`REVIEW   ${f.name}`, M + 3, y + 5.2);
      fs(6.5); font('normal'); st(T.inkSoft);
      const note = f.days < 730 ? ' (< 2yr)' : '';
      doc.text(
        `Alpha ${f.alpha >= 0 ? '+' : ''}${f.alpha.toFixed(2)}%   ${f.fund_xirr.toFixed(2)}% vs ${f.bx.toFixed(2)}%   ${(f.days / 365).toFixed(1)}yr${note}`,
        W - M - 3,
        y + 5.2,
        { align: 'right' }
      );
      y += 9.5;
    });
    y += 4;
  }

  // ─── Key insights ───────────────────────────────────────────────────────
  chk(36);
  sf(T.brand);
  doc.roundedRect(M, y, CW, 8, 1.5, 1.5, 'F');
  fs(8); font('bold'); st([255, 255, 255]);
  doc.text('KEY INSIGHTS', M + 3, y + 5.4);
  y += 10;

  const insights: Array<[RGB, string]> = [
    [
      T.brand600,
      `${funds.length} funds  ·  XIRR ${avgX.toFixed(2)}%  ·  Avg Alpha ${avgA >= 0 ? '+' : ''}${avgA.toFixed(2)}%  ·  ${hitRate}% hit rate`,
    ],
  ];
  if (tiers.EXIT.length) {
    insights.push([
      T.danger,
      `${tiers.EXIT.length} EXIT candidates - alpha < ${thresholds.exit}% with >= ${thresholds.age}yr holding`,
    ]);
  }
  if (tiers.REVIEW.length) {
    insights.push([
      T.warning,
      `${tiers.REVIEW.length} REVIEW funds — ${tiers.REVIEW.filter((f) => f.days < 730).length} new (<${thresholds.age}yr), ${tiers.REVIEW.filter((f) => f.days >= 730).length} borderline`,
    ]);
  }
  if (tiers.STAR.length) {
    insights.push([
      T.gold,
      `${tiers.STAR.length} STAR funds delivering strong alpha — hold and consider increasing SIP`,
    ]);
  }

  insights.forEach(([c, t]) => {
    chk(8);
    sf(c);
    doc.circle(M + 2.5, y - 1.2, 0.8, 'F');
    st(T.ink); fs(8); font('normal');
    const lines = doc.splitTextToSize(t, CW - 8) as string[];
    doc.text(lines, M + 6, y);
    y += lines.length * 4.2 + 2;
  });

  // ─── Disclaimer ─────────────────────────────────────────────────────────
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

  // ─── Footer on every page ───────────────────────────────────────────────
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    sd(T.line); doc.setLineWidth(0.2);
    doc.line(M, H - 10, W - M, H - 10);
    fs(6); font('normal'); st(T.inkSoft);
    doc.text(`${distributorName}  ·  care@echowin.in`, M, H - 5);
    doc.text(
      `Page ${p} of ${totalPages}  ·  ${investorName}  ·  AlphaGen  ·  ${reportDate}`,
      W - M,
      H - 5,
      { align: 'right' }
    );
  }

  // ─── Save ───────────────────────────────────────────────────────────────
  const safe = investorName.replace(/[^a-z0-9]/gi, '_');
  doc.save(`Alpha_Report_${safe}_${reportDate.replace(/[^0-9]/g, '')}.pdf`);
}

function rowsHeight(rowCount: number): number {
  // Header + N rows of 6.5mm — used to draw the table outer border.
  return 6.5 + 6.5 * rowCount;
}
