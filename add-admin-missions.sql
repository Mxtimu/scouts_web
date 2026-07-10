-- Signal Scouts — admin mission management
-- Run this in the Supabase SQL Editor.
--
-- 1. Adds columns the frontend actually needs on `missions` (teaser, topic,
--    estimated_time, reward, prompt) — the original schema was missing them,
--    which is why the app never actually read missions from this table.
-- 2. Grants the `authenticated` role (a real Supabase Auth session — i.e.
--    only Zuki's admin login, since scouts never use supabase.auth at all)
--    write access, separate from anon's existing read-only policy from
--    secure-rls.sql.
-- 3. Backfills the 5 existing mission rows with the real content currently
--    hardcoded in src/data/missions.js, since the original seed data here is
--    stale/mismatched — this makes the DB cutover invisible to scouts.

alter table missions add column if not exists teaser         text not null default '';
alter table missions add column if not exists topic          text not null default 'Culture';
alter table missions add column if not exists estimated_time text not null default '';
alter table missions add column if not exists reward         text not null default '';
alter table missions add column if not exists prompt         text not null default '';

grant select, insert, update, delete on missions to authenticated;

create policy "admin_write_missions" on missions
  for all to authenticated using (true) with check (true);

-- ── Backfill real mission content ──────────────────────────────────────────

update missions set
  title          = 'Unlock Moments',
  teaser         = 'In the last 7 days, where did money unlock something that mattered?',
  topic          = 'Money Unlocks',
  status         = 'current',
  estimated_time = '8–15 mins',
  reward         = 'Rewards',
  prompt         = $p1$Quest: In the last 7 days, where did money unlock something that mattered? Pick three moments and tell us the story.

Examples:
"I bought data to stay online with friends. It mattered because being offline makes me feel cut off."
"I paid for transport to get to class. It mattered because missing class feels like falling behind."
"I helped a friend with food. It mattered because it made me feel useful."

Tell us:
• What did money unlock?
• Why did it matter?
• What made it easy or tricky?
• If a bank showed up here, what would actually help (not just noise)?$p1$
where mission_id = 'm-1';

update missions set
  title          = 'Decision Drama',
  teaser         = 'One thing you wanted that cost money — rewind the scene.',
  topic          = 'Money Unlocks',
  status         = 'current',
  estimated_time = '8–15 mins',
  reward         = 'Rewards',
  prompt         = $p2$Quest: Think of one thing you wanted recently that cost money. Rewind the scene.

Examples:
"I wanted sneakers → I asked my parent → they said wait → I ended up not buying."
"I wanted concert tickets → I split costs with friends → we all decided together."

Tell us:
• What did you want?
• Who held the wallet?
• Did you decide, ask, negotiate, wait, contribute, or give up?
• What gave you power?
• What reduced it?
• What would have made the whole thing smoother?$p2$
where mission_id = 'm-2';

update missions set
  title          = 'Money Moves Playlist',
  teaser         = 'List five recent money moves — your week''s playlist of transactions.',
  topic          = 'Money Unlocks',
  status         = 'current',
  estimated_time = '8–15 mins',
  reward         = 'Rewards',
  prompt         = $p3$Quest: List five recent money moves. Think of it like your week's playlist of transactions.

Examples:
"I bought data because I needed to submit something and also stay online with my friends."
"I sent money to my sibling for transport."
"I skipped lunch to save for sneakers."

For each move:
• What was it?
• What did it help you do?
• Why did it matter right then?
• Was it planned, forced, routine, social, urgent, or impulsive?
• What would have made it easier, cheaper, safer, or more worth it?$p3$
where mission_id = 'm-3';

update missions set
  title          = 'Access Wishlist',
  teaser         = 'Two things you care about — why they matter and what blocks access.',
  topic          = 'Money Unlocks',
  status         = 'current',
  estimated_time = '8–15 mins',
  reward         = 'Rewards',
  prompt         = $p4$Quest: Choose two things you genuinely care about right now. Show us why they matter and what blocks access.

Examples:
"Sneakers make me feel part of my crew, but they're too expensive."
"Gaming keeps me connected, but data costs block me."
"Concerts matter for belonging, but tickets sell out too fast."

Tell us for each:
• What's the thing?
• Why does it matter?
• What makes access hard?
• Who already helps you?
• Who could help more?
• If a bank stepped in, what would feel useful vs fake?$p4$
where mission_id = 'm-4';

update missions set
  title          = 'Bank Permission Lab',
  teaser         = 'A bank says it wants to help young people. You''re the lab tester.',
  topic          = 'Money Unlocks',
  status         = 'current',
  estimated_time = '8–15 mins',
  reward         = 'Rewards',
  prompt         = $p5$Quest: Imagine a bank says: "We want to help young people access the things that matter to them." You're the lab tester.

Examples:
Useful: "Discounts on data bundles."
Fake: "Pretending to care with ads but no real help."
Proof: "Show me a student deal that actually works."

Tell us:
• What would feel genuinely useful?
• What would feel fake, cringe, controlling, risky, or like a trap?
• Which would you actually try: discount, early access, saving pot, split payment, data bundle, event access, creator/side-hustle tool, transport support, learning/work tool, or something else?
• What proof would make you trust it?
• Rewrite the bank's message in your own words: "If you want us to believe this, say it like this: ___"$p5$
where mission_id = 'm-5';
