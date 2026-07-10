-- Signal Scouts — per-account onboarding status
-- Run this in the Supabase SQL Editor AFTER secure-rls.sql.
--
-- Problem: whether a scout has seen the welcome/privacy/consent gate was
-- only tracked in browser localStorage, so it reappeared for the same
-- person on a new device, a different browser, or a cleared cache. This
-- moves the flag onto the scout's own row so it's tied to the account.

alter table scouts add column if not exists onboarded boolean not null default false;

-- get_scout_profile and verify_scout_password now also return `onboarded`
-- so the frontend knows on login whether to show the gate. Return type is
-- changing, so these must be dropped and recreated rather than replaced.

drop function if exists get_scout_profile(text);
create function get_scout_profile(p_email text)
returns table (
  scout_id text, full_name text, email text, phone_number text,
  birth_date date, location text, created_at timestamptz,
  has_password boolean, onboarded boolean
)
language sql security definer set search_path = public as $$
  select scout_id, full_name, email, phone_number, birth_date, location, created_at,
         (password_hash is not null and password_hash <> '') as has_password,
         onboarded
  from scouts
  where email = lower(trim(p_email))
  limit 1;
$$;

drop function if exists verify_scout_password(text, text);
create function verify_scout_password(p_email text, p_hash text)
returns table (
  scout_id text, full_name text, email text, phone_number text,
  birth_date date, location text, created_at timestamptz, onboarded boolean
)
language sql security definer set search_path = public as $$
  select scout_id, full_name, email, phone_number, birth_date, location, created_at, onboarded
  from scouts
  where email = lower(trim(p_email))
    and password_hash is not null and password_hash <> ''
    and split_part(password_hash, ':', 2) = p_hash
  limit 1;
$$;

create or replace function mark_scout_onboarded(p_scout_id text)
returns void
language sql security definer set search_path = public as $$
  update scouts set onboarded = true where scout_id = p_scout_id;
$$;

revoke all on function get_scout_profile(text)         from public;
revoke all on function verify_scout_password(text,text) from public;
revoke all on function mark_scout_onboarded(text)       from public;
grant execute on function get_scout_profile(text)         to anon;
grant execute on function verify_scout_password(text,text) to anon;
grant execute on function mark_scout_onboarded(text)       to anon;
