-- Per-user portfolio positions (quantity + average cost per asset), backing a simple P&L
-- tracker at /portfolio. One row per (user, asset) — no per-lot history, just an aggregate
-- position, same "quick tracker" scope as the rest of the product.

create table portfolio_positions (
  user_id uuid not null references auth.users(id) on delete cascade,
  asset_id uuid not null references watchlist_assets(id) on delete cascade,
  quantity numeric not null check (quantity > 0),
  avg_cost numeric not null check (avg_cost >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, asset_id)
);

create index idx_portfolio_positions_user on portfolio_positions (user_id);

alter table portfolio_positions enable row level security;

create policy "users can read their own portfolio" on portfolio_positions
  for select using (auth.uid() = user_id);

create policy "users can add to their own portfolio" on portfolio_positions
  for insert with check (auth.uid() = user_id);

create policy "users can update their own portfolio" on portfolio_positions
  for update using (auth.uid() = user_id);

create policy "users can remove from their own portfolio" on portfolio_positions
  for delete using (auth.uid() = user_id);
