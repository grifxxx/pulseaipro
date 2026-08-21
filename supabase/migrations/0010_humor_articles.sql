-- Adds a "humor" article kind: one daily cross-market satirical/ironic take on the day's
-- notable notes (same underlying facts as the regular articles, just told with a wink —
-- no fabricated events). Like retrospectives, it spans all markets, so market stays null.

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

alter table articles add constraint articles_kind_check check (kind in ('daily', 'retrospective', 'sponsored', 'humor'));
alter table articles add constraint articles_kind_consistency check (
  (kind = 'daily' and market is not null and period is null) or
  (kind = 'retrospective' and period is not null) or
  (kind = 'sponsored' and period is null) or
  (kind = 'humor' and market is null and period is null)
);
