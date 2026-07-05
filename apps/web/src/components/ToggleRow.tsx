// ────────────────────────────────────────────────────────────────────
// ToggleRow — accessible iOS-style switch with label + description
// ────────────────────────────────────────────────────────────────────
//
// Reused by both TherapistSettings and ParentPreferences pages so
// the look-and-feel is identical. Wraps the input in a <label> so the
// whole row is clickable — better UX on touch, and screen-reader
// friendly.

export interface ToggleRowProps {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
  experimental?: boolean;
  // When true, renders a small "Saves automatically" hint.
  // Therapists and parents both see this — saves are live, no
  // explicit Save button.
  autoSave?: boolean;
}

export default function ToggleRow({
  label,
  description,
  checked,
  onChange,
  disabled = false,
  experimental = false,
  autoSave = true,
}: ToggleRowProps) {
  return (
    <label
      className={[
        'flex items-start justify-between gap-4 px-4 py-3.5',
        disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
      ].join(' ')}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm md:text-base font-semibold text-gray-900">{label}</span>
          {experimental && (
            <span className="text-[10px] font-semibold uppercase tracking-wider bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded">
              Experimental
            </span>
          )}
        </div>
        {description && (
          <p className="text-xs md:text-sm text-gray-500 mt-0.5 leading-snug">{description}</p>
        )}
        {autoSave && <p className="text-[11px] text-gray-400 mt-1">Saves automatically</p>}
      </div>

      {/* Switch — visually styled, real <input> for accessibility */}
      <span
        role="switch"
        aria-checked={checked}
        aria-disabled={disabled || undefined}
        className={[
          'relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors',
          checked ? 'bg-brand-600' : 'bg-gray-300',
          disabled ? '' : 'cursor-pointer',
        ].join(' ')}
      >
        <span
          className={[
            'inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform',
            checked ? 'translate-x-6' : 'translate-x-1',
          ].join(' ')}
        />
        <input
          type="checkbox"
          className="sr-only"
          checked={checked}
          disabled={disabled}
          onChange={e => onChange(e.target.checked)}
        />
      </span>
    </label>
  );
}
