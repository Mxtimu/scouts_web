-- Signal Scouts — scout-facing score + feedback
-- Run this in the Supabase SQL Editor before running code-submissions.js
-- with the updated prompt.
--
-- Adds two columns to coding_evidence: scout_score (High/Medium/Low) and
-- scout_feedback (a short message meant to eventually be shown back to the
-- scout, telling them what to add next time for a better score). Additive
-- only — existing rows and the internal `quality`/`confidence` fields are
-- untouched.

do $$ begin
  create type scout_score_level as enum ('High', 'Medium', 'Low');
exception
  when duplicate_object then null;
end $$;

alter table coding_evidence add column if not exists scout_score    scout_score_level;
alter table coding_evidence add column if not exists scout_feedback text not null default '';

-- Recreate the view so it surfaces the new fields too.
drop view if exists coding_evidence_view;
create view coding_evidence_view as
  select
    ce.id,
    ce.money_utilities,
    ce.decision_control,
    ce.passion_categories,
    ce.access_barriers,
    ce.access_barriers_reason,
    ce.bank_permission,
    ce.bank_permission_reason,
    ce.verbatim_quote,
    ce.analyst_note,
    ce.quality,
    ce.scout_score,
    ce.scout_feedback,
    ce.confidence,
    ce.coded_by,
    ce.coded_at,
    sub.mission_id,
    sub.wave,
    s.scout_id,
    s.full_name,
    s.location
  from coding_evidence ce
  join submissions sub on sub.id = ce.submission_id
  join scouts s on s.scout_id = sub.scout_id;
