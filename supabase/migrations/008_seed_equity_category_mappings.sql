-- AlphaGen — seed the full set of AMFI equity scheme categories
-- Cap-tiered funds use the matching index (Large & Mid / Mid -> NLM, Small ->
-- N500); everything else (flexi/multi cap, value, focused, ELSS, thematic and
-- the sector funds, international) benchmarks against Nifty 50 TRI (N50).
-- Keywords are specific; the longest match wins, so cap rules don't collide.
-- Run this in the Supabase SQL Editor.

insert into public.category_mappings (category, benchmark, keywords) values
('Equity - Multi Cap Fund', 'N50', '{"multi cap","multicap"}'),
('Equity - Flexi Cap Fund', 'N50', '{"flexi cap","flexicap"}'),
('Equity - Large Cap Fund', 'N50', '{"large cap","large-cap","bluechip"}'),
('Equity - Large & Mid Cap Fund', 'NLM', '{"large & mid","large and mid","large mid","largemidc"}'),
('Equity - Mid Cap Fund', 'NLM', '{"mid cap","midcap","mid-cap"}'),
('Equity - Small Cap Fund', 'N500', '{"small cap","smallcap","small-cap"}'),
('Equity - Dividend Yield Fund', 'N50', '{"dividend yield"}'),
('Equity - Value/Contra Fund', 'N50', '{"value fund","value/contra","contra"}'),
('Equity - Focused Fund', 'N50', '{"focused"}'),
('Equity - ELSS', 'N50', '{"elss","tax saver","tax saving","80c"}'),
('Equity - Thematic', 'N50', '{"thematic"}'),
('Equity - Thematic-Infrastructure', 'N50', '{"thematic-infra","infrastructure"}'),
('Equity - Sector-Banking', 'N50', '{"sector-banking","banking sector"}'),
('Equity - Sector-Consumption', 'N50', '{"sector-consumption","consumption"}'),
('Equity - Sector-Energy & Power', 'N50', '{"sector-energy","energy & power","energy and power"}'),
('Equity - Sector-MNC', 'N50', '{"sector-mnc","mnc"}'),
('Equity - Sector-Pharma & Healthcare', 'N50', '{"pharma","healthcare"}'),
('Equity - Sector-Service Industry', 'N50', '{"sector-service","service industry"}'),
('Equity - Sector-Technology', 'N50', '{"sector-technology","technology"}'),
('Equity - International', 'N50', '{"international"}')
on conflict (category) do update set benchmark = excluded.benchmark, keywords = excluded.keywords;
