/* ===================================================================
 * MARKDOWN INPUT RENDERER EXTENSION
 * ===================================================================
 * Replaces TypingMind textarea with TOAST UI Editor
 * Provides markdown rendering with live preview options
 * =================================================================== */

(function() {
    'use strict';

    // ==============================
    // Configuration Constants
    // ==============================
    const CONFIG = {
        // CDN URLs for TOAST UI Editor
        CDN: {
            CSS: 'https://uicdn.toast.com/editor/latest/toastui-editor.min.css',
            CSS_DARK: 'https://uicdn.toast.com/editor/latest/theme/toastui-editor-dark.css',
            JS: 'https://uicdn.toast.com/editor/latest/toastui-editor-all.min.js',
            // Syntax highlighting plugin
            PRISM_THEME: 'https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/themes/prism-okaidia.min.css',
            SYNTAX_PLUGIN_CSS: 'https://uicdn.toast.com/editor-plugin-code-syntax-highlight/latest/toastui-editor-plugin-code-syntax-highlight.min.css',
            SYNTAX_PLUGIN_JS: 'https://uicdn.toast.com/editor-plugin-code-syntax-highlight/latest/toastui-editor-plugin-code-syntax-highlight-all.min.js'
        },
        
        // Height constraints
        HEIGHT: {
            MIN: '75px',
            MAX: '500px',
            MODE: 'auto'
        },
        
        // Timing delays
        DELAYS: {
            INIT_RETRY: 1000,
            SPELLCHECK: 100,
            TAB_SETUP: 200,
            TAB_STYLING: 300,
            KEYBOARD_SETUP: 500,
            SEND_CLICK: 150,
            CLEAR_AFTER_SEND: 200
        },
        
        // DOM selectors
        SELECTORS: {
            TEXTAREA: 'chat-input-textbox',
            EDITOR_CONTAINER: 'toast-markdown-editor',
            SEND_BUTTON: '[data-element-id="send-button"]',
            MODE_SWITCH: '.toastui-editor-mode-switch',
            MD_CONTAINER: '.toastui-editor-md-container',
            EDITABLE: '[contenteditable="true"]',
            TAB_ITEM: '.tab-item'
        },
        
        // LocalStorage keys
        STORAGE: {
            PREVIEW_STYLE: 'markdown_renderer_preview_style',
            EDIT_TYPE: 'markdown_renderer_edit_type'
        },
        
        // Editor toolbar configuration
        TOOLBAR: [
            ['heading', 'bold', 'italic', 'strike'],
            ['hr', 'quote'],
            ['ul', 'ol', 'task', 'indent', 'outdent'],
            ['table', 'link'],
            ['code', 'codeblock']
        ],
        
        // Preview styles
        PREVIEW_STYLES: {
            TAB: 'tab',
            SPLIT: 'vertical'
        },
        
        // Edit types
        EDIT_TYPES: {
            MARKDOWN: 'markdown',
            WYSIWYG: 'wysiwyg'
        }
    };

    // ==============================
    // State Management
    // ==============================
    const state = {
        isInitialized: false,
        initInProgress: false,
        textarea: null,
        editor: null,
        container: null,
        previewStyle: localStorage.getItem(CONFIG.STORAGE.PREVIEW_STYLE) || CONFIG.PREVIEW_STYLES.TAB,
        editType: localStorage.getItem(CONFIG.STORAGE.EDIT_TYPE) || CONFIG.EDIT_TYPES.MARKDOWN,
        // Observer references for cleanup
        chatObserver: null,
        themeObserver: null,

        // Internal perf guards
        _syncScheduled: false,
        _lastSyncedMarkdown: null,
        _lastSeenTextareaValue: null,
        _boundEditorForChange: null,
        _boundEditableForDomEvents: null,
        _keydownHandler: null,
        _pasteHandler: null
    };

    // ==============================
    // Theme Detection
    // ==============================
    function isDarkMode() {
        return document.documentElement.classList.contains('dark');
    }

    // ==============================
    // Library Loading
    // ==============================
    function loadCSS(href) {
        // Avoid injecting duplicate stylesheets
        if (document.querySelector(`link[rel="stylesheet"][href="${href}"]`)) return;

        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = href;
        document.head.appendChild(link);
    }

    function loadScript(src) {
        return new Promise((resolve, reject) => {
            // If a script tag already exists, assume it is loading (or will load) and wait for it.
            const existing = document.querySelector(`script[src="${src}"]`);
            if (existing) {
                existing.addEventListener('load', resolve, { once: true });
                existing.addEventListener('error', () => reject(new Error(`Failed to load script: ${src}`)), { once: true });
                return;
            }

            const script = document.createElement('script');
            script.src = src;
            script.onload = resolve;
            script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
            document.head.appendChild(script);
        });
    }

    function loadEditorLibrary() {
        if (window.toastui?.Editor?.plugin?.codeSyntaxHighlight) {
            return Promise.resolve();
        }

        return new Promise(async (resolve, reject) => {
            try {
                // Load all CSS files
                loadCSS(CONFIG.CDN.CSS);
                loadCSS(CONFIG.CDN.CSS_DARK);
                loadCSS(CONFIG.CDN.PRISM_THEME);
                loadCSS(CONFIG.CDN.SYNTAX_PLUGIN_CSS);

                // Load main editor JS first
                await loadScript(CONFIG.CDN.JS);
                
                // Then load syntax highlight plugin
                await loadScript(CONFIG.CDN.SYNTAX_PLUGIN_JS);
                
                resolve();
            } catch (error) {
                reject(error);
            }
        });
    }

    // ==============================
    // Image Upload Handling
    // ==============================
    function handleImageBlob(blob, callback) {
        // Forward the image blob to the hidden textarea so TypingMind can handle it
        const file = new File([blob], blob.name || 'image.png', { type: blob.type });
        
        // Create a new ClipboardEvent with the image
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        
        // Dispatch paste event to the hidden textarea (where TypingMind listens)
        const pasteEvent = new ClipboardEvent('paste', {
            clipboardData: dataTransfer,
            bubbles: true,
            cancelable: true
        });
        
        state.textarea.dispatchEvent(pasteEvent);
        
        // DON'T call the callback - this prevents Toast UI from inserting anything
        // If we call callback('', ''), it still inserts ![image.png]()
        return false;
    }

    // ==============================
    // Editor Instance Creation
    // ==============================
    function createEditorInstance(initialValue = '') {
        const { codeSyntaxHighlight } = window.toastui.Editor.plugin;
        
        return new window.toastui.Editor({
            el: state.container,
            height: CONFIG.HEIGHT.MODE,
            minHeight: CONFIG.HEIGHT.MIN,
            initialValue,
            initialEditType: state.editType,
            previewStyle: state.previewStyle,
            toolbarItems: CONFIG.TOOLBAR,
            theme: isDarkMode() ? 'dark' : 'light',
            plugins: [codeSyntaxHighlight],
            hooks: {
                addImageBlobHook: handleImageBlob
            }
        });
    }

    // ==============================
    // React Integration
    // ==============================
    const TEXTAREA_VALUE_SETTER = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')?.set;

    function syncToReactTextarea({ emitChange = false } = {}) {
        if (!state.editor || !state.textarea) return;

        const content = state.editor.getMarkdown();

        // Avoid redundant writes + event storms (important for typing performance)
        if (content === state._lastSyncedMarkdown) return;
        state._lastSyncedMarkdown = content;

        if (TEXTAREA_VALUE_SETTER) {
            TEXTAREA_VALUE_SETTER.call(state.textarea, content);
        } else {
            state.textarea.value = content;
        }

        // TypingMind/React generally only needs `input` to update state while typing.
        // `change` can be heavier and is normally emitted on commit/blur, not per keystroke.
        state.textarea.dispatchEvent(new Event('input', { bubbles: true }));
        if (emitChange) {
            state.textarea.dispatchEvent(new Event('change', { bubbles: true }));
        }
    }

    function scheduleSyncToReactTextarea() {
        if (state._syncScheduled) return;
        state._syncScheduled = true;

        requestAnimationFrame(() => {
            state._syncScheduled = false;
            syncToReactTextarea();
        });
    }

    // ==============================
    // Style Management
    // ==============================
    function applyCustomStyles() {
        const textareaStyles = window.getComputedStyle(state.textarea);
        
        const styleSheet = document.createElement('style');
        styleSheet.id = 'toast-editor-custom-styles';
        styleSheet.textContent = `
            /* Light mode: white background for editor */
            html:not(.dark) #${CONFIG.SELECTORS.EDITOR_CONTAINER} .toastui-editor-md-container,
            html:not(.dark) #${CONFIG.SELECTORS.EDITOR_CONTAINER} .toastui-editor-ww-container,
            html:not(.dark) #${CONFIG.SELECTORS.EDITOR_CONTAINER} .toastui-editor-contents,
            html:not(.dark) #${CONFIG.SELECTORS.EDITOR_CONTAINER} .ProseMirror {
                background-color: #ffffff !important;
            }

            #${CONFIG.SELECTORS.EDITOR_CONTAINER} ${CONFIG.SELECTORS.MD_CONTAINER},
            #${CONFIG.SELECTORS.EDITOR_CONTAINER} .toastui-editor-ww-container {
                min-height: ${CONFIG.HEIGHT.MIN} !important;
                max-height: ${CONFIG.HEIGHT.MAX} !important;
                overflow-y: auto !important;
                resize: vertical !important;
                z-index: 0 !important;
            }

            #${CONFIG.SELECTORS.EDITOR_CONTAINER} .toastui-editor-contents {
                font-family: ${textareaStyles.fontFamily} !important;
                font-size: ${textareaStyles.fontSize} !important;
                font-weight: ${textareaStyles.fontWeight} !important;
                line-height: ${textareaStyles.lineHeight} !important;
                padding: ${textareaStyles.paddingTop} ${textareaStyles.paddingRight} ${textareaStyles.paddingBottom} ${textareaStyles.paddingLeft} !important;
            }

            #${CONFIG.SELECTORS.EDITOR_CONTAINER} ${CONFIG.SELECTORS.MODE_SWITCH} {
                text-align: left !important;
                padding-left: 10px !important;
                padding-right: 0 !important;
            }
            
            #${CONFIG.SELECTORS.EDITOR_CONTAINER},
            #${CONFIG.SELECTORS.EDITOR_CONTAINER} .toastui-editor-defaultUI,
            #${CONFIG.SELECTORS.EDITOR_CONTAINER} .toastui-editor-main-container {
                z-index: 0 !important;
            }

            /* ========================================
               LIGHT MODE: Dark background for fenced code blocks (triple backticks)
               Does NOT affect inline code (single backticks)
               ======================================== */
            
            /* Markdown/Write mode: Code block - child span styling with white cursor */
            html:not(.dark) #${CONFIG.SELECTORS.EDITOR_CONTAINER} .toastui-editor-md-container .toastui-editor-md-code-block {
                background-color: transparent !important;
                color: #f8f8f2 !important;
                caret-color: #f8f8f2 !important;
            }
            
            /* Code block delimiter (the triple backtick marks) - brighter green for visibility */
            html:not(.dark) #${CONFIG.SELECTORS.EDITOR_CONTAINER} .toastui-editor-md-container .toastui-editor-md-code-block .toastui-editor-md-delimiter {
                color: #89D185 !important;
                font-weight: 600 !important;
            }
            
            /* Code block line background - parent div with padding and min-height so cursor is always visible */
            html:not(.dark) #${CONFIG.SELECTORS.EDITOR_CONTAINER} .toastui-editor-md-container .toastui-editor-md-code-block-line-background {
                background-color: #272822 !important;
                padding-left: 12px !important;
                padding-right: 12px !important;
                padding-top: 2px !important;
                padding-bottom: 2px !important;
                min-height: 24px !important;
                line-height: 1.5 !important;
                caret-color: #f8f8f2 !important;
            }
            
            /* First line: top corners (using .start class) */
            html:not(.dark) #${CONFIG.SELECTORS.EDITOR_CONTAINER} .toastui-editor-md-container .toastui-editor-md-code-block-line-background.start {
                border-top-left-radius: 6px !important;
                border-top-right-radius: 6px !important;
            }
            
            /* Last line: bottom corners (followed by non-code-block element) */
            html:not(.dark) #${CONFIG.SELECTORS.EDITOR_CONTAINER} .toastui-editor-md-container .toastui-editor-md-code-block-line-background:has(+ div:not(.toastui-editor-md-code-block-line-background)) {
                border-bottom-left-radius: 6px !important;
                border-bottom-right-radius: 6px !important;
            }
            
            /* Fallback: Last code block line when it's the last child */
            html:not(.dark) #${CONFIG.SELECTORS.EDITOR_CONTAINER} .toastui-editor-md-container .toastui-editor-md-code-block-line-background:last-child {
                border-bottom-left-radius: 6px !important;
                border-bottom-right-radius: 6px !important;
            }
            
            /* Preview mode: Code blocks with syntax highlighting */
            html:not(.dark) #${CONFIG.SELECTORS.EDITOR_CONTAINER} .toastui-editor-contents pre {
                background-color: #272822 !important;
                border-radius: 6px !important;
                padding: 12px !important;
                margin: 8px 0 !important;
            }
            
            html:not(.dark) #${CONFIG.SELECTORS.EDITOR_CONTAINER} .toastui-editor-contents pre code {
                background-color: transparent !important;
                color: #f8f8f2 !important;
                padding: 0 !important;
            }
            
            /* WYSIWYG mode: Code blocks */
            html:not(.dark) #${CONFIG.SELECTORS.EDITOR_CONTAINER} .toastui-editor-ww-container pre {
                background-color: #272822 !important;
                border-radius: 6px !important;
                padding: 12px !important;
            }
            
            html:not(.dark) #${CONFIG.SELECTORS.EDITOR_CONTAINER} .toastui-editor-ww-container pre code {
                background-color: transparent !important;
                color: #f8f8f2 !important;
            }
            
            /* Prism.js syntax highlighting colors (Okaidia theme adjustments) */
            html:not(.dark) #${CONFIG.SELECTORS.EDITOR_CONTAINER} .toastui-editor-contents pre code[class*="language-"],
            html:not(.dark) #${CONFIG.SELECTORS.EDITOR_CONTAINER} .toastui-editor-contents pre[class*="language-"] {
                background-color: #272822 !important;
                color: #f8f8f2 !important;
            }
            
            /* Inline code (single backticks) - NOT modified, uses TOAST UI default styling */
        `;
        
        // Remove existing styles if any (for theme switching)
        const existingStyles = document.getElementById('toast-editor-custom-styles');
        if (existingStyles) existingStyles.remove();
        
        document.head.appendChild(styleSheet);
    }

    // ==============================
    // Tab Management
    // ==============================
    function saveTabPreference(editType, previewStyle) {
        state.editType = editType;
        state.previewStyle = previewStyle;
        localStorage.setItem(CONFIG.STORAGE.EDIT_TYPE, editType);
        localStorage.setItem(CONFIG.STORAGE.PREVIEW_STYLE, previewStyle);
    }

    function setActiveTab(modeSwitch, tabText) {
        const tabs = modeSwitch.querySelectorAll(CONFIG.SELECTORS.TAB_ITEM);
        tabs.forEach(tab => tab.classList.remove('active'));
        
        const targetTab = Array.from(tabs).find(tab => tab.textContent === tabText);
        if (targetTab) targetTab.classList.add('active');
    }

    function createSplitTabClickHandler() {
        return () => {
            if (state.previewStyle === CONFIG.PREVIEW_STYLES.SPLIT) return;
            switchToPreviewStyle(CONFIG.PREVIEW_STYLES.SPLIT);
        };
    }

    function createTabClickHandler(editType, originalHandler) {
        return (e) => {
            const isSwitchingFromSplit = state.previewStyle === CONFIG.PREVIEW_STYLES.SPLIT;
            
            saveTabPreference(editType, CONFIG.PREVIEW_STYLES.TAB);
            
            if (isSwitchingFromSplit) {
                switchToPreviewStyle(CONFIG.PREVIEW_STYLES.TAB);
            } else if (originalHandler) {
                originalHandler.call(e.target, e);
                
                // Reattach handlers after mode change (contenteditable element is replaced)
                setTimeout(() => {
                    attachEditorHandlers();
                }, CONFIG.DELAYS.SPELLCHECK);
            }
        };
    }

    function setupSplitTab() {
        setTimeout(() => {
            // If the editor was removed (chat navigation), don't keep retrying forever.
            if (!state.container || !document.body.contains(state.container)) return;

            const modeSwitch = state.container.querySelector(CONFIG.SELECTORS.MODE_SWITCH);
            if (!modeSwitch) {
                // Retry only while the container still exists
                setTimeout(setupSplitTab, CONFIG.DELAYS.SPELLCHECK);
                return;
            }

            const tabs = modeSwitch.querySelectorAll(CONFIG.SELECTORS.TAB_ITEM);
            const existingSplitTab = Array.from(tabs).find(tab => tab.textContent === 'Split');
            
            if (existingSplitTab) {
                if (state.previewStyle === CONFIG.PREVIEW_STYLES.SPLIT) {
                    setActiveTab(modeSwitch, 'Split');
                }
                existingSplitTab.onclick = createSplitTabClickHandler();
                return;
            }

            const splitTab = document.createElement('span');
            splitTab.className = 'tab-item';
            splitTab.textContent = 'Split';
            splitTab.style.cursor = 'pointer';
            splitTab.onclick = createSplitTabClickHandler();
            
            if (state.previewStyle === CONFIG.PREVIEW_STYLES.SPLIT) {
                setActiveTab(modeSwitch, 'Split');
                splitTab.classList.add('active');
            }

            modeSwitch.appendChild(splitTab);

            const [markdownTab, wysiwygTab] = tabs;
            if (markdownTab) {
                markdownTab.onclick = createTabClickHandler(CONFIG.EDIT_TYPES.MARKDOWN, markdownTab.onclick);
            }
            if (wysiwygTab) {
                wysiwygTab.onclick = createTabClickHandler(CONFIG.EDIT_TYPES.WYSIWYG, wysiwygTab.onclick);
            }
        }, CONFIG.DELAYS.TAB_SETUP);
    }

    function updateTabHighlighting() {
        setTimeout(() => {
            const modeSwitch = state.container.querySelector(CONFIG.SELECTORS.MODE_SWITCH);
            if (!modeSwitch) return;

            if (state.previewStyle === CONFIG.PREVIEW_STYLES.SPLIT) {
                setActiveTab(modeSwitch, 'Split');
            } else {
                const splitTab = Array.from(modeSwitch.querySelectorAll(CONFIG.SELECTORS.TAB_ITEM))
                    .find(tab => tab.textContent === 'Split');
                if (splitTab) splitTab.classList.remove('active');
            }
        }, CONFIG.DELAYS.TAB_STYLING);
    }

    // ==============================
    // Preview Style Switching
    // ==============================
    function switchToPreviewStyle(newStyle) {
        const currentContent = state.editor.getMarkdown();
        let targetEditType = state.editor.isMarkdownMode() ? 'markdown' : 'wysiwyg';
        
        // Split view only works in Markdown mode
        if (newStyle === CONFIG.PREVIEW_STYLES.SPLIT) {
            targetEditType = CONFIG.EDIT_TYPES.MARKDOWN;
        }
        
        // Update state BEFORE creating new instance
        saveTabPreference(targetEditType, newStyle);
        
        // Destroy old editor
        state.editor.destroy();
        
        // Create new editor with updated state (will use state.editType and state.previewStyle)
        state.editor = createEditorInstance(currentContent);
        
        attachEditorHandlers();
        setupSplitTab();
        updateTabHighlighting();
    }

    // ==============================
    // Keyboard Event Handlers
    // ==============================
    function createKeydownHandler() {
        return (event) => {
            // Handle Ctrl+Y for redo (Toast UI default is Ctrl+Shift+Z)
            if (event.key === 'y' && event.ctrlKey && !event.shiftKey && !event.altKey && !event.metaKey) {
                event.preventDefault();
                event.stopPropagation();
                state.editor.exec('redo');
                return;
            }
            
            // Handle Enter key for sending
            if (event.key === 'Enter' && !event.shiftKey && !event.ctrlKey && !event.metaKey) {
                // Check if autocomplete menu is open
                const menuIsOpen = isAutocompleteMenuOpen();
                
                if (menuIsOpen) {
                    // Let the menu handle the Enter key
                    return;
                }
                
                // No menu - prevent default and send message
                event.preventDefault();
                event.stopPropagation();
                sendMessage();
                return;
            }
            
            // Prevent browser quick-find for "/" (which would steal focus)
            if (event.key === '/' && !event.ctrlKey && !event.metaKey && !event.altKey) {
                event.preventDefault();
                document.execCommand('insertText', false, '/');
            }
        };
    }

    function createPasteHandler() {
        return () => {
            // Wait for paste content to be inserted, then force height adjustment
            requestAnimationFrame(() => {
                // Schedule sync to update content (coalesces multiple triggers)
                scheduleSyncToReactTextarea();
                
                // Multiple approaches to force editor to recalculate height
                const mdContainer = state.container.querySelector(CONFIG.SELECTORS.MD_CONTAINER);
                const wwContainer = state.container.querySelector('.toastui-editor-ww-container');
                const editorMain = state.container.querySelector('.toastui-editor-main-container');
                
                // Reset height to auto to allow expansion
                [mdContainer, wwContainer, editorMain].forEach(el => {
                    if (el) {
                        el.style.height = 'auto';
                    }
                });
                
                // Force reflow
                if (mdContainer) mdContainer.offsetHeight;
                if (wwContainer) wwContainer.offsetHeight;
                
                // Additional check after a brief delay to handle async content insertion
                setTimeout(() => {
                    [mdContainer, wwContainer].forEach(el => {
                        if (el) {
                            el.style.height = 'auto';
                            el.scrollTop = el.scrollHeight; // Scroll to bottom to show pasted content
                        }
                    });
                }, 50);
            });
        };
    }

    function isAutocompleteMenuOpen() {
        return !!(document.querySelector('[role="combobox"][aria-expanded="true"]') || 
                  document.querySelector('[role="listbox"]'));
    }

    function sendMessage() {
        const content = state.editor.getMarkdown().trim();
        if (!content) return;
        
        // Ensure TypingMind state is fully up to date before sending
        syncToReactTextarea({ emitChange: true });
        
        setTimeout(() => {
            const sendButton = document.querySelector(CONFIG.SELECTORS.SEND_BUTTON);
            if (sendButton && !sendButton.disabled) {
                sendButton.click();
                clearEditorAfterSend();
            }
        }, CONFIG.DELAYS.SEND_CLICK);
    }

    function clearEditorAfterSend() {
        setTimeout(() => {
            state.editor.setMarkdown('');
            syncToReactTextarea();
            
            const mdContainer = state.container.querySelector(CONFIG.SELECTORS.MD_CONTAINER);
            if (mdContainer) mdContainer.style.height = 'auto';
        }, CONFIG.DELAYS.CLEAR_AFTER_SEND);
    }

    // ==============================
    // Editor Setup
    // ==============================
    function attachEditorHandlers() {
        // Avoid stacking duplicate editor change handlers (can multiply work over time)
        if (state._boundEditorForChange !== state.editor) {
            state._boundEditorForChange = state.editor;
            state.editor.on('change', scheduleSyncToReactTextarea);
        }
        
        setTimeout(() => {
            const editableArea = state.container.querySelector(CONFIG.SELECTORS.EDITABLE);
            if (!editableArea) return;
            
            editableArea.setAttribute('spellcheck', 'true');

            // Avoid stacking duplicate DOM listeners when Toast UI swaps the editable element
            if (state._boundEditableForDomEvents === editableArea) return;
            state._boundEditableForDomEvents = editableArea;

            if (!state._keydownHandler) state._keydownHandler = createKeydownHandler();
            if (!state._pasteHandler) state._pasteHandler = createPasteHandler();

            // Use capture phase (true) to intercept BEFORE the editor processes the key
            editableArea.addEventListener('keydown', state._keydownHandler, true);
            editableArea.addEventListener('paste', state._pasteHandler);
        }, CONFIG.DELAYS.KEYBOARD_SETUP);
    }

    function setupEditor() {
        const parent = state.textarea.parentElement;

        state.container = document.createElement('div');
        state.container.id = CONFIG.SELECTORS.EDITOR_CONTAINER;
        state.textarea.style.display = 'none';
        parent.insertBefore(state.container, state.textarea);

        state.editor = createEditorInstance();
        
        applyCustomStyles();
        attachEditorHandlers();
        watchTextareaForExternalChanges();
        setupSplitTab();
    }

    // ==============================
    // External Change Detection
    // ==============================
    function watchTextareaForExternalChanges() {
        // Intercept textarea value getter/setter to detect external changes
        const descriptor = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value');
        if (!descriptor || !descriptor.get || !descriptor.set) return;

        const originalGetter = descriptor.get;
        const originalSetter = descriptor.set;

        Object.defineProperty(state.textarea, 'value', {
            get() {
                return originalGetter.call(this);
            },
            set(newValue) {
                originalSetter.call(this, newValue);

                if (!state.editor || typeof newValue !== 'string') return;

                // Fast-path: ignore React echo / our own sync to avoid extra getMarkdown() calls.
                if (newValue === state._lastSyncedMarkdown || newValue === state._lastSeenTextareaValue) {
                    state._lastSeenTextareaValue = newValue;
                    return;
                }
                state._lastSeenTextareaValue = newValue;

                // Sync to editor if value changed externally (edit message feature)
                if (newValue !== state.editor.getMarkdown()) {
                    state.editor.setMarkdown(newValue);
                }
            },
            configurable: true
        });
    }

    // ==============================
    // Chat Navigation Handling
    // ==============================
    function watchForChatChanges() {
        // Disconnect existing observer if present (prevents duplicate observers)
        if (state.chatObserver) {
            state.chatObserver.disconnect();
        }
        
        let reinitScheduled = false;
        
        state.chatObserver = new MutationObserver(() => {
            if (reinitScheduled) return;
            
            reinitScheduled = true;
            requestAnimationFrame(() => {
                reinitScheduled = false;
                
                const newTextarea = document.getElementById(CONFIG.SELECTORS.TEXTAREA);
                const editorExists = state.container && document.body.contains(state.container);
                
                if (newTextarea && !editorExists && !state.initInProgress) {
                    newTextarea.style.display = 'none';
                    state.editor = null;
                    state.container = null;
                    initialize();
                }
            });
        });

        // Observing `document.body` can be noisy; `main` is usually enough and reduces callbacks.
        const observeRoot = document.querySelector('main') || document.body;

        state.chatObserver.observe(observeRoot, {
            childList: true,
            subtree: true
        });
    }

    // ==============================
    // Theme Change Handling
    // ==============================
    function watchForThemeChanges() {
        // Disconnect existing observer if present (prevents duplicate observers)
        if (state.themeObserver) {
            state.themeObserver.disconnect();
        }
        
        let currentTheme = isDarkMode();
        
        state.themeObserver = new MutationObserver(() => {
            const newTheme = isDarkMode();
            if (newTheme !== currentTheme) {
                currentTheme = newTheme;
                
                // Recreate editor with new theme if it exists
                if (state.editor && state.container) {
                    const currentContent = state.editor.getMarkdown();
                    state.editor.destroy();
                    state.editor = createEditorInstance(currentContent);
                    attachEditorHandlers();
                    setupSplitTab();
                }
            }
        });

        state.themeObserver.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['class']
        });
    }

    // ==============================
    // Initialization
    // ==============================
    async function initialize() {
        if (state.initInProgress) return;

        state.textarea = document.getElementById(CONFIG.SELECTORS.TEXTAREA);
        if (!state.textarea) {
            setTimeout(initialize, CONFIG.DELAYS.INIT_RETRY);
            return;
        }

        if (state.container && document.body.contains(state.container)) return;
        
        const existingContainer = document.getElementById(CONFIG.SELECTORS.EDITOR_CONTAINER);
        if (existingContainer) {
            state.container = existingContainer;
            return;
        }

        state.initInProgress = true;

        try {
            await loadEditorLibrary();
            setupEditor();
            
            if (!state.isInitialized) {
                watchForChatChanges();
                watchForThemeChanges();
                state.isInitialized = true;
            }
        } catch (error) {
            console.error('[MarkdownRenderer] Initialization failed:', error);
        } finally {
            state.initInProgress = false;
        }
    }

    // ==============================
    // Bootstrap
    // ==============================
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        initialize();
    }

})();
