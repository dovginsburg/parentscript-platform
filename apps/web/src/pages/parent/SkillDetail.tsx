import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { useSwipeBack } from '@/hooks/useSwipe'
import type { Skill, ClientSkillState } from '@/lib/types'
import { NOTE_TAG_LABELS } from '@/lib/types'

export default function SkillDetail() {
  const { slug } = useParams<{ slug: string }>()
  const { parent } = useAuth()
  const navigate = useNavigate()
  const [skill, setSkill] = useState<Skill | null>(null)
  const [state, setState] = useState<ClientSkillState | null>(null)
  const [loading, setLoading] = useState(true)

  const swipeHandlers = useSwipeBack(() => navigate('/parent'))

  useEffect(() => {
    if (!slug || !parent) return
    let cancelled = false
    async function load() {
      // Look up the skill by slug first, then fetch the matching state row.
      const skillRes = await supabase
        .from('skills')
        .select('*')
        .eq('slug', slug)
        .eq('is_published', true)
        .single()
      if (cancelled) return
      const foundSkill: Skill | null = skillRes.data ?? null
      setSkill(foundSkill)

      if (!foundSkill) {
        setState(null)
        setLoading(false)
        return
      }

      const stateRes = await supabase
        .from('client_skill_state')
        .select('*')
        .eq('client_id', parent!.client_id)
        .eq('skill_id', foundSkill.id)
        .maybeSingle()
      if (cancelled) return
      setState(stateRes.data ?? null)
      setLoading(false)
    }
    load()
    return () => { cancelled = true }
  }, [slug, parent])

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <p className="text-gray-400">Loading…</p>
      </div>
    )
  }

  if (!skill || state?.status !== 'unlocked') {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center px-6 text-center">
        <p className="text-gray-500 text-lg font-medium">Skill not available</p>
        <button
          onClick={() => navigate('/parent')}
          className="mt-4 text-brand-700 font-medium min-h-tap flex items-center"
        >
          ← Back home
        </button>
      </div>
    )
  }

  return (
    <div
      className="min-h-dvh bg-white flex flex-col swipeable"
      {...swipeHandlers}
    >
      {/* Sticky header */}
      <header className="bg-white border-b border-gray-100 px-4 md:px-8 pt-safe-top pb-4 sticky top-0 z-10">
        <div className="md:max-w-3xl md:mx-auto">
          <button
            onClick={() => navigate('/parent')}
            className="text-brand-700 font-medium text-sm mb-3 block min-h-tap flex items-center"
          >
            ← Back
          </button>
          <h1 className="text-parent-2xl md:text-4xl font-black text-gray-900 leading-tight">{skill.title}</h1>
          {state?.note_tag && (
            <span className="inline-block mt-2 text-sm font-medium px-3 py-1 rounded-full bg-brand-100 text-brand-800">
              {state.note_tag === 'focus_this_week' && '⭐ '}
              {state.note_tag === 'going_well' && '✅ '}
              {state.note_tag === 'revisit' && '🔄 '}
              {NOTE_TAG_LABELS[state.note_tag]}
            </span>
          )}
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 px-4 md:px-8 py-6 overflow-y-auto panel-scroll">
        <div className="md:max-w-3xl md:mx-auto space-y-6">

          {/* Safety warning — full width */}
          {skill.safety_warning && (
            <div className="bg-danger-50 border-l-4 border-danger-600 rounded-r-xl p-4">
              <p className="text-sm font-bold text-danger-700 mb-1">⚠️ Safety note</p>
              <p className="text-parent-sm text-danger-700">{skill.safety_warning}</p>
            </div>
          )}

          {/* Goal + Use When — single column on phone, side-by-side on iPad */}
          <div className="md:grid md:grid-cols-2 md:gap-6 space-y-6 md:space-y-0">
            <section>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Goal</h2>
              <p className="text-parent-lg text-gray-900 font-medium leading-snug">{skill.goal}</p>
            </section>

            <section>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Use when</h2>
              <p className="text-parent-base text-gray-700">{skill.use_when}</p>
            </section>
          </div>

          {/* Say This + Don't Say — side-by-side on iPad */}
          <div className="md:grid md:grid-cols-2 md:gap-6 space-y-6 md:space-y-0">
            {/* Say This — most prominent */}
            <section className="bg-brand-50 border border-brand-200 rounded-2xl p-5">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-brand-600 mb-3">Say this</h2>
              <div className="space-y-3">
                {skill.say_this.split('\n').filter(Boolean).map((line, i) => (
                  <p key={i} className="text-parent-lg text-gray-900 font-semibold leading-snug">
                    "{line.replace(/^"/, '').replace(/"$/, '')}"
                  </p>
                ))}
              </div>
            </section>

            {/* Don't Say */}
            <section className="bg-gray-50 border border-gray-200 rounded-2xl p-5">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">Don't say</h2>
              <div className="space-y-2">
                {skill.dont_say.split('\n').filter(Boolean).map((line, i) => (
                  <p key={i} className="text-parent-base text-gray-600 line-through decoration-danger-400">
                    {line.replace(/^"/, '').replace(/"$/, '')}
                  </p>
                ))}
              </div>
            </section>
          </div>

          <p className="text-xs text-center text-gray-400 pb-2">
            DRAFT — clinician review required before clinical use
          </p>
        </div>
      </div>

      {/* Practiced This button */}
      <div className="sticky-cta px-4 md:px-8 py-4">
        <div className="md:max-w-3xl md:mx-auto">
          <button
            onClick={() => navigate(`/parent/practice?skill=${skill.id}`)}
            className="w-full bg-success-600 hover:bg-success-600 active:bg-success-600 text-white font-bold text-parent-lg md:text-xl py-4 md:py-5 rounded-2xl transition min-h-tap"
          >
            ✓ Practiced this
          </button>
        </div>
      </div>
    </div>
  )
}
