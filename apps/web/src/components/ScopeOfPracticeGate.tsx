import { useEffect, useState } from 'react'
import ScopeOfPracticeDisclosure from '@/components/ScopeOfPracticeDisclosure'

// ──────────────────────────────────────────────────────────────────────
// ScopeOfPracticeGate — required acknowledgement modal
// ──────────────────────────────────────────────────────────────────────
//
// Per Mira's clinical memo §3 (parentscript-clinical-memo-2026-06-30.md):
// "Use this disclosure in the onboarding modal AND as a footer on every
// AI response card. Do not bury it."
//
// This gate renders the scope-of-practice disclosure as a fullscreen
// overlay that must be acknowledged before the underlying auth page is
// visible. Acceptance is persisted in localStorage so it's a one-time
// gate per device — re-asked only if the disclosure text version changes
// (the storage key embeds the version, so updates invalidate stored acks).
//
// Storage key: parentscript:scope-ack:v1
//   - Bumping "v1" → v2 will force all users to re-acknowledge after
//     Mira updates the disclosure.
//   - DO NOT change this version without coordinating with Mira —
//     re-acknowledgement must be tied to an actual disclosure update.

const STORAGE_KEY = 'parentscript:scope-ack:v1'
const DISCLOSURE_VERSION = '2026-06-30'

export default function ScopeOfPracticeGate({ children }: { children: React.ReactNode }) {
  const [ackState, setAckState] = useState<'loading' | 'accepted' | 'pending'>(
    typeof window === 'undefined' ? 'loading' : 'pending'
  )

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY)
      if (stored === DISCLOSURE_VERSION) {
        setAckState('accepted')
      } else {
        setAckState('pending')
      }
    } catch {
      // localStorage can throw in private modes / sandboxed iframes.
      // Fail closed: show the gate so the user still sees the disclosure.
      setAckState('pending')
    }
  }, [])

  function accept() {
    try {
      window.localStorage.setItem(STORAGE_KEY, DISCLOSURE_VERSION)
    } catch {
      // Best-effort persistence; if it fails the user just sees the gate again next visit.
    }
    setAckState('accepted')
  }

  function decline() {
    // The decline path is intentionally informational: we don't disable
    // anything, but we re-show the disclosure prominently so the user
    // knows the boundaries of what ParentScript is. This matches Mira's
    // spec: "do not bury it" — we surface it again rather than blocking
    // access, since the underlying product is still safe to evaluate.
    setAckState('pending')
  }

  if (ackState === 'loading') {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <p className="text-gray-400 text-sm">Loading…</p>
      </div>
    )
  }

  if (ackState === 'accepted') {
    return <>{children}</>
  }

  return (
    <div
      className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="scope-gate-title"
      aria-describedby="scope-gate-body"
    >
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="px-6 md:px-8 pt-6 md:pt-8 pb-2">
          <p className="text-xs font-semibold tracking-wider uppercase text-brand-700 mb-2">
            Before you continue
          </p>
          <h2
            id="scope-gate-title"
            className="text-2xl md:text-3xl font-black text-gray-900 leading-tight"
          >
            What ParentScript is — and isn't
          </h2>
        </div>

        <div id="scope-gate-body" className="px-6 md:px-8 py-4">
          <ScopeOfPracticeDisclosure />
        </div>

        <div className="px-6 md:px-8 pb-6 md:pb-8 pt-2 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
          <p className="text-xs text-gray-500 mb-4">
            By continuing, you acknowledge that you understand ParentScript is
            parenting support, not therapy, and that you will reach out to a
            licensed professional or crisis resource for any of the situations
            listed above.
          </p>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <button
              onClick={accept}
              data-scope-accept
              autoFocus
              className="flex-1 bg-brand-600 hover:bg-brand-700 text-white font-semibold px-5 py-3 rounded-xl min-h-tap transition"
            >
              I understand — continue
            </button>
            <button
              onClick={decline}
              className="px-5 py-3 rounded-xl text-sm text-gray-500 hover:text-gray-700 min-h-tap"
            >
              Show me this again
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}