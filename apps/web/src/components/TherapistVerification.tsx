import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';

// ──────────────────────────────────────────────────────────────────────
// TherapistVerification — license number collection
// ──────────────────────────────────────────────────────────────────────
//
// Format: <STATE>-<TYPE>-<NUMBER>
//   STATE:  2-letter US state code (e.g. CA, NY, TX, FL)
//   TYPE:   license type code (LCSW, LMFT, LPC, PsyD, PhD, etc.)
//   NUMBER: digits, typically 4-7 long
//
// Example valid inputs:
//   CA-LCSW-12345
//   NY-LMFT-987654
//   TX-LPC-1234
//   FL-PsyD-00042
//   IL-PhD-1234567
//
// Validation is purely format-level — we can't legally verify a clinical
// license without an authoritative source. The `is_verified` flag flips
// to true only after a manual review by the ParentScript clinical team
// (see the SQL migration in supabase/migrations/005_therapist_verification.sql).

export type LicenseType =
  // Therapy & Counseling
  | 'LCSW' // Licensed Clinical Social Worker
  | 'LMSW' // Licensed Master Social Worker
  | 'LMFT' // Licensed Marriage and Family Therapist
  | 'LCMFT' // Licensed Clinical Marriage and Family Therapist
  | 'LPC' // Licensed Professional Counselor
  | 'LCPC' // Licensed Clinical Professional Counselor (some states)
  | 'LMHC' // Licensed Mental Health Counselor (some states)
  // Psychology
  | 'PsyD' // Doctor of Psychology
  | 'PhD' // Psychologist (PhD)
  | 'EdD' // Doctor of Education (in psychology/counseling)
  | 'LPA' // Licensed Psychological Associate
  // Psychiatry & Medical
  | 'MD' // Medical Doctor (Psychiatrist)
  | 'DO' // Doctor of Osteopathic Medicine
  | 'NP' // Nurse Practitioner (Psychiatric)
  | 'RN' // Registered Nurse (Psychiatric)
  // Behavior Analysis
  | 'BCBA' // Board Certified Behavior Analyst
  | 'BCaBA' // Board Certified Assistant Behavior Analyst
  // Specialized
  | 'RPT' // Registered Play Therapist
  | 'LCADC' // Licensed Clinical Alcohol and Drug Counselor
  | 'CADC' // Certified Alcohol and Drug Counselor
  | 'CRC'; // Certified Rehabilitation Counselor

export const SUPPORTED_LICENSE_TYPES: LicenseType[] = [
  'LCSW',
  'LMSW',
  'LMFT',
  'LCMFT',
  'LPC',
  'LCPC',
  'LMHC',
  'PsyD',
  'PhD',
  'EdD',
  'LPA',
  'MD',
  'DO',
  'NP',
  'RN',
  'BCBA',
  'BCaBA',
  'RPT',
  'LCADC',
  'CADC',
  'CRC',
];

// 50 US states + DC. Puerto Rico and territories excluded for clarity;
// we can add them later if any user requests.
export const SUPPORTED_STATES = [
  'AL',
  'AK',
  'AZ',
  'AR',
  'CA',
  'CO',
  'CT',
  'DE',
  'FL',
  'GA',
  'HI',
  'ID',
  'IL',
  'IN',
  'IA',
  'KS',
  'KY',
  'LA',
  'ME',
  'MD',
  'MA',
  'MI',
  'MN',
  'MS',
  'MO',
  'MT',
  'NE',
  'NV',
  'NH',
  'NJ',
  'NM',
  'NY',
  'NC',
  'ND',
  'OH',
  'OK',
  'OR',
  'PA',
  'RI',
  'SC',
  'SD',
  'TN',
  'TX',
  'UT',
  'VT',
  'VA',
  'WA',
  'WV',
  'WI',
  'WY',
  'DC',
] as const;

// ─── Parsing ──────────────────────────────────────────────────────────

export interface ParsedLicense {
  state: string;
  type: LicenseType;
  number: string;
  formatted: string;
}

