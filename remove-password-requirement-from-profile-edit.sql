-- Signal Scouts — drop password re-verification from profile edits
-- Run this in the Supabase SQL Editor.
--
-- Requiring the current password just to save a phone/location/name edit
-- was causing real save failures on launch day ("incorrect password" even
-- when scouts were confident it was right). Profile detail edits now trust
-- scout_id the same way submissions/onboarding already do; changing your
-- actual password is a separate action that goes through the existing
-- forgot-password email flow instead (request_password_reset /
-- reset_scout_password from add-password-reset.sql).
--
-- Signature is changing (dropping p_password_hash), so drop + recreate.
-- Also switched back to plain `language sql` — no more conditional logic,
-- so the #variable_conflict plpgsql pitfall from before no longer applies.

drop function if exists update_scout_profile(text,text,text,text,text,text);

create or replace function update_scout_profile(
  p_scout_id text,
  p_full_name text,
  p_phone text,
  p_location text,
  p_id_number text
)
returns table (
  scout_id text, full_name text, email text, phone_number text,
  birth_date date, location text, created_at timestamptz, id_number text
)
language sql security definer set search_path = public as $$
  update scouts
  set full_name    = coalesce(p_full_name, full_name),
      phone_number = coalesce(p_phone, phone_number),
      location     = coalesce(p_location, location),
      id_number    = coalesce(p_id_number, id_number)
  where scouts.scout_id = p_scout_id
  returning scouts.scout_id, scouts.full_name, scouts.email, scouts.phone_number,
            scouts.birth_date, scouts.location, scouts.created_at, scouts.id_number;
$$;

revoke all on function update_scout_profile(text,text,text,text,text) from public;
grant execute on function update_scout_profile(text,text,text,text,text) to anon;
