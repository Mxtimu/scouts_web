-- Signal Scouts — forgot password (email-based reset)
-- Run this in the Supabase SQL Editor.
--
-- Scouts had no recovery path if they forgot their password. This adds a
-- standard token-based reset flow: request_password_reset() generates a
-- one-hour token (only for accounts that actually have a password — Google
-- accounts have nothing to reset), the frontend emails a link containing it
-- via the existing EmailJS integration, and reset_scout_password() consumes
-- the token exactly once to set a new password hash.

create extension if not exists pgcrypto;

alter table scouts add column if not exists reset_token text;
alter table scouts add column if not exists reset_token_expires_at timestamptz;

-- Returns nothing if the email doesn't match an account with a password —
-- the frontend always shows the same generic message either way, so this
-- can't be used to enumerate registered emails or detect Google-only accounts.
create or replace function request_password_reset(p_email text)
returns table (token text, full_name text)
language plpgsql security definer set search_path = public as $$
declare
  v_token text := gen_random_uuid()::text;
begin
  update scouts
  set reset_token = v_token,
      reset_token_expires_at = now() + interval '1 hour'
  where email = lower(trim(p_email))
    and password_hash is not null and password_hash <> '';

  if found then
    return query select v_token, s.full_name from scouts s where s.email = lower(trim(p_email));
  end if;
end;
$$;

-- Single-use: clears the token on success, so the same link can't be
-- replayed. Returns no rows if the token is wrong, already used, or expired.
create or replace function reset_scout_password(p_token text, p_new_hash text)
returns table (scout_id text)
language sql security definer set search_path = public as $$
  update scouts
  set password_hash = p_new_hash,
      reset_token = null,
      reset_token_expires_at = null
  where reset_token = p_token
    and reset_token_expires_at > now()
  returning scouts.scout_id;
$$;

revoke all on function request_password_reset(text)      from public;
revoke all on function reset_scout_password(text,text)   from public;
grant execute on function request_password_reset(text)      to anon;
grant execute on function reset_scout_password(text,text)   to anon;
