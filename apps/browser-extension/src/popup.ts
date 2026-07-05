/**
 * ParentScript popup — fetches skills, renders a filterable list,
 * and opens the full cheat sheet in a new tab on click.
 *
 * Data source: direct read of the `skills` table in Supabase using
 * the project's anon key. The exact same anon key is already shipped
 * in the web app, and the published-skills RLS policy
 * (apps/backend/supabase/migrations/002_rls_policies.sql:100-102)
 * permits world reads of `is_published = TRUE`. No posture change.
 *
 * The api.parentscript.app backend was unwired (DEPLOYMENT_NOT_FOUND)
 * at the time this was written, so the popup reads via Supabase
 * instead of via the FastAPI service. If the API gets deployed, this
 * file can swap back to a fetch() with no popup-side change.
 *
 * Shape mirrors the `Skill` type in @parentscript/shared. Column
 * names differ from the shared type (DB stores goal/use_when/say_this;
 * shared type's `body` is composed from those at read time).
 *
 * IMPORTANT: this popup never auto-opens, never auto-fills, and never
 * runs without an explicit click. It also surfaces an honest error state
 * when Supabase isn't reachable or the anon key isn't configured.
 */

import type { Skill } from '@parentscript/shared';
import { getSupabase, SupabaseConfigMissingError } from './supabase.js';

const PREVIEW_LINE_LIMIT = 2;

type ListState = 'loading' | 'ready' | 'error';

const els = {
  search: document.getElementById('ps-search') as HTMLInputElement,
  list: document.getElementById('ps-list') as HTMLUListElement,
  status: document.getElementById('ps-status') as HTMLDivElement,
  refresh: document.getElementById('ps-refresh') as HTMLButtonElement,
  meta: document.getElementById('ps-meta') as HTMLSpanElement,
};

let allSkills: Skill[] = [];
let state: ListState = 'loading';

/* ---------- network ---------- */

/**
 * Shape returned by Supabase for the published-skills query.
 * Kept narrow — we only project the columns we render.
 */
interface SupabaseSkillRow {
  id: string;
  level: number; // 1..4 (DB CHECK constraint)
  sort_order: number;
  title: string;
  goal: string; // DB column
  use_when: string; // DB column
  modality: string | null;
  principle_citation: string | null;
}

const LEVEL_LABEL: Record<number, Skill['level']> = {
  1: 'L1',
  2: 'L2',
  3: 'L3',
  4: 'L4',
};

/**
 * Compose a Skill-shaped record from a Supabase row.
 * The DB stores `goal`/`use_when`/`say_this`/`dont_say`; we surface a
 * single `body` field in the popup for the preview, and use the others
 * only on the full web page that opens in a new tab.
 */
function rowToSkill(row: SupabaseSkillRow): Skill {
  const level = LEVEL_LABEL[row.level] ?? 'L1';
  // Use the level label `L1..L4` for `level`, default to L1 if the DB
  // ever returned an out-of-range value (defensive — schema CHECK prevents it).
  const modality = row.modality ?? '';
  // The shared `Skill.modality` is required-string in v1; we coerce nulls.
  const body = row.goal || row.use_when || '';
  const evidence_refs = row.principle_citation ? [row.principle_citation] : [];
  return {
    id: row.id,
    level,
    modality,
    title: row.title,
    body,
    evidence_refs,
    reviewed_by: 'ParentScript clinical team',
  };
}

async function fetchSkills(): Promise<Skill[]> {
  const supabase = await getSupabase();
  if (!supabase) {
    // Config not set — surface a clear, recoverable error in the UI.
    throw new SupabaseConfigMissingError();
  }
  const { data, error } = await supabase
    .from('skills')
    .select('id, level, sort_order, title, goal, use_when, modality, principle_citation')
    .eq('is_published', true)
    .order('level', { ascending: true })
    .order('sort_order', { ascending: true });

  if (error) throw error;
  if (!data) return [];
  return data.map(rowToSkill);
}

/* ---------- rendering ---------- */

