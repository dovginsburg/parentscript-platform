/**
 * ParentScript content script — a small floating "lookup" button that
 * appears in the bottom-right of every page when text is selected.
 *
 * Clicking the button:
 *   - Asks the background worker to store the selection as a pending prefill.
 *   - Opens the popup (or, as a fallback, the popup.html in a new tab).
 *
 * The button is dismissable and never blocks interaction with the page.
 * It is intentionally minimal — v1 just bridges to the popup search.
 */

(function () {
  if (window.top !== window) return; // only the top frame

  const BTN_ID = "ps-lookup-fab";
  const MIN_SELECTION_LEN = 3;

  // Bail early if a prior content-script instance already injected the FAB.
  if (document.getElementById(BTN_ID)) return;

  const fab = document.createElement("button");
  fab.id = BTN_ID;
  fab.type = "button";
  fab.setAttribute("aria-label", "Search ParentScript for the selected text");
  fab.hidden = true;
  fab.textContent = "🔎 ParentScript";
  Object.assign(fab.style, {
    position: "fixed",
    right: "16px",
    bottom: "16px",
    zIndex: "2147483647",
    padding: "8px 12px",
    borderRadius: "999px",
    border: "1px solid rgba(99, 102, 241, 0.4)",
    background: "rgba(99, 102, 241, 0.95)",
    color: "#fff",
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    fontSize: "12px",
    fontWeight: "600",
    letterSpacing: "0.01em",
    boxShadow: "0 8px 24px rgba(15, 23, 42, 0.18)",
    cursor: "pointer",
    userSelect: "none",
    transition: "transform 120ms ease, opacity 120ms ease",
  });

  document.documentElement.appendChild(fab);

  function getSelectionText(): string {
    const sel = window.getSelection();
    return sel ? sel.toString().trim() : "";
  }

  function showFabIfSelection(): void {
    const text = getSelectionText();
    if (text.length < MIN_SELECTION_LEN) {
      fab.hidden = true;
      return;
    }
    fab.hidden = false;
    fab.dataset.query = text;
  }

  function hideFab(): void {
    fab.hidden = true;
  }

  fab.addEventListener("click", () => {
    const query = fab.dataset.query ?? getSelectionText();
    if (!query) return;
    // Ask the background worker to remember this selection so the popup
    // can pre-fill its search box. We can't open the popup from a content
    // script reliably, so we send a message and let the user click the
    // action icon to open the popup. As a UX bridge, we also flash the
    // action icon via chrome.action.setBadgeText.
    chrome.runtime.sendMessage({ type: "content-selection", query }, () => {
      // Ignore errors — the runtime might be in a state where no
      // listener is attached yet (cold service worker).
      void chrome.runtime.lastError;
    });
    try {
      void chrome.action.setBadgeText({ tabId: -1, text: "•" });
      window.setTimeout(() => {
        void chrome.action.setBadgeText({ tabId: -1, text: "" });
      }, 1500);
    } catch {
      // setBadgeText can throw if the action is unavailable; safe to ignore.
    }
    hideFab();
    // Best-effort: try to open the popup. If it fails, the user still has
    // the badge cue and can click the action icon.
    try {
      void (chrome as unknown as { action?: { openPopup?: () => Promise<void> } }).action?.openPopup?.();
    } catch {
      // ignore
    }
  });

  // Show on selection change; hide on mouse-down outside the FAB.
  document.addEventListener("selectionchange", showFabIfSelection, { passive: true });
  document.addEventListener("mousedown", (e) => {
    const target = e.target as Node | null;
    if (target && target === fab) return;
    hideFab();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") hideFab();
  });
})();