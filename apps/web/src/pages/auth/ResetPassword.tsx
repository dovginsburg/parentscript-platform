import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

type Status = 'idle' | 'ready' | 'submitting' | 'done' | 'invalid';

export default function ResetPassword() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<Status>('idle');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Supabase fires PASSWORD_RECOVERY once it processes the reset token
    // in the URL hash. If no event arrives within 4 s, the link is invalid.
    const timer = setTimeout(() => {
      setStatus(prev => (prev === 'idle' ? 'invalid' : prev));
    }, 4000);

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(event => {
      if (event === 'PASSWORD_RECOVERY') {
        clearTimeout(timer);
        setStatus('ready');
      }
    });

    return () => {
      subscription.unsubscribe();
      clearTimeout(timer);
    };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    setStatus('submitting');
    const { error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError) {
      setError(updateError.message);
      setStatus('ready');
      return;
    }
    setStatus('done');
    setTimeout(() => navigate('/login'), 2500);
  }

  if (status === 'idle') {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <p className="text-gray-500 text-sm">Checking reset link…</p>
      </div>
    );
  }

  if (status === 'invalid') {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center px-6 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Link expired or invalid</h1>
        <p className="text-gray-600 mb-6">
          Password reset links expire after 1 hour and can only be used once.
        </p>
        <Link to="/login" className="text-brand-700 font-medium hover:underline">
          Back to sign in
        </Link>
      </div>
    );
  }

  if (status === 'done') {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center px-6 text-center">
        <span className="text-5xl mb-4">✓</span>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Password updated</h1>
        <p className="text-gray-600">Redirecting you to sign in…</p>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-gray-50 flex flex-col justify-center py-12 px-4">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-8">
        <h1 className="text-4xl font-black text-brand-800 tracking-tight">ParentScript</h1>
        <h2 className="mt-6 text-2xl font-bold text-gray-900">Set a new password</h2>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md md:max-w-lg">
        <div className="bg-white py-8 px-6 shadow sm:rounded-xl md:py-10 md:px-10">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">New password</label>
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete="new-password"
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-brand-600"
              />
              <p className="mt-1 text-xs text-gray-400">Minimum 8 characters</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirm new password
              </label>
              <input
                type="password"
                required
                minLength={8}
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                autoComplete="new-password"
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-brand-600"
              />
            </div>

            {error && (
              <div className="rounded-lg bg-danger-50 border border-danger-500 p-3 text-sm text-danger-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={status === 'submitting'}
              className="w-full bg-brand-700 hover:bg-brand-800 text-white font-semibold py-3 md:py-4 rounded-lg transition disabled:opacity-60 min-h-tap text-base"
            >
              {status === 'submitting' ? 'Updating…' : 'Update password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
