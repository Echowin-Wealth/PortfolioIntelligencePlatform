import { supabase } from './supabaseClient';
import type { BenchmarkEntry, FundRecord, RawFundRecord, SignalType, AlphaThresholds } from './types';

// Fallback hardcoded tables (used if Supabase fetch fails)
const N50_FALLBACK: Record<number, number> = {
  2534:11.8,2528:11.8,2521:11.8,2401:11.5,2400:11.5,2305:12.1,2281:12.1,2275:12.1,
  2234:12.5,2172:11.5,2108:11.0,2057:14.5,2054:15.5,2053:15.5,2051:14.5,2047:15.5,
  2044:14.0,2032:14.2,2030:14.2,1917:9.2,1918:9.2,1891:9.2,1780:9.2,1659:7.9,1640:7.9,
  1515:9.17,1514:9.5,1501:9.5,1499:9.5,1493:9.5,1381:8.5,1380:8.5,1385:8.5,1379:8.5,
  1301:9.0,1281:9.0,1235:7.94,1234:7.94,1233:7.94,1232:7.94,1224:7.94,1221:7.94,
  1200:7.8,1192:7.8,1134:9.8,1051:9.5,1042:9.5,1010:8.5,843:5.5,842:5.5,812:5.5,
  808:5.5,776:5.5,763:5.5,744:5.5,730:5.5,706:5.5,700:5.5,667:8.5,625:5.0,470:8.2,
  400:7.5,350:5.6,238:5.5,232:5.5,231:5.5,230:5.5,21:9.2,
};

const NLM_FALLBACK: Record<number, number> = {
  2534:13.8,2528:12.0,2521:13.8,2401:14.0,2400:14.0,2305:15.46,2281:15.46,2275:11.84,
  2172:13.5,2108:13.5,2057:16.5,2054:15.5,2053:15.5,2051:16.5,2047:16.5,2032:16.0,
  2030:16.0,1918:12.1,1780:11.05,1659:9.5,1640:9.5,1515:11.5,1514:11.72,1499:11.72,
  1493:11.72,1385:13.0,1381:13.0,1380:13.0,1379:13.0,1301:12.5,1281:12.0,1235:13.86,
  1234:13.86,1233:13.86,1232:13.86,1224:13.86,1221:13.86,1200:13.5,1192:13.8,1134:13.0,
  1051:12.5,1042:12.5,843:6.0,812:6.0,808:6.0,776:6.0,763:6.0,744:6.0,730:6.0,706:6.0,
  667:9.8,625:6.0,470:9.0,350:6.0,238:9.0,
};

const N500_FALLBACK: Record<number, number> = {
  2534:12.5,2528:12.0,2521:12.5,2401:13.0,2400:13.0,2305:13.0,2281:13.0,2172:12.0,
  2108:12.0,2054:15.5,2053:15.5,2047:15.5,1918:12.0,1780:11.42,1659:10.0,1514:12.0,
  1499:12.0,1493:12.0,1301:11.0,1281:11.0,1134:11.0,843:5.5,812:5.5,808:5.5,776:5.5,
  763:5.5,744:5.5,730:5.5,706:5.5,667:9.0,470:9.5,
};

type BenchTable = Record<number, number>;

// Cache so we don't re-fetch on every call within a session
let cachedTables: Record<string, BenchTable> | null = null;

export async function loadBenchmarkTables(): Promise<Record<string, BenchTable>> {
  if (cachedTables) return cachedTables;

  const { data, error } = await supabase
    .from('benchmark_data')
    .select('index_code, days, xirr');

  if (error || !data || data.length === 0) {
    // Fall back to hardcoded tables
    cachedTables = { N50: N50_FALLBACK, NLM: NLM_FALLBACK, N500: N500_FALLBACK };
    return cachedTables;
  }

  const tables: Record<string, BenchTable> = { N50: {}, NLM: {}, N500: {}, DEBT: {} };
  for (const row of data as BenchmarkEntry[]) {
    if (!tables[row.index_code]) tables[row.index_code] = {};
    tables[row.index_code][row.days] = Number(row.xirr);
  }

  // Fill missing tables with fallbacks
  if (Object.keys(tables.N50).length === 0) tables.N50 = N50_FALLBACK;
  if (Object.keys(tables.NLM).length === 0) tables.NLM = NLM_FALLBACK;
  if (Object.keys(tables.N500).length === 0) tables.N500 = N500_FALLBACK;

  cachedTables = tables;
  return cachedTables;
}

export function invalidateBenchmarkCache() {
  cachedTables = null;
}

function closest(table: BenchTable, days: number): number {
  const keys = Object.keys(table).map(Number).sort((a, b) => Math.abs(a - days) - Math.abs(b - days));
  return keys.length > 0 ? table[keys[0]] : 8;
}

export function benchFromTables(tables: Record<string, BenchTable>, category: string, days: number): number {
  const c = category.toLowerCase();
  if (/duration|debt|liquid|ultra short/.test(c)) return 5.8;
  if (/small/.test(c)) return closest(tables['N500'] ?? N500_FALLBACK, days);
  if (/mid/.test(c) && !/large/.test(c)) return closest(tables['NLM'] ?? NLM_FALLBACK, days);
  return closest(tables['N50'] ?? N50_FALLBACK, days);
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
  const tables = await loadBenchmarkTables();

  return raw
    .filter((f) => f && typeof f.fund_xirr === 'number' && f.days)
    .map((f) => {
      const bx = benchFromTables(tables, f.category ?? '', +f.days);
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
