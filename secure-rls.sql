-- Signal Scouts — RLS lockdown migration
-- Run this in the Supabase SQL Editor AFTER supabase-schema.sql and migrate-coding-evidence.sql.
--
-- Problem being fixed: every table currently has an "anon_all" policy
-- (USING (true) WITH CHECK (true)), which combined with Supabase's default
-- anon grants means anyone holding the public anon key (embedded in the
-- browser bundle) can read or delete the ENTIRE scouts table — including
-- password hashes and PII — plus the full submissions/coding_evidence
-- research data. This migration:
--   1. Revokes blanket anon table access.
--   2. Moves login/signup lookups behind SECURITY DEFINER functions that
--      never return password_hash to the client.
--   3. Wraps submission reads in a function scoped to one scout_id, so the
--      raw submissions table can no longer be bulk-dumped.
--   4. Fully locks analyst-only tables (coding_evidence, provisional_segments,
--      segment_scouts) away from anon — the public app never needs them.

-- ══════════════════════════════════════════════════════════════════════════════
-- 1. SCOUTS — no more direct anon SELECT/UPDATE/DELETE
-- ══════════════════════════════════════════════════════════════════════════════

drop policy if exists "anon_all" on scouts;

revoke all on scouts from anon;
grant select (scout_id) on scouts to anon;   -- needed only for signup ID-collision check
grant insert on scouts to anon;              -- needed for signup

create policy "anon_read_scout_id" on scouts for select using (true);
create policy "anon_insert_signup" on scouts for insert with check (true);
-- No update/delete policy for anon => both are now blocked entirely.

-- Login/profile lookups go through these functions instead of the table directly.
-- SECURITY DEFINER lets them read password_hash internally without ever
-- returning it to the caller.

create or replace function get_scout_profile(p_email text)
returns table (
  scout_id text, full_name text, email text, phone_number text,
  birth_date date, location text, created_at timestamptz, has_password boolean
)
language sql security definer set search_path = public as $$
  select scout_id, full_name, email, phone_number, birth_date, location, created_at,
         (password_hash is not null and password_hash <> '') as has_password
  from scouts
  where email = lower(trim(p_email))
  limit 1;
$$;

create or replace function get_password_salt(p_email text)
returns text
language sql security definer set search_path = public as $$
  select split_part(password_hash, ':', 1)
  from scouts
  where email = lower(trim(p_email))
    and password_hash is not null and password_hash <> ''
  limit 1;
$$;

create or replace function verify_scout_password(p_email text, p_hash text)
returns table (
  scout_id text, full_name text, email text, phone_number text,
  birth_date date, location text, created_at timestamptz
)
language sql security definer set search_path = public as $$
  select scout_id, full_name, email, phone_number, birth_date, location, created_at
  from scouts
  where email = lower(trim(p_email))
    and password_hash is not null and password_hash <> ''
    and split_part(password_hash, ':', 2) = p_hash
  limit 1;
$$;

revoke all on function get_scout_profile(text)      from public;
revoke all on function get_password_salt(text)      from public;
revoke all on function verify_scout_password(text,text) from public;
grant execute on function get_scout_profile(text)      to anon;
grant execute on function get_password_salt(text)      to anon;
grant execute on function verify_scout_password(text,text) to anon;

-- ══════════════════════════════════════════════════════════════════════════════
-- 2. SUBMISSIONS — insert/update still open (no session to scope by), but the
--    raw table can no longer be bulk-read; reads must go through the function
--    below, which is scoped to a single scout_id per call.
-- ══════════════════════════════════════════════════════════════════════════════

drop policy if exists "anon_all" on submissions;

revoke all on submissions from anon;
grant insert on submissions to anon;
grant update on submissions to anon;

create policy "anon_insert_submission" on submissions for insert with check (true);
create policy "anon_update_submission" on submissions for update using (true) with check (true);
-- No select grant/policy => `.from('submissions').select()` from the browser now fails.

create or replace function get_scout_submissions(p_scout_id text)
returns table (mission_id text, submitted_at timestamptz, text_response text, images text[])
language sql security definer set search_path = public as $$
  select mission_id, submitted_at, text_response, images
  from submissions
  where scout_id = p_scout_id;
$$;

revoke all on function get_scout_submissions(text) from public;
grant execute on function get_scout_submissions(text) to anon;

-- ══════════════════════════════════════════════════════════════════════════════
-- 3. MISSIONS — public reference data, read-only for anon
-- ══════════════════════════════════════════════════════════════════════════════

drop policy if exists "anon_all" on missions;
revoke all on missions from anon;
grant select on missions to anon;
create policy "anon_read_missions" on missions for select using (true);

-- ══════════════════════════════════════════════════════════════════════════════
-- 4. ANALYST-ONLY TABLES — zero anon access. Used only by server-side scripts
--    (migrate-to-supabase.js, code-submissions.js) which now use the
--    service_role key and bypass RLS entirely.
-- ══════════════════════════════════════════════════════════════════════════════

drop policy if exists "anon_all" on coding_evidence;
drop policy if exists "anon_all" on provisional_segments;
drop policy if exists "anon_all" on segment_scouts;

revoke all on coding_evidence      from anon;
revoke all on provisional_segments from anon;
revoke all on segment_scouts       from anon;
-- RLS is already enabled on these tables (see supabase-schema.sql) with no
-- policies left for anon, so every anon request is denied by default.
