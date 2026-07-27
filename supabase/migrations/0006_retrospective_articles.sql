-- Retrospective articles ("how did news affect price over the last week/month/6 months/year"),
-- generated on the same schedule/image/chart machinery as the daily per-market articles, just
-- spanning all markets and a longer lookback instead of one market's latest day.

alter table articles
  alter column market drop not null,
  add column kind text not null default 'daily' check (kind in ('daily', 'retrospective')),
  add column period text check (period in ('weekly', 'monthly', 'semiannual', 'yearly'));

alter table articles add constraint articles_kind_consistency check (
  (kind = 'daily' and market is not null and period is null) or
  (kind = 'retrospective' and period is not null)
);
