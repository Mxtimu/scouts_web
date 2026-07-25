-- Signal Scouts — scheduled mission publishing
-- Run this in the Supabase SQL Editor AFTER fix-mission-scheduling.sql
-- (this depends on the opens_at column + stamp_mission_opens_at trigger
-- it creates).
--
-- Lets Zuki set a future "go live" time on a Draft/Upcoming mission instead
-- of only being able to publish it by hand at the exact moment. Since this
-- app has no backend/cron, activation is triggered client-side — any scout
-- loading the app calls activate_scheduled_missions(), which flips any
-- mission whose scheduled time has passed. The existing publish trigger
-- then stamps that mission's real opens_at automatically, same as a manual
-- publish would.

alter table missions add column if not exists scheduled_open_at timestamptz;

create or replace function activate_scheduled_missions()
returns void
language sql security definer set search_path = public as $$
  update missions
  set status = 'current'
  where status = 'upcoming'
    and scheduled_open_at is not null
    and scheduled_open_at <= now();
$$;

revoke all on function activate_scheduled_missions() from public;
grant execute on function activate_scheduled_missions() to anon;
