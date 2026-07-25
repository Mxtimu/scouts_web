-- Signal Scouts — correct the legacy mission window backfill
-- Run this in the Supabase SQL Editor.
--
-- fix-mission-scheduling.sql backfilled opens_at = now() for the 5 original
-- missions, which gave them a fresh 72h window starting from whenever that
-- migration ran — wrong, since they've actually been live since June.
-- Anyone who didn't submit back then should show as Missed, not get a
-- second chance from an accidentally-reset clock. This re-anchors them to
-- created_at (when they were actually seeded), which is long enough ago
-- that their real 72h window has already elapsed for anyone who hasn't
-- submitted — while anyone who DID submit is unaffected, since completion
-- is checked before the missed/expired logic on the frontend.

update missions
set opens_at = created_at
where mission_id in ('m-1', 'm-2', 'm-3', 'm-4', 'm-5');
