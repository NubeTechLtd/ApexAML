-- Sequence state
create table if not exists public.email_sequences (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid null,
  contact_name text not null,
  institution_name text not null,
  institution_type text null,
  email text not null,
  ref_number text not null,
  deadline text not null default '10 June 2026',
  tracking_token text not null unique default encode(gen_random_bytes(18), 'base64'),
  email_1_sent_at timestamptz null,
  email_2_sent_at timestamptz null,
  email_3_sent_at timestamptz null,
  email_4_sent_at timestamptz null,
  email_5_sent_at timestamptz null,
  demo_booked boolean not null default false,
  unsubscribed_at timestamptz null,
  bounced_at timestamptz null,
  last_error text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists email_sequences_dispatch_idx
  on public.email_sequences (demo_booked, unsubscribed_at, bounced_at, created_at);
create index if not exists email_sequences_email_idx
  on public.email_sequences (lower(email));

alter table public.email_sequences enable row level security;

drop policy if exists "Anyone can enqueue an email sequence" on public.email_sequences;
create policy "Anyone can enqueue an email sequence"
  on public.email_sequences
  for insert
  to public
  with check (true);

drop trigger if exists trg_email_sequences_updated_at on public.email_sequences;
create trigger trg_email_sequences_updated_at
before update on public.email_sequences
for each row execute function public.set_updated_at();

-- Append-only event log (opens / clicks / sends / bounces)
create table if not exists public.email_events (
  id uuid primary key default gen_random_uuid(),
  sequence_id uuid null references public.email_sequences(id) on delete set null,
  email text null,
  email_step int2 null,           -- 1..5
  event_type text not null,       -- 'sent' | 'open' | 'click' | 'bounce' | 'unsubscribe' | 'failed'
  url text null,                  -- for clicks
  user_agent text null,
  ip text null,
  metadata jsonb null,
  created_at timestamptz not null default now()
);

create index if not exists email_events_sequence_idx
  on public.email_events (sequence_id, created_at desc);
create index if not exists email_events_type_idx
  on public.email_events (event_type, created_at desc);

alter table public.email_events enable row level security;
-- No public policies: only the edge functions (service role) write/read.