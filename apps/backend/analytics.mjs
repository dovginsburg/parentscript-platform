// ============================================================
// /api analytics — Practice pattern + session-prep summaries
// ============================================================
//
// Both functions are STRUCTURED data only — no LLM, no free-text
// summarization. That keeps us inside the project's "no PHI / no
// free-text in v1" rule (CLAUDE.md) and makes the outputs cheap,
// fast, and explainable. If we ever want prose summaries later,
// they can sit on top of these structures.
//
// All time math is in days. "This week" = the last 7 days.
// "Active this week" = a practice log within the last 7 days.
// ============================================================

const DAY = 24 * 60 * 60 * 1000

function daysAgo(iso) {
  if (!iso) return Infinity
  const t = Date.parse(iso)
  if (Number.isNaN(t)) return Infinity
  return (Date.now() - t) / DAY
}

function isoDay(iso) {
  return iso ? iso.slice(0, 10) : null
}

// ── Practice patterns for one client ────────────────────────────
// Used by:
//   - Parent home screen (self-reflection)
//   - Therapist client-detail page (deep dive on one client)
//
// Returns counts, recent trend, skills with concerning patterns,
// and simple "things to notice" strings the UI can render directly.
export async function buildAnalyticsSummary(adminClient, clientId) {
  // Pull practice logs + joined skill titles.
  const { data: logs, error } = await adminClient
    .from('practice_logs')
    .select('id, went_how, practiced_at, reflection_tags, skill_id, skills:skill_id ( id, title, slug, level )')
    .eq('client_id', clientId)
    .order('practiced_at', { ascending: false })
    .limit(500)
  if (error) throw error

  const total = logs?.length ?? 0
  const last7 = (logs ?? []).filter((l) => daysAgo(l.practiced_at) <= 7)
  const last30 = (logs ?? []).filter((l) => daysAgo(l.practiced_at) <= 30)

  // Tally went_how.
  const wentHow = { good: 0, mixed: 0, hard: 0 }
  for (const l of logs ?? []) {
    if (l.went_how in wentHow) wentHow[l.went_how]++
  }

  // Skills with concerning patterns.
  // "Concerning" = >= 3 practice attempts in last 30 days AND
  // hard-rate >= 50%.
  const perSkill = new Map()
  for (const l of last30) {
    const k = l.skill_id ?? '__none__'
    const s = perSkill.get(k) ?? {
      skillId: l.skill_id ?? null,
      title: l.skills?.title ?? 'No specific skill',
      slug: l.skills?.slug ?? null,
      level: l.skills?.level ?? null,
      attempts: 0,
      hard: 0,
      mixed: 0,
      good: 0,
    }
    s.attempts++
    if (l.went_how === 'hard') s.hard++
    if (l.went_how === 'mixed') s.mixed++
    if (l.went_how === 'good') s.good++
    perSkill.set(k, s)
  }
  const concerningSkills = [...perSkill.values()]
    .filter((s) => s.attempts >= 3 && s.hard / s.attempts >= 0.5)
    .sort((a, b) => b.hard / b.attempts - a.hard / a.attempts)

  // Skills doing well (>= 3 attempts, good-rate >= 70%).
  const goingWellSkills = [...perSkill.values()]
    .filter((s) => s.attempts >= 3 && s.good / s.attempts >= 0.7)
    .sort((a, b) => b.good / b.attempts - a.good / a.attempts)

  // Reflection tag tally (top 3).
  const tagCounts = new Map()
  for (const l of logs ?? []) {
    for (const t of l.reflection_tags ?? []) {
      tagCounts.set(t, (tagCounts.get(t) ?? 0) + 1)
    }
  }
  const topTags = [...tagCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([tag, count]) => ({ tag, count }))

  // Engagement status.
  const lastLogAt = logs?.[0]?.practiced_at ?? null
  const daysSinceLastLog = Math.floor(daysAgo(lastLogAt))

  return {
    totalLogs: total,
    last7Count: last7.length,
    last30Count: last30.length,
    wentHow,
    concerningSkills: concerningSkills.map((s) => ({
      skillId: s.skillId,
      title: s.title,
      slug: s.slug,
      level: s.level,
      attempts: s.attempts,
      hard: s.hard,
      hardRate: s.attempts ? s.hard / s.attempts : 0,
    })),
    goingWellSkills: goingWellSkills.map((s) => ({
      skillId: s.skillId,
      title: s.title,
      slug: s.slug,
      level: s.level,
      attempts: s.attempts,
      good: s.good,
      goodRate: s.attempts ? s.good / s.attempts : 0,
    })),
    topTags,
    engagement: {
      lastLogAt,
      daysSinceLastLog,
      activeThisWeek: last7.length > 0,
    },
  }
}

