-- Per-user saved-asset watchlist, backing the "Избранное" personalized feed. Auth is Supabase
-- Auth (magic link / email OTP) — no separate users table needed, references auth.users directly.

create table user_watchlist (
  user_id uuid not null references auth.users(id) on delete cascade,
  asset_id uuid not null references watchlist_assets(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, asset_id)
);

create index idx_user_watchlist_user on user_watchlist (user_id);

alter table user_watchlist enable row level security;

create policy "users can read their own watchlist" on user_watchlist
  for select using (auth.uid() = user_id);

create policy "users can add to their own watchlist" on user_watchlist
  for insert with check (auth.uid() = user_id);

create policy "users can remove from their own watchlist" on user_watchlist
  for delete using (auth.uid() = user_id);
