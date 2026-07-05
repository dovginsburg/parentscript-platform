import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { useFeatureFlags } from '@/hooks/useFeatureFlags';
import { useLongPress } from '@/hooks/useLongPress';
import CrisisCard from '@/components/CrisisCard';
import type { Skill, ClientSkillState } from '@/lib/types';

interface SkillWithState extends Skill {
  state: ClientSkillState | null;
  isUnlocked: boolean;
}

const LEVEL_NAMES: Record<number, string> = {
  1: 'Connection & Foundation',
  2: 'Shaping Behavior',
  3: 'Limits & Boundaries',
};

// ── iOS install prompt ────────────────────────────────────────────────────────
function IOSInstallBanner({ onDismiss }: { onDismiss: () => void }) {
  return (
    <div className="bg-brand-700 text-white px-4 py-3 flex items-start gap-3">
      <span className="text-xl shrink-0 mt-0.5">📲</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold leading-snug">
          Add ParentScript to your home screen for the best experience.
        </p>
        <p className="text-xs text-brand-200 mt-0.5">
          Tap the <strong>Share</strong> button (⎙) then "Add to Home Screen"
        </p>
      </div>
      <button
        onClick={onDismiss}
        className="text-brand-200 hover:text-white text-lg leading-none shrink-0 mt-0.5"
        aria-label="Dismiss"
      >
        ✕
      </button>
    </div>
  );
}

