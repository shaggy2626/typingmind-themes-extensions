/* ============================================================================
 * TypingMind – Web Search Enhancer v2 (2025-12-17)
 * 
 * Enhances TypingMind's native web_search tool by adding:
 * - user_location with timezone (auto-detected from browser)
 * - search_context_size (configurable via Global Settings UI)
 * 
 * This extension only modifies existing web_search tools - it does NOT add
 * the tool itself. TypingMind's native "Web Browser" model tool handles that.
 * 
 * Supports: OpenAI models using the /v1/responses API
 * ========================================================================== */

(() => {
  'use strict';
  
  // Prevent duplicate initialization
  if (window.fetch?.__webSearchEnhancerV2) return;
  
  // ==================== Configuration ====================
  const CONFIG = {
    OAI_API_URL: 'https://api.openai.com/v1/responses',
    STORAGE_KEY: 'tmx-websearch-context-size',
    VALID_SIZES: ['low', 'medium', 'high'],
    DEFAULT_SIZE: 'medium',
  };
  
  // ==================== Timezone Detection ====================
  const getBrowserTimezone = () => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || null;
    } catch {
      return null; // Let TypingMind/OpenAI use their default
    }
  };
  
  // ==================== Context Size Preference ====================
  const getContextSize = () => {
    try {
      const saved = localStorage.getItem(CONFIG.STORAGE_KEY);
      if (saved && CONFIG.VALID_SIZES.includes(saved)) {
        return saved;
      }
    } catch {}
    return CONFIG.DEFAULT_SIZE;
  };
  
  const setContextSize = (size) => {
    if (CONFIG.VALID_SIZES.includes(size)) {
      try {
        localStorage.setItem(CONFIG.STORAGE_KEY, size);
      } catch {}
    }
  };
  
  // ==================== Fetch Wrapper ====================
  const installFetchWrapper = () => {
    const originalFetch = window.fetch;
    
    window.fetch = async function(input, init) {
      try {
        const url = typeof input === 'string' ? input : input?.url;
        const method = (init?.method || 'GET').toUpperCase();
        
        // Only intercept OpenAI responses API POST requests
        if (!url?.startsWith(CONFIG.OAI_API_URL) || method !== 'POST') {
          return originalFetch.apply(this, arguments);
        }
        
        // Get request body
        const bodyText = init?.body;
        if (typeof bodyText !== 'string') {
          return originalFetch.apply(this, arguments);
        }
        
        // Parse payload
        let payload;
        try {
          payload = JSON.parse(bodyText);
        } catch {
          return originalFetch.apply(this, arguments);
        }
        
        // Check if tools array exists and has web_search
        if (!Array.isArray(payload.tools)) {
          return originalFetch.apply(this, arguments);
        }
        
        // Find web_search tool
        const webSearchTool = payload.tools.find(t => t?.type === 'web_search');
        if (!webSearchTool) {
          return originalFetch.apply(this, arguments);
        }
        
        // Enhance the web_search tool
        const timezone = getBrowserTimezone();
        const contextSize = getContextSize();
        
        // Add user_location only if we detected a timezone and it's not already set
        if (timezone && !webSearchTool.user_location?.timezone) {
          webSearchTool.user_location = {
            type: 'approximate',
            timezone: timezone
          };
        }
        
        // Add search_context_size if not present
        if (!webSearchTool.search_context_size) {
          webSearchTool.search_context_size = contextSize;
        }
        
        console.log(`[WebSearch Enhancer v2] Enhanced: timezone=${timezone || 'default'}, context_size=${contextSize}`);
        
        // Rebuild request with modified payload
        const newInit = {
          ...init,
          body: JSON.stringify(payload),
          headers: new Headers(init?.headers)
        };
        newInit.headers.set('content-type', 'application/json');
        
        return originalFetch.call(this, input, newInit);
      } catch (err) {
        console.error('[WebSearch Enhancer v2] Error:', err);
        return originalFetch.apply(this, arguments);
      }
    };
    
    window.fetch.__webSearchEnhancerV2 = true;
  };
  
  // ==================== Settings UI ====================
  const SELECTORS = {
    modelsContainer: '[data-element-id="models-tab-content"]',
    globalFieldset: 'fieldset.space-y-4',
    header: 'div.antialiased.font-semibold',
    tabButtons: 'ul[role="tablist"] button',
  };
  
  const SETTINGS_ID = 'tmx-websearch-enhancer-settings';
  
  const isGlobalSettingsActive = (container) => {
    if (!container) return false;
    const tabButtons = Array.from(container.querySelectorAll(SELECTORS.tabButtons));
    for (const btn of tabButtons) {
      const label = (btn.textContent || '').trim().toLowerCase();
      if (/global settings/.test(label)) {
        if (btn.getAttribute('aria-selected') === 'true') return true;
        if (/border-blue-600/.test(btn.className || '')) return true;
      }
    }
    // Fallback: check for Global settings content
    return !!container.querySelector(SELECTORS.globalFieldset);
  };
  
  const findReasoningSection = (container) => {
    if (!container) return null;
    const headers = Array.from(container.querySelectorAll(SELECTORS.header));
    for (const header of headers) {
      const text = (header.textContent || '').toLowerCase();
      if (/reasoning\s*effort/.test(text)) {
        return header.parentElement || null;
      }
    }
    return null;
  };
  
  const createSettingsUI = () => {
    const container = document.querySelector(SELECTORS.modelsContainer);
    if (!container) return null;
    
    // Remove existing if Global Settings not active
    const existing = document.getElementById(SETTINGS_ID);
    if (!isGlobalSettingsActive(container)) {
      if (existing) existing.remove();
      return null;
    }
    
    // Don't recreate if already exists
    if (existing) return existing;
    
    // Create settings block
    const wrap = document.createElement('div');
    wrap.id = SETTINGS_ID;
    wrap.style.marginTop = '16px';
    
    // Header
    const header = document.createElement('div');
    header.className = 'antialiased font-semibold flex items-center gap-x-2';
    header.innerHTML = `
      <span>Web Search Context Size (OpenAI)</span>
      <button type="button" class="text-blue-600 hover:underline dark:text-blue-500 font-semibold text-xs">(Reset)</button>
    `;
    wrap.appendChild(header);
    
    // Description
    const desc = document.createElement('div');
    desc.className = 'text-xs text-slate-600 dark:text-slate-400 my-1';
    const tz = getBrowserTimezone();
    desc.innerHTML = `
      Controls how much web search context is included in responses.<br/>
      <b>low</b>: Faster, less context | <b>medium</b>: Balanced (default) | <b>high</b>: More context, slower
    `;
    wrap.appendChild(desc);
    
    // Timezone display with refresh button
    const tzRow = document.createElement('div');
    tzRow.className = 'flex items-center gap-2 mt-1';
    
    const tzLabel = document.createElement('span');
    tzLabel.className = 'text-xs text-slate-500';
    tzLabel.id = 'tmx-websearch-tz-display';
    tzLabel.textContent = `Timezone: ${tz || 'using default'}`;
    tzRow.appendChild(tzLabel);
    
    const refreshBtn = document.createElement('button');
    refreshBtn.type = 'button';
    refreshBtn.className = 'text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300';
    refreshBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/></svg>`;
    refreshBtn.title = 'Refresh timezone';
    refreshBtn.addEventListener('click', () => {
      const newTz = getBrowserTimezone();
      tzLabel.textContent = `Timezone: ${newTz || 'using default'}`;
      // Brief visual feedback
      refreshBtn.style.transform = 'rotate(360deg)';
      refreshBtn.style.transition = 'transform 0.3s';
      setTimeout(() => {
        refreshBtn.style.transform = '';
        refreshBtn.style.transition = '';
      }, 300);
    });
    tzRow.appendChild(refreshBtn);
    
    wrap.appendChild(tzRow);
    
    // Select dropdown
    const select = document.createElement('select');
    select.className = 'block w-full rounded-lg border-0 py-2 pl-3 pr-10 text-slate-900 dark:text-white dark:bg-zinc-800 ring-1 ring-inset ring-slate-200 dark:ring-white/20 focus:ring-2 focus:ring-blue-600 text-sm sm:leading-6 mt-2';
    select.innerHTML = `
      <option value="low">Low - Faster, less context</option>
      <option value="medium">Medium (default) - Balanced</option>
      <option value="high">High - More context, slower</option>
    `;
    select.value = getContextSize();
    select.addEventListener('change', () => setContextSize(select.value));
    wrap.appendChild(select);
    
    // Reset button handler
    header.querySelector('button').addEventListener('click', () => {
      setContextSize(CONFIG.DEFAULT_SIZE);
      select.value = CONFIG.DEFAULT_SIZE;
    });
    
    // Insert after Reasoning effort section, or append to fieldset
    const reasoningSection = findReasoningSection(container);
    if (reasoningSection?.parentNode) {
      reasoningSection.parentNode.insertBefore(wrap, reasoningSection.nextSibling);
    } else {
      const fieldset = container.querySelector(SELECTORS.globalFieldset);
      if (fieldset) {
        fieldset.appendChild(wrap);
      }
    }
    
    return wrap;
  };
  
  // ==================== Event Listeners (Simple & Targeted) ====================
  
  // Check if we're on the models page
  const isModelsPage = () => window.location.hash.startsWith('#models');
  
  // Debounced UI update
  let debounceTimer = null;
  const scheduleUIUpdate = () => {
    if (debounceTimer) return;
    debounceTimer = setTimeout(() => {
      debounceTimer = null;
      try {
        createSettingsUI();
      } catch {}
    }, 100);
  };
  
  // ==================== Initialize ====================
  const init = () => {
    installFetchWrapper();
    
    // 1. Hash change: When URL changes to #models
    window.addEventListener('hashchange', () => {
      if (isModelsPage()) {
        scheduleUIUpdate();
      }
    });
    
    // 2. Click on "Models" button in sidebar
    document.addEventListener('click', (e) => {
      const btn = e.target?.closest?.('button');
      if (!btn) return;
      
      const text = btn.textContent?.toLowerCase() || '';
      
      // Clicked "Models" in sidebar
      if (text.includes('models') && btn.closest('[class*="navigation"], nav, [role="navigation"]')) {
        setTimeout(scheduleUIUpdate, 150);
      }
      
      // Clicked "Global Settings" tab
      if (/global\s*settings/i.test(btn.textContent || '')) {
        setTimeout(scheduleUIUpdate, 150);
      }
    }, true);
    
    // 3. Initial check if already on models page
    if (isModelsPage()) {
      setTimeout(scheduleUIUpdate, 200);
    }
    
    console.log('[WebSearch Enhancer v2] Loaded');
  };
  
  // Run on load or immediately if already loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
