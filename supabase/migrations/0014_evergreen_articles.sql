-- Adds an "evergreen" article kind: the reference guides that replaced the daily market recaps.
-- Like the retrospectives and the humor piece, a guide is not tied to one market and not tied to
-- a period — it answers a standing question, so both market and period stay null.

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

alter table articles add constraint articles_kind_check check (kind in ('daily', 'retrospective', 'sponsored', 'humor', 'evergreen'));
alter table articles add constraint articles_kind_consistency check (
  (kind = 'daily' and market is not null and period is null) or
  (kind = 'retrospective' and period is not null) or
  (kind = 'sponsored' and period is null) or
  (kind = 'humor' and market is null and period is null) or
  (kind = 'evergreen' and market is null and period is null)
);
