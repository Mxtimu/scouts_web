-- Signal Scouts — scout profile editing (phone, location, SA ID number)
-- Run this in the Supabase SQL Editor.
--
-- Scouts currently have no way to update their phone/location, and there's
-- nowhere to store a South African ID number at all. anon has zero UPDATE
-- grant on scouts (see secure-rls.sql), so this must go through a new
-- SECURITY DEFINER RPC — update_scout_profile — which re-verifies the
-- scout's password server-side before writing anything, same as login
-- already does. Password-less (Google-only) accounts are handled by
-- branching inside the function rather than threading a flag through the
-- frontend: if the account has no stored password, the update proceeds
-- without a match check.

alter table scouts add column if not exists id_number text;

-- get_scout_profile and verify_scout_password now also return id_number so
-- it round-trips correctly on every future login/device, not just right
-- after an edit. Return type is changing, so drop + recreate.

drop function if exists get_scout_profile(text);
create function get_scout_profile(p_email text)
returns table (
  scout_id text, full_name text, email text, phone_number text,
  birth_date date, location text, created_at timestamptz,
  has_password boolean, onboarded boolean, first_login_at timestamptz,
  id_number text
)
language sql security definer set search_path = public as $$
  select scout_id, full_name, email, phone_number, birth_date, location, created_at,
         (password_hash is not null and password_hash <> '') as has_password,
         onboarded, first_login_at, id_number
  from scouts
  where email = lower(trim(p_email))
  limit 1;
$$;

drop function if exists verify_scout_password(text, text);
create function verify_scout_password(p_email text, p_hash text)
returns table (
  scout_id text, full_name text, email text, phone_number text,
  birth_date date, location text, created_at timestamptz, onboarded boolean,
  first_login_at timestamptz, id_number text
)
language sql security definer set search_path = public as $$
  select scout_id, full_name, email, phone_number, birth_date, location, created_at,
         onboarded, first_login_at, id_number
  from scouts
  where email = lower(trim(p_email))
    and password_hash is not null and password_hash <> ''
    and split_part(password_hash, ':', 2) = p_hash
  limit 1;
$$;

-- Updates a scout's own editable fields. Requires the current password hash
-- to match UNLESS the account has no password at all (Google-only), in
-- which case it updates unconditionally. Omitted fields (null params) are
-- left untouched via coalesce. Returns no rows on auth failure — the
-- frontend treats an empty result as "incorrect password".
create or replace function update_scout_profile(
  p_scout_id text,
  p_password_hash text,
  p_phone text,
  p_location text,
  p_id_number text
)
returns table (
  scout_id text, full_name text, email text, phone_number text,
  birth_date date, location text, created_at timestamptz, id_number text
)
language plpgsql security definer set search_path = public as $$
declare
  stored_hash text;
begin
  select password_hash into stored_hash from scouts where scouts.scout_id = p_scout_id;

  if stored_hash is not null and stored_hash <> '' then
    if p_password_hash is null or split_part(stored_hash, ':', 2) <> p_password_hash then
      return;
    end if;
  end if;

  update scouts
  set phone_number = coalesce(p_phone, phone_number),
      location      = coalesce(p_location, location),
      id_number     = coalesce(p_id_number, id_number)
  where scouts.scout_id = p_scout_id;

  return query
  select s.scout_id, s.full_name, s.email, s.phone_number, s.birth_date, s.location, s.created_at, s.id_number
  from scouts s
  where s.scout_id = p_scout_id;
end;
$$;

revoke all on function get_scout_profile(text)              from public;
revoke all on function verify_scout_password(text,text)      from public;
revoke all on function update_scout_profile(text,text,text,text,text) from public;
grant execute on function get_scout_profile(text)              to anon;
grant execute on function verify_scout_password(text,text)      to anon;
grant execute on function update_scout_profile(text,text,text,text,text) to anon;