export function parseLicense(raw: string): ParsedLicense | null {
  if (!raw) return null;
  // Normalize whitespace, uppercase the letters, strip extra separators.
  const cleaned = raw.trim().toUpperCase().replace(/\s+/g, '');
  if (!cleaned) return null;

  // Split on hyphens (allow up to 3 segments so "CA LCSW 12345" also works).
  const parts = cleaned.split(/[-_\s]+/).filter(Boolean);
  if (parts.length !== 3) return null;

  const [state, type, number] = parts;

  // Validate state
  if (!SUPPORTED_STATES.includes(state as (typeof SUPPORTED_STATES)[number])) {
    return null;
  }

  // Validate type — be tolerant of common variants.
  const normalizedType = normalizeType(type);
  if (!normalizedType) return null;

  // Validate number — digits only, 4-7 long.
  if (!/^\d{4,7}$/.test(number)) return null;

  return {
    state,
    type: normalizedType,
    number,
    formatted: `${state}-${normalizedType}-${number}`,
  };
}

function normalizeType(raw: string): LicenseType | null {
  const upper = raw.toUpperCase();
  if (upper === 'PH.D' || upper === 'PHD') return 'PhD';
  if (upper === 'PSY.D' || upper === 'PSYD') return 'PsyD';
  if (upper === 'ED.D' || upper === 'EDD') return 'EdD';
  if (upper === 'BCA-BA' || upper === 'BCABA') return 'BCaBA';
  if ((SUPPORTED_LICENSE_TYPES as readonly string[]).includes(upper)) {
    return upper as LicenseType;
  }
  return null;
}

// ─── Validation messages ─────────────────────────────────────────────

export interface LicenseValidation {
  ok: boolean;
  error?: string;
  parsed?: ParsedLicense;
}

export function validateLicense(raw: string): LicenseValidation {
  if (!raw.trim()) {
    return { ok: false, error: 'License number is required.' };
  }

  const parsed = parseLicense(raw);
  if (!parsed) {
    return {
      ok: false,
      error:
        'Format must be STATE-TYPE-NUMBER (e.g. CA-LCSW-12345). State must be a 2-letter US code; type must be one of LCSW, LMSW, LMFT, LCMFT, LPC, LCPC, LMHC, PsyD, PhD, EdD, LPA, MD, DO, NP, RN, BCBA, BCaBA, RPT, LCADC, CADC, or CRC; number must be 4–7 digits.',
    };
  }

  return { ok: true, parsed };
}

// ─── Component ────────────────────────────────────────────────────────

interface TherapistVerificationProps {
  onSaved?: () => void;
  /** When true, renders inline (used after signup); otherwise renders as a standalone card. */
  embedded?: boolean;
}

