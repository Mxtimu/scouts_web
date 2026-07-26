-- Signal Scouts — Insights dashboard read access
-- Run this in the Supabase SQL Editor.
--
-- The admin's Supabase Auth session (role `authenticated`) has never been
-- granted anything on scouts/submissions/coding_evidence or the analyst
-- views — every RLS migration so far only ever touched `anon`. The one and
-- only existing grant to `authenticated` is on `missions`
-- (add-admin-missions.sql). Without this, every query the new Insights
-- dashboard makes fails with permission-denied.
--
-- Read-only on purpose: this dashboard never writes to scout/submission/
-- evidence data, so no INSERT/UPDATE/DELETE policies are added here.
-- scouts gets a column-level grant excluding password_hash/reset_token/
-- reset_token_expires_at — no legitimate reason for a dashboard to ever
-- touch those, admin or not.

grant select (
  scout_id, full_name, email, phone_number, birth_date, location,
  created_at, onboarded, first_login_at, id_number
) on scouts to authenticated;

create policy "admin_read_scouts" on scouts
  for select to authenticated using (true);

grant select on submissions to authenticated;

create policy "admin_read_submissions" on submissions
  for select to authenticated using (true);

grant select on coding_evidence to authenticated;

create policy "admin_read_coding_evidence" on coding_evidence
  for select to authenticated using (true);

-- Belt-and-suspenders alongside the explicit grants above — matches the
-- security_invoker fix already applied to scout_mission_evidence_view.
alter view coding_evidence_view set (security_invoker = true);
alter view scout_mission_evidence_view set (security_invoker = true);

grant select on coding_evidence_view to authenticated;
grant select on scout_mission_evidence_view to authenticated;
