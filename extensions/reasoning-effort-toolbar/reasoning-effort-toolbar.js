// TypingMind Reasoning Effort Toolbar v2
// Simplified version - cleaner architecture, single observer, syncs with TM native storage
// Only shows for: gpt-5, gpt-5.1, gpt-5.2 (no Codex)
// Model-specific effort options:
//   gpt-5:   minimal, low, medium, high
//   gpt-5.1: none, low, medium, high
//   gpt-5.2: none, low, medium, high, xhigh
// Version: 2.1

(() => {
  'use strict';

  // Prevent duplicate installation
  if (window.__tmxReasoningEffortV2) return;
  window.__tmxReasoningEffortV2 = true;

  // ============ CONSTANTS ============
  const SELECTORS = {
    composerActions: '[data-element-id="chat-input-actions"]',
    thinkButton: '[data-element-id="toggle-thinking-button"]',
    modelButton: 'button', // We'll find the one with GPT text
  };

  const IDS = {
    wrapper: 'tmx-effort-v2-wrap',
    button: 'tmx-effort-v2-btn',
    menu: 'tmx-effort-v2-menu',
    styles: 'tmx-effort-v2-styles',
  };

  // Model-specific effort options
  const MODEL_EFFORT_OPTIONS = {
    'gpt-5': ['Minimal', 'Low', 'Medium', 'High'],
    'gpt-5.1': ['None', 'Low', 'Medium', 'High'],
    'gpt-5.2': ['None', 'Low', 'Medium', 'High', 'Xhigh'],
  };
  
  // Supported models (no Codex)
  const SUPPORTED_MODELS = Object.keys(MODEL_EFFORT_OPTIONS);
  
  const DEFAULT_EFFORT = 'Medium';
  const TM_STORAGE_KEY = 'TM_useModelsSettings';
  const OAI_API_URL = 'https://api.openai.com/v1/responses';

  // ============ HELPERS ============
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

  // Normalize model ID for TM storage lookup (only supported models, no Codex)
  const normalizeModelId = (text) => {
    if (!text) return null;
    const clean = text.toLowerCase().trim();
    // Exclude Codex models
    if (clean.includes('codex')) return null;
    // Check for supported models in order of specificity
    if (clean.includes('5.2')) return 'gpt-5.2';
    if (clean.includes('5.1')) return 'gpt-5.1';
    if (clean.includes('gpt') && clean.includes('5')) return 'gpt-5';
    return null;
  };

  // Get model button element
  const getModelButton = () => {
    const actions = $(SELECTORS.composerActions);
    if (!actions) return null;
    
    let container = actions.parentElement;
    for (let i = 0; i < 5 && container; i++) {
      const btn = $$('button', container).find(b => 
        /gpt[-\s]?\d|claude|gemini/i.test(b.textContent || '')
      );
      if (btn) return btn;
      container = container.parentElement;
    }
    return null;
  };

  // Check if current model is a supported GPT-5 model (not Codex)
  const shouldShowPill = () => {
    const btn = getModelButton();
    if (!btn) return false;
    const modelId = normalizeModelId(btn.textContent);
    return modelId && SUPPORTED_MODELS.includes(modelId);
  };
  
  // Get current model ID from button
  const getCurrentModelFromButton = () => {
    const btn = getModelButton();
    return btn ? normalizeModelId(btn.textContent) : null;
  };
  
  // Get effort options for a model
  const getEffortOptionsForModel = (modelId) => {
    return MODEL_EFFORT_OPTIONS[modelId] || MODEL_EFFORT_OPTIONS['gpt-5'];
  };

  // ============ STORAGE ============
  // Read effort from TM's native storage
  const getEffortFromTM = (modelId) => {
    try {
      const settings = JSON.parse(localStorage.getItem(TM_STORAGE_KEY) || '{}');
      const effort = settings[modelId]?.modelParameters?.reasoningEffort;
      if (effort) {
        const options = getEffortOptionsForModel(modelId);
        const normalized = effort.charAt(0).toUpperCase() + effort.slice(1).toLowerCase();
        if (options.map(o => o.toLowerCase()).includes(effort.toLowerCase())) {
          return normalized;
        }
      }
    } catch {}
    return DEFAULT_EFFORT;
  };

  // Write effort to TM's native storage (for persistence)
  const setEffortInTM = (modelId, effort) => {
    try {
      const settings = JSON.parse(localStorage.getItem(TM_STORAGE_KEY) || '{}');
      if (settings[modelId]?.modelParameters) {
        settings[modelId].modelParameters.reasoningEffort = effort.toLowerCase();
        localStorage.setItem(TM_STORAGE_KEY, JSON.stringify(settings));
      }
    } catch {}
  };

  // Current session effort (for immediate effect via fetch wrapper)
  let currentEffort = DEFAULT_EFFORT;
  let currentModelId = null;

  // Initialize effort from TM storage based on current model
  const syncEffortFromModel = () => {
    const modelId = getCurrentModelFromButton();
    if (!modelId) return;
    
    // If model changed, validate current effort is available for new model
    if (modelId !== currentModelId) {
      currentModelId = modelId;
      const options = getEffortOptionsForModel(modelId);
      
      // Check if current effort is valid for this model
      if (!options.map(o => o.toLowerCase()).includes(currentEffort.toLowerCase())) {
        // Reset to default or first available option
        currentEffort = options.includes(DEFAULT_EFFORT) ? DEFAULT_EFFORT : options[0];
      }
    }
    
    // Read from TM storage
    currentEffort = getEffortFromTM(modelId);
  };

  // ============ STYLES ============
  const injectStyles = () => {
    if ($(`#${IDS.styles}`)) return;
    
    const css = `
      #${IDS.wrapper} {
        display: inline-flex;
        align-items: center;
        margin-left: 0.25rem;
      }
      
      #${IDS.button} {
        display: inline-flex;
        align-items: center;
        gap: 0.375rem;
        height: 2.25rem;
        padding: 0 0.75rem;
        border-radius: 0.5rem;
        font-size: 0.75rem;
        font-weight: 500;
        cursor: pointer;
        border: none;
        background: rgb(191 219 254);
        color: rgb(37 99 235);
        transition: background 0.15s;
      }
      .dark #${IDS.button} {
        background: rgb(30 58 138);
        color: rgb(191 219 254);
      }
      #${IDS.button}:hover {
        background: rgb(147 197 253);
      }
      .dark #${IDS.button}:hover {
        background: rgb(30 64 175);
      }
      
      #${IDS.menu} {
        position: fixed;
        z-index: 2147483000;
        min-width: 10rem;
        padding: 0.25rem;
        background: white;
        border: 1px solid rgba(0,0,0,0.1);
        border-radius: 0.5rem;
        box-shadow: 0 10px 25px rgba(0,0,0,0.15);
      }
      .dark #${IDS.menu} {
        background: rgb(30 41 59);
        border-color: rgba(255,255,255,0.1);
      }
      
      .tmx-effort-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0.5rem 0.75rem;
        border-radius: 0.375rem;
        cursor: pointer;
        font-size: 0.875rem;
      }
      .tmx-effort-item:hover {
        background: rgba(0,0,0,0.05);
      }
      .dark .tmx-effort-item:hover {
        background: rgba(255,255,255,0.1);
      }
      .tmx-effort-item[data-selected="true"]::after {
        content: '✓';
        font-size: 0.75rem;
      }
      
      .tmx-hidden { display: none !important; }
    `;
    
    const style = document.createElement('style');
    style.id = IDS.styles;
    style.textContent = css;
    document.head.appendChild(style);
  };

  // ============ UI ============
  // Simple thinking icon SVG
  const thinkIcon = `<svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
    <path d="M16.585 10C16.585 6.363 13.637 3.415 10 3.415C6.363 3.415 3.415 6.363 3.415 10C3.415 13.637 6.363 16.585 10 16.585C13.637 16.585 16.585 13.637 16.585 10ZM17.915 10C17.915 14.371 14.371 17.915 10 17.915C5.629 17.915 2.085 14.371 2.085 10C2.085 5.629 5.629 2.085 10 2.085C14.371 2.085 17.915 5.629 17.915 10Z"/>
    <path d="M12.084 0.005C12.451 0.005 12.749 0.303 12.749 0.67C12.749 1.037 12.451 1.335 12.084 1.335H7.917C7.549 1.335 7.252 1.037 7.252 0.67C7.252 0.303 7.549 0.005 7.917 0.005H12.084Z"/>
    <path d="M11.299 10.75C10.885 11.468 9.968 11.713 9.25 11.299C8.533 10.885 8.287 9.967 8.701 9.25C9.451 7.951 12.067 5.42 12.5 5.67C12.933 5.92 12.049 9.451 11.299 10.75Z"/>
  </svg>`;

  let menuEl = null;
  let isMenuOpen = false;
  let currentMenuModelId = null;

  const createMenu = (modelId) => {
    const options = getEffortOptionsForModel(modelId);
    
    // Rebuild menu if model changed or doesn't exist
    if (menuEl && currentMenuModelId === modelId) {
      return menuEl;
    }
    
    // Remove old menu if exists
    if (menuEl) {
      menuEl.remove();
      menuEl = null;
    }
    
    currentMenuModelId = modelId;
    menuEl = document.createElement('div');
    menuEl.id = IDS.menu;
    menuEl.className = 'tmx-hidden';
    
    options.forEach(option => {
      const item = document.createElement('div');
      item.className = 'tmx-effort-item';
      item.textContent = option;
      item.dataset.value = option;
      item.dataset.selected = option === currentEffort ? 'true' : 'false';
      
      item.addEventListener('click', (e) => {
        e.stopPropagation();
        selectEffort(option);
        closeMenu();
      });
      
      menuEl.appendChild(item);
    });
    
    document.body.appendChild(menuEl);
    return menuEl;
  };

  const updateMenuSelection = () => {
    if (!menuEl) return;
    menuEl.querySelectorAll('.tmx-effort-item').forEach(item => {
      item.dataset.selected = item.dataset.value === currentEffort ? 'true' : 'false';
    });
  };

  const positionMenu = (btn) => {
    if (!menuEl) return;
    const rect = btn.getBoundingClientRect();
    const menuHeight = menuEl.offsetHeight || 120;
    const menuWidth = menuEl.offsetWidth || 160;
    
    let top = rect.bottom + 6;
    let left = rect.left;
    
    // Flip up if not enough space below
    if (top + menuHeight > window.innerHeight - 10) {
      top = rect.top - menuHeight - 6;
    }
    // Keep within viewport horizontally
    if (left + menuWidth > window.innerWidth - 10) {
      left = window.innerWidth - menuWidth - 10;
    }
    
    menuEl.style.top = `${top}px`;
    menuEl.style.left = `${left}px`;
  };

  const openMenu = (btn) => {
    const modelId = getCurrentModelFromButton();
    if (!modelId) return;
    
    createMenu(modelId);
    updateMenuSelection();
    menuEl.classList.remove('tmx-hidden');
    positionMenu(btn);
    isMenuOpen = true;
    
    // Close on outside click
    setTimeout(() => {
      document.addEventListener('click', handleOutsideClick, true);
    }, 0);
  };

  const closeMenu = () => {
    if (menuEl) menuEl.classList.add('tmx-hidden');
    isMenuOpen = false;
    document.removeEventListener('click', handleOutsideClick, true);
  };

  const handleOutsideClick = (e) => {
    const btn = $(`#${IDS.button}`);
    if (menuEl && !menuEl.contains(e.target) && (!btn || !btn.contains(e.target))) {
      closeMenu();
    }
  };

  const selectEffort = (effort) => {
    currentEffort = effort;
    
    // Update button label
    const btn = $(`#${IDS.button}`);
    if (btn) {
      const label = btn.querySelector('span');
      if (label) label.textContent = effort;
    }
    
    // Update TM storage for persistence
    const modelBtn = getModelButton();
    if (modelBtn) {
      const modelId = normalizeModelId(modelBtn.textContent);
      if (modelId) {
        setEffortInTM(modelId, effort);
      }
    }
    
    updateMenuSelection();
  };

  // ============ MOUNT/UNMOUNT ============
  const mountPill = () => {
    if ($(`#${IDS.wrapper}`)) return;
    
    injectStyles();
    syncEffortFromModel();
    
    const thinkBtn = $(SELECTORS.thinkButton);
    const actions = $(SELECTORS.composerActions);
    if (!thinkBtn && !actions) return;
    
    // Create wrapper
    const wrapper = document.createElement('span');
    wrapper.id = IDS.wrapper;
    
    // Create button
    const btn = document.createElement('button');
    btn.id = IDS.button;
    btn.type = 'button';
    btn.title = 'Reasoning effort level';
    btn.innerHTML = `${thinkIcon}<span>${currentEffort}</span>`;
    
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (isMenuOpen) {
        closeMenu();
      } else {
        openMenu(btn);
      }
    });
    
    wrapper.appendChild(btn);
    
    // Insert after Think button or at start of actions
    if (thinkBtn && thinkBtn.parentElement) {
      thinkBtn.parentElement.insertBefore(wrapper, thinkBtn.nextSibling);
    } else if (actions) {
      const leftGroup = actions.querySelector('.items-center.justify-start') || actions.firstElementChild || actions;
      leftGroup.insertBefore(wrapper, leftGroup.firstChild);
    }
  };

  const unmountPill = () => {
    $(`#${IDS.wrapper}`)?.remove();
    closeMenu();
  };

  // ============ VISIBILITY SYNC ============
  const syncVisibility = () => {
    const show = shouldShowPill();
    const mounted = !!$(`#${IDS.wrapper}`);
    
    if (show && !mounted) {
      mountPill();
    } else if (!show && mounted) {
      unmountPill();
    } else if (show && mounted) {
      // Model might have changed, sync effort from new model
      syncEffortFromModel();
      const btn = $(`#${IDS.button}`);
      if (btn) {
        const label = btn.querySelector('span');
        if (label) label.textContent = currentEffort;
      }
    }
  };

  // ============ OBSERVER ============
  // Single observer for composer area changes
  let observer = null;
  let debounceTimer = null;

  const debouncedSync = () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(syncVisibility, 50);
  };

  const startObserver = () => {
    if (observer) return;
    
    observer = new MutationObserver((mutations) => {
      // Check if any mutation is relevant (model change, composer change)
      for (const m of mutations) {
        if (m.type === 'characterData' || m.type === 'childList') {
          debouncedSync();
          return;
        }
        if (m.type === 'attributes' && m.attributeName === 'class') {
          debouncedSync();
          return;
        }
      }
    });
    
    // Observe body for SPA navigation and composer changes
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ['class']
    });
  };

  // ============ FETCH WRAPPER ============
  // Get model ID from API model name
  const getModelIdFromApiName = (modelName) => {
    if (!modelName) return null;
    const name = modelName.toLowerCase();
    // Exclude Codex
    if (name.includes('codex')) return null;
    if (name.includes('gpt-5.2') || name.includes('gpt5.2')) return 'gpt-5.2';
    if (name.includes('gpt-5.1') || name.includes('gpt5.1')) return 'gpt-5.1';
    if (name.includes('gpt-5') || name.includes('gpt5')) return 'gpt-5';
    return null;
  };

  const installFetchWrapper = () => {
    if (window.fetch.__tmxEffortV2) return;
    
    const originalFetch = window.fetch;
    
    window.fetch = async function(input, init) {
      try {
        const url = typeof input === 'string' ? input : input.url;
        const method = (init?.method || 'GET').toUpperCase();
        
        // Only intercept OpenAI responses API POST requests
        if (!url.startsWith(OAI_API_URL) || method !== 'POST') {
          return originalFetch.apply(this, arguments);
        }
        
        // Get request body
        let bodyText = init?.body;
        if (typeof bodyText !== 'string') {
          return originalFetch.apply(this, arguments);
        }
        
        // Parse and check if it's a supported GPT-5 model with reasoning
        let payload;
        try {
          payload = JSON.parse(bodyText);
        } catch {
          return originalFetch.apply(this, arguments);
        }
        
        // Get model ID and check if supported
        const modelId = getModelIdFromApiName(payload?.model);
        if (!modelId || !payload?.reasoning) {
          return originalFetch.apply(this, arguments);
        }
        
        // Apply current effort (lowercase for API)
        payload.reasoning.effort = currentEffort.toLowerCase();
        
        console.log(`[ReasoningEffort v2] Applied effort: ${currentEffort} to ${modelId}`);
        
        // Rebuild request
        const newInit = {
          ...init,
          body: JSON.stringify(payload),
          headers: new Headers(init?.headers)
        };
        newInit.headers.set('content-type', 'application/json');
        
        return originalFetch.call(this, input, newInit);
      } catch {
        return originalFetch.apply(this, arguments);
      }
    };
    
    window.fetch.__tmxEffortV2 = true;
  };

  // ============ INIT ============
  const init = () => {
    installFetchWrapper();
    startObserver();
    
    // Initial sync after a short delay for DOM to settle
    setTimeout(syncVisibility, 150);
    
    // Handle route changes
    window.addEventListener('popstate', () => setTimeout(syncVisibility, 150));
    window.addEventListener('hashchange', () => setTimeout(syncVisibility, 150));
  };

  // Start when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  console.log('[ReasoningEffort v2] Loaded');
})();

