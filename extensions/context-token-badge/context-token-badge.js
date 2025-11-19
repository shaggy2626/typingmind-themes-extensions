/* == TypingMind | Context Token Badge =======================================
 * Shows the live context length under the "About this chat" button without
 * polling. Reacts only when chats change, new messages land, or the tab
 * returns to focus, keeping overhead minimal.
 * ========================================================================== */

(() => {
  'use strict';

  // Prevent duplicate installations across page refreshes or SPA navigation
  if (window.__tmxContextTokenBadgeInstalled) return;
  window.__tmxContextTokenBadgeInstalled = true;

  class ContextTokenBadge {
    // DOM selectors for key elements
    BUTTON_SELECTOR = '[data-tooltip-content="About this chat"]';
    STREAM_SELECTOR = '[data-element-id="chat-space-middle-part"]';
    HEADER_SELECTOR = '[data-element-id="current-chat-title"], [data-element-id="chat-space-middle-part"]';
    BADGE_CLASS = 'tm-context-length-badge';
    BASE_DELAY = 400; // ms to wait before reading IndexedDB after a change

    constructor() {
      this._state = {
        // UI elements
        badge: null,
        button: null,
        stream: null,
        header: null,

        // Observers tracking different parts of the page
        observers: new Set(),
        streamObserver: null,
        headerObserver: null,
        globalObserver: null,

        // IndexedDB connection (reused across reads)
        dbPromise: null,

        // Timers for debouncing updates
        updateTimer: null,
        retryTimer: null,
        retryCount: 0,

        // Tracking the last known state to avoid redundant updates
        lastTokens: null,
        lastMessageKey: null,
        pendingMessageKey: null
      };

      this.#init();
    }

    /* ---------- lifecycle ------------------------------------------------- */
    #init() {
      // Start watching for new messages in the chat stream
      this.#observeStream();
      // Watch the chat header for changes (chat title updates, etc.)
      this.#observeHeader();
      // Watch the entire page for major DOM changes (handles SPA navigation)
      this.#observeGlobal();
      // Do an initial read right away
      this.#scheduleUpdate(0);

      // Set up event handlers for chat switches, tab focus, and visibility changes
      this._hashHandler = () => this.#handleHashChange();
      this._focusHandler = () => this.#scheduleUpdate(0);
      this._visibilityHandler = () => {
        if (!document.hidden) this.#scheduleUpdate(0);
      };

      window.addEventListener('hashchange', this._hashHandler);
      window.addEventListener('focus', this._focusHandler);
      document.addEventListener('visibilitychange', this._visibilityHandler);
      window.addEventListener('beforeunload', () => this.destroy(), { once: true });

      // Expose manual controls for debugging or user scripts
      window.contextTokenBadge = {
        refresh: () => this.#scheduleUpdate(0),
        destroy: () => this.destroy()
      };
    }

    destroy() {
      // Disconnect all MutationObservers to stop watching the page
      this._state.observers.forEach((obs) => obs.disconnect());
      this._state.observers.clear();
      this._state.streamObserver = null;
      this._state.headerObserver = null;
      this._state.globalObserver = null;

      // Clear any pending timers
      if (this._state.updateTimer) clearTimeout(this._state.updateTimer);
      if (this._state.retryTimer) clearTimeout(this._state.retryTimer);

      // Remove the badge from the page and reset all tracking
      this._state.badge?.remove();
      this.#resetTracking({ clearMount: true });

      // Remove event listeners
      window.removeEventListener('hashchange', this._hashHandler);
      window.removeEventListener('focus', this._focusHandler);
      document.removeEventListener('visibilitychange', this._visibilityHandler);

      // Clean up the global reference
      delete window.contextTokenBadge;
    }

    /* ---------- helpers --------------------------------------------------- */
    
    // Format token count for display (14062 → "14k", 580 → "580")
    #formatTokens(val) {
      if (!Number.isFinite(val)) return '—';
      if (val < 1_000) return String(val);
      return `${Math.round(val / 1_000)}k`;
    }

    // Extract the chat ID from the URL hash (e.g., #chat=abc123 → "abc123")
    #getChatId() {
      return location.hash.match(/chat=([^&]+)/)?.[1] ?? null;
    }

    // Reset all tracking state (used when switching chats or cleaning up)
    #resetTracking(options = {}) {
      const { clearMount = false } = options;
      if (clearMount) {
        this._state.button = null;
        this._state.badge = null;
      }
      this._state.lastTokens = null;
      this._state.lastMessageKey = null;
      this._state.pendingMessageKey = null;
      this._state.retryCount = 0;
    }

    // Register a new observer and disconnect any old one in the same slot
    #registerObserver(slot, observer) {
      const current = this._state[slot];
      if (current) {
        current.disconnect();
        this._state.observers.delete(current);
      }
      this._state[slot] = observer;
      this._state.observers.add(observer);
      return observer;
    }

    // Open the TypingMind IndexedDB (cached after first call)
    async #getDB() {
      if (this._state.dbPromise) return this._state.dbPromise;
      this._state.dbPromise = new Promise((resolve, reject) => {
        const req = indexedDB.open('keyval-store', 1);
        req.onerror = () => reject(req.error ?? new Error('IDB open failed'));
        req.onsuccess = () => resolve(req.result);
      });
      return this._state.dbPromise;
    }

    // Read the current context token count from IndexedDB
    async #readTokens() {
      const chatId = this.#getChatId();
      if (!chatId) return null;

      let db;
      try {
        db = await this.#getDB();
      } catch (err) {
        console.warn('[ContextTokenBadge] indexedDB open error', err);
        return null;
      }

      return await new Promise((resolve) => {
        const tx = db.transaction('keyval', 'readonly');
        tx.onabort = () => resolve(null);

        const store = tx.objectStore('keyval');
        const req = store.get(`CHAT_${chatId}`);
        req.onerror = () => resolve(null);
        req.onsuccess = () => {
          const record = req.result;
          if (!record) return resolve(null);

          const msgs = Array.isArray(record.messages) ? record.messages : [];
          const lastMsg = msgs[msgs.length - 1] ?? null;
          // Use the message's unique ID or timestamp to detect when a new message arrives
          const messageKey = lastMsg?.uuid ?? lastMsg?.createdAt ?? String(msgs.length);

          // Scan backward through messages to find the most recent one with token usage
          for (let i = msgs.length - 1; i >= 0; i -= 1) {
            const usage = msgs[i]?.usage?.total_tokens;
            if (Number.isFinite(usage)) {
              resolve({ tokens: usage, messageKey });
              return;
            }
          }

          // No message has usage data yet (e.g., brand new chat or still writing)
          resolve({ tokens: null, messageKey });
        };
      });
    }

    // Find and cache the "About this chat" button
    #ensureButton() {
      if (this._state.button?.isConnected) return this._state.button;
      const btn = document.querySelector(this.BUTTON_SELECTOR);
      if (btn) this._state.button = btn;
      return btn;
    }

    // Create or retrieve the token count badge element
    #ensureBadge() {
      const btn = this.#ensureButton();
      if (!btn) return null;

      if (!this._state.badge || !this._state.badge.isConnected) {
        // Stack the button content vertically (icon on top, badge below)
        btn.style.display = 'flex';
        btn.style.flexDirection = 'column';
        btn.style.alignItems = 'center';
        btn.style.gap = '2px';

        // Create the badge element with styling
        const badge = document.createElement('div');
        badge.className = this.BADGE_CLASS;
        badge.style.fontSize = '12px';
        badge.style.fontWeight = '600';
        badge.style.lineHeight = '1';
        badge.style.opacity = '0.85';
        badge.textContent = '—';
        btn.appendChild(badge);
        this._state.badge = badge;
      }

      return this._state.badge;
    }

    // Update the badge text and tooltip with the current token count
    #applyTokens(tokens) {
      const badge = this.#ensureBadge();
      if (!badge) return;

      badge.textContent = tokens == null ? '—' : this.#formatTokens(tokens);
      badge.title = tokens == null ? 'Token count unavailable' : `${tokens.toLocaleString()} tokens in context`;
    }

    // Schedule an update after a short delay (debouncing rapid changes)
    #scheduleUpdate(delay = this.BASE_DELAY) {
      if (this._state.updateTimer) clearTimeout(this._state.updateTimer);
      this._state.updateTimer = setTimeout(() => this.#runUpdate(), delay);
    }

    // Retry with exponential back-off when data isn't ready yet
    #scheduleRetry() {
      this._state.retryCount = Math.min(this._state.retryCount + 1, 5);
      const delay = this.BASE_DELAY * this._state.retryCount;

      if (this._state.retryTimer) clearTimeout(this._state.retryTimer);
      this._state.retryTimer = setTimeout(() => {
        this._state.retryTimer = null;
        this.#runUpdate();
      }, delay);
    }

    // Main update logic: read token count from IndexedDB and update the badge
    async #runUpdate() {
      this._state.updateTimer = null;

      // Wait for the button to appear in the DOM
      if (!this.#ensureButton()) {
        this.#scheduleUpdate(this.BASE_DELAY);
        return;
      }

      this.#ensureBadge();
      const result = await this.#readTokens();
      
      // No data available yet, retry with back-off
      if (!result) {
        this.#applyTokens(null);
        this.#scheduleRetry();
        return;
      }

      const { tokens, messageKey } = result;

      // Tokens still null (e.g., TypingMind hasn't written usage data yet)
      if (!Number.isFinite(tokens)) {
        this.#applyTokens(null);
        this.#scheduleRetry();
        return;
      }

      // If we detected a new message but tokens didn't change yet,
      // TypingMind is still writing the usage data. Wait and re-check.
      if (
        messageKey &&
        messageKey !== this._state.lastMessageKey &&
        this._state.pendingMessageKey !== messageKey &&
        tokens === this._state.lastTokens
      ) {
        this._state.pendingMessageKey = messageKey;
        this.#scheduleUpdate(this.BASE_DELAY);
        return;
      }

      // Data is fresh and complete, update the badge
      this._state.pendingMessageKey = null;
      this._state.retryCount = 0;
      if (tokens !== this._state.lastTokens || messageKey !== this._state.lastMessageKey) {
        this._state.lastTokens = tokens;
        this._state.lastMessageKey = messageKey ?? this._state.lastMessageKey;
        this.#applyTokens(tokens);
      }
    }

    // ============================== DOM Observers ==============================

    // Watch the chat message area for new AI or human messages
    #observeStream() {
      const container = document.querySelector(this.STREAM_SELECTOR);
      if (!container || container === this._state.stream) return;

      this._state.stream = container;
      const obs = new MutationObserver((muts) => {
        // Check if any mutation added a message node
        const relevant = muts.some((m) => (
          m.type === 'childList' &&
          [...m.addedNodes].some((node) => (
            node.nodeType === 1 &&
            (node.matches?.('[data-element-id="ai-response"], [data-element-id="human-response"], details[data-auto-expanded]') ||
             node.querySelector?.('[data-element-id="ai-response"], [data-element-id="human-response"]'))
          ))
        ));
        if (relevant) this.#scheduleUpdate();
      });
      obs.observe(container, { childList: true, subtree: true });
      this.#registerObserver('streamObserver', obs);
    }

    // Watch the chat header for changes (e.g., title updates)
    #observeHeader() {
      const header = document.querySelector(this.HEADER_SELECTOR);
      if (!header || header === this._state.header) return;

      this._state.header = header;
      const obs = new MutationObserver(() => this.#scheduleUpdate(this.BASE_DELAY));
      obs.observe(header, { childList: true, subtree: true });
      this.#registerObserver('headerObserver', obs);
    }

    // Watch the entire page to handle SPA navigation and button re-renders
    #observeGlobal() {
      const obs = new MutationObserver(() => {
        this.#observeStream();
        this.#observeHeader();
        this.#ensureButton();
        this.#ensureBadge();
      });
      obs.observe(document.body, { childList: true, subtree: true });
      this.#registerObserver('globalObserver', obs);
    }

    // Handle chat switches (URL hash changes to a new chat ID)
    #handleHashChange() {
      this.#resetTracking({ clearMount: true });
      this.#scheduleUpdate(this.BASE_DELAY);
    }
  }

  // Bootstrap the extension
  new ContextTokenBadge();
})();

