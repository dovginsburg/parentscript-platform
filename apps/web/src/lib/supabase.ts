import { createClient } from '@supabase/supabase-js';
import { ParentscriptApiClient } from '@parentscript/shared';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL ?? '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? '';

export const isConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key'
);

/**
 * Shared API client (see packages/shared/src/api-client.ts).
 *
 * Wraps the FastAPI backend at api.parentscript.app with the Supabase
 * access token from the current session. Used by any new server call
 * that does not go directly through Supabase (e.g. /v1/coach).
 */
export const api = new ParentscriptApiClient({
  baseUrl: import.meta.env.VITE_API_BASE_URL,
  getToken: async () => {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token;
  },
});
