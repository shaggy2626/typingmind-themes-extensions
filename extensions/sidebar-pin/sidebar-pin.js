/* == TypingMind | Sidebar Pin ==================================================
 * Keeps sidebar expanded (pin/unpin).
 * - Auto-expands when the collapsed-only expand button appears
 * - Click "Close sidebar" to unpin (allow manual collapse)
 * - Click the compact TypingMind button to pin again
 * ============================================================================ */

(() => {
  'use strict';

  if (window.__tmxSidebarPinInstalled) return;
  window.__tmxSidebarPinInstalled = true;

  const SEL_EXPAND = 'button[data-element-id="workspace-logo-button-compact"]';
  const SEL_NAV = '[data-element-id="nav-container"]';
  const SEL_NEW_CHAT = '[data-element-id="new-chat-button-in-side-bar"]';
  const SEL_CLOSE = 'button[aria-label="Close sidebar"]';

  let pinned = true;

  // Check if artifacts panel is open (iframe visible or "View in Artifacts" button active)
  const isArtifactsOpen = () => {
    const iframe = document.querySelector('main iframe');
    if (iframe) {
      const r = iframe.getBoundingClientRect();
      if (r.width > 300 && r.height > 200) return true;
    }
    return false;
  };

  let lastClick = 0;
  const THROTTLE_MS = 150;

  let observedNav = null;
  let mo = null;

  const expand = () => {
    if (!pinned) return;
    if (isArtifactsOpen()) return; // Don't expand if artifacts panel is open

    const btn = document.querySelector(SEL_EXPAND);
    if (!btn) return;

    const now = performance.now();
    if (now - lastClick < THROTTLE_MS) return;

    lastClick = now;
    btn.click();
  };

  const ensureObserver = () => {
    const nav = document.querySelector(SEL_NAV);
    if (!nav || nav === observedNav) return;

    observedNav = nav;
    mo?.disconnect();
    mo = new MutationObserver(expand);
    mo.observe(nav, { attributes: true, attributeFilter: ['class'] });
  };

  const kick = () => {
    ensureObserver();
    expand();
  };

  const pin = () => {
    pinned = true;
    Promise.resolve().then(kick);
  };

  const unpin = () => {
    pinned = false;
  };

  // Boot: run briefly until nav exists and sidebar is expanded
  let tries = 0;
  const boot = setInterval(() => {
    kick();
    if ((observedNav && !document.querySelector(SEL_EXPAND)) || ++tries >= 25) clearInterval(boot);
  }, 80);

  // Capture clicks to coordinate pin/unpin with the UI
  document.addEventListener(
    'click',
    (e) => {
      const btn = e.target.closest('button');
      if (!btn) return;

      // User explicitly wants collapse -> stop auto-expanding until they re-open
      if (e.target.closest(SEL_CLOSE)) {
        unpin();
        return;
      }

      // Check if clicking artifacts-related buttons (View in Artifacts, close artifacts, etc.)
      const btnText = btn.textContent?.toLowerCase() || '';
      const isArtifactsButton = btnText.includes('view in artifacts') || 
                                btnText.includes('artifact') ||
                                btnText.includes('canvas');
      
      // If clicking artifacts button, allow sidebar to collapse and re-check later
      if (isArtifactsButton) {
        setTimeout(() => {
          // After artifacts panel settles, if it's closed, re-expand sidebar
          if (!isArtifactsOpen() && pinned) {
            Promise.resolve().then(kick);
          }
        }, 400);
        return;
      }

      // New chat often triggers collapse; re-expand ASAP (microtask) unless artifacts open
      if (e.target.closest(SEL_NEW_CHAT)) {
        if (pinned && !isArtifactsOpen()) Promise.resolve().then(kick);
        return;
      }

      // If user manually expands from compact mode, resume pinning
      if (e.target.closest(SEL_EXPAND)) {
        pin();
      }
    },
    true
  );

  // SPA back/forward
  addEventListener('popstate', () => pinned && Promise.resolve().then(kick));

  // Debug / manual control
  window.sidebarPin = {
    pin,
    unpin,
    toggle: () => (pinned ? unpin() : pin()),
    isPinned: () => pinned,
    isCollapsed: () => !!document.querySelector(SEL_EXPAND),
    expand: kick,
  };
})();
