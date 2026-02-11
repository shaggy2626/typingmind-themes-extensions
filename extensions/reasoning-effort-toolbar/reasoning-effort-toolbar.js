// TypingMind Reasoning Effort Toolbar v7
// Universal lightbulb hijack: when thinking is ON on ANY model, clicking the
// lightbulb shows an effort menu instead of toggling off.
// Custom models (fetch-intercepted, no "Disable thinking"):
//   claude-opus-4-6:       Low/Medium/High/Max  (adaptive thinking + output_config.effort)
//   gemini-3-pro-preview:  Low/High             (thinkingConfig.thinkingLevel)
//   gemini-3-flash-preview: Minimal/Low/Medium/High (thinkingConfig.thinkingLevel)
//   gpt-5.2:               None/Low/Medium/High/Xhigh (reasoning.effort)
// All other models (incl. GPT-5, GPT-5.1): TM default options + "Disable thinking"
// GPT-4.1/4o: strips invalid reasoning params
// Version: 7.0

(() => {
  'use strict';

  if (window.__tmxReasoningEffortV2) return;
  window.__tmxReasoningEffortV2 = true;

  // ============ CONSTANTS ============
  const SEL = {
    actions: '[data-element-id="chat-input-actions"]',
    thinkBtn: '[data-element-id="toggle-thinking-button"]',
    scopeTarget: '[data-element-id="chat-space-end-part"]',
  };

  const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';
  const OAI_URLS = ['https://api.openai.com/v1/responses', 'https://api.openai.com/v1/chat/completions'];
  const GEMINI_URL = 'https://generativelanguage.googleapis.com/';
  const TM_KEY = 'TM_useModelsSettings';
  const TM_THINKING_KEY = 'TM_useThinkingOptions';
  const OUR_KEY = 'tmx_effort_v7';
  const LOG = '[ReasoningEffort v7]';

  // ============ HELPERS ============
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

  const getModelButton = () => {
    const actions = $(SEL.actions);
    if (!actions) return null;
    let el = actions.parentElement;
    for (let i = 0; i < 5 && el; i++) {
      const btn = $$('button', el).find(b => /gpt[-\s]?\d|claude|gemini/i.test(b.textContent || ''));
      if (btn) return btn;
      el = el.parentElement;
    }
    return null;
  };

  // Returns custom model ID for models we intercept, or null
  const getCustomModelId = () => {
    const btn = getModelButton();
    if (!btn) return null;
    const t = btn.textContent.toLowerCase().trim();
    if (t.includes('codex')) return null;
    if (t.includes('gemini') && t.includes('3') && t.includes('flash')) return 'gemini-3-flash-preview';
    if (t.includes('gemini') && t.includes('3') && t.includes('pro') && !t.includes('image')) return 'gemini-3-pro-preview';
    if (t.includes('claude') && t.includes('opus') && t.includes('4.6')) return 'claude-opus-4-6';
    if (t.includes('5.2') && !t.includes('codex') && !t.includes('chat')) return 'gpt-5.2';
    return null;
  };

  // Returns a storage key for ANY model (custom ID or cleaned button text)
  const getModelKey = () => {
    const custom = getCustomModelId();
    if (custom) return custom;
    const btn = getModelButton();
    if (!btn) return null;
    return btn.textContent.trim().toLowerCase().replace(/[^a-z0-9.]+/g, '-').replace(/-+/g, '-');
  };

  const isThinkingOn = () => $(SEL.thinkBtn)?.getAttribute('aria-pressed') === 'true';

  // ============ STORAGE ============
  const loadStore = () => { try { return JSON.parse(localStorage.getItem(OUR_KEY) || '{}'); } catch { return {}; } };

  const getEffort = (key) => {
    const stored = loadStore()[key];
    if (!stored) return 'High';
    // Title-case each word so "extra high" → "Extra High"
    return stored.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  const saveEffort = (label) => {
    const normalized = label.toLowerCase().replace(' ', '_');
    const customId = getCustomModelId();

    // Save to our own storage
    try {
      const data = loadStore();
      data[currentModelKey] = label.toLowerCase();
      localStorage.setItem(OUR_KEY, JSON.stringify(data));
    } catch {}

    // Gemini 3 Pro/Flash: TM reads TM_useThinkingOptions for thinkingConfig.thinkingLevel
    try {
      const isGemini3 = customId === 'gemini-3-pro-preview' || customId === 'gemini-3-flash-preview';
      if (isGemini3) {
        const thinking = JSON.parse(localStorage.getItem(TM_THINKING_KEY) || '{}');
        thinking.enabled = true;
        thinking.reasoningEffort = normalized;
        localStorage.setItem(TM_THINKING_KEY, JSON.stringify(thinking));
      }
    } catch {}

    // Write to TM's per-model storage
    try {
      const settings = JSON.parse(localStorage.getItem(TM_KEY) || '{}');
      if (customId && settings[customId]?.modelParameters) {
        settings[customId].modelParameters.reasoningEffort = normalized;
        localStorage.setItem(TM_KEY, JSON.stringify(settings));
        return;
      }
      for (const key of Object.keys(settings)) {
        if (settings[key]?.modelParameters) {
          settings[key].modelParameters.reasoningEffort = normalized;
          localStorage.setItem(TM_KEY, JSON.stringify(settings));
          break;
        }
      }
    } catch {}
  };

  // Session state
  let currentEffort = 'High';
  let currentModelKey = null;

  const syncEffort = () => {
    const key = getModelKey();
    if (key && key !== currentModelKey) {
      currentModelKey = key;
      currentEffort = getEffort(key);
    }
  };

  // ============ SVG ICONS (cloned from TM's native menu) ============
  const chevron = `<svg class="-my-[8px] first:mt-0 last:mb-0" width="12px" height="12px" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg"><g fill="none" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" stroke="currentColor"><polyline points="2.75 11.5 9 5.25 15.25 11.5"></polyline></g></svg>`;
  const bolt = `<svg height="18px" width="18px" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg"><g fill="currentColor"><path d="M7.25,16.25l2-7H4.466c-.348,0-.589-.346-.469-.672L6.38,2.078c.072-.197,.26-.328,.469-.328h4.17c.352,0,.593,.353,.466,.681l-1.485,3.819h3.75c.412,0,.647,.47,.4,.8l-6.9,9.2Z" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"></path></g></svg>`;
  const sparkle = `<svg width="18px" height="18px" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg"><g fill="currentColor"><path d="M2.342,4.974l1.263,.421,.421,1.263c.068,.204,.26,.342,.475,.342s.406-.138,.475-.342l.421-1.263,1.263-.421c.204-.068,.342-.259,.342-.474s-.138-.406-.342-.474l-1.263-.421-.421-1.263c-.137-.408-.812-.408-.949,0l-.421,1.263-1.263,.421c-.204,.068-.342,.259-.342,.474s.138,.406,.342,.474Z"></path><path d="M15.658,13.026l-1.263-.421-.421-1.263c-.137-.408-.812-.408-.949,0l-.421,1.263-1.263,.421c-.204,.068-.342,.259-.342,.474s.138,.406,.342,.474l1.263,.421,.421,1.263c.068,.204,.26,.342,.475,.342s.406-.138,.475-.342l.421-1.263,1.263-.421c.204-.068,.342-.259,.342-.474s-.138-.406-.342-.474Z"></path><path d="M9.525,11.303l-2.026-.802-.802-2.027c-.227-.572-1.168-.572-1.395,0l-.802,2.027-2.026,.802c-.286,.113-.475,.39-.475,.697s.188,.584,.475,.697l2.026,.802,.802,2.027c.113,.286,.39,.474,.697,.474s.584-.188,.697-.474l.802-2.027,2.026-.802c.286-.113,.475-.39,.475-.697s-.188-.584-.475-.697Z"></path><path d="M15.525,5.303l-2.026-.802-.802-2.027c-.227-.572-1.168-.572-1.395,0l-.802,2.027-2.026,.802c-.286,.113-.475,.39-.475,.697s.188,.584,.475,.697l2.026,.802,.802,2.027c.113,.286,.39,.474,.697,.474s.584-.188,.697-.474l.802-2.027,2.026-.802c.286-.113,.475-.39,.475-.697s-.188-.584-.475-.697Z"></path></g></svg>`;
  const stopCircle = `<svg width="18px" height="18px" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="9" cy="9" r="7" stroke="currentColor" stroke-width="1.5"/><line x1="4" y1="4" x2="14" y2="14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`;
  const minus = `<svg width="18px" height="18px" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg"><line x1="4" y1="9" x2="14" y2="9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`;

  const chev = (n) => `<span class="flex flex-col items-center w-[18px]">${chevron.repeat(n)}</span>`;

  // Menu item sets per custom model
  const OPUS_ITEMS = [
    { label: 'Low',    icon: chev(1) },
    { label: 'Medium', icon: chev(2) },
    { label: 'High',   icon: chev(3) },
    { label: 'Max',    icon: bolt },
  ];
  const GEMINI_PRO_ITEMS = [
    { label: 'Low',  icon: chev(1) },
    { label: 'High', icon: chev(3) },
  ];
  const GEMINI_FLASH_ITEMS = [
    { label: 'Minimal', icon: minus },
    { label: 'Low',     icon: chev(1) },
    { label: 'Medium',  icon: chev(2) },
    { label: 'High',    icon: chev(3) },
  ];
  const GPT52_ITEMS = [
    { label: 'None',   icon: minus },
    { label: 'Low',    icon: chev(1) },
    { label: 'Medium', icon: chev(2) },
    { label: 'High',   icon: chev(3) },
    { label: 'Xhigh',  icon: bolt },
  ];
  const GENERIC_ITEMS = [
    { label: 'Low',        icon: chev(1) },
    { label: 'Medium',     icon: chev(2) },
    { label: 'High',       icon: chev(3) },
    { label: 'Extra High', icon: bolt },
    { label: 'Auto',       icon: sparkle },
  ];

  // Map custom model IDs to their menu item sets
  const CUSTOM_ITEMS = {
    'claude-opus-4-6':       OPUS_ITEMS,
    'gemini-3-pro-preview':  GEMINI_PRO_ITEMS,
    'gemini-3-flash-preview': GEMINI_FLASH_ITEMS,
    'gpt-5.2':               GPT52_ITEMS,
  };

  // TM Tailwind classes
  const CLS = {
    menu:     'z-[70] rounded-xl bg-white dark:bg-[--main-dark-popup-color] shadow-lg ring-1 ring-slate-200 dark:ring-white/[15%] p-2 focus:outline-none',
    header:   'px-2 py-1.5 mb-1',
    headerTx: 'font-semibold text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wide',
    item:     'cursor-default group flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm text-slate-900 dark:text-white hover:bg-slate-900/20 dark:hover:bg-white/20',
    selected: 'cursor-default group flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm text-green-600 dark:text-green-400 hover:bg-slate-900/20 dark:hover:bg-white/20',
    divider:  'my-1 border-t border-slate-200 dark:border-white/10',
    disable:  'cursor-default group flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm text-red-500 dark:text-red-400 hover:bg-slate-900/20 dark:hover:bg-white/20',
  };

  // ============ TM NATIVE MENU MUTATION (initial enable) ============
  const mutateEffortMenu = (menuNode) => {
    const customId = getCustomModelId();
    if (!customId) return;
    if (!menuNode.textContent?.includes('Reasoning Effort')) return;
    if (menuNode.dataset.tmxMutated) return;
    menuNode.dataset.tmxMutated = 'true';

    menuNode.querySelectorAll('[role="menuitem"]').forEach(item => {
      const span = item.querySelector('span:last-child');
      if (!span) return;
      const label = span.textContent.trim();

      if (customId === 'claude-opus-4-6') {
        if (label === 'Auto') { item.remove(); return; }
        if (label === 'Extra High') span.textContent = 'Max';
      } else if (customId === 'gemini-3-pro-preview') {
        if (label === 'Medium' || label === 'Extra High' || label === 'Auto') { item.remove(); return; }
      } else if (customId === 'gemini-3-flash-preview') {
        if (label === 'Extra High' || label === 'Auto') { item.remove(); return; }
      } else if (customId === 'gpt-5.2') {
        if (label === 'Auto') { item.remove(); return; }
        if (label === 'Extra High') span.textContent = 'Xhigh';
      }

      const mapped = (customId === 'claude-opus-4-6' && label === 'Extra High') ? 'Max'
        : (customId === 'gpt-5.2' && label === 'Extra High') ? 'Xhigh'
        : label;
      item.addEventListener('click', () => {
        currentEffort = mapped;
        saveEffort(mapped);
        console.log(`${LOG} Selected: ${mapped}`);
      }, true);
    });
  };

  // ============ LIGHTBULB HIJACK (universal) ============
  let menuEl = null;
  let menuOpen = false;
  let bypass = false;
  let attachedBtn = null;

  const buildMenu = () => {
    if (menuEl) menuEl.remove();
    const customId = getCustomModelId();
    const items = CUSTOM_ITEMS[customId] || GENERIC_ITEMS;
    const alwaysThinking = !!customId; // all custom models have no disable option

    menuEl = document.createElement('div');
    menuEl.className = CLS.menu;
    menuEl.style.cssText = 'position:fixed;z-index:2147483000;';

    // Header
    const hdr = document.createElement('div');
    hdr.className = CLS.header;
    hdr.innerHTML = `<span class="${CLS.headerTx}">Reasoning Effort</span>`;
    menuEl.appendChild(hdr);

    // Effort items
    items.forEach(({ label, icon }) => {
      const btn = document.createElement('button');
      btn.className = label === currentEffort ? CLS.selected : CLS.item;
      btn.innerHTML = `${icon}<span>${label}</span>`;
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        currentEffort = label;
        saveEffort(label);
        console.log(`${LOG} Selected: ${label}`);
        closeMenu();
      });
      menuEl.appendChild(btn);
    });

    // "Disable thinking" only for non-custom models
    if (!alwaysThinking) {
      const div = document.createElement('div');
      div.className = CLS.divider;
      menuEl.appendChild(div);

      const dis = document.createElement('button');
      dis.className = CLS.disable;
      dis.innerHTML = `${stopCircle}<span>Disable thinking</span>`;
      dis.addEventListener('click', (e) => {
        e.stopPropagation();
        closeMenu();
        bypass = true;
        $(SEL.thinkBtn)?.click();
      });
      menuEl.appendChild(dis);
    }

    document.body.appendChild(menuEl);
  };

  const positionMenu = (anchor) => {
    if (!menuEl) return;
    const r = anchor.getBoundingClientRect();
    const mh = menuEl.offsetHeight || 220, mw = menuEl.offsetWidth || 180;
    let top = r.top - mh - 6;
    if (top < 10) top = r.bottom + 6;
    let left = r.left;
    if (left + mw > window.innerWidth - 10) left = window.innerWidth - mw - 10;
    menuEl.style.top = `${top}px`;
    menuEl.style.left = `${left}px`;
  };

  const openMenu = (anchor) => {
    syncEffort();
    buildMenu();
    positionMenu(anchor);
    menuOpen = true;
    setTimeout(() => document.addEventListener('click', onOutsideClick, true), 0);
  };

  const closeMenu = () => {
    if (menuEl) { menuEl.remove(); menuEl = null; }
    menuOpen = false;
    document.removeEventListener('click', onOutsideClick, true);
  };

  const onOutsideClick = (e) => {
    const tb = $(SEL.thinkBtn);
    if (menuEl && !menuEl.contains(e.target) && (!tb || !tb.contains(e.target))) closeMenu();
  };

  // Click handler on TM's lightbulb (capture phase)
  const onThinkClick = (e) => {
    if (bypass) { bypass = false; return; }
    if (!isThinkingOn()) return;
    e.stopPropagation();
    e.preventDefault();
    e.stopImmediatePropagation();
    const tb = $(SEL.thinkBtn);
    menuOpen ? closeMenu() : openMenu(tb);
  };

  const attachIntercept = () => {
    const btn = $(SEL.thinkBtn);
    if (!btn || btn === attachedBtn) return;
    detachIntercept();
    btn.addEventListener('click', onThinkClick, true);
    // Remove TM's native tooltip on the lightbulb
    btn.removeAttribute('data-tooltip-content');
    btn.removeAttribute('data-tooltip-id');
    btn.removeAttribute('title');
    attachedBtn = btn;
  };

  const detachIntercept = () => {
    if (attachedBtn) {
      attachedBtn.removeEventListener('click', onThinkClick, true);
      attachedBtn = null;
    }
    closeMenu();
  };

  // ============ SYNC ============
  const sync = () => {
    syncEffort();
    attachIntercept();
  };

  // ============ OBSERVERS ============
  let debounce = null;
  let scopedObs = null;
  let scopedEl = null;

  const debouncedSync = () => { clearTimeout(debounce); debounce = setTimeout(sync, 50); };

  const attachScoped = () => {
    const el = $(SEL.scopeTarget);
    if (!el || el === scopedEl) return;
    if (scopedObs) scopedObs.disconnect();
    scopedEl = el;
    scopedObs = new MutationObserver(() => debouncedSync());
    scopedObs.observe(el, { childList: true, subtree: true, characterData: true });
  };

  const startObservers = () => {
    new MutationObserver((muts) => {
      for (const m of muts) {
        if (m.type !== 'childList') continue;
        for (const node of m.addedNodes) {
          if (node.nodeType !== 1) continue;
          if (node.getAttribute?.('role') === 'menu') mutateEffortMenu(node);
          const nested = node.querySelector?.('[role="menu"]');
          if (nested) mutateEffortMenu(nested);
        }
      }
      attachScoped();
      debouncedSync();
    }).observe(document.body, { childList: true });

    attachScoped();
  };

  // ============ FETCH WRAPPER ============
  const getApiModelId = (name) => {
    if (!name) return null;
    const n = name.toLowerCase();
    if (n.includes('codex')) return null;
    if ((n.includes('claude') && n.includes('opus') && n.includes('4') && n.includes('6')) || n === 'claude-opus-4-6') return 'claude-opus-4-6';
    if ((n.includes('gpt-5.2') || n.includes('gpt5.2')) && !n.includes('chat')) return 'gpt-5.2';
    return null;
  };

  const shouldStripReasoning = (name) => {
    if (!name) return false;
    const n = String(name).toLowerCase();
    return n.includes('gpt-4.1') || n.includes('gpt4.1') || n.includes('gpt-4o') || n.includes('gpt4o');
  };

  const patchBody = (init, payload) => {
    const h = new Headers(init?.headers);
    h.set('content-type', 'application/json');
    return { ...init, body: JSON.stringify(payload), headers: h };
  };

  const handleAnthropic = (p) => {
    if (getApiModelId(p?.model) !== 'claude-opus-4-6') return null;
    if (p.thinking) p.thinking = { type: 'adaptive' };
    if (!p.output_config || typeof p.output_config !== 'object') p.output_config = {};
    p.output_config.effort = currentEffort.toLowerCase();
    console.log(`${LOG} Anthropic: thinking→adaptive, effort→${currentEffort.toLowerCase()}`);
    return p;
  };

  const handleGemini = (url, p) => {
    const isFlash = url.includes('gemini-3-flash');
    const isPro = url.includes('gemini-3-pro') && !url.includes('image');
    if (!isFlash && !isPro) return null;
    if (!p.generationConfig || typeof p.generationConfig !== 'object') p.generationConfig = {};
    if (!p.generationConfig.thinkingConfig || typeof p.generationConfig.thinkingConfig !== 'object') p.generationConfig.thinkingConfig = {};
    delete p.generationConfig.thinkingConfig.thinkingBudget;
    p.generationConfig.thinkingConfig.thinkingLevel = currentEffort.toLowerCase();
    console.log(`${LOG} Gemini: thinkingLevel→${currentEffort.toLowerCase()}`);
    return p;
  };

  const handleOpenAI = (p) => {
    if (shouldStripReasoning(p?.model)) {
      let mod = false;
      for (const k of ['reasoning_effort', 'reasoningEffort', 'reasoning']) {
        if (Object.prototype.hasOwnProperty.call(p, k)) { delete p[k]; mod = true; }
      }
      return mod ? p : null;
    }
    const id = getApiModelId(p?.model);
    if (id !== 'gpt-5.2' || !p?.reasoning) return null;
    p.reasoning.effort = currentEffort.toLowerCase();
    console.log(`${LOG} OpenAI: effort→${currentEffort.toLowerCase()} for ${id}`);
    return p;
  };

  const installFetch = () => {
    if (window.fetch.__tmxEffort) return;
    const orig = window.fetch;

    window.fetch = async function (input, init) {
      try {
        const url = typeof input === 'string' ? input : input?.url;
        if ((init?.method || 'GET').toUpperCase() !== 'POST') return orig.apply(this, arguments);

        const isAnth = url?.startsWith(ANTHROPIC_URL);
        const isGemini = !isAnth && url?.startsWith(GEMINI_URL);
        const isOai = !isAnth && !isGemini && OAI_URLS.some(u => url?.startsWith(u));
        if (!isAnth && !isGemini && !isOai) return orig.apply(this, arguments);

        const body = init?.body;
        if (typeof body !== 'string') return orig.apply(this, arguments);

        let payload;
        try { payload = JSON.parse(body); } catch { return orig.apply(this, arguments); }

        const patched = isAnth ? handleAnthropic(payload) : isGemini ? handleGemini(url, payload) : handleOpenAI(payload);
        if (patched) return orig.call(this, input, patchBody(init, patched));
        return orig.apply(this, arguments);
      } catch {
        return orig.apply(this, arguments);
      }
    };

    window.fetch.__tmxEffort = true;
  };

  // ============ INIT ============
  const init = () => {
    installFetch();
    startObservers();
    setTimeout(() => { attachScoped(); sync(); }, 150);
    const onRoute = () => setTimeout(() => { attachScoped(); sync(); }, 150);
    window.addEventListener('popstate', onRoute);
    window.addEventListener('hashchange', onRoute);
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  console.log(`${LOG} Loaded`);
})();
