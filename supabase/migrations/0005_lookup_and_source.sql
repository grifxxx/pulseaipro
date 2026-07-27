-- On-demand asset lookup: users can search for any stock/crypto not yet tracked.
-- `source` distinguishes how an asset entered the watchlist so the daily pipeline can
-- permanently track user-discovered assets while still treating CoinGecko "trending"
-- discoveries as ephemeral (re-fetched fresh each run, not accumulated forever).

alter table watchlist_assets
  add column source text not null default 'seed' check (source in ('seed', 'trending', 'search'));

create table lookup_log (
  id uuid primary key default gen_random_uuid(),
  query text not null,
  created_at timestamptz not null default now()
);

create index idx_lookup_log_created on lookup_log (created_at desc);
