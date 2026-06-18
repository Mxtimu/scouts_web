-- Signal Scouts — Supabase PostgreSQL Schema
-- Run this entire file in the Supabase SQL Editor to set up the database.
-- Order matters: ENUMs → tables → indexes → views → seed data → RLS policies

-- ══════════════════════════════════════════════════════════════════════════════
-- ENUMS
-- ══════════════════════════════════════════════════════════════════════════════

create type quality_flag     as enum ('Good', 'Thin', 'Problem');
create type confidence_level as enum ('Strong', 'Moderate', 'Weak');
create type mission_status   as enum ('current', 'upcoming', 'completed');

-- ══════════════════════════════════════════════════════════════════════════════
-- TABLES
-- ══════════════════════════════════════════════════════════════════════════════

-- 1. Scouts —————————————————————————————————————————————————————————————————

create table scouts (
  id            bigint  generated always as identity primary key,
  scout_id      text    not null unique,          -- e.g. SC247
  full_name     text    not null,
  email         text    not null unique,
  phone_number  text    not null default '',
  birth_date    date,
  location      text    not null default '',
  password_hash text    not null default '',
  created_at    timestamptz not null default now()
);

-- 2. Missions ————————————————————————————————————————————————————————————————

create table missions (
  id          bigint  generated always as identity primary key,
  mission_id  text    not null unique,            -- e.g. m-1
  title       text    not null,
  description text    not null default '',
  wave        text    not null default '',
  status      mission_status not null default 'upcoming',
  points      integer not null default 0,
  created_at  timestamptz not null default now()
);

-- 3. Submissions —————————————————————————————————————————————————————————————

create table submissions (
  id            bigint  generated always as identity primary key,
  scout_id      text    not null references scouts(scout_id) on delete cascade,
  mission_id    text    not null references missions(mission_id) on delete cascade,
  text_response text    not null default '',
  images        text[],                           -- Cloudinary URLs
  wave          text    not null default '',
  submitted_at  timestamptz not null default now(),
  unique (scout_id, mission_id)                  -- one submission per scout per mission
);

-- 4. Coding Evidence —————————————————————————————————————————————————————————

create table coding_evidence (
  id              bigint  generated always as identity primary key,
  submission_id   bigint  not null references submissions(id) on delete cascade,
  theme           text    not null,
  sub_theme       text    not null default '',
  verbatim_quote  text    not null default '',
  analyst_note    text    not null default '',
  quality         quality_flag,
  confidence      confidence_level,
  coded_by        text    not null default '',    -- analyst name or email
  coded_at        timestamptz not null default now()
);

-- 5. Provisional Segments ————————————————————————————————————————————————————

create table provisional_segments (
  id              bigint  generated always as identity primary key,
  segment_name    text    not null unique,
  description     text    not null default '',
  defining_themes text[]  not null default '{}',
  wave            text    not null default '',
  created_at      timestamptz not null default now()
);

-- 6. Segment–Scout Bridge ————————————————————————————————————————————————————

create table segment_scouts (
  id          bigint  generated always as identity primary key,
  segment_id  bigint  not null references provisional_segments(id) on delete cascade,
  scout_id    text    not null references scouts(scout_id) on delete cascade,
  fit_score   numeric(4,2),                      -- 0.00–1.00
  rationale   text    not null default '',
  assigned_at timestamptz not null default now(),
  unique (segment_id, scout_id)
);

-- ══════════════════════════════════════════════════════════════════════════════
-- INDEXES
-- ══════════════════════════════════════════════════════════════════════════════

create index idx_submissions_scout    on submissions(scout_id);
create index idx_submissions_mission  on submissions(mission_id);
create index idx_coding_submission    on coding_evidence(submission_id);
create index idx_segment_scouts_scout on segment_scouts(scout_id);
create index idx_scouts_email         on scouts(email);

-- ══════════════════════════════════════════════════════════════════════════════
-- VIEWS
-- ══════════════════════════════════════════════════════════════════════════════

-- Full submission details with scout info
create view submissions_view as
  select
    sub.id,
    sub.mission_id,
    sub.wave,
    sub.text_response,
    sub.images,
    sub.submitted_at,
    s.scout_id,
    s.full_name,
    s.email,
    s.location
  from submissions sub
  join scouts s on s.scout_id = sub.scout_id;

-- Coding evidence joined with submission + scout
create view coding_evidence_view as
  select
    ce.id,
    ce.theme,
    ce.sub_theme,
    ce.verbatim_quote,
    ce.analyst_note,
    ce.quality,
    ce.confidence,
    ce.coded_by,
    ce.coded_at,
    sub.mission_id,
    sub.wave,
    s.scout_id,
    s.full_name,
    s.location
  from coding_evidence ce
  join submissions sub on sub.id = ce.submission_id
  join scouts s on s.scout_id = sub.scout_id;

-- Segment roster with scout details
create view segment_roster as
  select
    ps.segment_name,
    ps.description,
    ps.wave,
    ss.fit_score,
    ss.rationale,
    s.scout_id,
    s.full_name,
    s.email,
    s.location
  from segment_scouts ss
  join provisional_segments ps on ps.id = ss.segment_id
  join scouts s on s.scout_id = ss.scout_id;

-- ══════════════════════════════════════════════════════════════════════════════
-- MISSION SEED DATA  (matches src/data/missions.js)
-- ══════════════════════════════════════════════════════════════════════════════

insert into missions (mission_id, title, wave, status, points) values
  ('m-1', 'First Impressions',   'June 2026', 'current', 10),
  ('m-2', 'Daily Rhythms',       'June 2026', 'current', 10),
  ('m-3', 'Brand Encounters',    'June 2026', 'current', 10),
  ('m-4', 'Future Signals',      'June 2026', 'current', 10),
  ('m-5', 'Community Voices',    'June 2026', 'current', 10);

-- ══════════════════════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY
-- ══════════════════════════════════════════════════════════════════════════════
-- The app uses custom auth (no Supabase Auth), so we use open RLS policies
-- matching the current Airtable security model (browser-direct access).
-- Tighten these once a backend/edge function auth layer is added.

alter table scouts              enable row level security;
alter table missions            enable row level security;
alter table submissions         enable row level security;
alter table coding_evidence     enable row level security;
alter table provisional_segments enable row level security;
alter table segment_scouts      enable row level security;

-- Allow anon key full access (matches Airtable's current open model)
create policy "anon_all" on scouts              for all using (true) with check (true);
create policy "anon_all" on missions            for all using (true) with check (true);
create policy "anon_all" on submissions         for all using (true) with check (true);
create policy "anon_all" on coding_evidence     for all using (true) with check (true);
create policy "anon_all" on provisional_segments for all using (true) with check (true);
create policy "anon_all" on segment_scouts      for all using (true) with check (true);
