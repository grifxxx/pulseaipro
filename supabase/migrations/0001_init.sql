create extension if not exists pgcrypto;

create table watchlist_assets (
  id uuid primary key default gen_random_uuid(),
  symbol text not null,
  name text not null,
  asset_type text not null check (asset_type in ('stock','crypto')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (symbol, asset_type)
);

create table pipeline_runs (
  id uuid primary key default gen_random_uuid(),
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  status text not null check (status in ('running','success','partial_failure','failed')),
  assets_scanned int,
  notes_created int,
  error_message text,
  raw_log jsonb
);

create table attention_notes (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references pipeline_runs(id),
  asset_id uuid not null references watchlist_assets(id),
  symbol text not null,
  name text not null,
  category text not null check (category in ('stock','crypto')),
  sentiment text not null check (sentiment in ('bullish','bearish','neutral','mixed')),
  sentiment_score numeric,
  summary text not null,
  why_notable text not null,
  key_facts jsonb not null default '[]',
  risk_notes text not null,
  sources jsonb not null default '[]',
  price_snapshot jsonb,
  generated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index idx_attention_notes_symbol_time on attention_notes (symbol, generated_at desc);
create index idx_attention_notes_run on attention_notes (run_id);

alter table watchlist_assets enable row level security;
alter table pipeline_runs enable row level security;
alter table attention_notes enable row level security;

-- Public (anon) read access — this is a public informational feed.
-- All writes go through the service-role key from the cron route, which bypasses RLS.
create policy "public read watchlist_assets" on watchlist_assets for select using (true);
create policy "public read attention_notes" on attention_notes for select using (true);
-- pipeline_runs is internal/operational — no public policy, so anon key gets no access.
