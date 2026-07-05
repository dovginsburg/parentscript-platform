import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import type { Client, Skill, ClientSkillState, PracticeLog, NoteTag, Parent } from '@/lib/types';
import { NOTE_TAG_LABELS } from '@/lib/types';

interface SkillWithState extends Skill {
  state: ClientSkillState | null;
}

function generateInviteCode() {
  return crypto.randomUUID();
}

const LEVEL_NAMES: Record<number, string> = {
  1: 'L1 — Connection & Foundation',
  2: 'L2 — Shaping Behavior',
  3: 'L3 — Limits & Boundaries',
};

export default function ClientDetail() {
  const { id } = useParams<{ id: string }>();
  const [client, setClient] = useState<Client | null>(null);
  const [skills, setSkills] = useState<SkillWithState[]>([]);
  const [parents, setParents] = useState<Parent[]>([]);
  const [logs, setLogs] = useState<PracticeLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [generatingInvite, setGeneratingInvite] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [mutationError, setMutationError] = useState<string | null>(null);
  const [tab, setTab] = useState<'skills' | 'logs'>('skills');

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);

    const [clientRes, skillsRes, statesRes, parentsRes, logsRes] = await Promise.all([
      supabase.from('clients').select('*').eq('id', id).single(),
      supabase
        .from('skills')
        .select('*')
        .eq('is_published', true)
        .order('level')
        .order('sort_order'),
      supabase.from('client_skill_state').select('*').eq('client_id', id),
      supabase.from('parents').select('*').eq('client_id', id),
      supabase
        .from('practice_logs')
        .select('*')
        .eq('client_id', id)
        .order('practiced_at', { ascending: false }),
    ]);

    setClient(clientRes.data);
    setParents(parentsRes.data ?? []);
    setLogs(logsRes.data ?? []);

    const stateMap = new Map((statesRes.data ?? []).map(s => [s.skill_id, s]));
    setSkills(
      (skillsRes.data ?? []).map(skill => ({
        ...skill,
        state: stateMap.get(skill.id) ?? null,
      }))
    );
    setLoading(false);
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function toggleSkill(skill: SkillWithState) {
    if (!id) return;
    setMutationError(null);
    const newStatus = skill.state?.status === 'unlocked' ? 'locked' : 'unlocked';

    let error: { message?: string } | null = null;
    if (skill.state) {
      const res = await supabase
        .from('client_skill_state')
        .update({
          status: newStatus,
          unlocked_at: newStatus === 'unlocked' ? new Date().toISOString() : null,
        })
        .eq('id', skill.state.id);
      error = res.error;
    } else {
      const res = await supabase.from('client_skill_state').insert({
        client_id: id,
        skill_id: skill.id,
        status: newStatus,
        unlocked_at: newStatus === 'unlocked' ? new Date().toISOString() : null,
      });
      error = res.error;
    }
    if (error) {
      console.error('[ClientDetail] toggleSkill failed:', error);
      setMutationError(error.message || 'Could not update skill.');
      return;
    }
    await load();
  }

  async function setNoteTag(skill: SkillWithState, tag: NoteTag | null) {
    if (!id) return;
    setMutationError(null);
    let error: { message?: string } | null = null;
    if (skill.state) {
      const res = await supabase
        .from('client_skill_state')
        .update({ note_tag: tag })
        .eq('id', skill.state.id);
      error = res.error;
    } else {
      const res = await supabase.from('client_skill_state').insert({
        client_id: id,
        skill_id: skill.id,
        status: 'locked',
        note_tag: tag,
      });
      error = res.error;
    }
    if (error) {
      console.error('[ClientDetail] setNoteTag failed:', error);
      setMutationError(error.message || 'Could not update note.');
      return;
    }
    await load();
  }

  async function generateInvite() {
    if (!id) return;
    setGeneratingInvite(true);
    setInviteError(null);
    setInviteLink(null);
    const code = generateInviteCode();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    const { error } = await supabase.from('invites').insert({
      client_id: id,
      code,
      expires_at: expiresAt,
    });

    if (error) {
      console.error('[ClientDetail] generateInvite failed:', error);
      setInviteError(error.message || 'Could not generate invite link.');
      setGeneratingInvite(false);
      return;
    }
    const url = `${window.location.origin}/invite/${code}`;
    setInviteLink(url);
    setGeneratingInvite(false);
  }

  function logSummary() {
    const last7 = logs.filter(
      l => new Date(l.practiced_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    );
    const good = logs.filter(l => l.went_how === 'good').length;
    const mixed = logs.filter(l => l.went_how === 'mixed').length;
    const hard = logs.filter(l => l.went_how === 'hard').length;
    return { total: logs.length, last7: last7.length, good, mixed, hard };
  }

  if (loading) {
    return <div className="min-h-dvh flex items-center justify-center text-gray-500">Loading…</div>;
  }

  if (!client) {
    return (
      <div className="min-h-dvh flex items-center justify-center text-gray-500">
        Client not found.
      </div>
    );
  }

  const byLevel = [1, 2, 3].map(level => ({
    level,
    name: LEVEL_NAMES[level],
    skills: skills.filter(s => s.level === level),
  }));

  const summary = logSummary();

  // ── Shared content blocks (rendered in both mobile-tab and tablet-column views) ──

  const skillsContent = (
    <div className="space-y-8">
      {byLevel.map(({ level, name, skills: levelSkills }) => (
        <section key={level}>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
            {name}
          </h2>
          <div className="space-y-2">
            {levelSkills.map(skill => (
              <div key={skill.id} className="bg-white rounded-xl border border-gray-200 p-4 md:p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span
                        className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full ${
                          skill.state?.status === 'unlocked'
                            ? 'bg-success-500 text-white'
                            : 'bg-gray-200 text-gray-600'
                        }`}
                      >
                        {skill.state?.status === 'unlocked' ? 'Unlocked' : 'Locked'}
                      </span>
                      {skill.state?.note_tag && (
                        <span className="inline-block text-xs font-medium px-2 py-0.5 rounded-full bg-brand-100 text-brand-800">
                          {NOTE_TAG_LABELS[skill.state.note_tag]}
                        </span>
                      )}
                    </div>
                    <p className="font-semibold text-gray-900">{skill.title}</p>
                    <p className="text-sm text-gray-500 mt-0.5 line-clamp-1">{skill.goal}</p>
                  </div>

                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <button
                      onClick={() => toggleSkill(skill)}
                      className={`text-sm font-medium px-3 py-1.5 rounded-lg transition min-h-tap ${
                        skill.state?.status === 'unlocked'
                          ? 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                          : 'bg-brand-700 hover:bg-brand-800 text-white'
                      }`}
                    >
                      {skill.state?.status === 'unlocked' ? 'Lock' : 'Unlock'}
                    </button>

                    <select
                      value={skill.state?.note_tag ?? ''}
                      onChange={e => setNoteTag(skill, (e.target.value || null) as NoteTag | null)}
                      className="text-xs border border-gray-200 rounded-lg px-2 py-1 text-gray-600 focus:outline-none focus:ring-1 focus:ring-brand-500"
                    >
                      <option value="">No note</option>
                      <option value="focus_this_week">Focus this week</option>
                      <option value="going_well">Going well</option>
                      <option value="revisit">Revisit</option>
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );

  const logsContent = (
    <div>
      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total', value: summary.total },
          { label: 'Last 7 days', value: summary.last7 },
          { label: '😀 Good', value: summary.good },
          { label: '😐 Mixed', value: summary.mixed },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-xs text-gray-500 mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Log list */}
      {logs.length === 0 ? (
        <p className="text-center text-gray-500 py-12">No practice logs yet.</p>
      ) : (
        <div className="space-y-2">
          {logs.map(log => (
            <div
              key={log.id}
              className="bg-white rounded-xl border border-gray-200 px-4 py-3 flex items-center justify-between"
            >
              <div>
                <p className="text-sm text-gray-900">
                  {log.went_how === 'good' ? '😀' : log.went_how === 'mixed' ? '😐' : '😞'}{' '}
                  {log.reflection_tags?.join(', ') || 'General practice'}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {new Date(log.practiced_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-dvh bg-gray-50">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <header className="bg-white border-b border-gray-200 px-6 md:px-10 py-4">
        <Link to="/therapist/clients" className="text-sm text-brand-700 hover:underline mb-2 block">
          ← Back to clients
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">{client.label}</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {parents.length > 0
                ? `${parents.length} parent(s) connected`
                : 'No parent account yet'}{' '}
              · {summary.total} practice log{summary.total !== 1 ? 's' : ''}
            </p>
          </div>
          <button
            onClick={generateInvite}
            disabled={generatingInvite}
            className="bg-brand-700 hover:bg-brand-800 text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition disabled:opacity-60 shrink-0 min-h-tap"
          >
            {generatingInvite ? '…' : 'Generate invite link'}
          </button>
        </div>

        {inviteError && (
          <div className="mt-3 bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-xs text-red-700">{inviteError}</p>
          </div>
        )}

        {inviteLink && (
          <div className="mt-3 bg-brand-50 border border-brand-200 rounded-lg p-3">
            <p className="text-xs font-semibold text-brand-800 mb-1">
              Parent invite link (expires 7 days):
            </p>
            <div className="flex gap-2 items-center">
              <input
                readOnly
                value={inviteLink}
                className="flex-1 text-xs bg-white border border-brand-300 rounded px-2 py-1.5 font-mono"
              />
              <button
                onClick={() => navigator.clipboard.writeText(inviteLink)}
                className="text-xs bg-brand-700 text-white px-3 py-1.5 rounded min-h-tap"
              >
                Copy
              </button>
            </div>
          </div>
        )}
      </header>

      {/* ── Mutation error banner (shared across mobile + tablet) ── */}
      {mutationError && (
        <div className="bg-red-50 border-b border-red-200 px-6 py-2 text-sm text-red-700">
          {mutationError}
        </div>
      )}

      {/* ── MOBILE: tabs ─────────────────────────────────────────────── */}
      <div className="md:hidden">
        <div className="bg-white border-b border-gray-200 px-6">
          <div className="flex gap-6">
            {(['skills', 'logs'] as const).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`py-3 text-sm font-medium border-b-2 transition min-h-tap ${
                  tab === t
                    ? 'border-brand-700 text-brand-700'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {t === 'skills' ? 'Skill tree' : 'Practice logs'}
              </button>
            ))}
          </div>
        </div>

        <main className="max-w-3xl mx-auto px-6 py-8">
          {tab === 'skills' && skillsContent}
          {tab === 'logs' && logsContent}
        </main>
      </div>

      {/* ── TABLET+: two-column layout, no tabs ──────────────────────── */}
      <main className="hidden md:block max-w-7xl mx-auto px-10 py-8">
        <div className="grid grid-cols-[1fr_360px] lg:grid-cols-[1fr_420px] gap-10">
          {/* Left: skill tree */}
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
              Skill tree
            </h3>
            {skillsContent}
          </div>

          {/* Right: practice logs sidebar */}
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
              Practice logs
            </h3>
            {/* Stats: 2 columns in sidebar */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              {[
                { label: 'Total', value: summary.total },
                { label: 'Last 7 days', value: summary.last7 },
                { label: '😀 Good', value: summary.good },
                { label: '😐 Mixed', value: summary.mixed },
              ].map(({ label, value }) => (
                <div
                  key={label}
                  className="bg-white rounded-xl border border-gray-200 p-4 text-center"
                >
                  <p className="text-2xl font-bold text-gray-900">{value}</p>
                  <p className="text-xs text-gray-500 mt-1">{label}</p>
                </div>
              ))}
            </div>

            {logs.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No practice logs yet.</p>
            ) : (
              <div className="space-y-2 max-h-[60vh] overflow-y-auto panel-scroll">
                {logs.map(log => (
                  <div
                    key={log.id}
                    className="bg-white rounded-xl border border-gray-200 px-4 py-3 flex items-center justify-between"
                  >
                    <div>
                      <p className="text-sm text-gray-900">
                        {log.went_how === 'good' ? '😀' : log.went_how === 'mixed' ? '😐' : '😞'}{' '}
                        {log.reflection_tags?.join(', ') || 'General practice'}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {new Date(log.practiced_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
