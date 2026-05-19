import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function formatPercent(value: number, opts: { sign?: boolean; digits?: number } = {}): string {
  const { sign = false, digits = 2 } = opts;
  const prefix = sign && value >= 0 ? '+' : '';
  return `${prefix}${value.toFixed(digits)}%`;
}

export function formatYears(days: number): string {
  return `${(days / 365).toFixed(1)}yr`;
}

export function truncate(str: string, max: number): string {
  if (str.length <= max) return str;
  return str.slice(0, max - 1) + '…';
}
