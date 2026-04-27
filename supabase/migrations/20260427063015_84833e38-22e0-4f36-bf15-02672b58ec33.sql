-- Extensions for scheduling + outbound HTTP
create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Sequence state table
create table if not exists public.whatsapp_sequences (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid null,
  contact_name text not null,
  institution_name text not null,
  institution_type text null,
  phone text not null,
  email text null,
  ref_number text not null,
  deadline text not null default '10 June 2026',
  message_1_sent_at timestamptz null,
  message_2_sent_at timestamptz null,
  message_3_sent_at timestamptz null,
  demo_booked boolean not null default false,
  last_error text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists whatsapp_sequences_pending_idx
  on public.whatsapp_sequences (demo_booked, message_1_sent_at, message_2_sent_at, message_3_sent_at);

alter table public.whatsapp_sequences enable row level security;

-- Public can enqueue a sequence (called from the roadmap flow). No read/update/delete.
drop policy if exists "Anyone can enqueue a whatsapp sequence" on public.whatsapp_sequences;
create policy "Anyone can enqueue a whatsapp sequence"
  on public.whatsapp_sequences
  for insert
  to public
  with check (true);

-- updated_at trigger
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_whatsapp_sequences_updated_at on public.whatsapp_sequences;
create trigger trg_whatsapp_sequences_updated_at
before update on public.whatsapp_sequences
for each row execute function public.set_updated_at();