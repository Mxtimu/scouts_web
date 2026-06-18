export const TOPIC_META = {
  'Money Unlocks': { color: 'text-amber-400', bg: 'bg-amber-400/10', border: 'border-amber-400/20', dot: 'bg-amber-400' },
  'Passions':       { color: 'text-rose-400',  bg: 'bg-rose-400/10',  border: 'border-rose-400/20',  dot: 'bg-rose-400' },
  'Digital Life':   { color: 'text-cyan-400',  bg: 'bg-cyan-400/10',  border: 'border-cyan-400/20',  dot: 'bg-cyan-400' },
  'Identity':       { color: 'text-violet-400',bg: 'bg-violet-400/10',border: 'border-violet-400/20',dot: 'bg-violet-400' },
  'Culture':        { color: 'text-emerald-400',bg: 'bg-emerald-400/10',border: 'border-emerald-400/20',dot: 'bg-emerald-400' },
}

export const INITIAL_MISSIONS = [
  // ── CURRENT (active this week) ────────────────────────────────────────────
  {
    id: 'm-1',
    title: 'Unlock Moments',
    teaser: 'In the last 7 days, where did money unlock something that mattered?',
    topic: 'Money Unlocks',
    status: 'current',
    dueDate: '2026-06-13',
    estimatedTime: '8–15 mins',
    reward: 'Rewards',
    prompt:
`Quest: In the last 7 days, where did money unlock something that mattered? Pick three moments and tell us the story.

Examples:
"I bought data to stay online with friends. It mattered because being offline makes me feel cut off."
"I paid for transport to get to class. It mattered because missing class feels like falling behind."
"I helped a friend with food. It mattered because it made me feel useful."

Tell us:
• What did money unlock?
• Why did it matter?
• What made it easy or tricky?
• If a bank showed up here, what would actually help (not just noise)?`,
  },
  {
    id: 'm-2',
    title: 'Decision Drama',
    teaser: 'One thing you wanted that cost money — rewind the scene.',
    topic: 'Money Unlocks',
    status: 'current',
    dueDate: '2026-06-13',
    estimatedTime: '8–15 mins',
    reward: 'Rewards',
    prompt:
`Quest: Think of one thing you wanted recently that cost money. Rewind the scene.

Examples:
"I wanted sneakers → I asked my parent → they said wait → I ended up not buying."
"I wanted concert tickets → I split costs with friends → we all decided together."

Tell us:
• What did you want?
• Who held the wallet?
• Did you decide, ask, negotiate, wait, contribute, or give up?
• What gave you power?
• What reduced it?
• What would have made the whole thing smoother?`,
  },
  {
    id: 'm-3',
    title: 'Money Moves Playlist',
    teaser: 'List five recent money moves — your week\'s playlist of transactions.',
    topic: 'Money Unlocks',
    status: 'current',
    dueDate: '2026-06-13',
    estimatedTime: '8–15 mins',
    reward: 'Rewards',
    prompt:
`Quest: List five recent money moves. Think of it like your week's playlist of transactions.

Examples:
"I bought data because I needed to submit something and also stay online with my friends."
"I sent money to my sibling for transport."
"I skipped lunch to save for sneakers."

For each move:
• What was it?
• What did it help you do?
• Why did it matter right then?
• Was it planned, forced, routine, social, urgent, or impulsive?
• What would have made it easier, cheaper, safer, or more worth it?`,
  },

  // ── UPCOMING (unlocks next week) ──────────────────────────────────────────
  {
    id: 'm-4',
    title: 'Access Wishlist',
    teaser: 'Two things you care about — why they matter and what blocks access.',
    topic: 'Money Unlocks',
    status: 'current',
    dueDate: '2026-06-16',
    estimatedTime: '8–15 mins',
    reward: 'Rewards',
    prompt:
`Quest: Choose two things you genuinely care about right now. Show us why they matter and what blocks access.

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
• If a bank stepped in, what would feel useful vs fake?`,
  },
  {
    id: 'm-5',
    title: 'Bank Permission Lab',
    teaser: 'A bank says it wants to help young people. You\'re the lab tester.',
    topic: 'Money Unlocks',
    status: 'current',
    dueDate: '2026-06-20',
    estimatedTime: '8–15 mins',
    reward: 'Rewards',
    prompt:
`Quest: Imagine a bank says: "We want to help young people access the things that matter to them." You're the lab tester.

Examples:
Useful: "Discounts on data bundles."
Fake: "Pretending to care with ads but no real help."
Proof: "Show me a student deal that actually works."

Tell us:
• What would feel genuinely useful?
• What would feel fake, cringe, controlling, risky, or like a trap?
• Which would you actually try: discount, early access, saving pot, split payment, data bundle, event access, creator/side-hustle tool, transport support, learning/work tool, or something else?
• What proof would make you trust it?
• Rewrite the bank's message in your own words: "If you want us to believe this, say it like this: ___"`,
  },
]
