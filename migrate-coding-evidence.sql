-- Signal Scouts — coding_evidence schema migration
-- Run this in the Supabase SQL Editor.
-- Clears existing coded data and rebuilds with reasoning fields.

DROP VIEW IF EXISTS coding_evidence_view;
DROP TABLE IF EXISTS coding_evidence;

CREATE TABLE coding_evidence (
  id                       bigint  generated always as identity primary key,
  submission_id            bigint  not null references submissions(id) on delete cascade,

  -- Analyst Team Operating Manual dimensions
  money_utilities          text[]  not null default '{}',
  decision_control         text    not null default '',
  passion_categories       text[]  not null default '{}',
  access_barriers          text[]  not null default '{}',
  access_barriers_reason   text    not null default '',   -- WHY these barriers were flagged
  bank_permission          text    not null default '',
  bank_permission_reason   text    not null default '',   -- WHY this permission level was assigned

  -- Evidence & QA fields
  verbatim_quote           text    not null default '',
  analyst_note             text    not null default '',
  quality                  quality_flag,
  confidence               confidence_level,

  coded_by                 text    not null default '',
  coded_at                 timestamptz not null default now()
);

CREATE INDEX idx_coding_submission ON coding_evidence(submission_id);

ALTER TABLE coding_evidence ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_all" ON coding_evidence FOR ALL USING (true) WITH CHECK (true);

CREATE VIEW coding_evidence_view AS
  SELECT
    ce.id,
    ce.money_utilities,
    ce.decision_control,
    ce.passion_categories,
    ce.access_barriers,
    ce.access_barriers_reason,
    ce.bank_permission,
    ce.bank_permission_reason,
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
  FROM coding_evidence ce
  JOIN submissions sub ON sub.id = ce.submission_id
  JOIN scouts s ON s.scout_id = sub.scout_id;
