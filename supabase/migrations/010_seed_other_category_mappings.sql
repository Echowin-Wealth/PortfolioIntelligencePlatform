-- AlphaGen — seed the AMFI "Other Schemes" group: ETFs, Fund-of-Funds, Index
-- Funds, plus the new SEBI Specialized Investment Fund (SIF). These don't start
-- with Debt/Hybrid/Equity, so the admin Category Mapping page files them under
-- the "Others" tab. FOF-Debt is the only debt-oriented one -> DEBT; everything
-- else benchmarks against Nifty 50 TRI (N50).
--
-- NOTE: Gold/Silver ETFs are commodity funds with no matching index in the
-- schema's four benchmarks (N50/NLM/N500/DEBT). They're seeded against N50 so
-- they're visible and editable in the admin page, but Nifty 50 is NOT a
-- meaningful benchmark for metals — revisit if a commodity TRI series is added.
--
-- Keywords cover hyphenated and spaced variants of the AMFI category strings;
-- the longest match wins, so "index funds other" beats "index fund".
-- Run this in the Supabase SQL Editor.

insert into public.category_mappings (category, benchmark, keywords) values
('ETFs - Gold Fund', 'N50', '{"gold"}'),
('ETFs - Silver Fund', 'N50', '{"silver"}'),
('FOF - Overseas', 'N50', '{"fof-overseas","fof - overseas","overseas fof","overseas"}'),
('FOF - Domestic', 'N50', '{"fof-domestic","fof - domestic","domestic fof"}'),
('FOF - Debt Oriented', 'DEBT', '{"fof-debt","fof - debt","debt oriented fof","debt oriented"}'),
('FOF - Equity Oriented', 'N50', '{"fof-equity","fof - equity","equity oriented fof","equity oriented"}'),
('ETF - Others', 'N50', '{"etf - others","etf-others","etf others"}'),
('Index Fund', 'N50', '{"index fund"}'),
('Index - Nifty Fund', 'N50', '{"index nifty","nifty index","index - nifty"}'),
('Index - Nifty Next 50', 'N50', '{"nifty next 50","nifty next","next 50"}'),
('Index - Sensex Fund', 'N50', '{"sensex"}'),
('Index Funds Other', 'N50', '{"index funds other","index fund other"}'),
('Specialized Investment Fund (SIF)', 'N50', '{"specialized investment","sif"}')
on conflict (category) do update set benchmark = excluded.benchmark, keywords = excluded.keywords;
