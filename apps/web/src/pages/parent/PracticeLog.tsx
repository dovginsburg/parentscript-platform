import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { useFeatureFlags } from '@/hooks/useFeatureFlags'
import type { Skill, PracticeWentHow } from '@/lib/types'
import { REFLECTION_TAGS } from '@/lib/types'

const WENT_HOW_OPTIONS: { value: PracticeWentHow; emoji: string; label: string }[] = [
  { value: 'good', emoji: '😀', label: 'Good' },
  { value: 'mixed', emoji: '😐', label: 'Mixed' },
  { value: 'hard', emoji: '😞', label: 'Hard' },
]

export default function PracticeLog() {
  const { parent } = useAuth()
  const { canUse, loading } = useFeatureFlags()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const skillId = searchParams.get('skill')

  const [skill, setSkill] = useState<Skill | null>(null)
  const [wentHow, setWentHow] = useState<PracticeWentHow | null>(null)
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // If practice logging is disabled by therapist or parent, redirect home.
  // Redirect during render is forbidden — do it after commit.
  useEffect(() => {
    if (!loading && !canUse('practiceLogging')) {
      navigate('/parent', { replace: true })
    }
  }, [loading, canUse, navigate])

  if (!loading && !canUse('practiceLogging')) {
    return null
  }

  useEffect(() => {
    if (!skillId) return
    supabase.from('skills').select('*').eq('id', skillId).single().then(({ data }) => {
      setSkill(data)
    })
  }, [skillId])

  function toggleTag(tag: string) {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    )
  }

  async function handleSubmit() {
    if (!parent || !wentHow) return
    setSubmitting(true)
    setError(null)

    const { error: insertError } = await supabase.from('practice_logs').insert({
      client_id: parent.client_id,
      parent_id: parent.id,
      skill_id: skillId ?? null,
      practiced_at: new Date().toISOString(),
      went_how: wentHow,
      reflection_tags: selectedTags.length > 0 ? selectedTags : null,
    })

    if (insertError) {
      console.error('[PracticeLog] insert failed:', insertError)
      setError(
        (insertError as { message?: string })?.message ||
          'Could not save the log. Please try again.'
      )
      setSubmitting(false)
      return
    }
    setDone(true)
    setTimeout(() => navigate('/parent'), 1500)
  }

  if (done) {
    return (
      <div className="min-h-dvh bg-white flex flex-col items-center justify-center px-6 text-center">
        <span className="text-6xl md:text-8xl mb-4">✓</span>
        <h2 className="text-parent-2xl md:text-5xl font-black text-gray-900">Logged!</h2>
        <p className="text-gray-500 mt-2 md:text-lg">Great work. Keep it up.</p>
      </div>
    )
  }

  return (
    <div className="min-h-dvh bg-white flex flex-col">
      <header className="px-4 md:px-8 pt-safe-top pb-4 border-b border-gray-100 flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="text-brand-700 font-medium text-sm min-h-tap flex items-center"
        >
          ← Back
        </button>
        <h1 className="text-lg font-bold text-gray-900">Log Practice</h1>
        <div className="w-12" />
      </header>

      <div className="flex-1 px-4 md:px-8 py-6 space-y-8 md:max-w-2xl md:mx-auto w-full overflow-y-auto panel-scroll">
        {skill && (
          <div className="bg-brand-50 border border-brand-100 rounded-2xl px-4 py-3 md:px-5 md:py-4">
            <p className="text-xs text-brand-600 font-semibold uppercase tracking-wide mb-0.5">Skill</p>
            <p className="text-parent-lg font-bold text-gray-900">{skill.title}</p>
          </div>
        )}

        {/* How did it go? */}
        <section>
          <h2 className="text-parent-base font-bold text-gray-900 mb-4">How did it go?</h2>
          <div className="grid grid-cols-3 gap-3 md:gap-4">
            {WENT_HOW_OPTIONS.map(option => (
              <button
                key={option.value}
                onClick={() => setWentHow(option.value)}
                className={`flex flex-col items-center gap-2 py-5 md:py-8 rounded-2xl border-2 transition min-h-tap touch-feedback ${
                  wentHow === option.value
                    ? 'border-brand-600 bg-brand-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <span className="text-4xl md:text-5xl">{option.emoji}</span>
                <span className="text-sm md:text-base font-semibold text-gray-700">{option.label}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Optional reflection tags */}
        <section>
          <h2 className="text-parent-base font-bold text-gray-900 mb-1">Anything else? (optional)</h2>
          <p className="text-sm text-gray-500 mb-4">Select all that apply</p>
          <div className="flex flex-wrap gap-2 md:gap-3">
            {REFLECTION_TAGS.map(tag => (
              <button
                key={tag.value}
                onClick={() => toggleTag(tag.value)}
                className={`px-4 py-2 md:px-5 md:py-2.5 rounded-full text-sm md:text-base font-medium border transition min-h-tap touch-feedback ${
                  selectedTags.includes(tag.value)
                    ? 'bg-brand-700 text-white border-brand-700'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                }`}
              >
                {tag.label}
              </button>
            ))}
          </div>
        </section>

        {error && (
          <div className="rounded-lg bg-danger-50 border border-danger-500 p-3 text-sm text-danger-700">
            {error}
          </div>
        )}
      </div>

      {/* Submit */}
      <div className="sticky-cta px-4 md:px-8 py-4">
        <div className="md:max-w-2xl md:mx-auto">
          <button
            onClick={handleSubmit}
            disabled={!wentHow || submitting}
            className="w-full bg-brand-700 hover:bg-brand-800 text-white font-bold text-parent-lg md:text-xl py-4 md:py-5 rounded-2xl transition disabled:opacity-40 min-h-tap"
          >
            {submitting ? 'Saving…' : 'Save log'}
          </button>
        </div>
      </div>
    </div>
  )
}