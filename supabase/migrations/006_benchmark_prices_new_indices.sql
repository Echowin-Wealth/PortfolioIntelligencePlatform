-- AlphaGen — widen benchmark_prices index_code CHECK for new TRI series
-- The app (src/shared/types.ts BenchmarkIndex) now supports additional indices:
--   NLM was renamed NLM250, plus new MIDSMALL / GOLD / SILVER series.
-- The previous constraint (migration 005) only allowed N50/NLM/N500/DEBT, so
-- uploading any of the new codes failed benchmark_prices_index_code_check.
-- Run this in the Supabase SQL Editor.

-- Migrate any legacy 'NLM' rows to the new 'NLM250' code first.
update public.benchmark_prices
  set index_code = 'NLM250'
  where index_code = 'NLM';

alter table public.benchmark_prices
  drop constraint if exists benchmark_prices_index_code_check;

alter table public.benchmark_prices
  add constraint benchmark_prices_index_code_check
  check (index_code in ('N50', 'NLM250', 'N500', 'MIDSMALL', 'GOLD', 'SILVER', 'DEBT'));
