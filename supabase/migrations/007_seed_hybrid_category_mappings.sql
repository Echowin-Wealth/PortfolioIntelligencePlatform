-- AlphaGen — seed the full set of AMFI hybrid scheme categories
-- Hybrid funds are benchmarked against Nifty 50 TRI (N50) per the product's
-- convention. This lists every AMFI hybrid subcategory so admins see and control
-- them in the Category Mapping page. Keywords are kept specific so they don't
-- collide with debt rules (e.g. "dynamic asset" vs the debt "dynamic bond").
-- Run this in the Supabase SQL Editor.

insert into public.category_mappings (category, benchmark, keywords) values
('Hybrid - Arbitrage Fund', 'N50', '{"arbitrage"}'),
('Hybrid - Conservative Hybrid Fund', 'N50', '{"conservative hybrid"}'),
('Hybrid - Dynamic Asset Allocation', 'N50', '{"dynamic asset allocation","dynamic asset"}'),
('Hybrid - Balanced Advantage Fund', 'N50', '{"balanced advantage"}'),
('Hybrid - Balanced Hybrid Fund', 'N50', '{"balanced hybrid"}'),
('Hybrid - Aggressive Hybrid Fund', 'N50', '{"aggressive hybrid","equity hybrid"}'),
('Hybrid - Equity Savings Fund', 'N50', '{"equity savings"}'),
('Hybrid - Multi Asset Allocation', 'N50', '{"multi asset allocation","multi asset"}')
on conflict (category) do update set benchmark = excluded.benchmark, keywords = excluded.keywords;