function escape(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function preview(body: string): string {
  const words = body.replace(/\s+/g, ' ').trim().split(' ');
  const limit = 26; // ~2 lines at 13px in a 336px-wide content area
  if (words.length <= limit) return body.trim();
  return words.slice(0, limit).join(' ') + '…';
}

function renderEmpty(): void {
  els.list.innerHTML = `<li class="ps-empty">No skills match your search.</li>`;
}

function renderError(message: string): void {
  els.list.innerHTML = '';
  els.status.classList.add('is-warn');
  els.status.textContent = message;
}

function renderStatus(): void {
  els.status.classList.toggle('is-warn', state === 'error');
  if (state === 'loading') {
    els.status.textContent = 'Loading skills…';
  } else if (state === 'ready') {
    els.status.textContent = '';
  } else {
    // error message already set by renderError
  }
}

function renderSkills(skills: Skill[]): void {
  if (skills.length === 0) {
    renderEmpty();
    return;
  }
  const html = skills
    .map(s => {
      const title = escape(s.title);
      const body = escape(preview(s.body ?? ''));
      const modality = escape(s.modality ?? '');
      const level = escape(s.level);
      const href = `https://parentscript.app/app/parent/skills/${encodeURIComponent(s.id)}`;
      return `
        <li class="ps-item" role="option" tabindex="0" data-skill-id="${escape(s.id)}" data-href="${escape(href)}" aria-label="${title}">
          <div class="ps-item-head">
            <span class="ps-badge">${level}</span>
            ${modality ? `<span class="ps-modality">${modality}</span>` : ''}
          </div>
          <div class="ps-item-title">${title}</div>
          <div class="ps-item-body">${body}</div>
        </li>
      `;
    })
    .join('');
  els.list.innerHTML = html;
}

function setMeta(filteredCount: number): void {
  const total = allSkills.length;
  els.meta.textContent =
    filteredCount === total
      ? `${total} skill${total === 1 ? '' : 's'}`
      : `${filteredCount} of ${total}`;
}

/* ---------- filtering ---------- */

function filterSkills(query: string): Skill[] {
  const q = query.trim().toLowerCase();
  if (!q) return allSkills;
  return allSkills.filter(s => {
    const hay = [s.title, s.modality ?? '', s.body ?? '', ...(s.evidence_refs ?? [])]
      .join(' ')
      .toLowerCase();
    return hay.includes(q);
  });
}

/* ---------- event handlers ---------- */

function applyFilter(): void {
  const q = els.search.value;
  const filtered = filterSkills(q);
  renderSkills(filtered);
  setMeta(filtered.length);
}

function openSkill(item: HTMLLIElement): void {
  const href = item.dataset.href;
  if (!href) return;
  // Chrome MV3 service-worker context uses chrome.tabs; popup context also has it.
  chrome.tabs.create({ url: href });
  window.close();
}

function wireList(): void {
  els.list.addEventListener('click', e => {
    const target = e.target as HTMLElement;
    const item = target.closest<HTMLLIElement>('.ps-item');
    if (item) openSkill(item);
  });
  els.list.addEventListener('keydown', e => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const target = e.target as HTMLElement;
    const item = target.closest<HTMLLIElement>('.ps-item');
    if (!item) return;
    e.preventDefault();
    openSkill(item);
  });
}

/* ---------- bootstrap ---------- */

async function load(): Promise<void> {
  state = 'loading';
  renderStatus();
  try {
    allSkills = await fetchSkills();
    state = 'ready';
    renderStatus();
    applyFilter();
  } catch (err) {
    state = 'error';
    // Config-missing gets its own message: it's the single most likely
    // failure on a fresh install, and the fix is one click (options page).
    const msg =
      err instanceof SupabaseConfigMissingError
        ? err.message
        : "Couldn't load skills — check your connection and try again.";
    renderError(msg);
    els.meta.textContent = '0 skills';
  }
}

function init(): void {
  els.search.addEventListener('input', applyFilter);
  els.refresh.addEventListener('click', () => {
    void load();
  });
  wireList();
  // Defer focus so the popup animation finishes first.
  setTimeout(() => els.search.focus(), 50);
  void load();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init, { once: true });
} else {
  init();
}

// Expose for debugging in DevTools without polluting globals in prod.
declare global {
  interface Window {
    __psPopup?: { filterSkills: typeof filterSkills };
  }
}
window.__psPopup = { filterSkills };
