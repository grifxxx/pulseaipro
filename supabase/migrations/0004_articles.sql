-- Blog articles: 3/day (one per market), generated with a cover image, chart, and
-- a "what to watch" synthesis section. Images are stored in a public Storage bucket
-- for permanent hosting (OpenAI's gpt-image-* models return base64, not hosted URLs).

insert into storage.buckets (id, name, public)
values ('article-images', 'article-images', true)
on conflict (id) do nothing;

create table articles (
  id uuid primary key default gen_random_uuid(),
  market text not null check (market in ('us_stock', 'ru_stock', 'crypto')),
  slug text not null unique,
  title jsonb not null,
  dek jsonb not null,
  body jsonb not null,
  cover_image_url text not null,
  related_tickers jsonb not null default '[]',
  published_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index idx_articles_published on articles (published_at desc);

alter table articles enable row level security;
create policy "public read articles" on articles for select using (true);
