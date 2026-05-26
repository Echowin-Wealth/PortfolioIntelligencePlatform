-- AlphaGen — seed remaining categories from the equity chart that aren't equity
-- Floater Fund invests in floating-rate debt -> benchmarked against DEBT.
-- Retirement and Children's funds are AMFI "solution-oriented" schemes; treated
-- as equity-oriented here -> benchmarked against Nifty 50 TRI (N50).
-- (Disclaimer / Load / Glossary from the chart are legend labels, not categories.)
-- Run this in the Supabase SQL Editor.

insert into public.category_mappings (category, benchmark, keywords) values
('Debt - Floater Fund', 'DEBT', '{"floater","floating rate"}'),
('Solution Oriented - Retirement Fund', 'N50', '{"retirement"}'),
('Solution Oriented - Children''s Fund', 'N50', '{"children","childrens","children''s"}')
on conflict (category) do update set benchmark = excluded.benchmark, keywords = excluded.keywords;
