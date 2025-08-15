/* ============================================================================
 * TypingMind – Web Search Tool Injection (2025-08-15)
 * Injects OpenAI web_search_preview tool
 * for GPT‑5 models based on reasoning effort and user settings.
 * ========================================================================== */

(() => {
    'use strict';
    if (window.fetch && window.fetch.__oneStopWrapped) return;
  
    // ==============================
    // Main Configuration
    // ==============================
    // OpenAI Responses API endpoint that TypingMind uses. We intercept
    // requests to this URL in order to adjust the payload on the fly.
    const OAI_URL = 'https://api.openai.com/v1/responses';

    // ==============================
    // Model Detection
    // ==============================
    // Helper that recognizes GPT‑5 family models by name (case-insensitive).
    const isGpt5 = modelName => !!modelName && String(modelName).toLowerCase().includes('gpt-5');

    // ==============================
    // User Preferences (Context Size & Timezone)
    // ==============================
    // Stores the user's web-search context size and timezone between sessions.
    // Also defines which reasoning efforts are allowed by OpenAI for web search.
    const PREF_KEY = '1stop-web-search-context';
    const VALID_CONTEXT_SIZES = ['off', 'low', 'medium', 'high'];
    const ALLOWED_REASONING_EFFORTS = ['low', 'medium', 'high'];
    const TIMEZONE_PREF_KEY = '1stop-web-search-timezone';
    const TIMEZONE_CACHE_KEY = '1stop-web-search-tz-cache-v1';
    const TIMEZONE_API_URL = 'https://timeapi.io/api/timezone/availabletimezones';
    
    // Retrieves the saved context size, defaulting to 'medium' when unset.
    function getWebSearchPref() {
      const v = (localStorage.getItem(PREF_KEY) || 'medium').toLowerCase();
      return VALID_CONTEXT_SIZES.includes(v) ? v : 'medium';
    }
    
    // Persists a valid context-size selection.
    function setWebSearchPref(value) {
      if (!VALID_CONTEXT_SIZES.includes(value)) return;
      try { localStorage.setItem(PREF_KEY, value); } catch {}
    }

    // Reads and normalizes the reasoning effort from the outgoing request payload.
    function getReasoningEffort(payload) {
      return (payload?.reasoning?.effort || '').toLowerCase();
    }

    // Normalizes the UI choice to a value OpenAI accepts ('low'|'medium'|'high').
    function getDesiredContextSizeFromPref(pref) {
      return pref === 'low' || pref === 'medium' || pref === 'high' ? pref : 'medium';
    }

    // ==============================
    // Timezone Helpers
    // ==============================
    // Detects the user's timezone, lets them override it, and fetches the full
    // list of IANA timezones (cached for 7 days) to populate the dropdown.
    function getBrowserTimeZone() {
      try { return Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/New_York'; } catch { return 'America/New_York'; }
    }
    function getTimeZonePref() {
      return localStorage.getItem(TIMEZONE_PREF_KEY) || getBrowserTimeZone();
    }
    function setTimeZonePref(tz) {
      if (typeof tz === 'string' && tz.length > 0 && tz.length < 128) {
        try { localStorage.setItem(TIMEZONE_PREF_KEY, tz); } catch {}
      }
    }
    // Retrieves available IANA timezones with a 7‑day local cache; falls back to the browser tz.
    async function fetchAvailableTimezones() {
      try {
        const cached = JSON.parse(localStorage.getItem(TIMEZONE_CACHE_KEY) || 'null');
        if (cached && Array.isArray(cached.list) && Date.now() - cached.ts < 7 * 24 * 60 * 60 * 1000) {
          return cached.list;
        }
      } catch {}
      try {
        const resp = await fetch(TIMEZONE_API_URL, { method: 'GET', mode: 'cors' });
        if (!resp.ok) throw new Error('tz fetch failed');
        const list = await resp.json();
        if (Array.isArray(list) && list.length) {
          try { localStorage.setItem(TIMEZONE_CACHE_KEY, JSON.stringify({ ts: Date.now(), list })); } catch {}
          return list;
        }
      } catch {}
      // No network or empty list: provide at least the browser timezone.
      return [getBrowserTimeZone()];
    }

    // ==============================
    // Payload Builder
    // ==============================
    // Purpose: keep the web_search_preview tool in sync with user settings and
    // OpenAI constraints. Adds or removes the tool per request as needed.
    function ensureWebTool(payload) {
      if (!payload || !isGpt5(payload.model)) return { payload, modified: false };
      
      // Ensure a tools array exists to work with
      if (!Array.isArray(payload.tools)) payload.tools = [];
      
      // Only permit web search for reasoning efforts OpenAI supports
      const reasoningEffort = getReasoningEffort(payload);
      const isValidEffort = ALLOWED_REASONING_EFFORTS.includes(reasoningEffort);
      
      // Apply current user preferences
      const pref = getWebSearchPref(); // 'off' | 'low' | 'medium' | 'high'
      const enabledByUser = pref !== 'off';
      const desiredSize = getDesiredContextSizeFromPref(pref);
      const tz = getTimeZonePref();
      
      // Locate an existing web_search_preview tool, including wrapped or named variants
      const webSearchIndex = payload.tools.findIndex(t => t && (
        t.type === 'web_search_preview' ||
        t.name === 'web_search_preview' ||
        (t.tool && (t.tool.type === 'web_search_preview' || t.tool.name === 'web_search_preview'))
      ));
      const hasWebSearch = webSearchIndex >= 0;
      
      // Determine whether the request should include the tool at all
      const shouldInclude = enabledByUser && isValidEffort;
      
      // If it shouldn't be present, remove it
      // Note: We only remove the web_search_preview entry and leave the
      // rest of payload.tools untouched. We never clear or recreate the array.
      if (!shouldInclude && hasWebSearch) {
        payload.tools.splice(webSearchIndex, 1);
        return { payload, modified: true };
      }
      
      // Otherwise, add or update the tool so it matches the user's selection
      if (shouldInclude) {
        if (hasWebSearch) {
          const before = JSON.stringify(payload.tools[webSearchIndex]);
          const existing = payload.tools[webSearchIndex];
          const target = (existing && existing.tool && typeof existing.tool === 'object') ? existing.tool : existing;
          if (target.type !== 'web_search_preview') target.type = 'web_search_preview';
          if (!target.user_location || target.user_location.type !== 'approximate' || target.user_location.timezone !== tz) {
            target.user_location = { type: 'approximate', timezone: tz };
          }
          if (target.search_context_size !== desiredSize) {
            target.search_context_size = desiredSize;
          }
          const after = JSON.stringify(payload.tools[webSearchIndex]);
          if (before !== after) return { payload, modified: true };
        } else {
          payload.tools.push({
            type: 'web_search_preview',
            user_location: { type: 'approximate', timezone: tz },
            search_context_size: desiredSize
          });
          return { payload, modified: true };
        }
      }
      
      return { payload, modified: false };
    }

    // ==============================
    // Settings UI (Global Settings Page)
    // ==============================
    // Inserts a compact settings block under “Reasoning effort” so users can
    // enable/disable web search, choose context size, and set their timezone.
    function findModelsTabContent() {
      return document.querySelector('[data-element-id="models-tab-content"]');
    }
    function findReasoningSection(container) {
      if (!container) return null;
      const sections = Array.from(container.querySelectorAll('div'));
      for (const sec of sections) {
        const header = sec.querySelector('.antialiased.font-semibold');
        const select = sec.querySelector('select');
        if (!header || !select) continue;
        const text = header.textContent || '';
        const hasEffortLabel = /Reasoning effort/i.test(text);
        const hasEffortOptions = Array.from(select.options || [])
          .some(o => /^(none|minimal|low|medium|high)$/i.test((o.value || '').toLowerCase()));
        if (hasEffortLabel || hasEffortOptions) return sec;
      }
      return null;
    }
    // Creates the settings block once and wires up change handlers.
    function ensureWebSearchSettingsSection() {
      const container = findModelsTabContent();
      const reasonSec = findReasoningSection(container);
      if (!reasonSec || !container) return null;
      const existing = container.querySelector('[data-1stop-websearch-settings]');
      if (existing) return existing; // already inserted
      
      const wrap = document.createElement('div');
      wrap.setAttribute('data-1stop-websearch-settings', '1');
      
      // Header: title + reset button
      const header = document.createElement('div');
      header.className = 'antialiased font-semibold flex items-center gap-x-2 sm:flex-nowrap flex-wrap';
      const title = document.createElement('span');
      title.textContent = 'Web search (GPT-5 only)';
      const reset = document.createElement('button');
      reset.type = 'button';
      reset.className = 'text-blue-600 hover:underline dark:text-blue-500 font-semibold text-xs';
      reset.textContent = '(Reset to default)';
      header.appendChild(title);
      header.appendChild(reset);
      wrap.appendChild(header);
      
      // Friendly description of the available context sizes
      const desc = document.createElement('div');
      desc.className = 'text-xs text-slate-600 dark:text-slate-400 my-1';
      desc.innerHTML = 'Enable OpenAI web search and choose context size.<br/>'
        + 'high: Most comprehensive context, slower response.<br/>'
        + 'medium (default): Balanced context and latency.<br/>'
        + 'low: Least context, fastest response, but potentially lower answer quality.';
      wrap.appendChild(desc);
      
      // Context-size selector (Off/Low/Medium/High)
      const select = document.createElement('select');
      select.setAttribute('data-element-id', '1stop-websearch-context-select');
      select.className = 'block w-full rounded-lg border-0 py-2 pl-3 pr-10 text-slate-900 dark:text-white dark:bg-zinc-800 ring-1 ring-inset ring-slate-200 dark:ring-white/20 dark:focus:ring-blue-500 focus:ring-2 focus:ring-blue-600 sm:text-sm sm:leading-6';
      select.innerHTML = [
        '<option value="off">Off</option>',
        '<option value="low">Low</option>',
        '<option value="medium">Medium (default)</option>',
        '<option value="high">High</option>'
      ].join('');
      select.value = getWebSearchPref();
      select.addEventListener('change', () => setWebSearchPref(select.value));
      reset.addEventListener('click', () => {
        setWebSearchPref('medium');
        select.value = 'medium';
      });
      wrap.appendChild(select);
      
      // Timezone label
      const tzHeader = document.createElement('div');
      tzHeader.className = 'antialiased font-semibold flex items-center gap-x-2 sm:flex-nowrap flex-wrap mt-3';
      tzHeader.appendChild(document.createTextNode('Timezone (IANA)'));
      wrap.appendChild(tzHeader);
      
      // Timezone dropdown populated from API (with caching)
      const tzSelect = document.createElement('select');
      tzSelect.setAttribute('data-element-id', '1stop-websearch-timezone-select');
      tzSelect.className = 'block w-full rounded-lg border-0 py-2 pl-3 pr-10 text-slate-900 dark:text-white dark:bg-zinc-800 ring-1 ring-inset ring-slate-200 dark:ring-white/20 dark:focus:ring-blue-500 focus:ring-2 focus:ring-blue-600 sm:text-sm sm:leading-6';
      tzSelect.innerHTML = '<option disabled selected>Loading timezones…</option>';
      wrap.appendChild(tzSelect);
      
      (async () => {
        const list = await fetchAvailableTimezones();
        const current = getTimeZonePref();
        tzSelect.innerHTML = '';
        const makeOption = (tz) => {
          const opt = document.createElement('option');
          opt.value = tz;
          opt.textContent = tz;
          return opt;
        };
        // Put current first
        tzSelect.appendChild(makeOption(current));
        if (Array.isArray(list) && list.length) {
          for (const tz of list) {
            if (tz && tz !== current) tzSelect.appendChild(makeOption(tz));
          }
        }
        tzSelect.value = current;
      })().catch(() => {
        tzSelect.innerHTML = '';
        const opt = document.createElement('option');
        const current = getTimeZonePref();
        opt.value = current;
        opt.textContent = current;
        tzSelect.appendChild(opt);
        tzSelect.value = current;
      });
      tzSelect.addEventListener('change', () => setTimeZonePref(tzSelect.value));
      
      // Insert after the Reasoning effort section
      if (reasonSec.nextSibling) {
        reasonSec.parentNode.insertBefore(wrap, reasonSec.nextSibling);
      } else {
        reasonSec.parentNode.appendChild(wrap);
      }
      return wrap;
    }

    // ==============================
    // Fetch Wrapper (OpenAI Responses API)
    // ==============================
    // Intercepts POST requests to OpenAI and conditionally rewrites the body
    // to include or remove the web_search_preview tool according to settings
    // and OpenAI's reasoning effort rules.
    const origFetch = window.fetch;
  
    async function wrappedFetch(input, init) {
        const url = input instanceof Request ? input.url : String(input);
        const method = (init?.method || (input instanceof Request ? input.method : 'GET')).toUpperCase();
  
      // Only intercept Responses API POSTs; everything else passes through
      if (!url.startsWith(OAI_URL) || method !== 'POST') {
        return origFetch.apply(this, arguments);
      }

          let body = init?.body;
          if (!body && input instanceof Request && method !== 'GET' && method !== 'HEAD') {
        try { body = await input.clone().text(); } catch {}
          }
      const text = typeof body === 'string' ? body : (body instanceof Blob ? await body.text() : null);
      if (!text) return origFetch.apply(this, arguments);
  
            try {
              const payload = JSON.parse(text);
        const { payload: updatedPayload, modified } = ensureWebTool(payload);
        if (!modified) return origFetch.apply(this, arguments);

        const newBody = JSON.stringify(updatedPayload);
                const newHeaders = new Headers(init?.headers || (input instanceof Request ? input.headers : undefined));
                newHeaders.set('content-type', 'application/json');
                newHeaders.delete('content-length');
  
        return origFetch(url, {
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
        // Non-JSON request bodies pass through unchanged
        return origFetch.apply(this, arguments);
      }
    }

    // ==============================
    // Bootstrap & Observers
    // ==============================
    // Marks fetch as wrapped, installs it globally, cleans up a legacy key,
    // and keeps the settings block present during SPA navigations without polling.
    wrappedFetch.__oneStopWrapped = true;
    try { window.fetch = wrappedFetch; } catch {}
    try { globalThis.fetch = wrappedFetch; } catch {}
    try { localStorage.removeItem('1stop-web-search-enabled'); } catch {}
  
    // Debounced ensure function to avoid repeated DOM work during choppy renders
    let __ensureScheduled = false;
    function scheduleEnsure() {
      if (__ensureScheduled) return;
      __ensureScheduled = true;
      requestAnimationFrame(() => {
        __ensureScheduled = false;
        try { ensureWebSearchSettingsSection(); } catch {}
      });
    }

    // Observes DOM changes and reinserts the settings UI when TypingMind re-renders
    addEventListener('load', () => {
      scheduleEnsure();
      const bodyObserver = new MutationObserver((mutations) => {
        for (const m of mutations) {
          if (m.type !== 'childList') continue;
          const nodes = [...m.addedNodes, ...m.removedNodes];
          for (const n of nodes) {
            if (n && n.nodeType === 1) {
              const relevant = n.matches?.('[data-element-id="models-tab-content"], [data-1stop-websearch-settings]') ||
                               n.querySelector?.('[data-element-id="models-tab-content"], [data-1stop-websearch-settings]');
              if (relevant) { scheduleEnsure(); break; }
            }
          }
        }
      });
      bodyObserver.observe(document.body, { childList: true, subtree: true });
    });

    // Re-check on SPA hash navigation (e.g., moving to #models)
    addEventListener('hashchange', () => { scheduleEnsure(); });

    // Re-check when navigating browser history (back/forward)
    addEventListener('popstate', () => { scheduleEnsure(); });

    // Re-check shortly after the user clicks the “Global settings” tab/button
    document.addEventListener('click', (e) => {
      const btn = e.target && (e.target.closest ? e.target.closest('button') : null);
      if (btn && /Global settings/i.test(btn.textContent || '')) scheduleEnsure();
    }, true);
  })();
  