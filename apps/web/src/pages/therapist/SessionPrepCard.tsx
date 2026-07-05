import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { getSessionPrepBrief, type SessionPrepBrief } from '@/lib/ai-analytics'

function pct(n: number, d: number): string {
  if (!d) return '0%'
  return Math.round((n / d) * 100) + '%'
}

export default function SessionPrepCard() {
  const { therapist } = useAuth()
  const [brief, setBrief] = useState<SessionPrepBrief | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expanded, setExpanded] = useState(false)

  async function load() {
    if (!therapist) return
    setLoading(true)
    setError(null)
    try {
      const data = await getSessionPrepBrief(therapist.id)
      setBrief(data)
      setExpanded(true)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load session prep brief.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  function formatDaysAgo(d: number | null): string {
    if (d == null) return 'Never practiced'
    if (d === 0) return 'Today'
    if (d === 1) return 'Yesterday'
    return `${d} days ago`
  }

  return (
    <div className="bg-white rounded-xl border border-brand-200 shadow-sm mb-6">
      {/* Card header */}
      <div className="px-6 py-4 flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-gray-900">Session Prep Brief</h3>
          {brief && (
            <p className="text-xs text-gray-400 mt-0.5">
              Generated {new Date(brief.generatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          {brief && (
            <button
              onClick={() => setExpanded(e => !e)}
              className="text-sm text-brand-700 hover:underline"
            >
              {expanded ? 'Collapse' : 'Expand'}
            </button>
          )}
          <button
            onClick={load}
            disabled={loading}
            className="bg-brand-700 hover:bg-brand-800 text-white text-sm font-semibold px-4 py-2 rounded-lg disabled:opacity-60 transition min-h-tap"
          >
            {loading ? 'Loading…' : brief ? 'Refresh' : 'Load brief'}
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="px-6 pb-4">
          <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3">
            <p className="text-sm text-red-700">{error}</p>
            <p className="text-xs text-red-500 mt-1">Make sure the API server is running: <code>npm run dev:api</code></p>
          </div>
        </div>
      )}

      {/* Brief content */}
      {brief && expanded && (
        <div className="px-6 pb-6 border-t border-gray-100 pt-4">
          {/* Caseload summary */}
          <div className="grid grid-cols-3 gap-3 mb-5">
            <div className="bg-gray-50 rounded-lg px-4 py-3 text-center">
              <p className="text-2xl font-black text-gray-900">{brief.caseload.total}</p>
              <p className="text-xs text-gray-500 mt-0.5">Clients</p>
            </div>
            <div className="bg-green-50 rounded-lg px-4 py-3 text-center">
              <p className="text-2xl font-black text-green-700">{brief.caseload.activeThisWeek}</p>
              <p className="text-xs text-gray-500 mt-0.5">Active this week</p>
            </div>
            <div className={`rounded-lg px-4 py-3 text-center ${brief.caseload.noRecentPractice > 0 ? 'bg-amber-50' : 'bg-gray-50'}`}>
              <p className={`text-2xl font-black ${brief.caseload.noRecentPractice > 0 ? 'text-amber-700' : 'text-gray-900'}`}>
                {brief.caseload.noRecentPractice}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">No recent practice</p>
            </div>
          </div>

          {/* Caseload-wide concerns */}
          {brief.caseloadConcerns.length > 0 && (
            <div className="mb-5">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Skills struggling across multiple clients
              </p>
              <div className="space-y-1.5">
                {brief.caseloadConcerns.map(c => (
                  <div key={c.title} className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-lg px-4 py-2.5">
                    <span className="text-sm font-medium text-amber-900">{c.title}</span>
                    <span className="text-xs text-amber-700 font-semibold ml-3 shrink-0">
                      {c.clientsAffected} client{c.clientsAffected !== 1 ? 's' : ''}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Per-client rows */}
          {brief.clients.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Per client
              </p>
              <div className="space-y-3">
                {brief.clients.map(client => (
                  <div key={client.clientId} className="border border-gray-200 rounded-lg px-4 py-3">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-medium text-gray-900 text-sm">{client.label}</span>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        client.last7Count > 0 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {client.last7Count > 0 ? `${client.last7Count} this week` : formatDaysAgo(client.daysSinceLastLog)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mb-2">
                      {client.last30Count} log{client.last30Count !== 1 ? 's' : ''} in 30 days
                      {client.lastLogAt && (
                        <> · Last: {formatDaysAgo(client.daysSinceLastLog)}</>
                      )}
                    </p>
                    {client.concerningSkills.length > 0 && (
                      <div className="space-y-1">
                        {client.concerningSkills.map(s => (
                          <div key={s.title} className="flex items-center gap-2 text-xs">
                            <span className="text-red-500 shrink-0">⚠</span>
                            <span className="text-gray-700">{s.title}</span>
                            <span className="text-gray-400 ml-auto shrink-0">
                              hard {pct(s.hard, s.attempts)} ({s.attempts} tries)
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                    {client.concerningSkills.length === 0 && client.last30Count > 0 && (
                      <p className="text-xs text-green-600">No concerning patterns</p>
                    )}
                    {client.last30Count === 0 && (
                      <p className="text-xs text-gray-400 italic">No practice logs in 30 days</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {brief.clients.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-4">No clients found.</p>
          )}
        </div>
      )}
    </div>
  )
}
