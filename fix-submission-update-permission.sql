-- Signal Scouts — fix "permission denied for table submissions" on resubmit
-- Run this in the Supabase SQL Editor.
--
-- Postgres requires SELECT privilege on any column referenced in an
-- UPDATE ... WHERE clause, not just UPDATE privilege on the table.
-- updateSubmission() filters on scout_id/mission_id, but secure-rls.sql
-- granted anon zero SELECT on submissions (even at the column level) —
-- so every resubmit failed. This grants SELECT on just those two
-- identifier columns; it does not expose text_response/images to anon.

grant select (scout_id, mission_id) on submissions to anon;
