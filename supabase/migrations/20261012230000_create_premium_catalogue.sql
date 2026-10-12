create table if not exists public.premium_offers (
  id bigint generated always as identity primary key,
  premium_year integer not null check (premium_year >= 2020),
  insurer_id text not null,
  insurer_name text not null,
  plan_id text not null,
  product_name text not null,
  canton text not null check (canton in (
    'AG', 'AI', 'AR', 'BE', 'BL', 'BS', 'FR', 'GE', 'GL', 'GR', 'JU',
    'LU', 'NE', 'NW', 'OW', 'SG', 'SH', 'SO', 'SZ', 'TG', 'TI', 'UR',
    'VD', 'VS', 'ZG', 'ZH'
  )),
  premium_region text not null check (premium_region in ('0', '1', '2', '3')),
  age_category text not null check (
    age_category in ('child', 'young_adult', 'adult')
  ),
  age_subgroup text not null,
  deductible_chf integer not null check (
    deductible_chf in (0, 100, 200, 300, 400, 500, 600, 1000, 1500, 2000, 2500)
  ),
  accident_coverage boolean not null,
  insurance_model text not null check (
    insurance_model in ('standard', 'family_doctor', 'hmo', 'telmed', 'other')
  ),
  monthly_premium_chf numeric(8, 2) not null check (monthly_premium_chf >= 0),
  source_tariff_type text not null,
  imported_at timestamptz not null default now(),
  unique (
    premium_year,
    insurer_id,
    plan_id,
    canton,
    premium_region,
    age_category,
    age_subgroup,
    deductible_chf,
    accident_coverage
  )
);

create index if not exists premium_offers_comparison_idx
  on public.premium_offers (
    premium_year,
    canton,
    premium_region,
    age_category,
    age_subgroup,
    accident_coverage,
    deductible_chf,
    insurance_model,
    monthly_premium_chf
  );

alter table public.premium_offers enable row level security;

revoke all on table public.premium_offers from anon, authenticated;

comment on table public.premium_offers is
  'Normalized BAG compulsory health-insurance premiums; server-side access only.';
