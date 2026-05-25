-- AlphaGen — TRI price series benchmarks
-- Replaces the precomputed (index_code, days) -> xirr lookup tables with a raw
-- TRI Close time series. Benchmark XIRR is now computed at runtime from each
-- fund's start date to the latest date in the series (see src/shared/alphaEngine.ts).
-- Run this in the Supabase SQL Editor.

-- ── benchmark_prices ──────────────────────────────────────────────────────────
create table if not exists public.benchmark_prices (
  id          uuid primary key default gen_random_uuid(),
  index_code  text not null check (index_code in ('N50', 'NLM', 'N500')),
  date        date not null,
  tri_close   numeric not null,
  updated_at  timestamptz default now(),
  unique (index_code, date)
);

-- Lookups are always "for an index, ordered by date" — the unique constraint
-- already provides a covering (index_code, date) btree, so no extra index needed.

alter table public.benchmark_prices enable row level security;

-- Public can read (needed for client-side alpha calculations)
create policy "Public read benchmark_prices"
  on public.benchmark_prices for select
  using (true);

-- Only authenticated users (admins) can write
create policy "Auth write benchmark_prices"
  on public.benchmark_prices for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- ── Drop the legacy days→xirr table ──────────────────────────────────────────
-- DEBT is no longer stored at all — it stays a fixed 5.8% constant in code.
drop table if exists public.benchmark_data;
