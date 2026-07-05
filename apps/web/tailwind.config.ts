import type { Config } from 'tailwindcss'

// ParentScript — design system v1.0 (Mark, 2026-07-03)
// Source of truth: /Users/Ezra/Projects/team/mark-deliverables/design-tokens.json
// Surface: "monitor" (light, clinical, calm, judgment-free)
// Tone: sentence case. No shouty uppercase in body copy. Em-dashes OK.

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // ── ParentScript surface palette (light, clinical) ─────────────
        ps: {
          bg: '#FFFFFF',
          'bg-soft': '#FAFBFC',
          border: '#E5E7EB',
          'border-strong': '#D1D5DB',
          text: '#111827',
          'text-soft': '#4B5563',
          'text-softer': '#6B7280',
          muted: '#9CA3AF',

          // accent — indigo
          accent: '#6366F1',
          'accent-hover': '#4F46E5',
          'accent-soft': '#EEF2FF',
          'accent-softer': '#F5F5FF',
          'accent-light': '#A5B4FC',
          'accent-ink': '#3730A3',

          // status — kept on warm/success/danger/info from Mark
          warm: '#F59E0B',
          'warm-soft': '#FEF3C7',
          'warm-ink': '#92400E',
          success: '#10B981',
          'success-soft': '#D1FAE5',
          danger: '#DC2626',
          'danger-soft': '#FEE2E2',
          info: '#0EA5E9',
          'info-soft': '#E0F2FE',
          'info-ink': '#0369A1',
        },
        // Keep `brand` as an alias for legacy class names in pages we
        // don't touch this pass. Maps to the indigo accent.
        brand: {
          50: '#EEF2FF',
          100: '#E0E7FF',
          200: '#C7D2FE',
          300: '#A5B4FC',
          500: '#6366F1',
          600: '#4F46E5',
          700: '#3730A3',
          800: '#312E81',
          900: '#1E1B4B',
        },
        danger: {
          50: '#FEE2E2',
          500: '#EF4444',
          600: '#DC2626',
          700: '#B91C1C',
        },
        success: {
          500: '#22C55E',
          600: '#16A34A',
        },
        muted: '#6B7280',
      },
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'Helvetica',
          'Arial',
          'sans-serif',
        ],
        mono: [
          'JetBrains Mono',
          'ui-monospace',
          'SFMono-Regular',
          'Menlo',
          'Monaco',
          'Consolas',
          'monospace',
        ],
      },
      borderRadius: {
        sm: '8px',
        md: '12px',
        lg: '18px',
        xl: '24px',
        '2xl': '32px',
      },
      boxShadow: {
        xs: '0 1px 2px rgba(0,0,0,0.04)',
        sm: '0 2px 8px rgba(0,0,0,0.06)',
        md: '0 8px 24px rgba(0,0,0,0.08)',
        lg: '0 24px 64px rgba(0,0,0,0.12)',
        'focus-ps': '0 0 0 3px rgba(99,102,241,0.35)',
      },
      // ParentScript parentLg/body scale (Mark tokens, restated).
      fontSize: {
        'parent-sm': ['0.875rem', { lineHeight: '1.375rem' }], // 14
        'parent-base': ['1rem', { lineHeight: '1.625rem' }], // 16 / 26
        'parent-lg': ['1.25rem', { lineHeight: '1.875rem' }], // 20 / 30
        'parent-xl': ['1.375rem', { lineHeight: '1.625rem' }], // 22 / 30 (h2)
        'parent-2xl': ['1.875rem', { lineHeight: '2.375rem' }], // 30 / 38 (h1)
        'parent-3xl': ['2.5rem', { lineHeight: '3rem' }], // 40 / 48 (display)
      },
      minHeight: {
        tap: '3rem', // WCAG 2.5.5 (48px)
      },
      minWidth: {
        tap: '3rem',
      },
      spacing: {
        'safe-bottom': 'env(safe-area-inset-bottom)',
        'safe-top': 'env(safe-area-inset-top)',
      },
      transitionTimingFunction: {
        ps: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
      },
      transitionDuration: {
        '240': '240ms',
        '420': '420ms',
      },
    },
  },
  plugins: [],
} satisfies Config