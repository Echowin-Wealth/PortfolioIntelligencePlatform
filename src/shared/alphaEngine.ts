import { supabase } from './supabaseClient';
import type {
  BenchmarkIndex,
  BenchmarkPrice,
  FundRecord,
  RawFundRecord,
  SignalType,
  AlphaThresholds,
} from './types';

// DEBT has no TRI series — it stays a fixed annualised rate.
const DEBT_RATE = 5.8;
// Used only when an equity index has no TRI series uploaded yet, so the product
// keeps working until benchmark data is loaded.
const EQUITY_FALLBACK = 12;

const MS_PER_YEAR = 365 * 24 * 60 * 60 * 1000;

// ── Date parsing ──────────────────────────────────────────────────────────────
const MONTHS: Record<string, number> = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
  jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
};

/**
 * Parse the date formats this app sees, returning a UTC timestamp (ms) or null:
 *  - ISO            "2016-05-17"        (benchmark_prices.date column)
 *  - DD-MMM-YYYY    "17-May-2016"       (TRI xlsx files)
 *  - DD-MMM-YY      "14-Jun-23"         (statement inv_date → 2023)
 *  - DD/MM/YYYY     numeric day-first
 */
export function parseFlexibleDate(input: string): number | null {
  if (!input) return null;
  const str = String(input).trim();

  let m = str.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (m) return Date.UTC(+m[1], +m[2] - 1, +m[3]);

  m = str.match(/^(\d{1,2})[-/ ]([A-Za-z]{3,})[-/ ](\d{2,4})$/);
  if (m) {
    const mon = MONTHS[m[2].slice(0, 3).toLowerCase()];
    if (mon === undefined) return null;
    let y = +m[3];
    if (y < 100) y += y < 70 ? 2000 : 1900;
    return Date.UTC(y, mon, +m[1]);
  }

  m = str.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/);
  if (m) {
    let y = +m[3];
    if (y < 100) y += y < 70 ? 2000 : 1900;
    return Date.UTC(y, +m[2] - 1, +m[1]);
  }

  const t = Date.parse(str);
  return isNaN(t) ? null : t;
}

// ── XIRR ────────────────────────────────────────────────────────────────────
interface CashFlow {
  amount: number;
  t: number; // UTC ms
}

/**
 * XIRR — the annualised rate r solving Σ amount / (1+r)^(years from first flow) = 0.
 * Newton–Raphson with a bisection fallback. Returns a fraction (0.12 = 12%).
 * For the 2-cash-flow benchmark case this equals point-to-point CAGR.
 */
export function xirr(flows: CashFlow[]): number {
  if (flows.length < 2) return 0;
  const t0 = flows[0].t;
  const yr = (t: number) => (t - t0) / MS_PER_YEAR;
  const npv = (r: number) =>
    flows.reduce((s, f) => s + f.amount / Math.pow(1 + r, yr(f.t)), 0);
  const dnpv = (r: number) =>
    flows.reduce((s, f) => s - (yr(f.t) * f.amount) / Math.pow(1 + r, yr(f.t) + 1), 0);

  let r = 0.1;
  for (let i = 0; i < 100; i++) {
    const f = npv(r);
    if (Math.abs(f) < 1e-7) return r;
    const d = dnpv(r);
    if (d === 0) break;
    let nr = r - f / d;
    if (!isFinite(nr)) break;
    if (nr <= -0.9999) nr = (r - 0.9999) / 2; // stay above -100%
    if (Math.abs(nr - r) < 1e-9) return nr;
    r = nr;
  }

  // Bisection fallback on [-0.9999, 10]
  let lo = -0.9999;
  let hi = 10;
  let flo = npv(lo);
  for (let i = 0; i < 200; i++) {
    const mid = (lo + hi) / 2;
    const fm = npv(mid);
    if (Math.abs(fm) < 1e-7) return mid;
    if (flo < 0 === fm < 0) {
      lo = mid;
      flo = fm;
    } else {
      hi = mid;
    }
  }
  return (lo + hi) / 2;
}

// ── Benchmark TRI series ──────────────────────────────────────────────────────
interface Bar {
  t: number; // UTC ms
  v: number; // TRI close
}
type SeriesMap = Record<BenchmarkIndex, Bar[]>;

