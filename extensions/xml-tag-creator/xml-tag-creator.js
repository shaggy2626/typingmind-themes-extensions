/**
 * TypingMind – XML Tag Creator
 *
 * Lets you wrap any text or code in custom XML tags—straight from the TypingMind
 * chat box—with a single click.
 *
 * Key Features
 * ------------
 * • Adds a "Wrap in XML Tag" button to the chat-input toolbar.  
 * • Opens a modal where you:
 *     – Type or click one of your 10 most-recent tags (stored in localStorage).  
 *     – Paste or type the content to wrap.  
 *     – Optionally toggle CDATA wrapping.  
 * • Sanitises tag names (lowercase; letters, numbers, hyphens, underscores; 
 *   prefixes invalid starts with "_") to ensure valid XML.  
 * • Inserts the formatted block at the cursor and fires real input events so
 *   TypingMind's React UI updates instantly.  
 * • MutationObserver re-injects the toolbar button if the UI rerenders.
 *
 * Perfect for creating consistent, well-structured prompts without manually
 * typing XML tags every time.
 */
(() => {
  'use strict';

  if (window.__tmxXmlTagCreatorInstalled) return;
  window.__tmxXmlTagCreatorInstalled = true;

  class XmlTagCreator {
    /* ─── Constants ───────────────────────── */
    static STORAGE_KEY   = 'xml_tag_creator_recent_tags';
    static MAX_RECENTS   = 10;
    static DEFAULT_TAG   = 'code';
    static MODAL_Z_INDEX = 9999;
    static TEXTAREA_HEIGHT = 48;
    
    /* ─── Common CSS Classes ───────────────── */
    static CSS = {
      INPUT_BASE: 'bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700',
      TEXT_MUTED: 'text-xs text-slate-500 dark:text-slate-400',
      BUTTON_SMALL: 'px-2 py-1 bg-slate-200 dark:bg-slate-700 text-xs rounded-md hover:bg-slate-300 dark:hover:bg-slate-600',
      CHECKBOX: 'h-4 w-4 cursor-pointer',
      LABEL: 'text-sm cursor-pointer'
    };

    /* ─── Static helpers ──────────────────── */
    /**
     * Normalises a raw string so it is safe for use as an XML tag name.
     *
     * @param {string} tag        Raw user input.
     * @param {boolean} trimEdges When true (default) leading/trailing
     *                            underscores produced by the replacement
     *                            step are removed. Pass false while the user
     *                            is typing so that underscores replacing
     *                            spaces are visible immediately.
     */
    static sanitize(tag = '', trimEdges = true) {
      let clean = tag
        .toLowerCase()
        // replace invalid characters (including space) with underscore
        .replace(/[^a-z0-9_-]+/g, '_')
        // collapse multiple underscores that may appear after successive
        // space-presses (or other invalid chars) into a single one
        .replace(/_+/g, '_');

      if (trimEdges) clean = clean.replace(/^_+|_+$/g, '');

      if (!clean || clean === XmlTagCreator.DEFAULT_TAG) return '';
      if (clean.startsWith('xml') || !/^[a-z_]/.test(clean)) clean = `_${clean}`;
      return clean;
    }

    /** Sets value on controlled <textarea>/<input> and triggers React's onChange */
    static setValue(el, v) {
      // Check if there's a custom property descriptor (e.g., from markdown renderer)
      const customDescriptor = Object.getOwnPropertyDescriptor(el, 'value');
      
      if (customDescriptor && customDescriptor.set) {
        // Custom setter exists (markdown renderer is active) - use direct assignment
        el.value = v;
      } else {
        // No custom setter - use prototype setter for React compatibility
        const setter = Object.getOwnPropertyDescriptor(el.__proto__, 'value')?.set;
        setter ? setter.call(el, v) : (el.value = v);
      }
      
      el.dispatchEvent(new Event('input', { bubbles: true }));
    }

    /* ─── Construction / state ────────────── */
    constructor() {
      this.sel = {
        chatInput : '#chat-input-textbox',
        // Target the left action group container, not an inner button
        toolbar   : '[data-element-id="chat-input-actions"] .items-center.justify-start',
        voiceBtn  : '[data-element-id="voice-input-button"]',
        insertBtn : '[data-element-id="insert-code-button"]',
        root      : '#app'
      };

      this.state = {
        useCDATA     : false,
        useCodeBlock : false,
        codeLang     : '',
        recent       : this.loadRecents(),
        overlay      : null
      };

      this.init();
    }

    /* ─── localStorage (recent tags) ──────── */
    loadRecents() {
      try { return JSON.parse(localStorage.getItem(XmlTagCreator.STORAGE_KEY)) ?? []; }
      catch { return []; }
    }
    saveRecents() {
      localStorage.setItem(XmlTagCreator.STORAGE_KEY, JSON.stringify(this.state.recent));
    }
    pushRecent(tag) {
      if (!tag) return;
      this.state.recent = [tag, ...this.state.recent.filter(t => t !== tag)]
                          .slice(0, XmlTagCreator.MAX_RECENTS);
      this.saveRecents();
    }

    /* ─── DOM factory ─────────────────────── */
    el(tag, cls = '', text = '', attrs = {}, ...kids) {
      const e = document.createElement(tag);
      if (cls ) e.className = cls;
      if (text) e.textContent = text;
      Object.entries(attrs).forEach(([k, v]) => e.setAttribute(k, v));
      kids.forEach(k => k && e.append(k));
      return e;
    }

    /* ─── Modal UI ────────────────────────── */
    buildModal() {
      // Reset state for a fresh modal
      this.resetModalState();

      const { overlay, modal } = this.createModalShell();
      const { tagInput, hintElement } = this.createTagInputSection();
      modal.append(tagInput, hintElement);
      
      if (this.state.recent.length) {
        modal.append(this.createRecentTagsSection(tagInput));
      }
      
      const codeTextarea = this.createCodeTextarea();
      modal.append(codeTextarea);
      
      const footer = this.createFooterControls();
      modal.append(footer);
      
      document.body.append(overlay);
      this.state.overlay = overlay;
      
      this.attachModalEventHandlers(tagInput, hintElement, codeTextarea, footer, overlay);
      tagInput.focus();
    }
    
    resetModalState() {
      this.state.useCodeBlock = false;
      this.state.useCDATA = false;
      this.state.codeLang = '';
    }
    
    createModalShell() {
      const overlay = this.el('div',
        `fixed inset-0 bg-black/50 z-[${XmlTagCreator.MODAL_Z_INDEX}] flex items-center justify-center`);
      const modal = this.el('div',
        'bg-white dark:bg-slate-900 p-6 rounded-lg shadow-2xl max-w-2xl w-full mx-4 border border-slate-200 dark:border-slate-700');
      overlay.append(modal);
      return { overlay, modal };
    }
    
    createTagInputSection() {
      const tagInput = this.el('input',
        `w-full p-2 mb-2 ${XmlTagCreator.CSS.INPUT_BASE} rounded-md`,
        '', { placeholder: 'XML Tag Name' });
      const hintElement = this.el('div',
        `hidden ${XmlTagCreator.CSS.TEXT_MUTED} mb-4`,
        'Only letters, numbers, hyphens, underscores. Must start with letter or _.');
      
      return { tagInput, hintElement };
    }
    
    createRecentTagsSection(tagInput) {
      const wrapper = this.el('div', 'mb-4');
      const header = this.el('div', 'flex justify-between items-center mb-2');
      const label = this.el('div', XmlTagCreator.CSS.TEXT_MUTED, 'Recent tags:');
      const clearButton = this.el('button', 'text-xs text-blue-600 dark:text-blue-400 hover:underline', 'Clear');
      
      clearButton.type = 'button';
      clearButton.onclick = () => {
        this.state.recent = [];
        this.saveRecents();
        wrapper.remove();
      };
      
      header.append(label, clearButton);
      wrapper.append(header);
      
      const tagCloud = this.el('div', 'flex flex-wrap gap-2');
      this.state.recent.forEach(tagName => {
        const tagButton = this.el('button', XmlTagCreator.CSS.BUTTON_SMALL, tagName);
        tagButton.onclick = () => { 
          XmlTagCreator.setValue(tagInput, tagName); 
          // Code textarea will be focused by handler
        };
        tagCloud.append(tagButton);
      });
      
      wrapper.append(tagCloud);
      return wrapper;
    }
    
    createCodeTextarea() {
      return this.el('textarea',
        `w-full h-${XmlTagCreator.TEXTAREA_HEIGHT} p-2 mb-4 ${XmlTagCreator.CSS.INPUT_BASE} rounded-md font-mono text-sm`,
        '', { placeholder: 'Paste your code here…' });
    }
    
    createFooterControls() {
      const footer = this.el('div', 'flex items-center justify-between');
      const toggleContainer = this.el('div', 'flex flex-col gap-2');
      
      const codeBlockRow = this.createCodeBlockRow();
      const cdataRow = this.createCdataRow();
      
      toggleContainer.append(codeBlockRow, cdataRow);
      
      const insertButton = this.el('button',
        'px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700',
        'Insert');
      
      footer.append(toggleContainer, insertButton);
      return footer;
    }
    
    createCodeBlockRow() {
      const row = this.el('div', 'flex items-center gap-2');
      const checkbox = this.el('input', XmlTagCreator.CSS.CHECKBOX, '', { type: 'checkbox', id: 'codeblock' });
      checkbox.checked = this.state.useCodeBlock;
      
      const label = this.el('label', XmlTagCreator.CSS.LABEL, 'Code block', { for: 'codeblock' });
      const langInput = this.el('input', 
        `w-20 p-1 ${XmlTagCreator.CSS.INPUT_BASE} rounded-md text-xs`, 
        '', { placeholder: 'lang' });
      langInput.value = this.state.codeLang;
      langInput.style.display = this.state.useCodeBlock ? '' : 'none';
      
      row.append(label, checkbox, langInput);
      row.dataset.checkbox = 'codeblock'; // For event handler reference
      row.dataset.langInput = 'lang';
      return row;
    }
    
    createCdataRow() {
      const row = this.el('div', 'flex items-center gap-2');
      const checkbox = this.el('input', XmlTagCreator.CSS.CHECKBOX, '', { type: 'checkbox', id: 'cdata' });
      checkbox.checked = this.state.useCDATA;
      
      const label = this.el('label', XmlTagCreator.CSS.LABEL, 'CDATA', { for: 'cdata' });
      
      row.append(label, checkbox);
      row.dataset.checkbox = 'cdata'; // For event handler reference
      return row;
    }
    
    attachModalEventHandlers(tagInput, hintElement, codeTextarea, footer, overlay) {
      // Space-to-underscore handler
      this.attachSpaceToUnderscoreHandler(tagInput);
      
      // Live validation
      this.attachTagValidationHandler(tagInput, hintElement);
      
      // Tab navigation
      this.attachTabNavigationHandler(tagInput, codeTextarea);
      
      // Toggle handlers
      this.attachToggleHandlers(footer);
      
      // Insert handlers
      this.attachInsertHandlers(tagInput, codeTextarea, footer, overlay);
      
      // Close handlers
      this.attachCloseHandlers(overlay);
    }
    
    attachSpaceToUnderscoreHandler(tagInput) {
      tagInput.addEventListener('keydown', event => {
        if (event.key !== ' ') return;
        event.preventDefault();

        const { selectionStart, selectionEnd, value } = tagInput;

        // Don't add another underscore if one already exists before cursor
        if (selectionStart === selectionEnd && value[selectionStart - 1] === '_') {
          return;
        }

        const newValue = value.slice(0, selectionStart) + '_' + value.slice(selectionEnd);
        tagInput.value = newValue;

        const cursorPosition = selectionStart + 1;
        tagInput.setSelectionRange(cursorPosition, cursorPosition);

        // Trigger validation
        tagInput.dispatchEvent(new Event('input', { bubbles: true }));
      });
    }
    
    attachTagValidationHandler(tagInput, hintElement) {
      tagInput.addEventListener('input', () => {
        const cleaned = XmlTagCreator.sanitize(tagInput.value, false);
        if (tagInput.value !== cleaned) tagInput.value = cleaned;
        hintElement.classList.toggle('hidden', !tagInput.value);
      });
    }
    
    attachTabNavigationHandler(tagInput, codeTextarea) {
      tagInput.addEventListener('keydown', event => {
        if (event.key === 'Tab' && !event.shiftKey) {
          event.preventDefault();
          codeTextarea.focus();
        }
      });
    }
    
    attachToggleHandlers(footer) {
      const cdataCheckbox = footer.querySelector('#cdata');
      const codeBlockCheckbox = footer.querySelector('#codeblock');
      const langInput = footer.querySelector('[placeholder="lang"]');
      
      cdataCheckbox.onchange = event => {
        this.state.useCDATA = event.target.checked;
      };
      
      codeBlockCheckbox.onchange = event => {
        this.state.useCodeBlock = event.target.checked;
        langInput.style.display = this.state.useCodeBlock ? '' : 'none';
      };
      
      langInput.oninput = event => {
        this.state.codeLang = event.target.value.trim();
      };
    }
    
    attachInsertHandlers(tagInput, codeTextarea, footer, overlay) {
      const insertButton = footer.querySelector('button');
      
      const performInsert = () => {
        if (!codeTextarea.value.trim()) {
          return alert('Please paste your code.');
        }
        
        const xmlTag = XmlTagCreator.sanitize(tagInput.value) || XmlTagCreator.DEFAULT_TAG;
        this.pushRecent(xmlTag);
        
        const snippet = this.buildXmlSnippet(xmlTag, codeTextarea.value);
        this.insertSnippetIntoChat(snippet);
        this.closeModal(overlay);
      };
      
      insertButton.onclick = performInsert;
      tagInput.addEventListener('keydown', event => {
        if (event.key === 'Enter') {
          event.preventDefault();
          performInsert();
        }
      });
      codeTextarea.addEventListener('keydown', event => {
        if (event.key === 'Enter' && !event.shiftKey) {
          event.preventDefault();
          performInsert();
        }
      });
    }
    
    buildXmlSnippet(xmlTag, content) {
      let innerContent = content;
      
      if (this.state.useCodeBlock) {
        const language = this.state.codeLang || '';
        innerContent = '```' + language + '\n' + innerContent + '\n```';
      }
      
      const xmlBlock = this.state.useCDATA
        ? `<${xmlTag}>\n<![CDATA[\n${innerContent}\n]]>\n</${xmlTag}>`
        : `<${xmlTag}>\n${innerContent}\n</${xmlTag}>`;
      
      // Add double line breaks before and after the XML block for proper spacing
      return `\n\n${xmlBlock}\n\n`;
    }
    
    insertSnippetIntoChat(snippet) {
      const textarea = document.querySelector(this.sel.chatInput);
      if (!textarea) return;
      
      const { value, selectionStart } = textarea;
      const newValue = value.slice(0, selectionStart) + snippet + value.slice(selectionStart);
      XmlTagCreator.setValue(textarea, newValue);
      
      const cursorPosition = selectionStart + snippet.length;
      textarea.focus();
      textarea.setSelectionRange(cursorPosition, cursorPosition);
    }
    
    attachCloseHandlers(overlay) {
      const handleEscape = event => {
        if (event.key === 'Escape') {
          this.closeModal(overlay, handleEscape);
        }
      };
      
      document.addEventListener('keydown', handleEscape);
      overlay.addEventListener('click', event => {
        if (event.target === overlay) {
          this.closeModal(overlay, handleEscape);
        }
      });
      
      // Store handler reference directly on the element (not in dataset which only holds strings)
      overlay._escapeHandler = handleEscape;
    }
    
    closeModal(overlay, escapeHandler = null) {
      const handler = escapeHandler || overlay._escapeHandler;
      if (handler) {
        document.removeEventListener('keydown', handler);
      }
      overlay.remove();
    }

    /* ─── Toolbar button ───────────────────── */
    addToolbarBtn() {
      const actions = document.querySelector('[data-element-id="chat-input-actions"]');
      const bar = actions?.querySelector('.items-center.justify-start') || document.querySelector(this.sel.toolbar);
      if (!bar) return;

      // Prevent nesting: ensure target is not a button element
      if (bar.tagName === 'BUTTON') return;

      // Dedupe across the page: keep the first, remove others
      const existing = Array.from(document.querySelectorAll(this.sel.insertBtn));
      if (existing.length > 1) existing.slice(1).forEach(el => { try { el.remove(); } catch {} });
      if (existing.length >= 1 && bar.contains(existing[0])) return;

      const btn = this.el('button',
        'group/canvas-btn relative w-9 h-9 rounded-lg text-slate-900 dark:text-white hover:bg-slate-900/20 dark:hover:bg-white/20 flex items-center justify-center',
        '');
      btn.type = 'button';
      btn.dataset.elementId      = 'insert-code-button';
      btn.dataset.tooltipId      = 'global';
      btn.dataset.tooltipContent = 'Wrap in XML Tag';
      btn.innerHTML = `
        <svg stroke="currentColor" fill="none" stroke-width="2" viewBox="0 0 24 24"
             stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5">
          <polyline points="16 18 22 12 16 6"></polyline>
          <polyline points="8 6 2 12 8 18"></polyline>
        </svg>`;
      btn.onclick = () => this.buildModal();

      const voice = actions?.querySelector(this.sel.voiceBtn);
      // Insert after voice button if present, otherwise as first child in the left group
      if (voice && voice.parentElement === bar) {
        bar.insertBefore(btn, voice.nextSibling);
      } else {
        bar.insertBefore(btn, bar.firstChild);
      }

      this.ensureOrder();
    }

    /* ─── Keep button alive on re-render ──── */
    ensureOrder() {
      if (this._orderingRunning) return;
      this._orderingRunning = true;
      try {
        const actions = document.querySelector('[data-element-id="chat-input-actions"]');
        const leftGroup = actions?.querySelector('.items-center.justify-start') || actions?.firstElementChild || actions;
        const thinkBtn = actions?.querySelector('[data-element-id="toggle-thinking-button"]');
        const effortWrap = document.getElementById('tmx-reason-wrap');
        const xmlBtn = actions?.querySelector(this.sel.insertBtn);
        if (leftGroup && thinkBtn && effortWrap) {
          const desiredAfterThink = thinkBtn.nextElementSibling;
          if (desiredAfterThink !== effortWrap) leftGroup.insertBefore(effortWrap, thinkBtn.nextElementSibling);
        }
        if (leftGroup && effortWrap && xmlBtn) {
          const desiredAfterWrap = effortWrap.nextElementSibling;
          if (desiredAfterWrap !== xmlBtn) leftGroup.insertBefore(xmlBtn, effortWrap.nextElementSibling);
        }
      } catch {}
      finally { this._orderingRunning = false; }
    }

    observeToolbar() {
      const root = document.body;
      const obs = new MutationObserver((mutations) => {
        if (this._orderScheduled) return;
        this._orderScheduled = true;
        requestAnimationFrame(() => {
          this._orderScheduled = false;
          for (const m of mutations) {
            if (m.type !== 'childList') continue;
            const nodes = [...m.addedNodes, ...m.removedNodes];
            for (const n of nodes) {
              if (n && n.nodeType === 1) {
                const el = /** @type {Element} */(n);
                if (el.matches?.('[data-element-id="chat-input-actions"]') || el.querySelector?.('[data-element-id="chat-input-actions"]')) {
                  this.addToolbarBtn();
                  this.ensureOrder();
                  return;
                }
              }
            }
          }
        });
      });
      obs.observe(root, { childList: true, subtree: true });
    }

    /* ─── Init ────────────────────────────── */
    init() {
      const ready = () => { this.addToolbarBtn(); this.observeToolbar(); };
      document.readyState === 'loading'
        ? document.addEventListener('DOMContentLoaded', ready)
        : ready();
    }
  }

  /* bootstrap */
  new XmlTagCreator();
})();
