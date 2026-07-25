-- Signal Scouts — combined scout + mission response + coding evidence view
-- Run this in the Supabase SQL Editor.
--
-- Zuki needs to review, per scout, their response to each of the 5 missions
-- alongside the AI-coded evidence (money utilities, passion categories,
-- access barriers) without having to cross-reference three separate tables
-- by hand. This view does that join once, as a saved view she can just open
-- in Table Editor → Views any time.
--
-- Security note: like coding_evidence_view/submissions_view, this contains
-- PII (name, phone) and full response text — it's for dashboard/analyst use
-- only. security_invoker makes it respect the querying role's own RLS
-- instead of the view owner's (see the "Security Definer View" lint fix
-- discussed earlier), and we explicitly revoke anon access on top of that.

create view scout_mission_evidence_view
with (security_invoker = true) as
select
  s.scout_id,
  s.full_name,
  s.phone_number,
  m.mission_id,
  m.title            as mission_title,
  sub.text_response,
  sub.images,
  sub.submitted_at,
  ce.money_utilities,
  ce.passion_categories,
  ce.access_barriers,
  ce.access_barriers_reason,
  ce.bank_permission,
  ce.bank_permission_reason,
  ce.quality,
  ce.scout_score,
  ce.scout_feedback,
  ce.confidence
from scouts s
join submissions sub    on sub.scout_id = s.scout_id
join missions m         on m.mission_id = sub.mission_id
left join coding_evidence ce on ce.submission_id = sub.id;

revoke all on scout_mission_evidence_view from anon;
