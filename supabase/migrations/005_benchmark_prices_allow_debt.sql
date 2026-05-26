-- AlphaGen — allow a DEBT TRI series in benchmark_prices
-- DEBT was previously a fixed 5.8% constant in code. It now carries an uploadable
-- TRI series like N50/NLM/N500, so widen the index_code CHECK to permit 'DEBT'.
-- The fixed 5.8% remains only as a code-side fallback until a series is uploaded.
-- Run this in the Supabase SQL Editor.

alter table public.benchmark_prices
  drop constraint if exists benchmark_prices_index_code_check;

alter table public.benchmark_prices
  add constraint benchmark_prices_index_code_check
  check (index_code in ('N50', 'NLM', 'N500', 'DEBT'));
