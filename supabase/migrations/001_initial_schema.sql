-- AlphaGen — Initial Schema
-- Run this in the Supabase SQL Editor

-- ── benchmark_data ──────────────────────────────────────────────────────────
create table if not exists public.benchmark_data (
  id          uuid primary key default gen_random_uuid(),
  index_code  text not null check (index_code in ('N50', 'NLM', 'N500', 'DEBT')),
  days        integer not null,
  xirr        numeric(6,2) not null,
  updated_at  timestamptz default now(),
  unique(index_code, days)
);

-- Enable RLS
alter table public.benchmark_data enable row level security;

-- Public can read benchmark data (needed for alpha calculations)
create policy "Public read benchmark_data"
  on public.benchmark_data for select
  using (true);

-- Only authenticated users (admins) can write
create policy "Auth write benchmark_data"
  on public.benchmark_data for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');


-- ── category_mappings ───────────────────────────────────────────────────────
create table if not exists public.category_mappings (
  id          uuid primary key default gen_random_uuid(),
  category    text not null unique,
  benchmark   text not null check (benchmark in ('N50', 'NLM', 'N500', 'DEBT')),
  keywords    text[] not null default '{}'
);

alter table public.category_mappings enable row level security;

create policy "Public read category_mappings"
  on public.category_mappings for select
  using (true);

create policy "Auth write category_mappings"
  on public.category_mappings for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');


-- ── rate_limits ─────────────────────────────────────────────────────────────
create table if not exists public.rate_limits (
  ip_hash     text not null,
  count       integer not null default 0,
  window_date date not null default current_date,
  primary key (ip_hash, window_date)
);

alter table public.rate_limits enable row level security;

-- Only service role can access rate_limits (via Edge Function with service_role key)
-- No public policies = no client access


-- ── report_history ──────────────────────────────────────────────────────────
create table if not exists public.report_history (
  id           uuid primary key default gen_random_uuid(),
  investor     text not null default 'Unknown',
  fund_count   integer not null default 0,
  avg_alpha    numeric(6,2) not null default 0,
  avg_xirr     numeric(6,2) not null default 0,
  star_count   integer not null default 0,
  exit_count   integer not null default 0,
  generated_by text not null default 'client' check (generated_by in ('client', 'admin')),
  created_at   timestamptz default now()
);

alter table public.report_history enable row level security;

-- Authenticated users (admins) can read all history
create policy "Auth read report_history"
  on public.report_history for select
  using (auth.role() = 'authenticated');

-- No client insert policy — inserts happen via Edge Function with service_role


-- ── Seed: N50 benchmark data ─────────────────────────────────────────────────
insert into public.benchmark_data (index_code, days, xirr) values
('N50',2534,11.8),('N50',2528,11.8),('N50',2521,11.8),('N50',2401,11.5),('N50',2400,11.5),
('N50',2305,12.1),('N50',2281,12.1),('N50',2275,12.1),('N50',2234,12.5),('N50',2172,11.5),
('N50',2108,11.0),('N50',2057,14.5),('N50',2054,15.5),('N50',2053,15.5),('N50',2051,14.5),
('N50',2047,15.5),('N50',2044,14.0),('N50',2032,14.2),('N50',2030,14.2),('N50',1917,9.2),
('N50',1918,9.2),('N50',1891,9.2),('N50',1780,9.2),('N50',1659,7.9),('N50',1640,7.9),
('N50',1515,9.17),('N50',1514,9.5),('N50',1501,9.5),('N50',1499,9.5),('N50',1493,9.5),
('N50',1381,8.5),('N50',1380,8.5),('N50',1385,8.5),('N50',1379,8.5),('N50',1301,9.0),
('N50',1281,9.0),('N50',1235,7.94),('N50',1234,7.94),('N50',1233,7.94),('N50',1232,7.94),
('N50',1224,7.94),('N50',1221,7.94),('N50',1200,7.8),('N50',1192,7.8),('N50',1134,9.8),
('N50',1051,9.5),('N50',1042,9.5),('N50',1010,8.5),('N50',843,5.5),('N50',842,5.5),
('N50',812,5.5),('N50',808,5.5),('N50',776,5.5),('N50',763,5.5),('N50',744,5.5),
('N50',730,5.5),('N50',706,5.5),('N50',700,5.5),('N50',667,8.5),('N50',625,5.0),
('N50',470,8.2),('N50',400,7.5),('N50',350,5.6),('N50',238,5.5),('N50',232,5.5),
('N50',231,5.5),('N50',230,5.5),('N50',21,9.2)
on conflict (index_code, days) do update set xirr = excluded.xirr, updated_at = now();

