create table if not exists public.landing_page_clicks (
  id uuid primary key default gen_random_uuid(),
  source text not null,
  event text not null default 'click',
  page_path text null,
  referrer text null,
  created_at timestamptz not null default now()
);

alter table public.landing_page_clicks enable row level security;

drop policy if exists "Anyone can record a landing page click" on public.landing_page_clicks;
create policy "Anyone can record a landing page click"
  on public.landing_page_clicks
  for insert
  to public
  with check (true);

create index if not exists landing_page_clicks_source_idx
  on public.landing_page_clicks (source, created_at desc);