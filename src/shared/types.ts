export type SignalType = 'STAR' | 'GOOD' | 'REVIEW' | 'EXIT';

export interface FundRecord {
  name: string;
  category: string;
  inv_date: string;
  days: number;
  fund_xirr: number;
  investor_name?: string;
  bx: number;
  alpha: number;
  signal: SignalType;
}

export interface RawFundRecord {
  name: string;
  category: string;
  inv_date: string;
  days: number;
  fund_xirr: number;
  investor_name?: string;
}

export interface BenchmarkEntry {
  id?: string;
  index_code: 'N50' | 'NLM' | 'N500' | 'DEBT';
  days: number;
  xirr: number;
  updated_at?: string;
}

export interface CategoryMapping {
  id?: string;
  category: string;
  benchmark: 'N50' | 'NLM' | 'N500' | 'DEBT';
  keywords: string[];
}

export interface ReportHistory {
  id?: string;
  investor: string;
  fund_count: number;
  avg_alpha: number;
  avg_xirr: number;
  star_count: number;
  exit_count: number;
  generated_by: 'client' | 'admin';
  created_at?: string;
}

export interface AlphaThresholds {
  star: number;
  good: number;
  exit: number;
  age: number;
}

export const DEFAULT_THRESHOLDS: AlphaThresholds = {
  star: 3,
  good: 0,
  exit: -1,
  age: 2,
};

export const SIG_LABELS: Record<SignalType, string> = {
  STAR: '★ STAR',
  GOOD: '✓ GOOD',
  REVIEW: '⚠ REVIEW',
  EXIT: '✕ EXIT',
};
