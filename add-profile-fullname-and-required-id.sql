-- Signal Scouts — profile edit: add full_name, make it + id_number required
-- Run this in the Supabase SQL Editor AFTER add-scout-profile-editing.sql.
--
-- update_scout_profile() gains a p_full_name parameter. Adding a parameter
-- changes the function's signature, so the old 5-arg version is dropped
-- first rather than left behind as a stale overload.

drop function if exists update_scout_profile(text,text,text,text,text);

create or replace function update_scout_profile(
  p_scout_id text,
  p_password_hash text,
  p_full_name text,
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
  set full_name    = coalesce(p_full_name, full_name),
      phone_number = coalesce(p_phone, phone_number),
      location      = coalesce(p_location, location),
      id_number     = coalesce(p_id_number, id_number)
  where scouts.scout_id = p_scout_id;

  return query
  select s.scout_id, s.full_name, s.email, s.phone_number, s.birth_date, s.location, s.created_at, s.id_number
  from scouts s
  where s.scout_id = p_scout_id;
end;
$$;

revoke all on function update_scout_profile(text,text,text,text,text,text) from public;
grant execute on function update_scout_profile(text,text,text,text,text,text) to anon;
