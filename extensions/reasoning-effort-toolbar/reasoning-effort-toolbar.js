// TypingMind UI-only: Effort (Reasoning) pill — GPT‑5 only, Think-style, ChatGPT icon
// Persists selection across sessions; popover closes immediately on selection
// Event-driven (no polling). Options: Minimal, Low, Medium, High
// Version: 1.4

(() => {
    if (window.__tmxReasonToolbarInstalled) return;
    window.__tmxReasonToolbarInstalled = true;
    const IDS = {
      wrap: 'tmx-reason-wrap',
      btn: 'tmx-reason-btn',
      menu: 'tmx-reason-menu',
      style: 'tmx-reason-style',
    };
    const OPTIONS = ['Minimal', 'Low', 'Medium', 'High'];
    const KEY_SEL = 'tmx-reason-selected';
  
    // -------- helpers --------
    const $ = (s, r = document) => r.querySelector(s);
    const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
    const isGPT5Text = (t) => /\bgpt-?\s*5\b/i.test((t || '').trim());
  
    function findModelButton() {
      // Prefer a composer-adjacent button that displays "GPT-*"
      const actions = $('[data-element-id="chat-input-actions"]');
      if (actions) {
        let node = actions.parentElement;
        for (let i = 0; i < 5 && node; i++) {
          const match = $$('button', node).find(b =>
            /gpt-\s*\d/i.test((b.innerText || b.textContent || ''))
          );
          if (match) return match;
          node = node.parentElement;
        }
      }
      // Fallback: any button with GPT-* visible
      return $$('button').find(b => /gpt-\s*\d/i.test((b.innerText || b.textContent || ''))) || null;
    }
  
    function readCurrentModelLabel() {
      const btn = findModelButton();
      if (!btn) return '';
      const text = (btn.innerText || btn.textContent || '').trim();
      const aria = (btn.getAttribute('aria-label') || '').trim();
      const title = (btn.title || '').trim();
      return [text, aria, title].filter(Boolean).join(' ');
    }
  
    function shouldShowEffort() {
      const btn = findModelButton();
      if (!btn) return false; // Strict: hide until we can positively detect GPT-5
      const label = readCurrentModelLabel().toLowerCase();
      return /\bgpt-?\s*5\b/.test(label);
    }
  
    // -------- styles (spacing + popover) --------
    function injectStyles() {
      if (document.getElementById(IDS.style)) return;
      const css = `
        /* Keep a consistent gap from Think so pills never touch */
        #${IDS.wrap} {
          display: inline-flex;
          align-items: center;
          margin-left: 0.25rem; /* Tailwind ml-1 */
        }
  
        /* Popover (portaled to body; above composer; flips if needed) */
        #${IDS.menu} {
          position: fixed;
          z-index: 2147483000;
          width: 14rem;
          padding: 0.25rem;
          background: #fff;
          color: rgb(15 23 42);
          border: 1px solid rgba(0,0,0,.08);
          border-radius: 0.75rem; /* rounded-xl */
          box-shadow: 0 10px 30px rgba(0,0,0,.12), 0 2px 6px rgba(0,0,0,.08);
          transform: translateZ(0);
        }
        .dark #${IDS.menu} {
          background: rgb(15 23 42);
          color: #fff;
          border-color: rgba(255,255,255,.12);
          box-shadow: 0 10px 30px rgba(0,0,0,.45), 0 2px 6px rgba(0,0,0,.30);
        }
        .tmx-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.75rem;
          border-radius: 0.5rem; /* rounded-lg */
          padding: 0.55rem 0.65rem;
          cursor: pointer;
        }
        .tmx-item:hover { background: rgba(15,23,42,.06); }
        .dark .tmx-item:hover { background: rgba(255,255,255,.12); }
        .tmx-check {
          width: 1rem;
          height: 1rem;
          border: 1.5px solid currentColor;
          border-radius: 0.25rem;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 0.8rem;
        }
        .tmx-item[aria-selected="true"] .tmx-check { background: currentColor; color: inherit; }
        .tmx-hidden { display: none !important; }
      `;
      const style = document.createElement('style');
      style.id = IDS.style;
      style.textContent = css;
      document.head.appendChild(style);
    }
  
    // Think-style pill (active look) with flexible width for long words
    const reasonPillClasses = [
      'relative','focus-visible:outline-blue-600','h-9','rounded-lg',
      'justify-center','items-center','gap-1.5','inline-flex',
      'min-w-fit','px-3',
      'disabled:text-neutral-400','dark:disabled:text-neutral-500',
      'bg-blue-200','dark:bg-blue-800',
      'text-blue-600','dark:text-blue-200',
      'hover:bg-blue-300','active:bg-blue-400',
      'hover:bg-blue-300/80','active:bg-blue-400/80'
    ].join(' ');
  
    // ChatGPT "light thinking" icon
    const chatgptLightThinkingSVG = `
      <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" class="w-5 h-5 flex-shrink-0">
        <path d="M16.585 9.99998C16.585 6.36319 13.6368 3.41502 10 3.41502C6.3632 3.41502 3.41504 6.36319 3.41504 9.99998C3.41504 13.6368 6.3632 16.5849 10 16.5849C13.6368 16.5849 16.585 13.6368 16.585 9.99998ZM17.915 9.99998C17.915 14.3713 14.3713 17.915 10 17.915C5.62867 17.915 2.08496 14.3713 2.08496 9.99998C2.08496 5.62865 5.62867 2.08494 10 2.08494C14.3713 2.08494 17.915 5.62865 17.915 9.99998Z"></path>
        <path d="M12.0837 0.00494385C12.4509 0.00511975 12.7488 0.302822 12.7488 0.669983C12.7488 1.03714 12.4509 1.33485 12.0837 1.33502H7.91675C7.54948 1.33502 7.25171 1.03725 7.25171 0.669983C7.25171 0.302714 7.54948 0.00494385 7.91675 0.00494385H12.0837Z"></path>
        <path d="M11.2992 10.75C10.8849 11.4675 9.96756 11.7133 9.25012 11.2991C8.53268 10.8849 8.28687 9.96747 8.70108 9.25003C9.45108 7.95099 12.0671 5.4199 12.5001 5.6699C12.9331 5.9199 12.0492 9.45099 11.2992 10.75Z"></path>
      </svg>
    `;
  
    function buildMenu(selected, btn, closeMenu) {
      // Reuse existing menu if present; remove extras if any
      const existingMenus = document.querySelectorAll('#' + IDS.menu);
      let menu = existingMenus[0] || null;
      if (existingMenus.length > 1) {
        for (let i = 1; i < existingMenus.length; i++) {
          try { existingMenus[i].remove(); } catch {}
        }
      }
      if (!menu) {
        menu = document.createElement('div');
        menu.id = IDS.menu;
        menu.className = 'tmx-hidden';
        menu.setAttribute('role', 'menu');
        menu.setAttribute('aria-label', 'Reasoning effort');
      } else {
        // Clear previous items to avoid duplication of entries
        menu.innerHTML = '';
      }
  
      const mkItem = (opt, on) => {
        const el = document.createElement('div');
        el.className = 'tmx-item';
        el.setAttribute('role', 'menuitemradio');
        el.setAttribute('data-value', opt);
        el.setAttribute('aria-selected', String(on));
        el.innerHTML = `<span>${opt}</span><span class="tmx-check">${on ? '✓' : ''}</span>`;
        el.addEventListener('pointerdown', (e) => {
          e.stopPropagation();
          menu.querySelectorAll('.tmx-item').forEach(i => {
            const active = i.getAttribute('data-value') === opt;
            i.setAttribute('aria-selected', String(active));
            i.querySelector('.tmx-check').textContent = active ? '✓' : '';
          });
          btn.querySelector('span.text-xs').textContent = opt;
          try { localStorage.setItem(KEY_SEL, opt); } catch {}
          // Guarantee close right after selection
          requestAnimationFrame(() => closeMenu());
        });
        return el;
      };
      OPTIONS.forEach(o => menu.appendChild(mkItem(o, o === selected)));
      return menu;
    }
  
    function positionMenu(menu, btn) {
      const r = btn.getBoundingClientRect();
      let top = r.bottom + 8;
      let left = r.left;
      const mh = menu.offsetHeight || 240;
      const mw = menu.offsetWidth || 224;
      const vw = window.innerWidth, vh = window.innerHeight;
      left = Math.min(Math.max(8, left), vw - mw - 8);
      if (top + mh > vh - 8) top = Math.max(8, r.top - 8 - mh);
      if (r.right + 8 > vw) left = Math.max(8, r.right - mw);
      Object.assign(menu.style, { top: `${top}px`, left: `${left}px` });
    }
  
    function mountEffort() {
      injectStyles();
      if (document.getElementById(IDS.wrap)) return;
  
      const thinkBtn = $('[data-element-id="toggle-thinking-button"]');
      const actions = $('[data-element-id="chat-input-actions"]');
      if (!thinkBtn && !actions) return;
  
      // First-run default persisted (Minimal)
      let selected = 'Minimal';
      try {
        const saved = localStorage.getItem(KEY_SEL);
        if (!saved) localStorage.setItem(KEY_SEL, selected);
        else selected = saved;
      } catch {}
  
      const wrap = document.createElement('span');
      wrap.id = IDS.wrap;
  
      const btn = document.createElement('button');
      btn.id = IDS.btn;
      btn.type = 'button';
      btn.className = reasonPillClasses;
      btn.setAttribute('aria-haspopup', 'menu');
      btn.setAttribute('aria-expanded', 'false');
      btn.setAttribute('title', 'Select reasoning effort (UI only)');
      btn.innerHTML = `${chatgptLightThinkingSVG}<span class="text-xs font-medium">${selected}</span>`;
  
      let open = false;
      let openingGuard = false;
      let menu; // defined after close/open functions
  
      const onOutsidePD = (e) => {
        if (!open || openingGuard) return;
        const path = e.composedPath ? e.composedPath() : [];
        if (path.includes(btn) || path.includes(menu)) return;
        closeMenu();
      };
      function openMenu() {
        $$('#' + IDS.menu).forEach(m => m !== menu && m.classList.add('tmx-hidden'));
        if (!menu.isConnected) document.body.appendChild(menu);
        openingGuard = true;
        menu.classList.remove('tmx-hidden');
        btn.setAttribute('aria-expanded', 'true');
        open = true;
        requestAnimationFrame(() => {
          positionMenu(menu, btn);
          setTimeout(() => { openingGuard = false; }, 0);
        });
        window.addEventListener('pointerdown', onOutsidePD, true);
      }
      function closeMenu() {
        if (!open) return;
        menu.classList.add('tmx-hidden');
        btn.setAttribute('aria-expanded', 'false');
        open = false;
        window.removeEventListener('pointerdown', onOutsidePD, true);
      }
  
      menu = buildMenu(selected, btn, closeMenu);
  
      btn.addEventListener('pointerdown', (e) => {
        e.stopPropagation();
        open ? closeMenu() : openMenu();
      });
      window.addEventListener('resize', () => { if (open) positionMenu(menu, btn); });
      window.addEventListener('scroll', () => { if (open) positionMenu(menu, btn); }, true);
  
      wrap.appendChild(btn);
      // Insert immediately after Think if present; otherwise prepend into actions left group
      if (thinkBtn && thinkBtn.parentElement) {
        thinkBtn.parentElement.insertBefore(wrap, thinkBtn.nextSibling);
      } else if (actions) {
        const leftGroup = actions.querySelector('.items-center.justify-start') || actions.firstElementChild || actions;
        leftGroup.insertBefore(wrap, leftGroup.firstChild);
      }
      // Ensure order: Effort pill first, then XML button
      try {
        const actionsRoot = actions || document.querySelector('[data-element-id="chat-input-actions"]');
        const leftGroup = actionsRoot?.querySelector('.items-center.justify-start') || thinkBtn?.parentElement;
        const xmlBtn = document.querySelector('[data-element-id="insert-code-button"]');
        if (leftGroup && xmlBtn && xmlBtn.parentElement === leftGroup) {
          if (wrap.nextSibling !== xmlBtn) {
            leftGroup.insertBefore(xmlBtn, wrap.nextSibling);
          }
        }
      } catch {}
      if (!menu.isConnected) document.body.appendChild(menu);
    }

    // Ensure Effort pill and XML button order relative to Think button (re-entrant safe)
    let __orderingRunning = false;
    let __orderingScheduled = false;
    function scheduleEnsureOrder() {
      if (__orderingScheduled) return;
      __orderingScheduled = true;
      requestAnimationFrame(() => {
        __orderingScheduled = false;
        ensureOrder();
      });
    }
    function ensureOrder() {
      if (__orderingRunning) return;
      __orderingRunning = true;
      try {
        const actionsRoot = $('[data-element-id="chat-input-actions"]');
        if (!actionsRoot) return;
        const leftGroup = actionsRoot.querySelector('.items-center.justify-start') || actionsRoot.firstElementChild || actionsRoot;
        const thinkBtn = actionsRoot.querySelector('[data-element-id="toggle-thinking-button"]');
        const wrap = document.getElementById(IDS.wrap);
        if (thinkBtn && wrap && leftGroup) {
          const desiredAfterThink = thinkBtn.nextElementSibling;
          if (desiredAfterThink !== wrap) {
            leftGroup.insertBefore(wrap, thinkBtn.nextElementSibling);
          }
        }
        const xmlBtn = actionsRoot.querySelector('[data-element-id="insert-code-button"]');
        if (wrap && xmlBtn && leftGroup) {
          const desiredAfterWrap = wrap.nextElementSibling;
          if (desiredAfterWrap !== xmlBtn) {
            leftGroup.insertBefore(xmlBtn, wrap.nextElementSibling);
          }
        }
      } catch {}
      finally { __orderingRunning = false; }
    }
  
    function unmountEffort() {
      document.getElementById(IDS.wrap)?.remove();
      document.getElementById(IDS.menu)?.classList.add('tmx-hidden');
    }
  
    // -------- event-driven visibility (no polling) with tiny scoped observers --------
    function syncEffortVisibility() {
      const show = shouldShowEffort();
      const mounted = !!document.getElementById(IDS.wrap);
      if (show && !mounted) {
        mountEffort();
        return;
      }
      if (!show && mounted) {
        unmountEffort();
      }
    }

    // Observe the model pill for label changes. Extremely cheap: one node, characterData + subtree.
    function observeModelLabel(modelBtn) {
      if (!modelBtn || modelBtn.__tmxLabelObserver) return;
      const obs = new MutationObserver(() => {
        // Any label change → re-evaluate once
        syncEffortVisibility();
      });
      obs.observe(modelBtn, { subtree: true, characterData: true, childList: true });
      modelBtn.__tmxLabelObserver = obs;
    }

    // Attach click hook (short-lived timeouts) and label observer
    function attachModelClickHook() {
      const modelBtn = findModelButton();
      if (!modelBtn) return;

      // Install one-time click hook to re-check shortly after selection
      if (!modelBtn.__tmxHooked) {
        modelBtn.__tmxHooked = true;
        modelBtn.addEventListener('pointerdown', () => {
          const attempt = () => syncEffortVisibility();
          setTimeout(attempt, 150);
          setTimeout(attempt, 350);
        });
      }

      // Observe label changes for the lifetime of this pill
      observeModelLabel(modelBtn);
    }

    // On initial page load or route change, the label might settle a few frames later.
    // Do a short rAF loop (max ~20 frames ≈ 330ms) to catch hydration once, then stop.
    function settleThenSync(maxFrames = 40) {
      let frames = 0;
      function step() {
        frames++;
        attachModelClickHook(); // ensures observer and click hook exist
        syncEffortVisibility(); // mount/unmount as needed
        scheduleEnsureOrder(); // keep after Think when components settle
        // If already visible for GPT‑5 or we’ve tried enough frames, stop
        if (document.getElementById(IDS.wrap) || frames >= maxFrames) return;
        requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    }

    // The composer actions container can be swapped on re-render; re-arm hooks on changes
    function observeComposerActions() {
      const actions = $('[data-element-id="chat-input-actions"]');
      if (!actions || actions.__tmxComposerObserver) return;
      const obs = new MutationObserver(() => {
        // Rewire hooks if the model button instance or label changed
        attachModelClickHook();
        settleThenSync(10);
        scheduleEnsureOrder();
      });
      obs.observe(actions, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
      actions.__tmxComposerObserver = obs;
    }

    // Edit-mode swaps the composer markup (adds an edit banner and toggles classes)
    function observeEditMode() {
      if (document.body.__tmxEditObserver) return;
      const editObs = new MutationObserver((mutations) => {
        for (const m of mutations) {
          if (m.type !== 'childList') continue;
          const nodes = [...m.addedNodes, ...m.removedNodes];
          for (const n of nodes) {
            if (n && n.nodeType === 1) {
              const el = /** @type {Element} */(n);
              if (el.matches?.('[data-element-id="edit-message-label"]') || el.querySelector?.('[data-element-id="edit-message-label"]')) {
                // When edit mode appears or disappears, re-sync after layout settles
                settleThenSync(20);
                return;
              }
            }
          }
        }
      });
      editObs.observe(document.body, { childList: true, subtree: true });
      document.body.__tmxEditObserver = editObs;
    }

    function onRouteChange() {
      // Give the composer a tick to render, then settle
      setTimeout(() => {
        observeComposerActions();
        observeEditMode();
        settleThenSync(20);
      }, 120);
    }
    window.addEventListener('hashchange', onRouteChange);
    window.addEventListener('popstate', onRouteChange);

    // Observe body for composer mount/unmount across SPA navigations
    if (!document.body.__tmxComposerBodyObs) {
      const bodyObs = new MutationObserver((mutations) => {
        for (const m of mutations) {
          if (m.type !== 'childList') continue;
          const nodes = [...m.addedNodes, ...m.removedNodes];
          for (const n of nodes) {
            if (n && n.nodeType === 1) {
              const el = /** @type {Element} */(n);
              if (el.matches?.('[data-element-id="chat-input-actions"]') || el.querySelector?.('[data-element-id="chat-input-actions"]')) {
                observeComposerActions();
                observeEditMode();
                settleThenSync(40);
                scheduleEnsureOrder();
                return;
              }
            }
          }
        }
      });
      bodyObs.observe(document.body, { childList: true, subtree: true });
      document.body.__tmxComposerBodyObs = bodyObs;
    }
  
  // -------- fetch wrapper (set reasoning.effort only when present) --------
  const OAI_URL = 'https://api.openai.com/v1/responses';
  const SUPPORTED_EFFORTS = ['minimal', 'low', 'medium', 'high', 'none'];

  function mapSelectedEffort() {
    try {
      const raw = (localStorage.getItem(KEY_SEL) || '').toLowerCase();
      // UI stores: 'Minimal' | 'Low' | 'Medium' | 'High'
      if (SUPPORTED_EFFORTS.includes(raw)) return raw;
      // handle capitalized values just in case
      const lower = raw.trim();
      if (SUPPORTED_EFFORTS.includes(lower)) return lower;
    } catch {}
    return null;
  }

  function isGpt5ModelName(name) {
    return !!name && String(name).toLowerCase().includes('gpt-5');
  }
  
  function isGpt51ModelName(name) {
    if (!name) return false;
    const normalized = String(name).toLowerCase().replace(/[^a-z0-9.]/g, '');
    return normalized.includes('gpt5.1') || normalized.includes('gpt51');
  }

  function installEffortWrapper() {
    if (window.fetch && window.fetch.__tmxEffortWrapped) return;
    const prevFetch = window.fetch;

    async function wrappedFetch(input, init) {
      try {
        const url = input instanceof Request ? input.url : String(input);
        const method = (init?.method || (input instanceof Request ? input.method : 'GET')).toUpperCase();
        if (!url.startsWith(OAI_URL) || method !== 'POST') {
          return prevFetch.apply(this, arguments);
        }

        // Read body text
        let body = init?.body;
        if (!body && input instanceof Request && method !== 'GET' && method !== 'HEAD') {
          try { body = await input.clone().text(); } catch {}
        }
        const text = typeof body === 'string' ? body : (body instanceof Blob ? await body.text() : null);
        if (!text) return prevFetch.apply(this, arguments);

        // Parse JSON payload
        let payload;
        try { payload = JSON.parse(text); } catch { return prevFetch.apply(this, arguments); }

        // Preconditions
        const selected = mapSelectedEffort();
        if (!selected) return prevFetch.apply(this, arguments);
        if (!isGpt5ModelName(payload?.model)) return prevFetch.apply(this, arguments);
        if (!payload || typeof payload !== 'object' || !payload.reasoning || typeof payload.reasoning !== 'object') {
          // Respect rule: do nothing if reasoning object is absent
          return prevFetch.apply(this, arguments);
        }

        const current = (payload.reasoning.effort || '').toLowerCase();
        
        // Map UI selection to API value based on model
        let targetEffort = selected;
        if (selected === 'minimal') {
          // GPT-5.1 uses 'none' instead of 'minimal'
          targetEffort = isGpt51ModelName(payload.model) ? 'none' : 'minimal';
        }
        
        if (current === targetEffort) {
          // No change needed
          return prevFetch.apply(this, arguments);
        }

        // Apply only the effort field, preserve everything else
        payload.reasoning.effort = targetEffort;

        // Rebuild request
        const newBody = JSON.stringify(payload);
        const newHeaders = new Headers(init?.headers || (input instanceof Request ? input.headers : undefined));
        newHeaders.set('content-type', 'application/json');
        newHeaders.delete('content-length');

        return prevFetch(url, {
          ...init,
          method,
          headers: newHeaders,
          body: newBody,
          credentials: init?.credentials ?? (input instanceof Request ? input.credentials : undefined),
          cache: init?.cache ?? (input instanceof Request ? input.cache : undefined),
          mode: init?.mode ?? (input instanceof Request ? input.mode : undefined),
          redirect: init?.redirect ?? (input instanceof Request ? input.redirect : undefined),
          referrer: init?.referrer ?? (input instanceof Request ? input.referrer : undefined),
          referrerPolicy: init?.referrerPolicy ?? (input instanceof Request ? input.referrerPolicy : undefined)
        });
      } catch {
        return prevFetch.apply(this, arguments);
      }
    }

    wrappedFetch.__tmxEffortWrapped = true;
    try { window.fetch = wrappedFetch; } catch {}
    try { globalThis.fetch = wrappedFetch; } catch {}
  }

  installEffortWrapper();
 
  // Initial boot
  setTimeout(() => {
    observeComposerActions();
    observeEditMode();
    settleThenSync(20);
  }, 120);
  })();
  