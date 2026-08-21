-- Tracks the last time a user was DM'd a price-move alert for a watchlist asset, so a price
-- that stays elevated across many pipeline runs (3x/day) doesn't re-trigger the same alert
-- every run — same spirit as the notes-dedup fix. Service-role only, no client policies needed.

create table price_alert_state (
  user_id uuid not null references auth.users(id) on delete cascade,
  asset_id uuid not null references watchlist_assets(id) on delete cascade,
  last_alert_at timestamptz not null default now(),
  primary key (user_id, asset_id)
);

alter table price_alert_state enable row level security;