// ── Skill preview bottom sheet (long-press) ───────────────────────────────────
function SkillPreviewSheet({
  skill,
  onClose,
  onNavigate,
}: {
  skill: SkillWithState;
  onClose: () => void;
  onNavigate: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/40" onClick={onClose}>
      <div
        className="bg-white rounded-t-3xl w-full max-h-[80vh] overflow-y-auto shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Drag handle */}
        <div className="pt-3 pb-2 flex justify-center">
          <div className="w-10 h-1 bg-gray-200 rounded-full" />
        </div>

        <div className="px-5 pb-6 space-y-4">
          <h3 className="text-xl font-black text-gray-900 leading-tight">{skill.title}</h3>
          <p className="text-base text-gray-600 leading-snug">{skill.goal}</p>

          {skill.say_this && (
            <div className="bg-brand-50 border border-brand-200 rounded-2xl p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-brand-600 mb-2">
                Try saying
              </p>
              <p className="text-lg font-semibold text-gray-900 leading-snug">
                "{skill.say_this.split('\n').filter(Boolean)[0]}"
              </p>
            </div>
          )}

          <button
            onClick={onNavigate}
            className="w-full bg-brand-700 text-white font-bold text-lg py-4 rounded-2xl"
          >
            View full skill →
          </button>
          <button onClick={onClose} className="w-full py-3 text-gray-400 text-sm">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Unlocked skill card (calls useLongPress at component level) ───────────────
function UnlockedSkillCard({
  skill,
  onPreview,
}: {
  skill: SkillWithState;
  onPreview: (skill: SkillWithState) => void;
}) {
  const navigate = useNavigate();
  const longPress = useLongPress(() => onPreview(skill));

  return (
    <div
      {...longPress}
      onClick={() => navigate(`/parent/skills/${skill.slug}`)}
      className="long-press-target block bg-white rounded-2xl border border-gray-200 px-4 py-4 md:py-5 hover:border-brand-300 hover:shadow-sm active:bg-gray-50 transition select-none"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="font-bold text-parent-base text-gray-900">{skill.title}</p>
          <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">{skill.goal}</p>
          {skill.state?.note_tag && (
            <span className="inline-block mt-1.5 text-xs font-medium px-2 py-0.5 rounded-full bg-brand-100 text-brand-800">
              {skill.state.note_tag === 'focus_this_week' && '⭐ Focus this week'}
              {skill.state.note_tag === 'going_well' && '✅ Going well'}
              {skill.state.note_tag === 'revisit' && '🔄 Revisit'}
            </span>
          )}
        </div>
        <span className="text-brand-600 text-xl mt-1">›</span>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function ParentHome() {
  const { parent, signOut } = useAuth();
  const { canUse } = useFeatureFlags();
  const navigate = useNavigate();
  const [skills, setSkills] = useState<SkillWithState[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewSkill, setPreviewSkill] = useState<SkillWithState | null>(null);
  const [showIOSBanner, setShowIOSBanner] = useState(false);

  // Feature flags — both the therapist and the parent must agree.
  // Defaults to true so the UI never blanks out before flags load.
  const showInTheMoment = canUse('inTheMoment');
  const showPracticeLog = canUse('practiceLogging');
  // NOTE: CrisisCard is intentionally NOT feature-flagged. It is
  // clinical safety infrastructure — like 988 / 911, it should
  // always be reachable from the parent home. The component itself
  // exposes a "hide for now" affordance (session-scoped) for parents
  // who need a quieter screen.
  useEffect(() => {
    if (!parent) return;
    async function load() {
      const [skillsRes, statesRes] = await Promise.all([
        supabase
          .from('skills')
          .select('*')
          .eq('is_published', true)
          .order('level')
          .order('sort_order'),
        supabase.from('client_skill_state').select('*').eq('client_id', parent!.client_id),
      ]);
      const stateMap = new Map((statesRes.data ?? []).map(s => [s.skill_id, s]));
      setSkills(
        (skillsRes.data ?? []).map(skill => ({
          ...skill,
          state: stateMap.get(skill.id) ?? null,
          isUnlocked: stateMap.get(skill.id)?.status === 'unlocked',
        }))
      );
      setLoading(false);
    }
    load();
  }, [parent]);

  // Show iOS install hint if: iOS Safari (not standalone), not previously dismissed
  useEffect(() => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    const isStandalone = (window.navigator as any).standalone === true;
    const dismissed = sessionStorage.getItem('ios-install-dismissed');
    if (isIOS && !isStandalone && !dismissed) {
      setShowIOSBanner(true);
    }
  }, []);

  const dismissIOSBanner = useCallback(() => {
    sessionStorage.setItem('ios-install-dismissed', '1');
    setShowIOSBanner(false);
  }, []);

  const byLevel = [1, 2, 3].map(level => ({
    level,
    name: LEVEL_NAMES[level],
    skills: skills.filter(s => s.level === level),
  }));

  const unlockedCount = skills.filter(s => s.isUnlocked).length;

  return (
    <div className="min-h-dvh bg-gray-50 pb-safe-bottom flex flex-col">
      {showIOSBanner && <IOSInstallBanner onDismiss={dismissIOSBanner} />}

      {/* In-the-Moment crisis card — always above the fold, above
          all other UI, z-index: crisis (400). Token-aligned to
          packages/design/tokens.json → global.feedback.crisis.
          Not feature-flagged: clinical safety infrastructure. */}
      <CrisisCard />

      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-4 md:px-8 pt-safe-top pb-3 flex items-center justify-between">
        <h1 className="text-xl font-black text-brand-800 tracking-tight">ParentScript</h1>
        <div className="flex items-center gap-4">
          <Link
            to="/parent/preferences"
            className="text-sm text-gray-400 hover:text-gray-600 min-h-tap flex items-center"
            aria-label="Preferences"
          >
            Preferences
          </Link>
          <button
            onClick={signOut}
            className="text-sm text-gray-400 hover:text-gray-600 min-h-tap flex items-center"
          >
            Sign out
          </button>
        </div>
      </header>

      {/* In-the-Moment button — only shown when both therapist and
          parent agree the feature is enabled. */}
      {showInTheMoment && (
        <div className="px-4 md:px-8 py-4 bg-white border-b border-gray-100">
          <div className="md:max-w-2xl lg:max-w-3xl md:mx-auto">
            <button
              onClick={() => navigate('/parent/in-the-moment')}
              className="w-full bg-danger-600 hover:bg-danger-700 active:bg-danger-700 text-white font-bold text-parent-xl md:text-3xl py-5 md:py-8 rounded-2xl md:rounded-3xl shadow-lg transition flex items-center justify-center gap-3 md:gap-4"
              style={{ minHeight: '80px' }}
            >
              <span className="text-3xl md:text-5xl">🆘</span>
              <span>In the Moment</span>
            </button>
            <p className="text-xs text-center text-gray-400 mt-2 landscape-hide">
              For right now, when it's hard — tap this.
            </p>
          </div>
        </div>
      )}

      {/* Skills */}
      <main className="flex-1 px-4 md:px-8 py-6 md:max-w-4xl md:mx-auto w-full">
        {loading ? (
          <div className="flex justify-center py-12">
            <p className="text-gray-400">Loading your skills…</p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-gray-600">
                <span className="font-bold text-brand-700">{unlockedCount}</span> skill
                {unlockedCount !== 1 ? 's' : ''} unlocked
              </p>
              {showPracticeLog && (
                <Link
                  to="/parent/practice"
                  className="text-sm font-medium text-brand-700 hover:underline min-h-tap flex items-center"
                >
                  + Log practice
                </Link>
              )}
            </div>

            <div className="space-y-6">
              {byLevel.map(({ level, name, skills: levelSkills }) => {
                if (levelSkills.length === 0) return null;
                return (
                  <section key={level}>
                    <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                      Level {level} — {name}
                    </h2>
                    {/* Two-column grid on iPad portrait; three on iPad landscape */}
                    <div className="space-y-2 md:grid md:grid-cols-2 md:gap-3 md:space-y-0 lg:grid-cols-3">
                      {levelSkills.map(skill =>
                        skill.isUnlocked ? (
                          <UnlockedSkillCard
                            key={skill.id}
                            skill={skill}
                            onPreview={setPreviewSkill}
                          />
                        ) : (
                          <div
                            key={skill.id}
                            className="bg-gray-100 rounded-2xl border border-gray-200 px-4 py-4 md:py-5 opacity-60"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="font-bold text-parent-base text-gray-500">
                                  {skill.title}
                                </p>
                                <p className="text-sm text-gray-400 mt-0.5">Coming soon</p>
                              </div>
                              <span className="text-gray-300 text-xl">🔒</span>
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  </section>
                );
              })}

              {unlockedCount === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <p className="text-lg font-medium mb-2">No skills unlocked yet</p>
                  <p className="text-sm">Your therapist will unlock skills session by session.</p>
                </div>
              )}
            </div>
          </>
        )}
      </main>

      {/* Long-press skill preview sheet */}
      {previewSkill && (
        <SkillPreviewSheet
          skill={previewSkill}
          onClose={() => setPreviewSkill(null)}
          onNavigate={() => {
            navigate(`/parent/skills/${previewSkill.slug}`);
            setPreviewSkill(null);
          }}
        />
      )}
    </div>
  );
}
