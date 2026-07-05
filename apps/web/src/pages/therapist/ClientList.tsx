import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription, canAddClient } from '@/hooks/useSubscription';
import type { Client } from '@/lib/types';
import SessionPrepCard from './SessionPrepCard';

interface ClientWithStats extends Client {
  unlocked_count: number;
  last_practiced: string | null;
}

export default function ClientList() {
  const { therapist, signOut } = useAuth();
  const { subscription } = useSubscription();
  const [clients, setClients] = useState<ClientWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [labelWarningAccepted, setLabelWarningAccepted] = useState(false);

  const atClientLimit = !canAddClient(subscription, clients.length);
  const planName = subscription?.plan || 'free';

  async function loadClients() {
    if (!therapist) return;
    setLoading(true);
    const { data: clientData, error: clientsError } = await supabase
      .from('clients')
      .select('*')
      .eq('therapist_id', therapist.id)
      .order('created_at', { ascending: false });

    if (clientsError) {
      // P2-4: surface in Vercel runtime logs so Dov can see why the
      // client list is empty (e.g. RLS drift, transient network).
      console.warn('[ClientList] loadClients failed:', clientsError);
    }
    if (!clientData) {
      setLoading(false);
      return;
    }

    const clientsWithStats = await Promise.all(
      clientData.map(async client => {
        const [stateRes, logRes] = await Promise.all([
          supabase
            .from('client_skill_state')
            .select('id', { count: 'exact' })
            .eq('client_id', client.id)
            .eq('status', 'unlocked'),
          supabase
            .from('practice_logs')
            .select('practiced_at')
            .eq('client_id', client.id)
            .order('practiced_at', { ascending: false })
            .limit(1),
        ]);
        return {
          ...client,
          unlocked_count: stateRes.count ?? 0,
          last_practiced: logRes.data?.[0]?.practiced_at ?? null,
        };
      })
    );
    setClients(clientsWithStats);
    setLoading(false);
  }

  useEffect(() => {
    loadClients();
  }, [therapist]);

  async function handleAddClient(e: React.FormEvent) {
    e.preventDefault();
    if (!therapist || !newLabel.trim()) return;
    const trimmed = newLabel.trim();
    if (trimmed.length < 1) {
      setAddError('Label is required.');
      return;
    }
    if (trimmed.length > 120) {
      setAddError('Label must be 120 characters or fewer.');
      return;
    }
    setAdding(true);
    setAddError(null);
    const { error } = await supabase.from('clients').insert({
      therapist_id: therapist.id,
      label: trimmed,
    });
    if (error) {
      setAddError(error.message);
    } else {
      setNewLabel('');
      setShowAddForm(false);
      setLabelWarningAccepted(false);
      await loadClients();
    }
    setAdding(false);
  }

  function formatLastPracticed(dateStr: string | null) {
    if (!dateStr) return 'Never';
    const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    return `${days} days ago`;
  }

  return (
    <div className="min-h-dvh bg-gray-50">
      {/* Header — full width, adapts to iPad */}
      <header className="bg-white border-b border-gray-200 px-6 md:px-10 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-brand-800 tracking-tight">ParentScript</h1>
          <p className="text-xs text-gray-500">Therapist dashboard</p>
        </div>
        <div className="flex items-center gap-4 md:gap-6">
          <Link
            to="/therapist/settings"
            className="text-sm font-medium text-brand-700 hover:underline min-h-tap flex items-center"
          >
            Settings
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

      <main className="max-w-5xl mx-auto px-6 md:px-10 py-8">
        <SessionPrepCard />
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Clients</h2>
          <button
            onClick={() => setShowAddForm(true)}
            disabled={atClientLimit}
            className="bg-brand-700 hover:bg-brand-800 disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition min-h-tap"
          >
            + Add client
          </button>
        </div>

        {atClientLimit && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 text-sm text-amber-800">
            <p className="font-semibold mb-1">Client limit reached</p>
            <p>
              Your <strong>{planName}</strong> plan allows{' '}
              {planName === 'free'
                ? '0 clients'
                : planName === 'solo'
                  ? 'up to 25 clients'
                  : 'unlimited clients'}
              .
              {planName === 'free' ? (
                <>
                  {' '}
                  <Link to="/pricing" className="text-brand-700 hover:underline font-medium">
                    Upgrade to a paid plan
                  </Link>{' '}
                  to start adding clients.
                </>
              ) : (
                <>
                  {' '}
                  <Link to="/billing" className="text-brand-700 hover:underline font-medium">
                    Review your billing
                  </Link>{' '}
                  to resolve any subscription issues.
                </>
              )}
            </p>
          </div>
        )}

        {/* Add client form */}
        {showAddForm && (
          <div className="bg-white rounded-xl border border-brand-200 p-6 mb-6 shadow-sm md:max-w-2xl">
            <h3 className="font-semibold text-gray-900 mb-3">New client</h3>

            {!labelWarningAccepted ? (
              <>
                <div className="bg-amber-50 border border-amber-300 rounded-lg p-4 mb-4">
                  <p className="text-sm font-semibold text-amber-800 mb-1">⚠️ Privacy reminder</p>
                  <p className="text-sm text-amber-700">
                    Do <strong>not</strong> use a real name, date of birth, or any identifying
                    information. Use a non-identifying label you'll recognize (e.g., "Client 042",
                    "Red file", "Tuesday family"). You hold the label→patient mapping outside this
                    app.
                  </p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setLabelWarningAccepted(true)}
                    className="bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold px-4 py-2.5 rounded-lg min-h-tap"
                  >
                    Understood — continue
                  </button>
                  <button
                    onClick={() => setShowAddForm(false)}
                    className="text-sm text-gray-500 hover:text-gray-700 min-h-tap flex items-center"
                  >
                    Cancel
                  </button>
                </div>
              </>
            ) : (
              <form onSubmit={handleAddClient} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Non-identifying label
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={120}
                    value={newLabel}
                    onChange={e => setNewLabel(e.target.value)}
                    placeholder="e.g., Client 042"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-brand-600"
                  />
                </div>
                {addError && <p className="text-sm text-danger-600">{addError}</p>}
                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={adding}
                    className="bg-brand-700 hover:bg-brand-800 text-white text-sm font-semibold px-4 py-2.5 rounded-lg disabled:opacity-60 min-h-tap"
                  >
                    {adding ? 'Adding…' : 'Add client'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddForm(false);
                      setLabelWarningAccepted(false);
                    }}
                    className="text-sm text-gray-500 hover:text-gray-700 min-h-tap flex items-center"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* Client list — single column on phone, two columns on iPad */}
        {loading ? (
          <p className="text-gray-500 text-sm">Loading clients…</p>
        ) : clients.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <p className="text-lg font-medium mb-2">No clients yet</p>
            <p className="text-sm">Add your first client to get started.</p>
          </div>
        ) : (
          <div className="space-y-3 md:grid md:grid-cols-2 md:gap-4 md:space-y-0 lg:grid-cols-3">
            {clients.map(client => (
              <Link
                key={client.id}
                to={`/therapist/clients/${client.id}`}
                className="block bg-white rounded-xl border border-gray-200 px-6 py-4 hover:border-brand-300 hover:shadow-sm transition touch-feedback"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-900">{client.label}</p>
                    <p className="text-sm text-gray-500 mt-0.5">
                      {client.unlocked_count} skill{client.unlocked_count !== 1 ? 's' : ''} unlocked
                      &nbsp;·&nbsp; Last practice: {formatLastPracticed(client.last_practiced)}
                    </p>
                  </div>
                  <span className="text-gray-400 text-lg">›</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