// Cache so we don't re-fetch on every call within a session
let cachedSeries: SeriesMap | null = null;

export async function loadBenchmarkSeries(): Promise<SeriesMap> {
  if (cachedSeries) return cachedSeries;

  const map: SeriesMap = { N50: [], NLM: [], N500: [] };
  const PAGE = 1000; // Supabase caps select at 1000 rows — page through

  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase
      .from('benchmark_prices')
      .select('index_code, date, tri_close')
      .order('date', { ascending: true })
      .range(from, from + PAGE - 1);

    if (error || !data || data.length === 0) break;
    for (const row of data as BenchmarkPrice[]) {
      const t = parseFlexibleDate(row.date);
      if (t === null || !map[row.index_code]) continue;
      map[row.index_code].push({ t, v: Number(row.tri_close) });
    }
    if (data.length < PAGE) break;
  }

  for (const k of Object.keys(map) as BenchmarkIndex[]) {
    map[k].sort((a, b) => a.t - b.t);
  }
  cachedSeries = map;
  return cachedSeries;
}

export function invalidateBenchmarkCache() {
  cachedSeries = null;
}

/** TRI bar on `target` or the nearest prior trading day; first bar if target precedes the series. */
function triOnOrBefore(series: Bar[], target: number): Bar | null {
  if (series.length === 0) return null;
  if (target <= series[0].t) return series[0];
  let lo = 0;
  let hi = series.length - 1;
  let ans = 0;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (series[mid].t <= target) {
      ans = mid;
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }
  return series[ans];
}

function indexForCategory(category: string): BenchmarkIndex | 'DEBT' {
  const c = category.toLowerCase();
  if (/duration|debt|liquid|ultra short/.test(c)) return 'DEBT';
  if (/small/.test(c)) return 'N500';
  if (/mid/.test(c) && !/large/.test(c)) return 'NLM';
  return 'N50';
}

/**
 * Benchmark XIRR (%) for a fund: the index return from the fund's start date
 * (inv_date) to the latest date in the TRI series, computed via XIRR with the
 * start TRI as a negative outflow and the end TRI as a positive inflow.
 */
export function benchXirrFromSeries(
  seriesMap: SeriesMap,
  category: string,
  invDate: string
): number {
  const idx = indexForCategory(category ?? '');
  if (idx === 'DEBT') return DEBT_RATE;

  const series = seriesMap[idx] ?? [];
  if (series.length === 0) return EQUITY_FALLBACK;

  const start = parseFlexibleDate(invDate);
  if (start === null) return EQUITY_FALLBACK;

  const startBar = triOnOrBefore(series, start);
  const endBar = series[series.length - 1];
  if (!startBar || !endBar || startBar.t >= endBar.t || startBar.v <= 0) {
    return EQUITY_FALLBACK;
  }

  const r = xirr([
    { amount: -startBar.v, t: startBar.t },
    { amount: endBar.v, t: endBar.t },
  ]);
  if (!isFinite(r)) return EQUITY_FALLBACK;
  return Math.round(r * 100 * 100) / 100; // fraction → percent, 2dp
}

export function classify(alpha: number, days: number, thresholds: AlphaThresholds): SignalType {
  const yrs = days / 365.25;
  if (yrs < thresholds.age) return 'REVIEW';
  if (alpha < thresholds.exit) return 'EXIT';
  if (alpha < 0) return 'REVIEW';
  if (alpha < thresholds.star) return 'GOOD';
  return 'STAR';
}

export async function processRawFunds(
  raw: RawFundRecord[],
  thresholds: AlphaThresholds
): Promise<FundRecord[]> {
  const series = await loadBenchmarkSeries();

  return raw
    .filter((f) => f && typeof f.fund_xirr === 'number' && f.days)
    .map((f) => {
      const bx = benchXirrFromSeries(series, f.category ?? '', f.inv_date ?? '');
      const alpha = Math.round((+f.fund_xirr - bx) * 100) / 100;
      const signal = classify(alpha, +f.days, thresholds);
      return {
        ...f,
        days: +f.days,
        fund_xirr: +f.fund_xirr,
        bx,
        alpha,
        signal,
      } as FundRecord;
    });
}
