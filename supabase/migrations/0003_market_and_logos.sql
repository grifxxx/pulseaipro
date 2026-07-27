-- Adds a finer-grained market classification (US stock / RU stock / crypto) and a
-- cached logo URL per asset, so the feed can be filtered by market and show icons.

alter table watchlist_assets
  add column market text not null default 'us_stock' check (market in ('us_stock', 'ru_stock', 'crypto')),
  add column logo_url text;

-- Backfill existing rows: anything currently asset_type='crypto' becomes market='crypto',
-- everything else stays the default 'us_stock' (safe since only US tickers existed before this migration).
update watchlist_assets set market = 'crypto' where asset_type = 'crypto';
