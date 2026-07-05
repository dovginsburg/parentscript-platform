import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import {
  defaultParentPrefs,
  defaultTherapistFlags,
  parentCanUse,
  resolveParentPrefs,
  resolveTherapistFlags,
  type ParentFeatureKey,
} from '@/lib/featureFlags'
import type {
  ParentPreferenceKey,
  TherapistFeatureFlag,
} from '@/lib/types'

// ────────────────────────────────────────────────────────────────────
// Feature Flags Provider
// ────────────────────────────────────────────────────────────────────
//
// One source of truth for the whole app:
//   - Therapists get their own flag row loaded
//   - Parents get their own prefs row loaded
//   - Parents ALSO get their therapist's flag row loaded, so
//     parentCanUse() can compute correctly
//
// State shape:
//   loading         true until initial rows are loaded (or we know
//                   there are none). Components should gate on this.
//   flags           therapist flags (relevant to whoever is logged in:
//                   the therapist themselves, OR a parent's therapist)
//   prefs           parent prefs (only populated when parent is logged in)
//   updateFlag/setFlag/setPref  mutators that hit Supabase
//   isEnabled       helper — therapist-owned feature check
//   getPref         helper — parent-owned preference check
//   canUse          helper — combined check for parent-side features
// ────────────────────────────────────────────────────────────────────

interface FeatureFlagsState {
  therapistFlags: Record<TherapistFeatureFlag, boolean>
  parentPrefs: Record<ParentPreferenceKey, boolean>
  loading: boolean
}

interface FeatureFlagsContextValue extends FeatureFlagsState {
  // Setters — pass the new boolean value. They optimistically update
  // local state and write through to Supabase.
  setTherapistFlag: (key: TherapistFeatureFlag, value: boolean) => Promise<void>
  setParentPref: (key: ParentPreferenceKey, value: boolean) => Promise<void>

  // True if the therapist has this feature enabled.
  // For therapists: reads their own flags.
  // For parents: reads their therapist's flags.
  isEnabled: (key: TherapistFeatureFlag) => boolean

  // True if the parent has this preference on.
  // For parents: reads their own prefs. For therapists: always false.
  getPref: (key: ParentPreferenceKey) => boolean

  // Combined check for parent-facing features. Requires BOTH the
  // therapist to have it enabled AND the parent to have it visible.
  // Returns false for therapists (they should use isEnabled).
  canUse: (feature: ParentFeatureKey) => boolean
}

const FeatureFlagsContext = createContext<FeatureFlagsContextValue | null>(null)

export function FeatureFlagsProvider({ children }: { children: React.ReactNode }) {
  const { user, role, therapist, parent, loading: authLoading } = useAuth()

  const [state, setState] = useState<FeatureFlagsState>({
    therapistFlags: defaultTherapistFlags(),
    parentPrefs: defaultParentPrefs(),
    loading: true,
  })

  // ── Load ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (authLoading) return
    if (!user || !role) {
      // Not signed in — fall back to defaults, mark not loading.
      setState({
        therapistFlags: defaultTherapistFlags(),
        parentPrefs: defaultParentPrefs(),
        loading: false,
      })
      return
    }

    let cancelled = false

    async function load() {
      setState(s => ({ ...s, loading: true }))

      if (role === 'therapist' && therapist) {
        const { data } = await supabase
          .from('therapist_feature_flags')
          .select('flags')
          .eq('therapist_id', therapist.id)
          .maybeSingle()
        if (cancelled) return
        setState({
          therapistFlags: resolveTherapistFlags(data?.flags),
          parentPrefs: defaultParentPrefs(),
          loading: false,
        })
        return
      }

      if (role === 'parent' && parent) {
        // Parents need BOTH their own prefs AND their therapist's flags.
        // First, find the therapist for this parent.
        const { data: client } = await supabase
          .from('clients')
          .select('therapist_id')
          .eq('id', parent.client_id)
          .maybeSingle()
        const therapistId = client?.therapist_id ?? null

        const [prefsRes, flagsRes] = await Promise.all([
          supabase
            .from('parent_preferences')
            .select('prefs')
            .eq('parent_id', parent.id)
            .maybeSingle(),
          therapistId
            ? supabase
                .from('therapist_feature_flags')
                .select('flags')
                .eq('therapist_id', therapistId)
                .maybeSingle()
            : Promise.resolve({ data: null } as { data: null }),
        ])
        if (cancelled) return
        setState({
          therapistFlags: resolveTherapistFlags(flagsRes.data?.flags),
          parentPrefs: resolveParentPrefs(prefsRes.data?.prefs),
          loading: false,
        })
        return
      }

      setState({
        therapistFlags: defaultTherapistFlags(),
        parentPrefs: defaultParentPrefs(),
        loading: false,
      })
    }

    load()
    return () => {
      cancelled = true
    }
  }, [user, role, therapist, parent, authLoading])

  // ── Mutators ──────────────────────────────────────────────────────
  const setTherapistFlag = useCallback(
    async (key: TherapistFeatureFlag, value: boolean) => {
      if (!therapist) return
      // Optimistic update — feels instant.
      setState(s => ({
        ...s,
        therapistFlags: { ...s.therapistFlags, [key]: value },
      }))
      // Upsert (jsonb merge happens via set with full new value).
      const next: Record<TherapistFeatureFlag, boolean> = {
        ...state.therapistFlags,
        [key]: value,
      }
      const { error } = await supabase
        .from('therapist_feature_flags')
        .upsert(
          { therapist_id: therapist.id, flags: next },
          { onConflict: 'therapist_id' },
        )
      if (error) {
        // Roll back on failure.
        setState(s => ({
          ...s,
          therapistFlags: { ...s.therapistFlags, [key]: !value },
        }))
        console.error('Failed to save therapist flag', key, error)
      }
    },
    [therapist, state.therapistFlags],
  )

  const setParentPref = useCallback(
    async (key: ParentPreferenceKey, value: boolean) => {
      if (!parent) return
      setState(s => ({
        ...s,
        parentPrefs: { ...s.parentPrefs, [key]: value },
      }))
      const next: Record<ParentPreferenceKey, boolean> = {
        ...state.parentPrefs,
        [key]: value,
      }
      const { error } = await supabase
        .from('parent_preferences')
        .upsert(
          { parent_id: parent.id, prefs: next },
          { onConflict: 'parent_id' },
        )
      if (error) {
        setState(s => ({
          ...s,
          parentPrefs: { ...s.parentPrefs, [key]: !value },
        }))
        console.error('Failed to save parent preference', key, error)
      }
    },
    [parent, state.parentPrefs],
  )

  // ── Derived helpers ───────────────────────────────────────────────
  const value = useMemo<FeatureFlagsContextValue>(() => {
    return {
      ...state,
      setTherapistFlag,
      setParentPref,
      isEnabled: (key) => Boolean(state.therapistFlags[key]),
      getPref: (key) => Boolean(state.parentPrefs[key]),
      canUse: (feature) => parentCanUse(feature, state.therapistFlags, state.parentPrefs),
    }
  }, [state, setTherapistFlag, setParentPref])

  return (
    <FeatureFlagsContext.Provider value={value}>
      {children}
    </FeatureFlagsContext.Provider>
  )
}

export function useFeatureFlags() {
  const ctx = useContext(FeatureFlagsContext)
  if (!ctx) throw new Error('useFeatureFlags must be used inside FeatureFlagsProvider')
  return ctx
}
