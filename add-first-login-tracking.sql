-- Signal Scouts — first-login-based mission window
-- Run this in the Supabase SQL Editor AFTER add-onboarding-status.sql.
--
-- The 3-day (72h) mission window was counted from `created_at` (account
-- creation), which isn't always the moment a scout actually starts using
-- the app. This adds `first_login_at`, stamped the first time a scout
-- logs in, so the countdown starts exactly when they begin — not before.

alter table scouts add column if not exists first_login_at timestamptz;

-- Called on every successful login. Sets first_login_at only the first
-- time (coalesce) — later logins don't reset the window.
create or replace function record_login(p_scout_id text)
returns timestamptz
language sql security definer set search_path = public as $$
  update scouts
  set first_login_at = coalesce(first_login_at, now())
  where scout_id = p_scout_id
  returning first_login_at;
$$;

revoke all on function record_login(text) from public;
grant execute on function record_login(text) to anon;

-- get_scout_profile and verify_scout_password now also return
-- first_login_at. Return type is changing, so drop + recreate.

drop function if exists get_scout_profile(text);
create function get_scout_profile(p_email text)
returns table (
  scout_id text, full_name text, email text, phone_number text,
  birth_date date, location text, created_at timestamptz,
  has_password boolean, onboarded boolean, first_login_at timestamptz
)
language sql security definer set search_path = public as $$
  select scout_id, full_name, email, phone_number, birth_date, location, created_at,
         (password_hash is not null and password_hash <> '') as has_password,
         onboarded, first_login_at
  from scouts
  where email = lower(trim(p_email))
  limit 1;
$$;

drop function if exists verify_scout_password(text, text);
create function verify_scout_password(p_email text, p_hash text)
returns table (
  scout_id text, full_name text, email text, phone_number text,
  birth_date date, location text, created_at timestamptz, onboarded boolean,
  first_login_at timestamptz
)
language sql security definer set search_path = public as $$
  select scout_id, full_name, email, phone_number, birth_date, location, created_at,
         onboarded, first_login_at
  from scouts
  where email = lower(trim(p_email))
    and password_hash is not null and password_hash <> ''
    and split_part(password_hash, ':', 2) = p_hash
  limit 1;
$$;

revoke all on function get_scout_profile(text)         from public;
revoke all on function verify_scout_password(text,text) from public;
grant execute on function get_scout_profile(text)         to anon;
grant execute on function verify_scout_password(text,text) to anon;
