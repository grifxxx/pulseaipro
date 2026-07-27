-- Adds a "sponsored" article kind for disclosed partner/advertising long-form posts
-- (e.g. an explainer article about a paid referral offer). These flow through the same
-- articles table/blog listing/SEO plumbing as daily/retrospective posts, but the frontend
-- renders them with a prominent "Партнёрский материал · Реклама" disclosure banner.

-- Drop whatever the two existing check constraints on `kind` happen to be named
-- (Postgres auto-names inline column checks, so we look them up rather than guess).
do $$
declare
  con record;
begin
  for con in
    select conname from pg_constraint
    where conrelid = 'articles'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%kind%'
  loop
    execute format('alter table articles drop constraint %I', con.conname);
  end loop;
end $$;

alter table articles add constraint articles_kind_check check (kind in ('daily', 'retrospective', 'sponsored'));
alter table articles add constraint articles_kind_consistency check (
  (kind = 'daily' and market is not null and period is null) or
  (kind = 'retrospective' and period is not null) or
  (kind = 'sponsored' and period is null)
);