// ── Session prep brief for a therapist ───────────────────────────
// Used by the therapist dashboard right before a session.
// Aggregates across all clients owned by the therapist.
export async function buildSessionPrepSummary(adminClient, therapistId /*, _therapistIdParam */) {
  // 1. Pull all clients for this therapist.
  const { data: clients, error: cErr } = await adminClient
    .from('clients')
    .select('id, label, created_at')
    .eq('therapist_id', therapistId)
    .order('created_at', { ascending: false })
  if (cErr) throw cErr

  const clientList = clients ?? []
  if (clientList.length === 0) {
    return {
      therapistId,
      generatedAt: new Date().toISOString(),
      clients: [],
      caseload: { total: 0, activeThisWeek: 0, noRecentPractice: 0 },
      caseloadConcerns: [],
    }
  }

  // 2. For each client, pull last 30 days of practice logs.
  const since = new Date(Date.now() - 30 * DAY).toISOString()
  const { data: logs, error: lErr } = await adminClient
    .from('practice_logs')
    .select('id, client_id, went_how, practiced_at, reflection_tags, skill_id, skills:skill_id ( id, title, slug, level )')
    .in('client_id', clientList.map((c) => c.id))
    .gte('practiced_at', since)
    .order('practiced_at', { ascending: false })
  if (lErr) throw lErr

  const logsByClient = new Map()
  for (const l of logs ?? []) {
    const arr = logsByClient.get(l.client_id) ?? []
    arr.push(l)
    logsByClient.set(l.client_id, arr)
  }

  // 3. Per-client rollup.
  const clientsPrep = clientList.map((client) => {
    const arr = logsByClient.get(client.id) ?? []
    const last7 = arr.filter((l) => daysAgo(l.practiced_at) <= 7)
    const lastLogAt = arr[0]?.practiced_at ?? null
    const daysSinceLastLog = Math.floor(daysAgo(lastLogAt))

    // Per-skill concern count (same logic as buildAnalyticsSummary).
    const perSkill = new Map()
    for (const l of arr) {
      const k = l.skill_id ?? '__none__'
      const s = perSkill.get(k) ?? {
        title: l.skills?.title ?? 'No specific skill',
        attempts: 0,
        hard: 0,
      }
      s.attempts++
      if (l.went_how === 'hard') s.hard++
      perSkill.set(k, s)
    }
    const concerns = [...perSkill.values()]
      .filter((s) => s.attempts >= 3 && s.hard / s.attempts >= 0.5)
      .sort((a, b) => b.hard / b.attempts - a.hard / a.attempts)

    return {
      clientId: client.id,
      label: client.label,
      last7Count: last7.length,
      last30Count: arr.length,
      lastLogAt,
      daysSinceLastLog: Number.isFinite(daysSinceLastLog) ? daysSinceLastLog : null,
      concerningSkills: concerns.slice(0, 3).map((s) => ({
        title: s.title,
        attempts: s.attempts,
        hard: s.hard,
        hardRate: s.attempts ? s.hard / s.attempts : 0,
      })),
    }
  })

  // 4. Sort: most-active first; never-practiced at the bottom.
  clientsPrep.sort((a, b) => {
    if (a.last7Count !== b.last7Count) return b.last7Count - a.last7Count
    if (a.daysSinceLastLog == null) return -1
    if (b.daysSinceLastLog == null) return 1
    return b.daysSinceLastLog - a.daysSinceLastLog
  })

  // 5. Caseload rollups.
  const activeThisWeek = clientsPrep.filter((c) => c.last7Count > 0).length
  const noRecentPractice = clientsPrep.filter(
    (c) => c.daysSinceLastLog == null || c.daysSinceLastLog > 14
  ).length

  // 6. Caseload-level concerns (skills appearing as concerning
  //    for >= 2 clients — useful as a "you might want to revisit
  //    this skill in supervision" signal).
  const concernTitleCounts = new Map()
  for (const c of clientsPrep) {
    const seen = new Set()
    for (const s of c.concerningSkills) {
      if (seen.has(s.title)) continue
      seen.add(s.title)
      concernTitleCounts.set(s.title, (concernTitleCounts.get(s.title) ?? 0) + 1)
    }
  }
  const caseloadConcerns = [...concernTitleCounts.entries()]
    .filter(([, n]) => n >= 2)
    .sort((a, b) => b[1] - a[1])
    .map(([title, n]) => ({ title, clientsAffected: n }))

  return {
    therapistId,
    generatedAt: new Date().toISOString(),
    caseload: {
      total: clientsPrep.length,
      activeThisWeek,
      noRecentPractice,
    },
    caseloadConcerns,
    clients: clientsPrep,
  }
}