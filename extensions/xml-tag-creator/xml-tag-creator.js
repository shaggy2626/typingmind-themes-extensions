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

  class XmlTagCreator {
    /* ─── Constants ───────────────────────── */
    static STORAGE_KEY   = 'xml_tag_creator_recent_tags';
    static MAX_RECENTS   = 10;

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

      if (!clean || clean === 'code') return '';
      if (clean.startsWith('xml') || !/^[a-z_]/.test(clean)) clean = `_${clean}`;
      return clean;
    }

    /** Sets value on controlled <textarea>/<input> and triggers React's onChange */
    static setValue(el, v) {
      const setter = Object.getOwnPropertyDescriptor(el.__proto__, 'value')?.set;
      setter ? setter.call(el, v) : (el.value = v);
      el.dispatchEvent(new Event('input', { bubbles: true }));
    }

    /* ─── Construction / state ────────────── */
    constructor() {
      this.sel = {
        chatInput : '#chat-input-textbox',
        toolbar   : '[data-element-id="chat-input-actions"] .flex.items-center',
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
      this.state.useCodeBlock = false;
      this.state.useCDATA = false;
      this.state.codeLang = '';

      /* shell */
      const overlay = this.el('div',
        'fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center');
      const modal = this.el('div',
        'bg-white dark:bg-slate-900 p-6 rounded-lg shadow-2xl max-w-2xl w-full mx-4 border border-slate-200 dark:border-slate-700');
      overlay.append(modal);

      /* inputs */
      const tag   = this.el('input',
        'w-full p-2 mb-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md',
        '', { placeholder: 'XML Tag Name' });
      const hint  = this.el('div',
        'hidden text-xs text-slate-500 dark:text-slate-400 mb-4',
        'Only letters, numbers, hyphens, underscores. Must start with letter or _.');

      modal.append(tag, hint);

      /* space-to-underscore (fast path) */
      tag.addEventListener('keydown', e => {
        if (e.key !== ' ') return;
        e.preventDefault();

        const { selectionStart, selectionEnd, value } = tag;

        // If the character immediately before the caret is already an underscore
        // we don't need (or want) another one.
        if (selectionStart === selectionEnd && value[selectionStart - 1] === '_') {
          return;
        }

        const newVal = value.slice(0, selectionStart) + '_' + value.slice(selectionEnd);
        tag.value = newVal;

        const cur = selectionStart + 1;
        tag.setSelectionRange(cur, cur);

        // Trigger the input listener manually so the hint visibility updates.
        tag.dispatchEvent(new Event('input', { bubbles: true }));
      });

      /* recent tags – TOP position */
      if (this.state.recent.length) {
        const wrap = this.el('div', 'mb-4');
        const header = this.el('div', 'flex justify-between items-center mb-2');
        const label = this.el('div', 'text-xs text-slate-500 dark:text-slate-400', 'Recent tags:');
        const clearBtn = this.el('button', 'text-xs text-blue-600 dark:text-blue-400 hover:underline', 'Clear');
        clearBtn.type = 'button';
        clearBtn.onclick = () => {
          this.state.recent = [];
          this.saveRecents();
          wrap.remove();
        };
        header.append(label, clearBtn);
        wrap.append(header);

        const cloud = this.el('div', 'flex flex-wrap gap-2');
        this.state.recent.forEach(t => {
          const b = this.el('button',
            'px-2 py-1 bg-slate-200 dark:bg-slate-700 text-xs rounded-md hover:bg-slate-300 dark:hover:bg-slate-600',
            t);
          b.onclick = () => { XmlTagCreator.setValue(tag, t); code.focus(); };
          cloud.append(b);
        });
        wrap.append(cloud);
        modal.append(wrap);
      }

      /* code textarea */
      const code  = this.el('textarea',
        'w-full h-48 p-2 mb-4 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md font-mono text-sm',
        '', { placeholder: 'Paste your code here…' });
      modal.append(code);

      /* footer */
      const foot  = this.el('div', 'flex items-center justify-between');
      const toggleContainer = this.el('div', 'flex flex-col gap-2');

      /* -- Row 1: Code block -- */
      const codeBlockRow = this.el('div', 'flex items-center gap-2');
      const bIn   = this.el('input','h-4 w-4 cursor-pointer','', { type:'checkbox', id:'codeblock' });
      bIn.checked = this.state.useCodeBlock;
      const bLab  = this.el('label','text-sm cursor-pointer','Code block',{ for:'codeblock' });
      const langIn = this.el('input','w-20 p-1 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md text-xs','', { placeholder:'lang' });
      langIn.value = this.state.codeLang;
      langIn.style.display = this.state.useCodeBlock ? '' : 'none';
      codeBlockRow.append(bLab, bIn, langIn);

      /* -- Row 2: CDATA -- */
      const cdataRow = this.el('div', 'flex items-center gap-2');
      const cIn   = this.el('input','h-4 w-4 cursor-pointer','', { type:'checkbox', id:'cdata' });
      cIn.checked = this.state.useCDATA;
      const cLab  = this.el('label','text-sm cursor-pointer','CDATA',{ for:'cdata' });
      cdataRow.append(cLab, cIn);

      toggleContainer.append(codeBlockRow, cdataRow);

      const insert = this.el('button',
        'px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700',
        'Insert');
      foot.append(toggleContainer, insert);
      modal.append(foot);

      /* mount + events */
      document.body.append(overlay);
      this.state.overlay = overlay;
      tag.focus();

      /* live validation: keep underscores visible while typing */
      tag.addEventListener('input', () => {
        const clean = XmlTagCreator.sanitize(tag.value, false);
        if (tag.value !== clean) tag.value = clean;
        hint.classList.toggle('hidden', !tag.value);
      });

      /* tab handler */
      tag.addEventListener('keydown', e => {
        if (e.key === 'Tab' && !e.shiftKey) {
          e.preventDefault();
          code.focus();
        }
      });

      /* toggle listeners */
      cIn.onchange   = e => (this.state.useCDATA     = e.target.checked);
      bIn.onchange   = e => {
        this.state.useCodeBlock = e.target.checked;
        langIn.style.display = this.state.useCodeBlock ? '' : 'none';
      };
      langIn.oninput = e => (this.state.codeLang     = e.target.value.trim());

      /* insert logic */
      const doInsert = () => {
        if (!code.value.trim()) return alert('Please paste your code.');
        const xmlTag  = XmlTagCreator.sanitize(tag.value) || 'code';
        this.pushRecent(xmlTag);
        let inner = code.value;
        if (this.state.useCodeBlock) {
          const lang = this.state.codeLang || '';
          inner = '```' + lang + '\n' + inner + '\n```';
        }
        const snippet = this.state.useCDATA
          ? `<${xmlTag}>\n<![CDATA[\n${inner}\n]]>\n</${xmlTag}>`
          : `<${xmlTag}>\n${inner}\n</${xmlTag}>`;

        const tb = document.querySelector(this.sel.chatInput);
        if (!tb) return;
        const { value, selectionStart } = tb;
        const newVal = value.slice(0, selectionStart) + snippet + value.slice(selectionStart);
        XmlTagCreator.setValue(tb, newVal);
        const cur = selectionStart + snippet.length;
        tb.focus();
        tb.setSelectionRange(cur, cur);
        close();
      };

      insert.onclick = doInsert;
      tag.addEventListener('keydown',  e => e.key === 'Enter' && (e.preventDefault(), doInsert()));
      code.addEventListener('keydown', e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), doInsert()));

      const close = () => { overlay.remove(); document.removeEventListener('keydown', esc); };
      const esc   = e => e.key === 'Escape' && close();
      document.addEventListener('keydown', esc);
      overlay.addEventListener('click', e => e.target === overlay && close());
    }

    /* ─── Toolbar button ───────────────────── */
    addToolbarBtn() {
      const bar = document.querySelector(this.sel.toolbar);
      if (!bar || bar.querySelector(this.sel.insertBtn)) return;

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

      const voice = bar.querySelector(this.sel.voiceBtn);
      bar.insertBefore(btn, voice?.nextSibling ?? null);
    }

    /* ─── Keep button alive on re-render ──── */
    observeToolbar() {
      const root = document.querySelector(this.sel.root) || document.body;
      new MutationObserver(() => this.addToolbarBtn())
        .observe(root, { childList: true, subtree: true });
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
