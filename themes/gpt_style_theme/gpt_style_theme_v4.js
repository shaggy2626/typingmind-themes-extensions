(function () {
    /**
     * TypingMind GPT-Style Theme v4.0
     * Configuration and selector definitions
     */
    const CONFIG = {
      colors: {
        background: '#F9F9F9',
        text: '#000',
        border: '#ccc',
        input: {
          background: '#f4f4f4',
          text: 'rgb(13, 13, 13)',
          placeholder: 'rgb(142, 142, 142)'
        },
        button: {
          primary: 'rgb(13, 13, 13)',
          hover: 'rgba(13, 13, 13, 0.8)'
        },
        thought: {
          text: '#0066CC'  // Blue color for thought sections
        }
      },
      fonts: {
        primary:
          'ui-sans-serif, -apple-system, system-ui, "Segoe UI", Helvetica, Arial, sans-serif',
        code:
          'ui-monospace, SFMono-Regular, Menlo, Consolas, Liberation Mono, monospace',
        thought: {
          size: '12px',
          lineHeight: '20px'
        }
      },
      spacing: { small: '0.5rem', medium: '1rem', large: '1.5rem' },
      borderRadius: { small: '0.5rem', medium: '1rem', large: '1.5rem' },
      formats: {
        months: {
          'Jan': 'January',
          'Feb': 'February',
          'Mar': 'March',
          'Apr': 'April',
          'May': 'May',
          'Jun': 'June',
          'Jul': 'July',
          'Aug': 'August',
          'Sep': 'September',
          'Oct': 'October',
          'Nov': 'November',
          'Dec': 'December'
        },
        daysOfWeek: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
        daysAbbr: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
      }
    };
  
    const SELECTORS = {
      CODE_BLOCKS: 'pre code',
      RESULT_BLOCKS: 'details pre',
      USER_MESSAGE_BLOCK: 'div[data-element-id="user-message"]',
      CHAT_SPACE: '[data-element-id="chat-space-middle-part"]',
      THOUGHT_DETAILS: 'details.text-slate-900',
      TIMESTAMP_BUTTONS: 'button[id^="message-timestamp-"]',
      DATE_SPANS: '[data-element-id="chat-date-info"] span',
      SIDEBAR: {
        WORKSPACE: '[data-element-id="workspace-bar"]',
        BACKGROUND: '[data-element-id="side-bar-background"]',
        BEGINNING: '[data-element-id="sidebar-beginning-part"]',
        MIDDLE: '[data-element-id="sidebar-middle-part"]',
        SEARCH: '[data-element-id="search-chats-bar"]',
        NEW_CHAT: '[data-element-id="new-chat-button-in-side-bar"]'
      }
    };
  
    const Utils = {
      debounce: (fn, delay) => {
        let timeout;
        return (...args) => {
          clearTimeout(timeout);
          timeout = setTimeout(() => fn(...args), delay);
        };
      },
      safe: (fn, context = 'unknown') => {
        try {
          return fn();
        } catch (e) {
          console.error(`Error in ${context}:`, e);
          return null;
        }
      },
      escapeHtml: str =>
        typeof str !== 'string'
          ? ''
          : str
              .replace(/&/g, '&amp;')
              .replace(/</g, '&lt;')
              .replace(/>/g, '&gt;')
              .replace(/"/g, '&quot;')
              .replace(/'/g, '&#039;')
    };
  
    /* ---------------- Sidebar Modifications ---------------- */
    /**
     * Applies styling to the sidebar elements
     * Creates and injects CSS for sidebar styling
     */
    function applySidebarStyles() {
      // Skip if already applied
      if (document.getElementById('typingmindSidebarFixMerged')) return;
      
      const sidebarStyle = document.createElement('style');
      sidebarStyle.id = 'typingmindSidebarFixMerged';
      sidebarStyle.type = 'text/css';
      
      // Generate CSS for sidebar elements
      const styles = [
        // Main sidebar containers
        `${SELECTORS.SIDEBAR.WORKSPACE}, 
         ${SELECTORS.SIDEBAR.BACKGROUND}, 
         ${SELECTORS.SIDEBAR.BEGINNING}, 
         ${SELECTORS.SIDEBAR.MIDDLE} { background-color: ${CONFIG.colors.background} !important; }`,
        
        // New chat button
        `${SELECTORS.SIDEBAR.NEW_CHAT} { background-color: #E3E3E3 !important; color: ${CONFIG.colors.text} !important; }`,
        `${SELECTORS.SIDEBAR.NEW_CHAT} * { color: ${CONFIG.colors.text} !important; }`,
        
        // Search bar
        `${SELECTORS.SIDEBAR.SEARCH} { 
           background-color: #fff !important; 
           color: ${CONFIG.colors.text} !important; 
           border: 1px solid ${CONFIG.colors.border} !important; 
         }`,
        
        // Search placeholder text
        `${SELECTORS.SIDEBAR.SEARCH}[placeholder]::placeholder,
         ${SELECTORS.SIDEBAR.SEARCH}::-webkit-input-placeholder,
         ${SELECTORS.SIDEBAR.SEARCH}::-moz-placeholder,
         ${SELECTORS.SIDEBAR.SEARCH}:-ms-input-placeholder { 
           color: rgba(0,0,0,0.6) !important; 
           opacity: 1 !important; 
           -webkit-text-fill-color: rgba(0,0,0,0.6) !important; 
         }`,
        
        // Text colors for sidebar elements
        `${SELECTORS.SIDEBAR.WORKSPACE} *:not(svg):not(path)[class*="text-white"],
         ${SELECTORS.SIDEBAR.WORKSPACE} *:not(svg):not(path)[class*="text-white/"],
         ${SELECTORS.SIDEBAR.WORKSPACE} *:not(svg):not(path)[class*="text-gray-"],
         ${SELECTORS.SIDEBAR.WORKSPACE} *:not(svg):not(path)[class*="dark:text-white"],
         ${SELECTORS.SIDEBAR.BACKGROUND} *:not(svg):not(path)[class*="text-white"],
         ${SELECTORS.SIDEBAR.BACKGROUND} *:not(svg):not(path)[class*="text-white/"],
         ${SELECTORS.SIDEBAR.BACKGROUND} *:not(svg):not(path)[class*="text-gray-"],
         ${SELECTORS.SIDEBAR.BACKGROUND} *:not(svg):not(path)[class*="dark:text-white"]
         { color: ${CONFIG.colors.text} !important; opacity: 1 !important; --tw-text-opacity: 1 !important; }`,
        
        // Chat item styling
        `[data-element-id="custom-chat-item"]:hover,
         [data-element-id="selected-chat-item"] { background-color: #E3E3E3 !important; }`,
        
        // Chat item buttons (hide by default, show on hover)
        `[data-element-id="custom-chat-item"] button[aria-label="Delete Chat"],
         [data-element-id="custom-chat-item"] button[aria-label="Favorite Chat"],
         [data-element-id="custom-chat-item"] button[aria-label="Chat settings"],
         [data-element-id="selected-chat-item"] button[aria-label="Delete Chat"],
         [data-element-id="selected-chat-item"] button[aria-label="Favorite Chat"],
         [data-element-id="selected-chat-item"] button[aria-label="Chat settings"] { display: none !important; }`,
        
        `[data-element-id="custom-chat-item"]:hover button[aria-label="Delete Chat"],
         [data-element-id="custom-chat-item"]:hover button[aria-label="Favorite Chat"],
         [data-element-id="custom-chat-item"]:hover button[aria-label="Chat settings"],
         [data-element-id="selected-chat-item"]:hover button[aria-label="Delete Chat"],
         [data-element-id="selected-chat-item"]:hover button[aria-label="Favorite Chat"],
         [data-element-id="selected-chat-item"]:hover button[aria-label="Chat settings"],
         [data-element-id="custom-chat-item"] button[aria-expanded="true"],
         [data-element-id="selected-chat-item"] button[aria-expanded="true"] { display: inline-block !important; }`,
        
        // Headless UI Portal (dropdown menus)
        `#headlessui-portal-root { display: block !important; visibility: visible !important; pointer-events: auto !important; }`,
        `#headlessui-portal-root [role="menu"] { display: block !important; visibility: visible !important; background-color: white !important; color: black !important; pointer-events: auto !important; }`,
        `#headlessui-portal-root [role="menuitem"] { display: flex !important; visibility: visible !important; pointer-events: auto !important; }`,
        
        // Tag search panel
        `[data-element-id="tag-search-panel"] { background-color: ${CONFIG.colors.background} !important; border: 1px solid ${CONFIG.colors.border} !important; color: ${CONFIG.colors.text} !important; }`,
        `[data-element-id="tag-search-panel"] input[type="search"] { background-color: #fff !important; border: 1px solid ${CONFIG.colors.border} !important; color: ${CONFIG.colors.text} !important; }`,
        
        // Checkbox styling
        `[data-element-id="tag-search-panel"] input[type="checkbox"] { 
           appearance: none !important; 
           width: 16px !important; 
           height: 16px !important; 
           border: 1px solid ${CONFIG.colors.border} !important; 
           border-radius: 3px !important; 
           background-color: #fff !important; 
           position: relative !important; 
           cursor: pointer !important; 
         }`,
         
        `[data-element-id="tag-search-panel"] input[type="checkbox"]:checked { 
           background-color: #2563eb !important; 
           border-color: #2563eb !important; 
         }`,
         
        `[data-element-id="tag-search-panel"] input[type="checkbox"]:checked::after { 
           content: '' !important; 
           position: absolute !important; 
           left: 5px !important; 
           top: 2px !important; 
           width: 4px !important; 
           height: 8px !important; 
           border: solid white !important; 
           border-width: 0 2px 2px 0 !important; 
           transform: rotate(45deg) !important; 
         }`,
         
        // Text colors for tag panel
        `[data-element-id="tag-search-panel"] label,
         [data-element-id="tag-search-panel"] p,
         [data-element-id="tag-search-panel"] span,
         [data-element-id="tag-search-panel"] button { color: ${CONFIG.colors.text} !important; }`,
         
        // Scrollbar styling
        `[data-element-id="tag-search-panel"] .overflow-auto::-webkit-scrollbar { width: 8px !important; }`,
        `[data-element-id="tag-search-panel"] .overflow-auto::-webkit-scrollbar-track { background: #f1f1f1 !important; border-radius: 4px !important; }`,
        `[data-element-id="tag-search-panel"] .overflow-auto::-webkit-scrollbar-thumb { background: #c1c1c1 !important; border-radius: 4px !important; }`,
        `[data-element-id="tag-search-panel"] .overflow-auto::-webkit-scrollbar-thumb:hover { background: #a1a1a1 !important; }`,
        `[data-element-id="tag-search-panel"] .overflow-auto { scrollbar-width: thin !important; scrollbar-color: #c1c1c1 #f1f1f1 !important; }`,
        
        // Textarea styling
        `[data-element-id="chat-folder"] textarea,
         [data-element-id="custom-chat-item"] textarea,
         [data-element-id="selected-chat-item"] textarea,
         [data-element-id="side-bar-background"] textarea { 
           background-color: #fff !important; 
           color: ${CONFIG.colors.text} !important; 
           border: 1px solid ${CONFIG.colors.border} !important; 
         }`,
         
        `[data-element-id="chat-folder"] textarea:focus,
         [data-element-id="custom-chat-item"] textarea:focus,
         [data-element-id="selected-chat-item"] textarea:focus,
         [data-element-id="side-bar-background"] textarea:focus { 
           background-color: #fff !important; 
           color: ${CONFIG.colors.text} !important; 
           border-color: #2563eb !important; 
           box-shadow: 0 0 0 2px rgba(37,99,235,0.2) !important; 
         }`,
        
        // Hover effects
        `[data-element-id="workspace-bar"] button span.hover\\:bg-white\\/20:hover,
         [data-element-id="workspace-bar"] button:hover span.text-white\\/70,
         [data-element-id="workspace-profile-button"]:hover { background-color: rgba(0,0,0,0.1) !important; }`
      ];
      
      sidebarStyle.innerHTML = styles.join('\n');
      document.head.appendChild(sidebarStyle);
      
      // Set up observer to ensure styles persist
      new MutationObserver(() => {
        if (!document.getElementById('typingmindSidebarFixMerged'))
          document.head.appendChild(sidebarStyle);
      }).observe(document.body, { childList: true, subtree: true });
      
      console.log('TypingMind Sidebar Mods loaded.');
    }
    
    /**
     * Ensures search bar has a placeholder text
     */
    function fixSearchPlaceholder() {
      const input = document.querySelector(SELECTORS.SIDEBAR.SEARCH);
      if (input && !input.placeholder) input.setAttribute('placeholder', 'Search chats');
    }

    // Initialize sidebar styles
    document.addEventListener('DOMContentLoaded', () => {
      applySidebarStyles();
      fixSearchPlaceholder();
    });
    
    // Apply sidebar styles immediately (don't wait for DOMContentLoaded)
    if (!document.getElementById('typingmindSidebarFixMerged')) {
      applySidebarStyles();
      fixSearchPlaceholder();
    }
  
    /* ---------------- Main Chat & Input Styles ---------------- */
    const mainStyle = document.createElement('style');
    mainStyle.textContent = `
      [data-element-id="chat-space-middle-part"] .prose.max-w-full *:not(
        pre, pre *, code, code *, .flex.items-start.justify-center.flex-col.gap-2 *,
        .text-xs.text-gray-500.truncate, .italic.truncate.hover\\:underline, h1, h2, h3, h4, h5, h6
      ),
      [data-element-id="chat-space-middle-part"] [data-element-id="user-message"] > div {
        font-family: ${CONFIG.fonts.primary}; font-size: 14px !important; line-height: 28px !important; color: ${CONFIG.colors.text} !important;
      }
      [data-element-id="chat-space-middle-part"] .prose.max-w-full,
      [data-element-id="chat-space-middle-part"] [data-element-id="user-message"] {
        font-family: ${CONFIG.fonts.primary}; font-size: 14px !important; line-height: 28px !important; color: ${CONFIG.colors.text} !important;
      }
      [data-element-id="chat-space-middle-part"] .text-xs.text-gray-500.truncate,
      [data-element-id="chat-space-middle-part"] .italic.truncate.hover\\:underline,
      [data-element-id="chat-space-middle-part"] .flex.items-start.justify-center.flex-col.gap-2 {
        font-size: unset !important; line-height: unset !important; font-family: unset !important; color: unset !important;
      }
      [data-element-id="chat-space-middle-part"] [data-element-id="response-block"]:has([data-element-id="user-message"]) [data-element-id="chat-avatar-container"] {
        display: none !important;
      }
      [data-element-id="chat-space-middle-part"] [data-element-id="user-message"] {
        margin-left: auto !important; margin-right: 0 !important; display: block !important; max-width: 70% !important;
        border-radius: ${CONFIG.borderRadius.large} !important; background-color: ${CONFIG.colors.input.background} !important;
        color: ${CONFIG.colors.text} !important; padding: ${CONFIG.spacing.small} !important; margin-bottom: ${CONFIG.spacing.small} !important;
      }
      [data-element-id="chat-space-middle-part"] [data-element-id="user-message"],
      [data-element-id="chat-space-middle-part"] [data-element-id="user-message"] > div {
        background-color: ${CONFIG.colors.input.background} !important;
      }
      [data-element-id="chat-space-middle-part"] pre:has(div.relative) {
        background-color: #F9F9F9 !important; border: 1px solid ${CONFIG.colors.border} !important; border-radius: ${CONFIG.borderRadius.small} !important;
      }
      [data-element-id="chat-space-middle-part"] pre.mb-2.overflow-auto.text-sm.border.border-gray-200.rounded.bg-gray-100 {
        background-color: #000 !important; color: #fff !important; border: none !important; padding: 8px !important; border-radius: 4px !important;
        white-space: pre-wrap !important; word-wrap: break-word !important; overflow-x: hidden !important;
      }
      [data-element-id="chat-space-middle-part"] pre > div.relative { position: relative !important; }
      [data-element-id="chat-space-middle-part"] pre > div.relative > div.sticky {
        position: sticky !important; top: 0 !important; z-index: 10 !important; background-color: #F9F9F9 !important;
        border-radius: 0.5rem 0.5rem 0 0 !important; border-bottom: 1px solid ${CONFIG.colors.border} !important;
      }
      [data-element-id="chat-space-middle-part"] pre > div.relative > div > pre {
        border: none !important; background: transparent !important; margin: 0 !important;
      }
      [data-element-id="chat-space-middle-part"] [data-element-id="response-block"]:hover { background-color: transparent !important; }
      [data-element-id="chat-space-middle-part"] .prose.max-w-full ul,
      [data-element-id="chat-space-middle-part"] .prose.max-w-full ol { margin: 0.5rem 0 !important; }
      [data-element-id="chat-space-middle-part"] .prose.max-w-full li { margin: 0.3rem 0 !important; }
      [data-element-id="chat-space-middle-part"] .prose.max-w-full li::marker {
        color: ${CONFIG.colors.text} !important; font-weight: bold !important;
      }
      [data-element-id="chat-space-middle-part"] .prose.max-w-full ul > li { list-style-type: disc !important; padding-left: 0.5rem !important; }
      [data-element-id="chat-space-middle-part"] .prose.max-w-full ol > li { list-style-type: decimal !important; padding-left: 0.5rem !important; }
      [data-element-id="chat-space-middle-part"] .prose.max-w-full h1 { font-size: 2em !important; line-height: 1.3 !important; margin: 0.5em 0 !important; }
      [data-element-id="chat-space-middle-part"] .prose.max-w-full h2 { font-size: 1.5em !important; line-height: 1.3 !important; margin: 0.5em 0 !important; }
      [data-element-id="chat-space-middle-part"] .prose.max-w-full h3 { font-size: 1.25em !important; line-height: 1.3 !important; margin: 0.5em 0 !important; }
      
      /* Thought section styling - Make text red */
      [data-element-id="chat-space-middle-part"] details[open] summary:has(span:contains('Thought for')) + div,
      [data-element-id="chat-space-middle-part"] details.text-slate-900 summary:has(span:contains('Thought for')) + div,
      [data-element-id="chat-space-middle-part"] details[open] summary:has(span:contains('Thought for')) ~ div {
        color: ${CONFIG.colors.thought.text} !important;
      }
      [data-element-id="chat-space-middle-part"] details[open] summary:has(span:contains('Thought for')) + div *,
      [data-element-id="chat-space-middle-part"] details.text-slate-900 summary:has(span:contains('Thought for')) + div *,
      [data-element-id="chat-space-middle-part"] details[open] summary:has(span:contains('Thought for')) ~ div * {
        color: ${CONFIG.colors.thought.text} !important;
      }
    `;
    document.head.appendChild(mainStyle);
  
    const inputStyle = document.createElement('style');
    inputStyle.textContent = `
      [data-element-id="chat-space-end-part"] [role="presentation"] {
        background-color: ${CONFIG.colors.input.background};
        border-radius: ${CONFIG.borderRadius.large};
        margin-bottom: ${CONFIG.spacing.medium};
      }
      #chat-input-textbox {
        font-family: ${CONFIG.fonts.primary};
        font-size: 16px !important;
        line-height: 24px !important;
        min-height: 44px !important;
        padding: 0.75rem 1rem !important;
        border-radius: 1.5rem !important;
        color: ${CONFIG.colors.text} !important;
        border: 0 solid ${CONFIG.colors.border} !important;
        outline: none !important;
        margin: 8px 0 !important;
        overflow-wrap: break-word !important;
        tab-size: 4 !important;
        text-size-adjust: 100% !important;
        white-space: pre-wrap !important;
        font-variant-ligatures: none !important;
        -webkit-tap-highlight-color: transparent !important;
      }
      #chat-input-textbox::placeholder { color: ${CONFIG.colors.input.placeholder} !important; opacity: 1 !important; }
      /* Exclude send, more-options, and replace-only buttons so their text color is not forced to black */
      [data-element-id="chat-input-actions"] button:not([data-element-id="send-button"]):not([data-element-id="more-options-button"]):not([data-element-id="replace-only-button"]) {
        transition: all 0.2s ease !important;
        color: ${CONFIG.colors.text} !important;
      }
      [data-element-id="chat-input-actions"] button:not([data-element-id="send-button"]):not([data-element-id="more-options-button"]):not([data-element-id="replace-only-button"]) svg {
        width: 20px !important; height: 20px !important; vertical-align: middle !important;
      }
      [data-element-id="chat-input-actions"] button:not([data-element-id="send-button"]):not([data-element-id="more-options-button"]):not([data-element-id="replace-only-button"]):hover {
        background-color: rgba(0,0,0,0.1) !important; border-radius: 0.5rem !important;
      }
      [data-element-id="chat-input-actions"] { padding: 0.5rem 0.75rem !important; }
      [data-element-id="send-button"],
      [data-element-id="more-options-button"] {
        background-color: ${CONFIG.colors.button.primary} !important;
        border-color: ${CONFIG.colors.button.primary} !important;
      }
      [data-element-id="send-button"]:hover,
      [data-element-id="more-options-button"]:hover {
        background-color: ${CONFIG.colors.button.hover} !important;
        border-color: ${CONFIG.colors.button.hover} !important;
      }
    `;
    document.head.appendChild(inputStyle);
  
    /* ---------------- Text Parsing & Formatting ---------------- */
    /**
     * Parses text with Markdown-like formatting and converts to HTML
     * @param {string} txt - Text to parse
     * @returns {string} HTML formatted text
     */
    const multiStepParse = txt =>
      Utils.safe(() => {
        let res = txt;
        // Replace triple backticks with an optional language specifier into <pre><code> blocks.
        res = res.replace(/```(\w+)?\s*([\s\S]*?)\s*```/g, (_, lang, code) => {
          lang = lang ? lang.toLowerCase() : '';
          return `<pre style="background:${CONFIG.colors.background}; border:1px solid ${CONFIG.colors.border}; padding:6px; border-radius:${CONFIG.borderRadius.small}; overflow-x:auto; margin:0;" class="code-block${lang ? ' language-' + lang : ''}"><code style="font-family:${CONFIG.fonts.code}; font-size:13px; line-height:20px; white-space:pre; display:block; overflow-wrap:normal; word-break:normal;">${code}</code></pre>`;
        });
        // Replace inline code (backticks) with <code> tags styled similarly to ChatGPT.
        res = res.replace(/`([^`]+)`/g, (_, inline) =>
          `<code style="background-color:#f6f8fa; padding:0.2em 0.4em; border-radius:3px; font-family:${CONFIG.fonts.code}; font-size:90%;">${inline}</code>`
        );
        // Replace encoded single quotes with inline code styling.
        res = res.replace(/&#039;([^&#]+)&#039;/g, (_, content) =>
          `<code style="background-color:#f6f8fa; padding:0.2em 0.4em; border-radius:3px; font-family:${CONFIG.fonts.code}; font-size:90%;">${content}</code>`
        );
        return res;
      }, 'multiStepParse');
  
    /**
     * Process message content with special handling for test tags
     * @param {string} safeTxt - HTML-escaped text to process
     * @returns {string} Processed HTML
     */
    const processMessageContent = safeTxt =>
      Utils.safe(() => {
        const tests = [];
        let proc = safeTxt.replace(/(&lt;test&gt;)([\s\S]*?)(&lt;\/test&gt;)/g, (m, open, inner, close) => {
          const ph = `__TEST_${tests.length}__`;
          tests.push({ open, inner, close });
          return ph;
        });
        proc = multiStepParse(proc);
        tests.forEach(({ open, inner, close }, i) => {
          const parsed = multiStepParse(inner);
          proc = proc.replace(
            `__TEST_${i}__`,
            `${open}<code style="background-color:#f6f8fa; padding:0.2em 0.4em; border-radius:3px; font-family:${CONFIG.fonts.code}; font-size:90%;">${parsed}</code>${close}`
          );
        });
        return proc;
      }, 'processMessageContent');
  
    /**
     * Styles user message elements with formatted content
     * @param {Element} msgEl - User message element to style
     */
    function styleUserMessageEl(msgEl) {
      Utils.safe(() => {
        msgEl.setAttribute('data-processed', 'true');
        const raw = msgEl.textContent || '';
        if (!/[<`']/.test(raw)) return;
        const safeText = Utils.escapeHtml(raw);
        const processed = processMessageContent(safeText);
        const container = msgEl.querySelector('div');
        container
          ? (container.innerHTML = processed)
          : (msgEl.innerHTML = `<div>${processed}</div>`);
      }, 'styleUserMessageEl');
    }
  
    /**
     * Cleans and formats JSON code blocks
     * @param {Element} codeEl - Code element to process
     */
    function handleJsonCodeBlock(codeEl) {
      Utils.safe(() => {
        const content = codeEl.textContent.trim();
        if (
          !(content.startsWith('{') && content.endsWith('}') && content.includes('"code"'))
        )
          return;
        try {
          let json = JSON.parse(content);
          if (typeof json.code !== 'string') return;
          let clean = json.code.replace(/\\n/g, '\n').replace(/^"|"$/g, '');
          codeEl.textContent = clean;
          Object.assign(codeEl.style, {
            whiteSpace: 'pre-wrap',
            wordWrap: 'break-word',
            fontFamily: CONFIG.fonts.code
          });
          const pre = codeEl.closest('pre');
          if (pre)
            Object.assign(pre.style, {
              whiteSpace: 'pre-wrap',
              wordWrap: 'break-word',
              backgroundColor: CONFIG.colors.background,
              border: `1px solid ${CONFIG.colors.border}`,
              borderRadius: CONFIG.borderRadius.small
            });
        } catch (e) {
          console.error(
            'Error parsing JSON code block:',
            e,
            content.substring(0, 100) + '...'
          );
        }
      }, 'handleJsonCodeBlock');
    }
  
    /**
     * Styles sandbox output blocks
     */
    function styleSandboxOutputs() {
      document.querySelectorAll(SELECTORS.RESULT_BLOCKS).forEach(preEl => {
        if (preEl.closest('.editing')) return;
        if (
          preEl.textContent.includes('SANDBOX_ID') ||
          preEl.textContent.includes('STANDARD_OUTPUT')
        ) {
          Object.assign(preEl.style, {
            whiteSpace: 'pre-wrap',
            wordWrap: 'break-word',
            overflowX: 'hidden',
            background: '#000',
            color: '#fff',
            padding: '8px',
            borderRadius: '4px'
          });
          const container = preEl.closest('.pb-6');
          if (container) container.style.overflowX = 'hidden';
        }
      });
    }
  
    /* ---------------- Thought Section Styling ---------------- */
    /**
     * Creates CSS styles for thought sections
     * @returns {string} CSS rules for thought sections
     */
    function createThoughtSectionStyles() {
      return `
        /* Super specific selectors to override any existing styles */
        details[open] summary span[contains="Thought for"] ~ div,
        details[open] summary span:first-child ~ div,
        details summary:has(span:contains("Thought for")) ~ div,
        details.text-slate-900 div,
        details[open] div.border-l-2,
        details[open] div.border-l-2 p,
        details[open] div.border-l-2 li,
        details[open] div.border-l-2 ol li,
        details[open] div.border-l-2 ul li,
        details[open] div.border-l-2 span {
          color: ${CONFIG.colors.thought.text} !important;
          font-size: ${CONFIG.fonts.thought.size} !important;
          font-style: italic !important;
          line-height: ${CONFIG.fonts.thought.lineHeight} !important;
        }
      `;
    }

    /**
     * Applies inline styles to thought section elements
     * @param {Element} element - DOM element to style
     */
    function applyThoughtStyle(element) {
      const styleValue = `
        color: ${CONFIG.colors.thought.text} !important; 
        font-size: ${CONFIG.fonts.thought.size} !important; 
        font-style: italic !important; 
        line-height: ${CONFIG.fonts.thought.lineHeight} !important;
      `;
      element.setAttribute('style', styleValue);
    }

    /**
     * Styles thought sections in the chat
     */
    function styleThoughtSections() {
      Utils.safe(() => {
        // Target all details elements
        document.querySelectorAll('details').forEach(details => {
          const summary = details.querySelector('summary');
          // Check if it's a thought section
          if (summary && summary.textContent.includes('Thought for')) {
            // Apply styles to the content div and all its children
            const contentDiv = details.querySelector('div');
            if (contentDiv) {
              // Apply style directly to element for maximum specificity
              applyThoughtStyle(contentDiv);
              
              // Apply style to all paragraph elements
              contentDiv.querySelectorAll('p').forEach(p => {
                applyThoughtStyle(p);
              });
              
              // Apply style to all list items
              contentDiv.querySelectorAll('li').forEach(li => {
                applyThoughtStyle(li);
              });
              
              // Apply style to all spans
              contentDiv.querySelectorAll('span').forEach(span => {
                applyThoughtStyle(span);
              });
              
              // Don't apply to code elements
              contentDiv.querySelectorAll('code').forEach(code => {
                // Preserve code styling
                if (!code.hasAttribute('data-thought-processed')) {
                  code.setAttribute('data-thought-processed', 'true');
                }
              });
            }
          }
        });
      }, 'styleThoughtSections');
    }

    /**
     * Adds a style element for thought sections
     */
    function injectThoughtSectionStyles() {
      if (document.getElementById('typingmind-thought-style')) return;
      
      const thoughtStyle = document.createElement('style');
      thoughtStyle.id = 'typingmind-thought-style';
      thoughtStyle.textContent = createThoughtSectionStyles();
      document.head.appendChild(thoughtStyle);
    }
  
    /* ---------------- Date and Time Formatting ---------------- */
    /**
     * Date and time formatting utilities
     */
    const DateTimeFormatters = {
      /**
       * Converts 24-hour time format to 12-hour format with AM/PM and day abbreviation
       * @param {string} timeStr - Time string in format "HH:MM"
       * @returns {string} Formatted time string (e.g., "7:30 PM Fri")
       */
      convertTo12HourFormat: (timeStr) => {
        // Parse the time string in format "HH:MM"
        const [hoursStr, minutes] = timeStr.split(':');
        const hours = parseInt(hoursStr, 10);
        
        // Convert to 12-hour format
        const period = hours >= 12 ? 'PM' : 'AM';
        const hours12 = hours % 12 || 12; // Convert 0 to 12 for midnight
        
        // Get current day of week (abbreviated)
        const today = new Date();
        const dayAbbr = CONFIG.formats.daysAbbr[today.getDay()];
        
        // Return formatted time with day abbreviation
        return `${hours12}:${minutes} ${period} ${dayAbbr}`;
      },
      
      /**
       * Formats date from "DD MMM YYYY" to "Month DD, YYYY DayOfWeek"
       * @param {string} dateStr - Date string in format "DD MMM YYYY"
       * @returns {string} Formatted date string (e.g., "March 8, 2025 Saturday")
       */
      formatFullDate: (dateStr) => {
        // Parse the date string in format "DD MMM YYYY" (e.g., "08 Mar 2025")
        const parts = dateStr.trim().split(' ');
        if (parts.length !== 3) return dateStr; // Return original if not in expected format
        
        const day = parseInt(parts[0], 10);
        const monthAbbr = parts[1];
        const year = parts[2];
        
        // Get full month name
        const fullMonth = CONFIG.formats.months[monthAbbr] || monthAbbr;
        
        // Create a Date object to determine day of the week
        // Note: month in JS Date is 0-indexed (0 = January)
        const monthIndex = Object.keys(CONFIG.formats.months).indexOf(monthAbbr);
        if (monthIndex === -1) return dateStr; // Return original if month not found
        
        const dateObj = new Date(year, monthIndex, day);
        
        // Get day of week
        const dayOfWeek = CONFIG.formats.daysOfWeek[dateObj.getDay()];
        
        // Format as "March 8, 2025 Saturday"
        return `${fullMonth} ${day}, ${year} ${dayOfWeek}`;
      }
    };
    
    /**
     * Formats timestamps in the chat to 12-hour format with AM/PM and day abbreviation
     */
    function formatTimestamps() {
      Utils.safe(() => {
        document.querySelectorAll(SELECTORS.TIMESTAMP_BUTTONS).forEach(button => {
          // Check if the button text already has a day abbreviation
          const hasDay = new RegExp(`\\b(${CONFIG.formats.daysAbbr.join('|')})\\b`).test(button.textContent);
          
          // For already processed timestamps without day abbreviation, we want to add it
          if (button.hasAttribute('data-time-processed') && !hasDay) {
            // Get current text (should be in 12-hour format)
            const timeText = button.textContent.trim();
            
            // Add day abbreviation
            const today = new Date();
            const dayAbbr = CONFIG.formats.daysAbbr[today.getDay()];
            
            button.textContent = `${timeText} ${dayAbbr}`;
            return;
          }
          
          // For unprocessed timestamps
          if (!button.hasAttribute('data-time-processed')) {
            // Get current text content (24-hour format)
            const timeText = button.textContent.trim();
            
            // Check if it matches the HH:MM format
            if (/^\d{1,2}:\d{2}$/.test(timeText)) {
              // Convert to 12-hour format with day
              const time12Hour = DateTimeFormatters.convertTo12HourFormat(timeText);
              
              // Update the button text
              button.textContent = time12Hour;
              
              // Mark as processed
              button.setAttribute('data-time-processed', 'true');
            }
          }
        });
      }, 'formatTimestamps');
    }
    
    /**
     * Reformats date displays in the chat
     */
    function reformatDateDisplays() {
      Utils.safe(() => {
        document.querySelectorAll(SELECTORS.DATE_SPANS).forEach(span => {
          // Skip if already processed
          if (span.hasAttribute('data-date-processed')) return;
          
          // Get current date text
          const dateText = span.textContent.trim();
          
          // Check if it looks like a date
          if (/^\d{1,2}\s[A-Za-z]{3}\s\d{4}$/.test(dateText)) {
            // Format to new style
            const formattedDate = DateTimeFormatters.formatFullDate(dateText);
            
            // Update the span text
            span.textContent = formattedDate;
            
            // Mark as processed
            span.setAttribute('data-date-processed', 'true');
          }
        });
      }, 'reformatDateDisplays');
    }
  
    /* ---------------- Main Display Handler ---------------- */
    /**
     * Main function to improve text display across the app
     * Processes user messages, code blocks, and applies styling
     */
    const improveTextDisplay = Utils.debounce(
      () =>
        Utils.safe(() => {
          // Process user messages
          document.querySelectorAll(SELECTORS.USER_MESSAGE_BLOCK).forEach(msg => {
            if (msg.closest('.editing') || msg.hasAttribute('data-processed')) return;
            styleUserMessageEl(msg);
          });
          
          // Process code blocks
          document.querySelectorAll(SELECTORS.CODE_BLOCKS).forEach(code => {
            if (!code.closest('.editing')) handleJsonCodeBlock(code);
          });
          
          // Apply all display enhancements
          styleSandboxOutputs();
          styleThoughtSections();
          formatTimestamps();
          reformatDateDisplays();
        }, 'improveTextDisplay'),
      100
    );
  
    /* ---------------- Initialization ---------------- */
    /**
     * Initialize the theme
     * Set up event handlers and apply initial styling
     */
    function initTheme() {
      // Apply sidebar styles
      applySidebarStyles();
      fixSearchPlaceholder();
      
      // Apply thought section styles
      injectThoughtSectionStyles();
      
      // Set up mutation observer to detect DOM changes
      const observeDomChanges = () => {
        new MutationObserver(mutations => {
          const shouldUpdate = mutations.some(mutation => 
            mutation.addedNodes.length > 0 || 
            mutation.type === 'characterData' || 
            (mutation.type === 'childList' && 
             mutation.target.matches && 
             mutation.target.matches(SELECTORS.USER_MESSAGE_BLOCK))
          );
          
          if (shouldUpdate) {
            setTimeout(improveTextDisplay, 0);
          }
        }).observe(document.body, {
          childList: true,
          subtree: true,
          attributes: true,
          characterData: true
        });
      };
      
      // Process initial display
      document.addEventListener('DOMContentLoaded', () => {
        improveTextDisplay();
        observeDomChanges();
      });
      
      // Also run immediately in case DOMContentLoaded already fired
      improveTextDisplay();
      observeDomChanges();
      
      console.log('TypingMind GPT-Style Theme v4.0 loaded.');
    }

    // Initialize theme
    initTheme();
  })();
  