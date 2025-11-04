/* == TypingMind | Auto‑Hide "Thinking…" =====================================
 * Automatically opens the streaming "Thinking…" details, collapses it once
 * a real answer starts, and adds a menu toggle stored in localStorage.
 * ========================================================================== */

(() => {
    'use strict';

    // Prevent double-install across SPA navigations or duplicate script loads
    if (window.__tmxAutoThoughtInstalled) return;
    window.__tmxAutoThoughtInstalled = true;

    /* ---------- class ------------------------------------------------------ */
    class AutoThoughtToggle {
      /* static config */
      STORAGE = 'autoThoughtToggle_enabled';
      BTN_ID  = 'auto-thought-toggle-button';
      /* checkbox icons */
      CHECKED_SVG   = '<svg class="w-[18px] h-[18px] shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="3" y="3" width="18" height="18" rx="4" stroke="currentColor" stroke-width="2"/><path d="M9 12l2 2 4-4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
      UNCHECKED_SVG = '<svg class="w-[18px] h-[18px] shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="3" y="3" width="18" height="18" rx="4" stroke="currentColor" stroke-width="2"/></svg>';
      SEL = {
        thought  : '[data-element-id="ai-response"] details',
        content  : '[data-element-id="ai-response"]>*:not(details):not([data-element-id="additional-actions-of-response-container"])',
        menu     : '[role="menu"][aria-labelledby*="headlessui-menu-button"]',
        menuItem : '[role="menuitem"]'
      };
  
      constructor() {
        /* read persisted state as real boolean, defaulting to true */
        this.enabled = JSON.parse(localStorage.getItem(this.STORAGE) ?? 'true');
        /* track per-details observers for cleanup */
        this._detailsObservers = new WeakMap();
        this.#init();
      }
  
      /** master initialiser */
      #init() {
        console.log(`[AutoThoughtToggle] ${this.enabled ? 'Enabled' : 'Disabled'}.`);
  
        /* rAF-batched DOM observer scoped to chat container when available */
        this._rafScheduled = false;
        this._observer = null;
        this._clickDelegated = false;
        this._processedAutoExpand = new WeakSet();
        this.#ensureObserver();
  
        /* cleanup to avoid duplicate observers on navigation */
        window.addEventListener('beforeunload', () => this._observer?.disconnect());

        /* re-arm observer on SPA route changes */
        window.addEventListener('hashchange', () => this.#ensureObserver());
        window.addEventListener('popstate',   () => this.#ensureObserver());

        /* single delegated click to respect user interaction */
        if (!this._clickDelegated) {
          document.addEventListener('click', (e) => {
            const summary = e.target?.closest?.(`${this.SEL.thought}>summary`);
            if (!summary) return;
            const d = summary.closest(this.SEL.thought);
            if (!d) return;
            
            // Mark as user-controlled
            d.dataset.userInteracted = '1';
            d.removeAttribute('data-auto-expanded');
            
            // Immediately disconnect and clean up any dedicated observer
            const obs = this._detailsObservers.get(d);
            if (obs) {
              obs.disconnect();
              this._detailsObservers.delete(d);
            }
          }, { capture: true });
          this._clickDelegated = true;
        }
  
        /* console helpers */
        window.autoThoughtToggle = {
          enable : () => this.#setState(true),
          disable: () => this.#setState(false),
          status : () => console.log(`Auto‑Hide Thoughts is ${this.enabled?'ENABLED':'DISABLED'}.`)
        };
      }
  
      /** attach observer to the most relevant container */
      #ensureObserver() {
        try { this._observer?.disconnect(); } catch {}
        const container = this.#findChatContainer() || document.body;
        this._observer = new MutationObserver((muts) => {
          if (document.hidden) return; // skip background tabs
          // quick relevance check to avoid unnecessary scans
          const relevant = muts.some(m => (
            [...(m.addedNodes||[]), ...(m.removedNodes||[])].some(n => {
              if (!(n && n.nodeType === 1)) return false;
              const el = /** @type {Element} */(n);
              return el.matches?.(this.SEL.thought) ||
                     el.querySelector?.(this.SEL.thought) ||
                     el.matches?.(this.SEL.menu) ||
                     el.querySelector?.(this.SEL.menu);
            })
          ));
          if (!relevant) return;
          if (this._rafScheduled) return;
          this._rafScheduled = true;
          requestAnimationFrame(() => {
            this._rafScheduled = false;
            this.#autoToggle();
            if (!document.getElementById(this.BTN_ID)) this.#injectButton();
          });
        });
        this._observer.observe(container, { childList: true, subtree: true });
      }

      #findChatContainer() {
        const anyResponse = document.querySelector('[data-element-id="ai-response"]');
        return anyResponse?.parentElement?.closest?.('[data-element-id]') || anyResponse?.parentElement || null;
      }

      /** change feature state & UI */
      #setState(on) {
        this.enabled = on;
        localStorage.setItem(this.STORAGE, JSON.stringify(on));
        console.log(`[AutoThoughtToggle] ${on?'Enabled':'Disabled'}.`);
        this.#updateButtonIcon();
      }
  
      /** open/collapse "Thinking…" blocks */
      #autoToggle() {
        if (!this.enabled) return;
  
        /* collapse blocks whose answer started (fallback for any that slipped through) */
        document.querySelectorAll('details[data-auto-expanded]').forEach(d => {
          const next = d.nextElementSibling;
          if (next && next.matches(this.SEL.content)) {
            d.open = false;
            d.removeAttribute('data-auto-expanded');
            // Clean up observer if it exists
            const obs = this._detailsObservers.get(d);
            if (obs) {
              obs.disconnect();
              this._detailsObservers.delete(d);
            }
          }
        });
  
        /* manage new "Thinking…" blocks */
        document.querySelectorAll(this.SEL.thought).forEach(d => {
          if (d.dataset.autoExpanded || d.dataset.userInteracted) return;
          if (this._processedAutoExpand.has(d)) return;
  
          const label = d.querySelector('summary')?.textContent || '';
          if (!/Thinking|Thought/i.test(label)) return;
  
          d.open = true;
          d.dataset.autoExpanded = '1';
          this._processedAutoExpand.add(d);
  
          /* collapse immediately if answer already there */
          const next = d.nextElementSibling;
          if (next && next.matches(this.SEL.content)) {
            d.open = false;
            d.removeAttribute('data-auto-expanded');
            return; // Don't create observer if already collapsed
          }
          
          /* create dedicated observer to watch for when content appears */
          if (!d.parentElement) return;
          
          const collapseObserver = new MutationObserver(() => {
            // Check if content appeared as next sibling
            const contentSibling = d.nextElementSibling;
            if (contentSibling && contentSibling.matches(this.SEL.content)) {
              // Content appeared - collapse and clean up
              d.open = false;
              d.removeAttribute('data-auto-expanded');
              collapseObserver.disconnect();
              this._detailsObservers.delete(d);
            }
          });
          
          // Watch parent for new children (minimal scope)
          collapseObserver.observe(d.parentElement, { 
            childList: true,  // Only watch for siblings being added
            subtree: false    // Don't watch deep children
          });
          
          // Store for cleanup
          this._detailsObservers.set(d, collapseObserver);
        });
      }
  
      /** add toggle entry to "More actions" menu */
      #injectButton() {
        // Find all menus on the page that could be our target.
        const menus = document.querySelectorAll(this.SEL.menu);
        if (!menus.length) return;

        // Find the specific "More Actions" menu by looking for a unique item
        // it contains, like the "Delete Chat" button. This prevents us from
        // ever targeting the wrong menu (e.g., the plugin menu).
        let targetMenu = null;
        for (const menu of menus) {
          const menuItems = menu.querySelectorAll('span.text-left');
          for (const item of menuItems) {
            if (item.textContent?.includes('Reset chat')) {
              targetMenu = menu;
              break;
            }
          }
          if (targetMenu) break;
        }

        // If we didn't find the correct menu, abort.
        if (!targetMenu) return;

        // Prevent duplicate buttons from being injected.
        if (targetMenu.querySelector(`#${this.BTN_ID}`)) return;

        const template = targetMenu.querySelector(this.SEL.menuItem);
        if (!template) return;
  
        const btn = template.cloneNode(true);
        btn.id = this.BTN_ID;
        btn.removeAttribute('data-headlessui-state');
  
        btn.querySelector('span.text-left').textContent = 'Auto‑Hide Thoughts';
        btn.querySelector('.font-normal.text-slate-500')?.remove();
        btn.querySelector('div:has(svg[data-tooltip-id="global"])')?.remove();
        btn.addEventListener('click', () => this.#setState(!this.enabled));
  
        targetMenu.appendChild(btn);
        this.#updateButtonIcon();
      }
  
      /** swap checkbox icon inside the menu entry */
      #updateButtonIcon() {
        const btn  = document.getElementById(this.BTN_ID);
        if (!btn) return;
  
        const box  = btn.querySelector('.flex.items-center.justify-center.gap-x-2');
        const svg  = box?.querySelector('svg');
        if (!svg) return;
  
        svg.outerHTML = this.enabled ? this.CHECKED_SVG : this.UNCHECKED_SVG;
      }
    }
  
    /* bootstrap */
    document.readyState === 'loading'
      ? document.addEventListener('DOMContentLoaded', () => new AutoThoughtToggle())
      : new AutoThoughtToggle();
})(); 
  