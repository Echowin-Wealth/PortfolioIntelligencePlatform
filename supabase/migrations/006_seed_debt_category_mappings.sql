-- AlphaGen — seed the full set of AMFI debt scheme categories
-- The engine now reads category_mappings to pick each fund's benchmark, with the
-- longest matching keyword winning (so "banking and psu" beats "banking"). This
-- lists every AMFI debt subcategory so admins see and control them in the
-- Category Mapping page, all benchmarked against the DEBT TRI series.
-- Run this in the Supabase SQL Editor.

insert into public.category_mappings (category, benchmark, keywords) values
('Debt - Overnight Fund', 'DEBT', '{"overnight"}'),
('Debt - Money Market Fund', 'DEBT', '{"money market"}'),
('Debt - Liquid Fund', 'DEBT', '{"liquid"}'),
('Debt - Ultra Short Duration Fund', 'DEBT', '{"ultra short duration","ultra short"}'),
('Debt - Low Duration Fund', 'DEBT', '{"low duration"}'),
('Debt - Short Duration Fund', 'DEBT', '{"short duration"}'),
('Debt - Medium Duration Fund', 'DEBT', '{"medium duration"}'),
('Debt - Medium to Long Duration Fund', 'DEBT', '{"medium to long duration"}'),
('Debt - Long Duration Fund', 'DEBT', '{"long duration"}'),
('Debt - Dynamic Bond', 'DEBT', '{"dynamic bond"}'),
('Debt - Corporate Bond Fund', 'DEBT', '{"corporate bond"}'),
('Debt - Credit Risk Fund', 'DEBT', '{"credit risk"}'),
('Debt - Banking and PSU Fund', 'DEBT', '{"banking and psu","banking & psu"}'),
('Debt - Gilt Fund', 'DEBT', '{"gilt"}'),
('Debt - Gilt Fund with 10 year constant Duration', 'DEBT', '{"gilt fund with 10 year","10 year constant"}'),
('Debt - Target Maturity Fund', 'DEBT', '{"target maturity"}')
on conflict (category) do update set benchmark = excluded.benchmark, keywords = excluded.keywords;
