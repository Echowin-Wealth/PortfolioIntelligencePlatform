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

export type BenchmarkIndex = 'N50' | 'NLM250' | 'N500' | 'MIDSMALL' | 'GOLD' | 'SILVER' | 'DEBT';

export interface BenchmarkPrice {
  id?: string;
  index_code: BenchmarkIndex;
  date: string; // ISO yyyy-mm-dd
  tri_close: number;
  updated_at?: string;
}

export interface CategoryMapping {
  id?: string;
  category: string;
  benchmark: BenchmarkIndex;
  keywords: string[];
}

export interface ReportHistory {
  id?: string;
  user_id?: string | null;
  investor: string;
  fund_count: number;
  avg_alpha: number;
  avg_xirr: number;
  star_count: number;
  exit_count: number;
  generated_by: 'client' | 'admin';
  funds_json?: RawFundRecord[] | null;
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
