/**
 * A ChatGPT-Inspired Theme for TypingMind
 *
 * This script themes the TypingMind interface to be visually similar to the
 * classic ChatGPT style. It's designed for users who prefer that familiar,
 * clean aesthetic, adjusting fonts, colors, and layout for a more
 * comfortable user experience.
 */
(function () {
    'use strict';

    /**
     * ----------------------------
     * 1) Configuration & Selectors
     * ----------------------------
     */
    const CONFIG = {
        colors: { background: '#F9F9F9', text: '#000', border: '#ccc', input: { background: '#f4f4f4', text: 'rgb(13, 13, 13)', placeholder: 'rgb(142, 142, 142)' }, button: { primary: 'rgb(13, 13, 13)', hover: 'rgba(13, 13, 13, 0.8)' }, thought: { text: '#0066CC' }, inlineCode: { background: '#e8e8e8', border: '#ddd', text: '#111' } },
        fonts: { primary: 'ui-sans-serif, -apple-system, system-ui, "Segoe UI", Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"', code: 'ui-monospace, SFMono-Regular, Menlo, Consolas, Liberation Mono, monospace', weights: { light: 300, normal: 400, medium: 500, semibold: 600, bold: 700 }, thought: { size: '12px', lineHeight: '20px', weight: 400 } },
        spacing: { small: '0.5rem', medium: '1rem', large: '1.5rem' },
        borderRadius: { small: '0.5rem', medium: '1rem', large: '1.5rem' },
    };
    const SELECTORS = {
        CODE_BLOCKS: 'pre code',
        CODE_BLOCK_CONTAINER: 'pre:has(> div.relative):not(details pre)',
        RESULT_BLOCKS: 'details pre',
        USER_MESSAGE_BLOCK: 'div[data-element-id="user-message"]',
        CHAT_SPACE: '[data-element-id="chat-space-middle-part"]',
        AI_RESPONSE_BLOCK: '[data-element-id="ai-response"]',
        THOUGHT_DETAILS_SPECIFIC: 'details:has(summary span:first-child span)',
        THOUGHT_SUMMARY_TEXT_SPAN: 'summary span:first-child span',
        AI_RESPONSE_CONTENT_NODES: `${'[data-element-id="ai-response"]'} > *:not(details):not([data-element-id="additional-actions-of-response-container"])`,
        SIDEBAR: { WORKSPACE: '[data-element-id="workspace-bar"]', BACKGROUND: '[data-element-id="side-bar-background"]', BEGINNING: '[data-element-id="sidebar-beginning-part"]', MIDDLE: '[data-element-id="sidebar-middle-part"]', SEARCH: '[data-element-id="search-chats-bar"]', NEW_CHAT: '[data-element-id="new-chat-button-in-side-bar"]' }
    };

    /**
     * ----------------------------
     * 2) Utility Functions
     * ----------------------------
     */
    const Utils = {
        debounce(fn, delay) { let timeout; return (...args) => { clearTimeout(timeout); timeout = setTimeout(() => fn(...args), delay); }; },
        safe(fn, context = 'unknown') { try { return fn(); } catch (e) { console.error(`Error in ${context}:`, e); return null; } },
        escapeHtml(str) { if (typeof str !== 'string') return ''; return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;'); }
    };

    /**
     * ----------------------------
     * 3) Sidebar Styling & Behavior
     * ----------------------------
     */
    function applySidebarStyles() {
        if (document.getElementById('typingmindSidebarFixMerged')) return;
        const sidebarStyle = document.createElement('style'); sidebarStyle.id = 'typingmindSidebarFixMerged'; sidebarStyle.type = 'text/css';
        const styles = [`${SELECTORS.SIDEBAR.WORKSPACE}, ${SELECTORS.SIDEBAR.BACKGROUND}, ${SELECTORS.SIDEBAR.BEGINNING}, ${SELECTORS.SIDEBAR.MIDDLE} { background-color: ${CONFIG.colors.background} !important; }`, `${SELECTORS.SIDEBAR.NEW_CHAT} { background-color: #E3E3E3 !important; color: ${CONFIG.colors.text} !important; font-weight: ${CONFIG.fonts.weights.semibold} !important; }`, `${SELECTORS.SIDEBAR.NEW_CHAT} * { color: ${CONFIG.colors.text} !important; }`, `${SELECTORS.SIDEBAR.SEARCH} { background-color: #fff !important; color: ${CONFIG.colors.text} !important; border: 1px solid ${CONFIG.colors.border} !important; font-weight: ${CONFIG.fonts.weights.normal} !important; }`, `${SELECTORS.SIDEBAR.SEARCH}[placeholder]::placeholder, ${SELECTORS.SIDEBAR.SEARCH}::-webkit-input-placeholder, ${SELECTORS.SIDEBAR.SEARCH}::-moz-placeholder, ${SELECTORS.SIDEBAR.SEARCH}:-ms-input-placeholder { color: rgba(0,0,0,0.6) !important; opacity: 1 !important; -webkit-text-fill-color: rgba(0,0,0,0.6) !important; font-weight: ${CONFIG.fonts.weights.normal} !important; }`, `${SELECTORS.SIDEBAR.WORKSPACE} *:not(svg):not(path)[class*="text-white"], ${SELECTORS.SIDEBAR.WORKSPACE} *:not(svg):not(path)[class*="text-white/"], ${SELECTORS.SIDEBAR.WORKSPACE} *:not(svg):not(path)[class*="text-gray-"], ${SELECTORS.SIDEBAR.WORKSPACE} *:not(svg):not(path)[class*="dark:text-white"], ${SELECTORS.SIDEBAR.BACKGROUND} *:not(svg):not(path)[class*="text-white"], ${SELECTORS.SIDEBAR.BACKGROUND} *:not(svg):not(path)[class*="text-white/"], ${SELECTORS.SIDEBAR.BACKGROUND} *:not(svg):not(path)[class*="text-gray-"], ${SELECTORS.SIDEBAR.BACKGROUND} *:not(svg):not(path)[class*="dark:text-white"] { color: ${CONFIG.colors.text} !important; opacity: 1 !important; --tw-text-opacity: 1 !important; }`, `[data-element-id="custom-chat-item"]:hover, [data-element-id="selected-chat-item"] { background-color: #E3E3E3 !important; }`, `[data-element-id="custom-chat-item"] span, [data-element-id="selected-chat-item"] span { font-weight: ${CONFIG.fonts.weights.normal} !important; }`, `[data-element-id="custom-chat-item"] button[aria-label="Delete Chat"], [data-element-id="custom-chat-item"] button[aria-label="Favorite Chat"], [data-element-id="custom-chat-item"] button[aria-label="Chat settings"], [data-element-id="selected-chat-item"] button[aria-label="Delete Chat"], [data-element-id="selected-chat-item"] button[aria-label="Favorite Chat"], [data-element-id="selected-chat-item"] button[aria-label="Chat settings"] { display: none !important; }`, `[data-element-id="custom-chat-item"]:hover button[aria-label="Delete Chat"], [data-element-id="custom-chat-item"]:hover button[aria-label="Favorite Chat"], [data-element-id="custom-chat-item"]:hover button[aria-label="Chat settings"], [data-element-id="selected-chat-item"]:hover button[aria-label="Delete Chat"], [data-element-id="selected-chat-item"]:hover button[aria-label="Favorite Chat"], [data-element-id="selected-chat-item"]:hover button[aria-label="Chat settings"], [data-element-id="custom-chat-item"] button[aria-expanded="true"], [data-element-id="selected-chat-item"] button[aria-expanded="true"] { display: inline-block !important; }`, `#headlessui-portal-root { display: block !important; visibility: visible !important; pointer-events: auto !important; }`, `#headlessui-portal-root [role="menu"] { display: block !important; visibility: visible !important; background-color: white !important; color: black !important; pointer-events: auto !important; }`, `#headlessui-portal-root [role="menuitem"] { display: flex !important; visibility: visible !important; pointer-events: auto !important; font-weight: ${CONFIG.fonts.weights.normal} !important; }`, `[data-element-id="tag-search-panel"] { background-color: ${CONFIG.colors.background} !important; border: 1px solid ${CONFIG.colors.border} !important; color: ${CONFIG.colors.text} !important; }`, `[data-element-id="tag-search-panel"] input[type="search"] { background-color: #fff !important; border: 1px solid ${CONFIG.colors.border} !important; color: ${CONFIG.colors.text} !important; font-weight: ${CONFIG.fonts.weights.normal} !important; }`, `[data-element-id="tag-search-panel"] input[type="checkbox"] { appearance: none !important; width: 16px !important; height: 16px !important; border: 1px solid ${CONFIG.colors.border} !important; border-radius: 3px !important; background-color: #fff !important; position: relative !important; cursor: pointer !important; }`, `[data-element-id="tag-search-panel"] input[type="checkbox"]:checked { background-color: #2563eb !important; border-color: #2563eb !important; }`, `[data-element-id="tag-search-panel"] input[type="checkbox"]:checked::after { content: '' !important; position: absolute !important; left: 5px !important; top: 2px !important; width: 4px !important; height: 8px !important; border: solid white !important; border-width: 0 2px 2px 0 !important; transform: rotate(45deg) !important; }`, `[data-element-id="tag-search-panel"] label, [data-element-id="tag-search-panel"] p, [data-element-id="tag-search-panel"] span, [data-element-id="tag-search-panel"] button { color: ${CONFIG.colors.text} !important; font-weight: ${CONFIG.fonts.weights.normal} !important; }`, `[data-element-id="tag-search-panel"] .overflow-auto::-webkit-scrollbar { width: 8px !important; }`, `[data-element-id="tag-search-panel"] .overflow-auto::-webkit-scrollbar-track { background: #f1f1f1 !important; border-radius: 4px !important; }`, `[data-element-id="tag-search-panel"] .overflow-auto::-webkit-scrollbar-thumb { background: #c1c1c1 !important; border-radius: 4px !important; }`, `[data-element-id="tag-search-panel"] .overflow-auto::-webkit-scrollbar-thumb:hover { background: #a1a1a1 !important; }`, `[data-element-id="tag-search-panel"] .overflow-auto { scrollbar-width: thin !important; scrollbar-color: #c1c1c1 #f1f1f1 !important; }`, `[data-element-id="chat-folder"] textarea, [data-element-id="custom-chat-item"] textarea, [data-element-id="selected-chat-item"] textarea, [data-element-id="side-bar-background"] textarea { background-color: #fff !important; color: ${CONFIG.colors.text} !important; border: 1px solid ${CONFIG.colors.border} !important; font-weight: ${CONFIG.fonts.weights.normal} !important; }`, `[data-element-id="chat-folder"] textarea:focus, [data-element-id="custom-chat-item"] textarea:focus, [data-element-id="selected-chat-item"] textarea:focus, [data-element-id="side-bar-background"] textarea:focus { background-color: #fff !important; color: ${CONFIG.colors.text} !important; border-color: #2563eb !important; box-shadow: 0 0 0 2px rgba(37,99,235,0.2) !important; }`, `[data-element-id="workspace-bar"] button span.hover\\:bg-white\\/20:hover, [data-element-id="workspace-bar"] button:hover span.text-white\\/70, [data-element-id="workspace-profile-button"]:hover { background-color: rgba(0,0,0,0.1) !important; }`];
        sidebarStyle.innerHTML = styles.join('\n');
        // Ensure circular avatar icons remain visible on light sidebar:
        // keep icon color white when the avatar uses a dark circular background
        sidebarStyle.innerHTML += `\n${SELECTORS.SIDEBAR.WORKSPACE} .rounded-full[class*="text-white"], ${SELECTORS.SIDEBAR.BACKGROUND} .rounded-full[class*="text-white"] { color: #fff !important; }`;
        sidebarStyle.innerHTML += `\n${SELECTORS.SIDEBAR.WORKSPACE} .bg-\\[\\#0d0d0d\\].text-white, ${SELECTORS.SIDEBAR.BACKGROUND} .bg-\\[\\#0d0d0d\\].text-white { color: #fff !important; }`;
        document.head.appendChild(sidebarStyle);
        new MutationObserver(() => { if (!document.getElementById('typingmindSidebarFixMerged')) { document.head.appendChild(sidebarStyle); } }).observe(document.body, { childList: true, subtree: true });
        console.log('TypingMind Sidebar Mods loaded.');
    }
    function fixSearchPlaceholder() {
        const input = document.querySelector(SELECTORS.SIDEBAR.SEARCH); if (input && !input.placeholder) { input.setAttribute('placeholder', 'Search chats'); }
    }
    document.addEventListener('DOMContentLoaded', () => { applySidebarStyles(); fixSearchPlaceholder(); });
    if (!document.getElementById('typingmindSidebarFixMerged')) { applySidebarStyles(); fixSearchPlaceholder(); }

    /**
     * ----------------------------
     * 4) Main Chat & Input Styles
     * ----------------------------
     */
    const mainStyle = document.createElement('style');
    mainStyle.textContent = `
      [data-element-id="chat-space-middle-part"] .prose.max-w-full *:not( pre, pre *, code, code *, .flex.items-start.justify-center.flex-col.gap-2 *, .text-xs.text-gray-500.truncate, .italic.truncate.hover\\:underline, h1, h2, h3, h4, h5, h6, strong, b ),
      [data-element-id="chat-space-middle-part"] [data-element-id="user-message"] > div { font-family: ${CONFIG.fonts.primary} !important; font-size: 16px !important; line-height: 24px !important; color: ${CONFIG.colors.text} !important; font-weight: ${CONFIG.fonts.weights.normal} !important; }
      [data-element-id="chat-space-middle-part"] .prose.max-w-full, [data-element-id="chat-space-middle-part"] [data-element-id="user-message"] { font-family: ${CONFIG.fonts.primary} !important; font-size: 16px !important; line-height: 24px !important; color: ${CONFIG.colors.text} !important; font-weight: ${CONFIG.fonts.weights.normal} !important; }
      /* Improve visual crispness similar to ChatGPT */
      [data-element-id="chat-space-middle-part"] .prose.max-w-full {
        -webkit-font-smoothing: antialiased !important;
        -moz-osx-font-smoothing: grayscale !important;
        text-rendering: optimizeLegibility !important;
        letter-spacing: -0.005em !important;
        font-weight: ${CONFIG.fonts.weights.normal} !important;
      }
      [data-element-id="chat-space-middle-part"] .text-xs.text-gray-500.truncate, [data-element-id="chat-space-middle-part"] .italic.truncate.hover\\:underline, [data-element-id="chat-space-middle-part"] .flex.items-start.justify-center.flex-col.gap-2 { font-size: unset !important; line-height: unset !important; font-family: unset !important; color: unset !important; font-weight: unset !important; }
      [data-element-id="chat-space-middle-part"] [data-element-id="response-block"]:has([data-element-id="user-message"]) [data-element-id="chat-avatar-container"] { display: none !important; }
      [data-element-id="chat-space-middle-part"] [data-element-id="user-message"] { margin-left: auto !important; margin-right: 0 !important; display: block !important; max-width: 70% !important; border-radius: ${CONFIG.borderRadius.large} !important; background-color: ${CONFIG.colors.input.background} !important; color: ${CONFIG.colors.text} !important; padding: ${CONFIG.spacing.small} !important; margin-bottom: ${CONFIG.spacing.small} !important; }
      [data-element-id="chat-space-middle-part"] [data-element-id="user-message"], [data-element-id="chat-space-middle-part"] [data-element-id="user-message"] > div { background-color: ${CONFIG.colors.input.background} !important; }
      ${SELECTORS.CODE_BLOCK_CONTAINER} { background-color: ${CONFIG.colors.background} !important; border: 1px solid ${CONFIG.colors.border} !important; border-radius: ${CONFIG.borderRadius.small} !important; margin: 0.5em 0 !important; max-height: none !important; }
      /* The parent of the code block needs to have visible overflow for sticky positioning to work correctly. */
      .prose > div:has(> pre) { overflow: visible !important; }
      ${SELECTORS.CODE_BLOCK_CONTAINER} > div.relative { position: relative !important; }
      ${SELECTORS.CODE_BLOCK_CONTAINER} > div.relative > div.sticky { position: sticky !important; top: 0 !important; z-index: 10 !important; background-color: ${CONFIG.colors.background} !important; border-radius: 0.5rem 0.5rem 0 0 !important; border-bottom: 1px solid ${CONFIG.colors.border} !important; }
      ${SELECTORS.CODE_BLOCK_CONTAINER} > div.relative > div > pre { border: none !important; background: transparent !important; margin: 0 !important; padding: 1em !important; }
      ${SELECTORS.CODE_BLOCK_CONTAINER} code { font-family: ${CONFIG.fonts.code} !important; font-weight: ${CONFIG.fonts.weights.normal} !important; font-size: 13px !important; line-height: 20px !important; }
      ${SELECTORS.AI_RESPONSE_BLOCK} ${SELECTORS.RESULT_BLOCKS} { background-color: #000 !important; color: #fff !important; border: none !important; padding: 8px !important; border-radius: 4px !important; white-space: pre-wrap !important; word-wrap: break-word !important; overflow-x: hidden !important; font-family: ${CONFIG.fonts.code} !important; font-weight: ${CONFIG.fonts.weights.normal} !important; }
      [data-element-id="chat-space-middle-part"] [data-element-id="response-block"]:hover { background-color: transparent !important; }
      [data-element-id="chat-space-middle-part"] .prose.max-w-full ul, [data-element-id="chat-space-middle-part"] .prose.max-w-full ol { margin: 0.5rem 0 !important; }
      [data-element-id="chat-space-middle-part"] .prose.max-w-full li { margin: 0.3rem 0 !important; }
      [data-element-id="chat-space-middle-part"] .prose.max-w-full li::marker { color: ${CONFIG.colors.text} !important; font-weight: ${CONFIG.fonts.weights.bold} !important; }
      [data-element-id="chat-space-middle-part"] .prose.max-w-full ul > li { list-style-type: disc !important; padding-left: 0.5rem !important; }
      [data-element-id="chat-space-middle-part"] .prose.max-w-full ol > li { list-style-type: decimal !important; padding-left: 0.5rem !important; }
      [data-element-id="chat-space-middle-part"] .prose.max-w-full h1 { font-size: 2em !important; line-height: 1.3 !important; margin: 0.5em 0 !important; font-weight: ${CONFIG.fonts.weights.bold} !important; color: ${CONFIG.colors.text} !important; }
      [data-element-id="chat-space-middle-part"] .prose.max-w-full h2 { font-size: 1.5em !important; line-height: 1.3 !important; margin: 0.5em 0 !important; font-weight: ${CONFIG.fonts.weights.semibold} !important; color: ${CONFIG.colors.text} !important; }
      [data-element-id="chat-space-middle-part"] .prose.max-w-full h3 { font-size: 1.25em !important; line-height: 1.3 !important; margin: 0.5em 0 !important; font-weight: ${CONFIG.fonts.weights.semibold} !important; color: ${CONFIG.colors.text} !important; }
      ${SELECTORS.THOUGHT_DETAILS_SPECIFIC} > div, ${SELECTORS.THOUGHT_DETAILS_SPECIFIC} > div * { color: ${CONFIG.colors.thought.text} !important; font-size: ${CONFIG.fonts.thought.size} !important; font-style: italic !important; line-height: ${CONFIG.fonts.thought.lineHeight} !important; font-weight: ${CONFIG.fonts.thought.weight} !important; }
      
      /* Set a max-height and overflow for the code container to enable internal scrolling for sticky header. */
      ${SELECTORS.CODE_BLOCK_CONTAINER} > div.relative > div:last-child {
          max-height: 600px;
          overflow-y: auto !important;
      }
    `;
    document.head.appendChild(mainStyle);

    const inputStyle = document.createElement('style');
    inputStyle.textContent = `
      [data-element-id="chat-space-end-part"] [role="presentation"] { background-color: ${CONFIG.colors.input.background}; border-radius: ${CONFIG.borderRadius.large}; margin-bottom: ${CONFIG.spacing.medium}; }
      #chat-input-textbox { font-family: ${CONFIG.fonts.primary}; font-size: 16px !important; line-height: 24px !important; min-height: 44px !important; padding: 0.75rem 1rem !important; border-radius: 1.5rem !important; color: ${CONFIG.colors.text} !important; border: 0 solid ${CONFIG.colors.border} !important; outline: none !important; margin: 8px 0 !important; overflow-wrap: break-word !important; tab-size: 4 !important; text-size-adjust: 100% !important; white-space: pre-wrap !important; font-variant-ligatures: none !important; -webkit-tap-highlight-color: transparent !important; font-weight: ${CONFIG.fonts.weights.normal} !important; }
      #chat-input-textbox::placeholder { color: ${CONFIG.colors.input.placeholder} !important; opacity: 1 !important; font-weight: ${CONFIG.fonts.weights.normal} !important; }
      [data-element-id="chat-input-actions"] button:not([data-element-id="send-button"]):not([data-element-id="more-options-button"]):not([data-element-id="replace-only-button"]) { transition: all 0.2s ease !important; color: ${CONFIG.colors.text} !important; }
      [data-element-id="chat-input-actions"] button:not([data-element-id="send-button"]):not([data-element-id="more-options-button"]):not([data-element-id="replace-only-button"]) svg { width: 20px !important; height: 20px !important; vertical-align: middle !important; }
      [data-element-id="chat-input-actions"] button:not([data-element-id="send-button"]):not([data-element-id="more-options-button"]):not([data-element-id="replace-only-button"]):hover { background-color: rgba(0,0,0,0.1) !important; border-radius: 0.5rem !important; }
      [data-element-id="chat-input-actions"] { padding: 0.5rem 0.75rem !important; }
      [data-element-id="send-button"], [data-element-id="more-options-button"] { background-color: ${CONFIG.colors.button.primary} !important; border-color: ${CONFIG.colors.button.primary} !important; }
      [data-element-id="send-button"]:hover, [data-element-id="more-options-button"]:hover { background-color: ${CONFIG.colors.button.hover} !important; border-color: ${CONFIG.colors.button.hover} !important; }
      /* Regenerate button: style directly like Send */
      [data-element-id="regenerate-button"] { background-color: ${CONFIG.colors.button.primary} !important; border-color: ${CONFIG.colors.button.primary} !important; color: #fff !important; }
      [data-element-id="regenerate-button"]:hover { background-color: ${CONFIG.colors.button.hover} !important; border-color: ${CONFIG.colors.button.hover} !important; }
    `;
    document.head.appendChild(inputStyle);

    /**
     * ----------------------------
     * 5) Text Parsing & Formatting
     * ----------------------------
     */
    function multiStepParse(rawText) {
        return Utils.safe(() => {
            let processedHtml = rawText;
            const codeBlockRegex = /^(```|""")(\w*)\s*([\s\S]*?)\s*\1$/gm;
            const placeholders = [];
            processedHtml = processedHtml.replace(codeBlockRegex, (match, delimiter, lang, code) => {
                lang = lang ? lang.toLowerCase() : ''; const escapedCode = Utils.escapeHtml(code);
                const placeholder = `__CODEBLOCK_${placeholders.length}__`;
                placeholders.push(`<pre><div class="relative"><div class="sticky top-0 flex items-center bg-gray-200 dark:bg-gray-900 pl-[12px] pr-1 justify-between"><span class="text-xs font-light">${lang || 'code'}</span><button class="rounded-full flex items-center gap-1 dark:bg-gray-900 dark:text-white py-1 px-2.5 text-xs font-light text-gray-900 font-sans select-none">...</button></div><div><pre style="..."><code style="white-space: pre; line-height: inherit; font-size: inherit;">${escapedCode}</code></pre></div></div></pre>`);
                return placeholder;
            });
            processedHtml = Utils.escapeHtml(processedHtml);
            placeholders.forEach((blockHtml, index) => { processedHtml = processedHtml.replace(`__CODEBLOCK_${index}__`, blockHtml); });
            return processedHtml;
        }, 'multiStepParse');
    }
    const parsingStyle = document.createElement('style'); parsingStyle.id = 'typingmind-parsing-style';
    parsingStyle.textContent = `
      .inline-code { background-color: ${CONFIG.colors.inlineCode.background} !important; padding: 0.2em 0.4em !important; margin: 0 0.1em !important; border-radius: 3px !important; border: 1px solid ${CONFIG.colors.inlineCode.border} !important; font-family: ${CONFIG.fonts.code} !important; font-size: 90% !important; font-weight: ${CONFIG.fonts.weights.normal} !important; color: ${CONFIG.colors.inlineCode.text} !important; }
    `;
    if (!document.getElementById('typingmind-parsing-style')) { document.head.appendChild(parsingStyle); }

    function processMessageContent(rawText) {
        return Utils.safe(() => multiStepParse(rawText), 'processMessageContent');
    }
    function styleUserMessageEl(msgEl) {
        Utils.safe(() => {
            if (msgEl.hasAttribute('data-processed')) return;

            // Check if the message contains a file attachment block.
            const hasAttachment = msgEl.querySelector('.group\\/attachment');

            // Iterate over the direct children of the message element.
            // This avoids destroying the attachment's HTML structure.
            for (const child of msgEl.children) {
                // Only process child elements that are NOT the attachment block or its container.
                if (hasAttachment && child.querySelector('.group\\/attachment')) {
                    continue;
                }

                const rawText = child.textContent || '';
                if (rawText.trim() === '') continue;

                // Only apply markdown parsing if markdown characters are present.
                if (/[*`~_]/.test(rawText) || rawText.includes('```') || rawText.includes('"""')) {
                    const processedHtml = processMessageContent(rawText);
                    child.innerHTML = processedHtml;
                }
            }

            msgEl.setAttribute('data-processed', 'true');
        }, 'styleUserMessageEl');
    }
    function handleJsonCodeBlock(codeEl) {
        Utils.safe(() => { const content = codeEl.textContent.trim(); if (!(content.startsWith('{') && content.endsWith('}') && content.includes('"code"'))) { return; } try { const json = JSON.parse(content); if (typeof json.code !== 'string') return; let clean = json.code.replace(/\\n/g, '\n').replace(/^"|"$/g, ''); codeEl.textContent = clean; codeEl.style.fontFamily = CONFIG.fonts.code; codeEl.style.whiteSpace = 'pre-wrap'; codeEl.style.wordWrap = 'break-word'; } catch (e) { console.error('Error parsing JSON code block:', e, content.substring(0, 100) + '...'); } }, 'handleJsonCodeBlock');
    }
    function styleSandboxOutputs() {
        document.querySelectorAll(`${SELECTORS.AI_RESPONSE_BLOCK} ${SELECTORS.RESULT_BLOCKS}`).forEach(preEl => { if (preEl.closest('.editing')) return; const container = preEl.closest('.pb-6'); if (container) container.style.overflowX = 'auto'; });
    }

    // No JS tagging for Regenerate; styled directly via CSS above.

    /**
     * ----------------------------
     * 8) Main Display Handler
     * ----------------------------
     */
    const improveTextDisplay = Utils.debounce(
        (rootNode = document) =>
            Utils.safe(() => {
                const scope = rootNode === document ? document.body : rootNode;
                scope.querySelectorAll(SELECTORS.USER_MESSAGE_BLOCK).forEach(msg => { if (msg.closest('.editing') || msg.hasAttribute('data-processed')) return; styleUserMessageEl(msg); });
                scope.querySelectorAll(SELECTORS.CODE_BLOCKS).forEach(code => { if (!code.closest('.editing')) handleJsonCodeBlock(code); });
                styleSandboxOutputs();
            }, 'improveTextDisplay'),
        350
    );

    /**
     * ----------------------------
     * 9) Initialization
     * ----------------------------
     */
    function initTheme() {
        applySidebarStyles();
        fixSearchPlaceholder();

        // Apply a global style fix for text selection.
        const selectionFixStyle = document.createElement('style');
        selectionFixStyle.id = 'typingmind-selection-fix';
        selectionFixStyle.textContent = ` .highlight-darkblue::selection, .highlight-darkblue *::selection { background-color: Highlight !important; color: HighlightText !important; } `;
        if (!document.getElementById('typingmind-selection-fix')) {
            document.head.appendChild(selectionFixStyle);
        }

        const observeDomChanges = () => {
            const observer = new MutationObserver(mutations => {
                let requiresVisualUpdate = false;
                for (const mutation of mutations) {
                    if (mutation.type === 'childList') {
                        for (const node of mutation.addedNodes) {
                            if (node.nodeType === Node.ELEMENT_NODE && (node.matches(SELECTORS.USER_MESSAGE_BLOCK) || node.matches(SELECTORS.AI_RESPONSE_BLOCK) || node.querySelector(SELECTORS.USER_MESSAGE_BLOCK) || node.querySelector(SELECTORS.AI_RESPONSE_BLOCK))) {
                                requiresVisualUpdate = true;
                                break;
                            }
                        }
                    }
                    if (requiresVisualUpdate) break;
                }
                if (requiresVisualUpdate) {
                    improveTextDisplay();
                }
            });
            observer.observe(document.body, { childList: true, subtree: true });
        };
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                improveTextDisplay();
                observeDomChanges();
            });
        } else {
            improveTextDisplay();
            observeDomChanges();
        }
    }

    initTheme();

})();