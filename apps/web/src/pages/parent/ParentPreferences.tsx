import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useFeatureFlags } from '@/hooks/useFeatureFlags';
import ToggleRow from '@/components/ToggleRow';
import { groupParentPrefsByCategory } from '@/lib/featureFlags';

// ────────────────────────────────────────────────────────────────────
// ParentPreferences — display + notification settings
// ────────────────────────────────────────────────────────────────────
//
// NON-CLINICAL UX only. Parents cannot toggle which skills are
// unlocked (that's therapist-controlled). They can adjust how the
// app looks and how it notifies them.
//
// Saves automatically — no Save button.

export default function ParentPreferences() {
  const { signOut } = useAuth();
  const { parentPrefs, setParentPref, loading } = useFeatureFlags();

  const grouped = groupParentPrefsByCategory();
  const categories = Object.keys(grouped);

  return (
    <div className="min-h-dvh bg-gray-50 pb-safe-bottom flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-4 md:px-8 pt-safe-top pb-3 flex items-center justify-between">
        <h1 className="text-xl font-black text-brand-800 tracking-tight">Preferences</h1>
        <Link
          to="/parent"
          className="text-sm text-gray-500 hover:text-gray-700 min-h-tap flex items-center"
        >
          ← Home
        </Link>
      </header>

      <main className="flex-1 px-4 md:px-8 py-6 md:max-w-2xl md:mx-auto w-full">
        <p className="text-sm text-gray-600 mb-6 leading-snug">
          Adjust how ParentScript looks and how it contacts you. The skills your therapist unlocks
          are not affected by these settings.
        </p>

        {loading ? (
          <p className="text-sm text-gray-500">Loading preferences…</p>
        ) : (
          <div className="space-y-6">
            {categories.map(category => (
              <section
                key={category}
                className="bg-white rounded-2xl border border-gray-200 overflow-hidden"
              >
                <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
                  <h2 className="text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    {category}
                  </h2>
                </div>
                <div className="divide-y divide-gray-100">
                  {grouped[category].map(pref => (
                    <ToggleRow
                      key={pref.id}
                      label={pref.label}
                      description={pref.description}
                      checked={Boolean(parentPrefs[pref.id])}
                      onChange={next => setParentPref(pref.id, next)}
                      experimental={pref.experimental}
                    />
                  ))}
                </div>
              </section>
            ))}

            <div className="pt-2 text-center">
              <button
                onClick={signOut}
                className="text-sm text-gray-400 hover:text-gray-600 min-h-tap"
              >
                Sign out
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
