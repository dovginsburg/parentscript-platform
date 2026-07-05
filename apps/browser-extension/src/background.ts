/**
 * ParentScript background service worker — MV3 module worker.
 *
 * Responsibilities:
 *   1. Create a context-menu item on install: "Search ParentScript for '%s'"
 *      — sends the selected text to the popup, which pre-fills the search.
 *   2. Listen for the context-menu click and message the popup (or open it).
 *   3. Handle the keyboard command: open the popup focused on search.
 *   4. Bridge content-script requests (e.g. open skill in tab).
 *
 * No persistent state lives here in v1. Future: cache last-seen skills list
 * keyed by locale so the popup opens fast offline.
 */

const MENU_ID = 'parentscript-search-selection';
const POPUP_PATH = 'popup.html';

interface PendingSelection {
  query: string;
  ts: number;
}

const pending = new Map<number, PendingSelection>(); // tabId -> payload

function isParentscriptUrl(url: string | undefined): boolean {
  if (!url) return false;
  return /^https:\/\/(api|app|www)\.parentscript\.app\//.test(url);
}

function createContextMenu(): void {
  // Idempotent — chrome.contextMenus.create throws if it already exists,
  // so on startup we remove then re-create.
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: MENU_ID,
      title: "Search ParentScript for '%s'",
      contexts: ['selection'],
    });
  });
}

function storeSelectionForTab(tabId: number, query: string): void {
  pending.set(tabId, { query, ts: Date.now() });
  // Auto-expire after 60s so stale entries don't accumulate.
  setTimeout(() => {
    const entry = pending.get(tabId);
    if (entry && Date.now() - entry.ts >= 60_000) {
      pending.delete(tabId);
    }
  }, 61_000);
}

chrome.runtime.onInstalled.addListener(() => {
  createContextMenu();
});

chrome.runtime.onStartup.addListener(() => {
  createContextMenu();
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId !== MENU_ID) return;
  const selection = info.selectionText?.trim() ?? '';
  if (!selection) return;
  if (tab?.id !== undefined) {
    storeSelectionForTab(tab.id, selection);
  }
  // Open the popup — action.openPopup requires user gesture in some browsers,
  // so we fall back to opening a new tab to popup.html when the action API is unavailable.
  try {
    void chrome.action.openPopup();
  } catch {
    if (tab?.id !== undefined) {
      void chrome.tabs.update(tab.id, { url: chrome.runtime.getURL(POPUP_PATH) });
    }
  }
});

chrome.commands?.onCommand.addListener(command => {
  if (command === '_execute_action') {
    try {
      void chrome.action.openPopup();
    } catch {
      // openPopup may be unavailable; nothing else we can do programmatically.
    }
  }
});

/* Popup asks: "did anyone hand me a prefill for this tab?" */
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (!msg || typeof msg !== 'object') return;
  if (msg.type === 'get-prefill' && typeof msg.tabId === 'number') {
    const entry = pending.get(msg.tabId);
    if (entry) {
      pending.delete(msg.tabId);
      sendResponse({ ok: true, query: entry.query });
      return true;
    }
    sendResponse({ ok: false });
    return true;
  }
  if (msg.type === 'open-skill' && typeof msg.url === 'string') {
    if (!isParentscriptUrl(msg.url)) {
      sendResponse({ ok: false, error: 'URL not allowed' });
      return true;
    }
    chrome.tabs.create({ url: msg.url }, () => sendResponse({ ok: true }));
    return true;
  }
  return false;
});

// Keep the worker alive long enough to receive a single message round-trip.
self.addEventListener('uninstall', () => {
  pending.clear();
});