export default function TherapistVerification({
  onSaved,
  embedded = false,
}: TherapistVerificationProps) {
  const { therapist, refreshRole } = useAuth();
  const [licenseInput, setLicenseInput] = useState('');
  const [state, setState] = useState<string>('');
  const [type, setType] = useState<LicenseType | ''>('');
  const [number, setNumber] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  function buildFromFields(): string {
    return [state, type, number].filter(Boolean).join('-');
  }

  function handleValidate(raw: string): LicenseValidation {
    const result = validateLicense(raw);
    if (result.ok && result.parsed) {
      setState(result.parsed.state);
      setType(result.parsed.type);
      setNumber(result.parsed.number);
      setError(null);
    } else {
      setError(result.error ?? 'Invalid license format.');
    }
    return result;
  }

  function handleChange(value: string) {
    setLicenseInput(value);
    setSaved(false);
    // Only auto-parse when the user has typed enough to look complete,
    // otherwise we'd yell at them while they're still typing.
    if (value.includes('-') && value.length >= 8) {
      handleValidate(value);
    } else {
      setError(null);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!therapist?.id) {
      setError('You must be signed in as a therapist to submit a license.');
      return;
    }

    const candidate = licenseInput.trim() ? licenseInput : buildFromFields();
    const validation = validateLicense(candidate);
    if (!validation.ok || !validation.parsed) {
      setError(validation.error ?? 'Invalid license format.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const { error: dbError } = await supabase
        .from('therapists')
        .update({
          license_number: validation.parsed.formatted,
          license_state: validation.parsed.state,
          license_type: validation.parsed.type,
          is_verified: false, // Remains false until manual review by clinical team.
          // updated_at is set via DB trigger if one exists; otherwise the
          // default fetch via .select() picks up the row.
        })
        .eq('id', therapist.id);

      if (dbError) throw dbError;

      setSaved(true);
      setLicenseInput(validation.parsed.formatted);
      await refreshRole();
      onSaved?.();
    } catch (err: unknown) {
      const msg =
        (err as { message?: string })?.message ||
        (err instanceof Error ? err.message : null) ||
        'Failed to save license. Please try again.';
      console.error('[TherapistVerification] save failed:', err);
      setError(msg);
    } finally {
      setSaving(false);
    }
  }

  const containerClass = embedded
    ? ''
    : 'bg-white rounded-2xl shadow-sm border border-gray-200 p-6 md:p-8';

  return (
    <form onSubmit={handleSubmit} className={containerClass}>
      <div className="mb-4">
        <h3 className="text-lg font-bold text-gray-900">Verify your license</h3>
        <p className="text-sm text-gray-500 mt-1">
          Parents trust therapists on ParentScript because we verify clinical credentials. Enter
          your license in the format{' '}
          <code className="bg-gray-100 px-1 rounded text-xs">STATE-TYPE-NUMBER</code> (for example{' '}
          <code className="bg-gray-100 px-1 rounded text-xs">CA-LCSW-12345</code>). Verification is
          reviewed manually by our clinical team within 1–2 business days.
        </p>
      </div>

      {/* License number — paste the full thing or fill the three fields */}
      <div className="space-y-4">
        <div>
          <label htmlFor="license-number" className="block text-sm font-medium text-gray-700 mb-1">
            License number (full)
          </label>
          <input
            id="license-number"
            type="text"
            value={licenseInput}
            onChange={e => handleChange(e.target.value)}
            placeholder="CA-LCSW-12345"
            autoComplete="off"
            spellCheck={false}
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-base font-mono focus:outline-none focus:ring-2 focus:ring-brand-600"
          />
          <p className="text-xs text-gray-500 mt-1">
            Or fill the three fields below. They auto-sync as you type.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label htmlFor="license-state" className="block text-sm font-medium text-gray-700 mb-1">
              State
            </label>
            <select
              id="license-state"
              value={state}
              onChange={e => {
                setState(e.target.value);
                setLicenseInput(buildFromFields());
                setError(null);
              }}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-brand-600"
            >
              <option value="">Select…</option>
              {SUPPORTED_STATES.map(s => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="license-type" className="block text-sm font-medium text-gray-700 mb-1">
              Type
            </label>
            <select
              id="license-type"
              value={type}
              onChange={e => {
                setType(e.target.value as LicenseType | '');
                setLicenseInput(buildFromFields());
                setError(null);
              }}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-brand-600"
            >
              <option value="">Select…</option>
              {SUPPORTED_LICENSE_TYPES.map(t => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="license-digits"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Number
            </label>
            <input
              id="license-digits"
              type="text"
              value={number}
              onChange={e => {
                const digits = e.target.value.replace(/\D/g, '').slice(0, 7);
                setNumber(digits);
                setLicenseInput(buildFromFields());
                setError(null);
              }}
              placeholder="12345"
              autoComplete="off"
              inputMode="numeric"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-base font-mono focus:outline-none focus:ring-2 focus:ring-brand-600"
            />
          </div>
        </div>
      </div>

      {error && (
        <div className="mt-4 rounded-lg bg-danger-50 border border-danger-500 p-3 text-sm text-danger-700">
          {error}
        </div>
      )}

      {saved && (
        <div className="mt-4 rounded-lg bg-green-50 border border-green-400 p-3 text-sm text-green-800">
          License saved. We'll review and email you within 1–2 business days.
        </div>
      )}

      <div className="mt-6 flex items-center justify-between gap-3">
        <p className="text-xs text-gray-500">
          We never share your license number publicly. It's only used for verification.
        </p>
        <button
          type="submit"
          disabled={saving}
          className="bg-brand-700 hover:bg-brand-800 text-white font-semibold px-5 py-2.5 rounded-lg transition disabled:opacity-60 min-h-tap text-sm"
        >
          {saving ? 'Saving…' : 'Submit for verification'}
        </button>
      </div>
    </form>
  );
}
