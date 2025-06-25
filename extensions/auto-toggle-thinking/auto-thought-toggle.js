/* == TypingMind | Auto‑Hide "Thinking…" =====================================
 * Automatically opens the streaming "Thinking…" details, collapses it once
 * a real answer starts, and adds a menu toggle stored in localStorage.
 * ========================================================================== */

(() => {
    'use strict';

    /* ---------- class ------------------------------------------------------ */
    class AutoThoughtToggle {
      /* static config */
      STORAGE = 'autoThoughtToggle_enabled';
      BTN_ID  = 'auto-thought-toggle-button';
      SEL = {
        thought  : '[data-element-id="ai-response"] details',
        content  : '[data-element-id="ai-response"]>*:not(details):not([data-element-id="additional-actions-of-response-container"])',
        menu     : '[role="menu"][aria-labelledby*="headlessui-menu-button"]',
        menuItem : '[role="menuitem"]'
      };
  
      constructor() {
        /* read persisted state */
        this.enabled = localStorage.getItem(this.STORAGE) !== 'false';
        this.#init();
      }
  
      /** master initialiser */
      #init() {
        console.log(`[AutoThoughtToggle] ${this.enabled ? 'Enabled' : 'Disabled'}.`);
  
        /* DOM observer */
        new MutationObserver(() => {
          this.#autoToggle();
          if (!document.getElementById(this.BTN_ID)) this.#injectButton();
        }).observe(document.body, {childList:true,subtree:true,characterData:true});
  
        /* console helpers */
        window.autoThoughtToggle = {
          enable : () => this.#setState(true),
          disable: () => this.#setState(false),
          status : () => console.log(`Auto‑Hide Thoughts is ${this.enabled?'ENABLED':'DISABLED'}.`)
        };
      }
  
      /** change feature state & UI */
      #setState(on) {
        this.enabled = on;
        localStorage.setItem(this.STORAGE,on);
        console.log(`[AutoThoughtToggle] ${on?'Enabled':'Disabled'}.`);
        this.#updateButtonIcon();
      }
  
      /** open/collapse "Thinking…" blocks */
      #autoToggle() {
        if (!this.enabled) return;
  
        /* collapse blocks whose answer started */
        document.querySelectorAll('details[data-auto-expanded]').forEach(d => {
          const next = d.nextElementSibling;
          if (next && next.matches(this.SEL.content)) {
            d.open = false;
            d.removeAttribute('data-auto-expanded');
          }
        });
  
        /* manage new "Thinking…" blocks */
        document.querySelectorAll(this.SEL.thought).forEach(d => {
          if (d.dataset.autoExpanded || d.dataset.userInteracted) return;
  
          const label = d.querySelector('summary')?.textContent || '';
          if (!/Thinking|Thought/i.test(label)) return;
  
          d.open = true;
          d.dataset.autoExpanded = '1';
  
          /* collapse immediately if answer already there */
          const next = d.nextElementSibling;
          if (next && next.matches(this.SEL.content)) {
            d.open = false;
            d.removeAttribute('data-auto-expanded');
          }
        });
  
        /* track manual clicks to stop auto‑handling */
        document.querySelectorAll(`${this.SEL.thought}>summary:not([data-clicked])`)
          .forEach(s => {
            s.addEventListener('click', () => {
              const d = s.closest(this.SEL.thought);
              if (d) {
                d.dataset.userInteracted = '1';
                d.removeAttribute('data-auto-expanded');
              }
            }, {capture:true});
            s.dataset.clicked = '1';
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
  
        svg.outerHTML = this.enabled
          ? '<svg class="w-[18px] h-[18px] shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="3" y="3" width="18" height="18" rx="4" stroke="currentColor" stroke-width="2"/><path d="M9 12l2 2 4-4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>'
          : '<svg class="w-[18px] h-[18px] shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="3" y="3" width="18" height="18" rx="4" stroke="currentColor" stroke-width="2"/></svg>';
      }
    }
  
    /* bootstrap */
    document.readyState === 'loading'
      ? document.addEventListener('DOMContentLoaded', () => new AutoThoughtToggle())
      : new AutoThoughtToggle();
})(); 
  