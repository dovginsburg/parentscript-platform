import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useFeatureFlags } from '@/hooks/useFeatureFlags';
import ToggleRow from '@/components/ToggleRow';
import { groupTherapistFlagsByCategory } from '@/lib/featureFlags';

// ────────────────────────────────────────────────────────────────────
// TherapistSettings — feature flags admin page
// ────────────────────────────────────────────────────────────────────
//
// One toggle per row in THERAPIST_FLAGS (see src/lib/featureFlags.ts).
// Adding a flag → add it to THERAPIST_FLAGS, it shows up here.
// Flags are grouped by category for scanability.
//
// Saves automatically — no Save button. The hook does an optimistic
// update and rolls back on error.

export default function TherapistSettings() {
  const { therapist, signOut } = useAuth();
  const navigate = useNavigate();
  const { therapistFlags, setTherapistFlag, loading } = useFeatureFlags();

  const grouped = groupTherapistFlagsByCategory();
  const categories = Object.keys(grouped);

  return (
    <div className="min-h-dvh bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 md:px-10 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-brand-800 tracking-tight">ParentScript</h1>
          <p className="text-xs text-gray-500">Therapist dashboard</p>
        </div>
        <div className="flex items-center gap-4 md:gap-6">
          <Link
            to="/therapist/clients"
            className="text-sm font-medium text-brand-700 hover:underline min-h-tap flex items-center"
          >
            ← Clients
          </Link>
          <span className="hidden sm:block text-sm text-gray-600">
            {therapist?.display_name || therapist?.email}
          </span>
          <button
            onClick={signOut}
            className="text-sm text-gray-500 hover:text-gray-700 min-h-tap flex items-center"
          >
            Sign out
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 md:px-10 py-8">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900">Feature settings</h2>
          <p className="text-sm text-gray-500 mt-1">
            Turn features on or off for your account. Parents in your caseload see only the features
            you enable here.
          </p>
        </div>

        {loading ? (
          <p className="text-sm text-gray-500">Loading settings…</p>
        ) : (
          <div className="space-y-6">
            {categories.map(category => (
              <section
                key={category}
                className="bg-white rounded-xl border border-gray-200 overflow-hidden"
              >
                <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
                  <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
                    {category}
                  </h3>
                </div>
                <div className="divide-y divide-gray-100">
                  {grouped[category].map(flag => (
                    <ToggleRow
                      key={flag.id}
                      label={flag.label}
                      description={flag.description}
                      checked={Boolean(therapistFlags[flag.id])}
                      onChange={next => setTherapistFlag(flag.id, next)}
                      experimental={flag.experimental}
                    />
                  ))}
                </div>
              </section>
            ))}

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm font-semibold text-blue-900 mb-1">How this affects parents</p>
              <p className="text-sm text-blue-800 leading-snug">
                When you turn off a parent-facing feature (like In-the-Moment), the button
                disappears from every parent's home screen immediately. The parent can still toggle
                their own display and notification preferences, but they can't override your
                clinical decisions.
              </p>
            </div>

            <div className="pt-2">
              <button
                onClick={() => navigate('/therapist/clients')}
                className="text-sm text-gray-500 hover:text-gray-700 min-h-tap"
              >
                ← Back to clients
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
