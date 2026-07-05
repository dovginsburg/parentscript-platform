/**
 * Supabase bootstrap for the ParentScript Chrome extension popup.
 *
 * The extension reads published skills directly from Supabase using the
 * project's anon key. The exact same anon key is already shipped in the
 * web app, so this is not a posture change — the published-skills RLS
 * policy (apps/backend/supabase/migrations/002_rls_policies.sql:100-102)
 * already permits world reads of `is_published = TRUE`.
 *
 * Key resolution priority:
 *   1. chrome.storage.local.supabaseUrl + supabaseAnonKey
 *      (set by the options page that ships separately; takes priority
 *      so a user can override the defaults without rebuilding)
 *   2. Build-time import.meta.env.VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY
 *      (committed-by-developer default for unpacked-extension development;
 *      optional — leaving both unset is fine if the options page is the
 *      only expected source)
 *
 * If neither source yields both URL and anon key, we surface a clear
 * error in the popup ("Set your Supabase URL and anon key in the
 * extension options") rather than guessing.
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// `vite/client` augments `import.meta.env`, but this extension is built
// with raw esbuild — not Vite — so we type the few keys we read inline.
// Both fields are optional; only present if the dev committed a .env file.
interface BuildEnv {
  VITE_SUPABASE_URL?: string;
  VITE_SUPABASE_ANON_KEY?: string;
}
// `import.meta` is not a global in an MV3 service worker / popup context
// without DOM lib magic, so we narrow via Optional Chaining rather than
// reaching for `any`. esbuild preserves this as-is in the bundle.
const buildEnv = ((import.meta as unknown as { env?: BuildEnv }).env) ?? {};

const STORAGE_URL_KEY = "supabaseUrl";
const STORAGE_KEY_KEY = "supabaseAnonKey";

export interface SupabaseConfig {
  url: string;
  anonKey: string;
}

/**
 * Read Supabase config from chrome.storage.local.
 * Returns undefined if either field is missing or storage is unavailable.
 */
async function readStorageConfig(): Promise<SupabaseConfig | undefined> {
  try {
    const result = await chrome.storage.local.get([STORAGE_URL_KEY, STORAGE_KEY_KEY]);
    const url = result[STORAGE_URL_KEY];
    const anonKey = result[STORAGE_KEY_KEY];
    if (typeof url === "string" && url.length > 0 && typeof anonKey === "string" && anonKey.length > 0) {
      return { url, anonKey };
    }
  } catch {
    // chrome.storage may be unavailable (e.g. page devtools); fall through.
  }
  return undefined;
}

function readBuildConfig(): SupabaseConfig | undefined {
  const url = buildEnv.VITE_SUPABASE_URL;
  const anonKey = buildEnv.VITE_SUPABASE_ANON_KEY;
  if (typeof url === "string" && url.length > 0 && typeof anonKey === "string" && anonKey.length > 0) {
    return { url, anonKey };
  }
  return undefined;
}

/**
 * Returns the config the popup should use, or undefined if neither
 * chrome.storage.local nor build-time env vars are populated.
 */
export async function getSupabaseConfig(): Promise<SupabaseConfig | undefined> {
  return (await readStorageConfig()) ?? readBuildConfig();
}

/**
 * Holds a lazily-created Supabase client so the popup doesn't re-instantiate
 * it on every refresh click. The client is keyed by the resolved config so
 * a runtime-supplied key from the options page beats a stale build-time env.
 */
let cachedClient: SupabaseClient | undefined;
let cachedConfigKey: string | undefined;

export async function getSupabase(): Promise<SupabaseClient | undefined> {
  const cfg = await getSupabaseConfig();
  if (!cfg) return undefined;
  const cacheKey = `${cfg.url}::${cfg.anonKey}`;
  if (cachedClient && cachedConfigKey === cacheKey) return cachedClient;
  cachedClient = createClient(cfg.url, cfg.anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  cachedConfigKey = cacheKey;
  return cachedClient;
}

/**
 * Error surfaced by the popup when neither chrome.storage.local nor the
 * build-time env provides a usable Supabase URL + anon key. The popup
 * catches this and offers the option page link instead of retrying.
 */
export class SupabaseConfigMissingError extends Error {
  constructor() {
    super(
      "Supabase URL and anon key are not configured. Open the extension options to add them, then reload the popup.",
    );
    this.name = "SupabaseConfigMissingError";
  }
}
