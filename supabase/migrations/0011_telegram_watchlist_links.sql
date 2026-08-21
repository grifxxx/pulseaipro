-- Links a PulseAiPro account to a Telegram chat, so we can DM the user when a note is
-- published for an asset in their "Избранное" watchlist. Linking flow: the client inserts a
-- row into telegram_link_tokens (RLS-gated to their own user_id), opens
-- t.me/<bot>?start=<token>, and the bot's webhook (service role, bypasses RLS) resolves the
-- token to a user_id and upserts telegram_links with the resulting chat_id.

create table telegram_links (
  user_id uuid primary key references auth.users(id) on delete cascade,
  chat_id bigint not null,
  linked_at timestamptz not null default now()
);

alter table telegram_links enable row level security;
create policy "users can read their own telegram link" on telegram_links for select using (auth.uid() = user_id);
create policy "users can delete their own telegram link" on telegram_links for delete using (auth.uid() = user_id);

create table telegram_link_tokens (
  token uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table telegram_link_tokens enable row level security;
create policy "users can create their own link token" on telegram_link_tokens for insert with check (auth.uid() = user_id);
