// ──────────────────────────────────────────────────────────────────────
// ScopeOfPracticeDisclosure — Mira-verified scope + crisis-line block
// ──────────────────────────────────────────────────────────────────────
//
// Drop-in block required by Mira's clinical memo §3 to appear:
//   1. Onboarding modal (must accept before continuing).
//   2. Footer of every AI-authored card.
//   3. Marketing site footer on every page.
//
// This component renders the verbatim disclosure + crisis-line row.
// Source of truth: Mira's clinical memo (parentscript-clinical-memo-
// 2026-06-30.md, Section 3 "Mandatory scope-of-practice disclosure").
// When Mira updates the wording, edit it here AND in Mira's memo.
//
// Re-uses SCOPE_DISCLOSURE_TEXT from lib/safety.ts (already
// client/server-synced, Mira-verified). The crisis-line row is
// verbatim from the same memo.
//
// SURFACE PARAMETER
//   `surface` (default 'parent') picks the right header + body for the
//   active surface. Each surface has a Mira-approved disclosure
//   (parent) or a reviewable draft (sibling). See api/server.mjs
//   SURFACE_SCOPE for the server-side mirror. The footer of this
//   disclosure is always the same (crisis-line row is universal).

import { SCOPE_DISCLOSURE_TEXT } from '@/lib/safety'

type Surface = 'parent' | 'sibling'

const SURFACE_HEADER: Record<Surface, { title: string; body: string }> = {
  parent: {
    title: 'ParentScript is parenting support — not therapy.',
    body: 'The tools, scripts, and resources on ParentScript are educational and self-coaching aids built around well-established parenting frameworks (PCIT, BPT, CPS, Triple P, Circle of Security, and DBT-informed distress tolerance). They are not a substitute for diagnosis, psychotherapy, crisis care, or treatment of any mental health condition.',
  },
  sibling: {
    title: 'SiblingSupport is peer support — not counseling.',
    body: 'SiblingSupport is built for teens 13–18 who are supporting a sibling in distress. It teaches active listening, validation, and de-escalation — but it is not counseling, therapy, or a substitute for a trusted adult. If your sibling is in danger, you tell a safe adult. The app is here to help you slow down, not to be the only helper.',
  },
}

const SURFACE_TAIL: Record<Surface, string> = {
  parent: 'If you are working with a licensed mental health professional, ParentScript is designed to support that work between sessions — not replace it.',
  sibling: 'You are not the only helper. SiblingSupport is one tool in a wider circle that includes your parents, school counselor, the 988 Lifeline, and the Childhelp National Child Abuse Hotline.',
}

export default function ScopeOfPracticeDisclosure({
  compact = false,
  surface = 'parent',
}: {
  compact?: boolean
  surface?: Surface
}) {
  const header = SURFACE_HEADER[surface]
  const tail = SURFACE_TAIL[surface]
  return (
    <aside
      aria-label="Scope of practice and crisis resources"
      className="bg-brand-50 border border-brand-200 rounded-xl p-4 md:p-5"
    >
      <p className="text-xs md:text-sm text-gray-800 leading-relaxed">
        <strong className="font-bold">{header.title}</strong>{' '}
        {header.body}
      </p>

      <p className="text-xs md:text-sm text-gray-700 leading-relaxed mt-3">
        {tail}
      </p>

      {!compact && (
        <p className="text-xs md:text-sm text-gray-700 leading-relaxed mt-3">
          {SCOPE_DISCLOSURE_TEXT}
        </p>
      )}

      <p className="text-xs text-gray-700 mt-3 font-semibold">
        In or near a crisis?{' '}
        <span className="font-normal">Call or text</span>{' '}
        <a className="underline font-semibold" href="tel:988">988</a>{' '}
        <span className="font-normal">(Suicide &amp; Crisis Lifeline) · </span>
        <span className="font-normal">Childhelp </span>
        <a className="underline font-semibold" href="tel:18004224453">1-800-422-4453</a>{' '}
        <span className="font-normal">· Domestic Violence </span>
        <a className="underline font-semibold" href="tel:18007997233">1-800-799-7233</a>{' '}
        <span className="font-normal">· Emergency </span>
        <a className="underline font-semibold" href="tel:911">911</a>
        <span className="font-normal"> · International: </span>
        <a
          className="underline font-semibold"
          href="https://findahelpline.com"
          target="_blank"
          rel="noopener noreferrer"
        >
          findahelpline.com
        </a>
      </p>
    </aside>
  )
}