-- ── Seed: NLM benchmark data ─────────────────────────────────────────────────
insert into public.benchmark_data (index_code, days, xirr) values
('NLM',2534,13.8),('NLM',2528,12.0),('NLM',2521,13.8),('NLM',2401,14.0),('NLM',2400,14.0),
('NLM',2305,15.46),('NLM',2281,15.46),('NLM',2275,11.84),('NLM',2172,13.5),('NLM',2108,13.5),
('NLM',2057,16.5),('NLM',2054,15.5),('NLM',2053,15.5),('NLM',2051,16.5),('NLM',2047,16.5),
('NLM',2032,16.0),('NLM',2030,16.0),('NLM',1918,12.1),('NLM',1780,11.05),('NLM',1659,9.5),
('NLM',1640,9.5),('NLM',1515,11.5),('NLM',1514,11.72),('NLM',1499,11.72),('NLM',1493,11.72),
('NLM',1385,13.0),('NLM',1381,13.0),('NLM',1380,13.0),('NLM',1379,13.0),('NLM',1301,12.5),
('NLM',1281,12.0),('NLM',1235,13.86),('NLM',1234,13.86),('NLM',1233,13.86),('NLM',1232,13.86),
('NLM',1224,13.86),('NLM',1221,13.86),('NLM',1200,13.5),('NLM',1192,13.8),('NLM',1134,13.0),
('NLM',1051,12.5),('NLM',1042,12.5),('NLM',843,6.0),('NLM',812,6.0),('NLM',808,6.0),
('NLM',776,6.0),('NLM',763,6.0),('NLM',744,6.0),('NLM',730,6.0),('NLM',706,6.0),
('NLM',667,9.8),('NLM',625,6.0),('NLM',470,9.0),('NLM',350,6.0),('NLM',238,9.0)
on conflict (index_code, days) do update set xirr = excluded.xirr, updated_at = now();

-- ── Seed: N500 benchmark data ────────────────────────────────────────────────
insert into public.benchmark_data (index_code, days, xirr) values
('N500',2534,12.5),('N500',2528,12.0),('N500',2521,12.5),('N500',2401,13.0),('N500',2400,13.0),
('N500',2305,13.0),('N500',2281,13.0),('N500',2172,12.0),('N500',2108,12.0),('N500',2054,15.5),
('N500',2053,15.5),('N500',2047,15.5),('N500',1918,12.0),('N500',1780,11.42),('N500',1659,10.0),
('N500',1514,12.0),('N500',1499,12.0),('N500',1493,12.0),('N500',1301,11.0),('N500',1281,11.0),
('N500',1134,11.0),('N500',843,5.5),('N500',812,5.5),('N500',808,5.5),('N500',776,5.5),
('N500',763,5.5),('N500',744,5.5),('N500',730,5.5),('N500',706,5.5),('N500',667,9.0),
('N500',470,9.5)
on conflict (index_code, days) do update set xirr = excluded.xirr, updated_at = now();

-- ── Seed: Default category mappings ─────────────────────────────────────────
insert into public.category_mappings (category, benchmark, keywords) values
('Equity - Large Cap Fund', 'N50', '{"large cap","large-cap","bluechip","nifty 50"}'),
('Equity - Flexi Cap Fund', 'N50', '{"flexi cap","flexicap","multi cap","multicap"}'),
('Equity - ELSS', 'N50', '{"elss","tax saver","tax saving","80c"}'),
('Equity - Sectoral/Thematic', 'N50', '{"sectoral","thematic","infrastructure","banking","technology"}'),
('Equity - Large & Mid Cap Fund', 'NLM', '{"large & mid","large and mid","largemidc","large mid"}'),
('Equity - Mid Cap Fund', 'NLM', '{"mid cap","midcap","mid-cap"}'),
('Equity - Small Cap Fund', 'N500', '{"small cap","smallcap","small-cap"}'),
('Hybrid - Aggressive Hybrid Fund', 'N50', '{"aggressive hybrid","equity hybrid","balanced advantage"}'),
('Hybrid - Balanced Advantage Fund', 'N50', '{"balanced advantage","dynamic asset"}'),
('FOF - Domestic', 'N50', '{"fof","fund of fund","fund of funds"}'),
('Debt - Low Duration Fund', 'DEBT', '{"low duration","debt","liquid","ultra short","overnight","money market"}')
on conflict (category) do update set benchmark = excluded.benchmark, keywords = excluded.keywords;
