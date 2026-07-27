-- Attention notes now store summary/why_notable/risk_notes as {"ru": "...", "en": "..."}
-- and key_facts as {"ru": [...], "en": [...]} instead of plain text/array.
-- Clears existing test data since the old shape isn't compatible with the new one.

truncate table attention_notes;
truncate table pipeline_runs cascade;

alter table attention_notes
  alter column summary type jsonb using to_jsonb(summary),
  alter column why_notable type jsonb using to_jsonb(why_notable),
  alter column risk_notes type jsonb using to_jsonb(risk_notes);
