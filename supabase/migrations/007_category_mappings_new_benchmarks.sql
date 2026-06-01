-- AlphaGen — widen category_mappings benchmark CHECK for new TRI series
-- Mirrors migration 006 for benchmark_prices. The category->benchmark mapping
-- must accept the same set of index codes the app supports
-- (src/shared/types.ts BenchmarkIndex): NLM renamed to NLM250, plus new
-- MIDSMALL / GOLD / SILVER series. Without this, mapping a category to any of
-- the new benchmarks fails category_mappings_benchmark_check.
-- Run this in the Supabase SQL Editor.

-- Migrate any legacy 'NLM' mappings to the new 'NLM250' code first.
update public.category_mappings
  set benchmark = 'NLM250'
  where benchmark = 'NLM';

alter table public.category_mappings
  drop constraint if exists category_mappings_benchmark_check;

alter table public.category_mappings
  add constraint category_mappings_benchmark_check
  check (benchmark in ('N50', 'NLM250', 'N500', 'MIDSMALL', 'GOLD', 'SILVER', 'DEBT'));
