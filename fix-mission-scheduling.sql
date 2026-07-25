-- Signal Scouts — per-mission publish scheduling
-- Run this in the Supabase SQL Editor.
--
-- Problem: the 72h submission window was anchored to each scout's first
-- login, applied globally to every mission. That breaks the moment a new
-- mission is added later — scouts whose personal window already closed can
-- never reach it, even though it just went live. This adds a per-mission
-- opens_at, stamped automatically the moment a mission is published (status
-- flips to 'current'), so each mission gets its own fresh 72h window
-- regardless of when any given scout signed up.

alter table missions add column if not exists opens_at timestamptz;

-- Stamps opens_at the first time a mission becomes 'current' — never resets
-- it on later edits, same "stamp once" pattern as record_login().
create or replace function stamp_mission_opens_at()
returns trigger
language plpgsql as $$
begin
  if new.status = 'current' and new.opens_at is null then
    new.opens_at := now();
  end if;
  return new;
end;
$$;

drop trigger if exists trg_stamp_mission_opens_at on missions;
create trigger trg_stamp_mission_opens_at
  before insert or update on missions
  for each row execute function stamp_mission_opens_at();

-- Backfill: the 5 missions already live predate this concept. Give them a
-- fresh window starting now rather than leaving opens_at null (which the
-- frontend would otherwise have to special-case) — this means currently
-- active scouts get a full 72h from this migration to keep working,
-- instead of being retroactively cut off.
update missions set opens_at = now() where status = 'current' and opens_at is null;
