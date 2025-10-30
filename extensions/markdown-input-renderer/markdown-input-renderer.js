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
            JS: 'https://uicdn.toast.com/editor/latest/toastui-editor-all.min.js'
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
        editType: localStorage.getItem(CONFIG.STORAGE.EDIT_TYPE) || CONFIG.EDIT_TYPES.MARKDOWN
    };

    // ==============================
    // Library Loading
    // ==============================
    function loadEditorLibrary() {
        if (window.toastui?.Editor) {
            return Promise.resolve();
        }

        return new Promise((resolve, reject) => {
            const cssLink = document.createElement('link');
            cssLink.rel = 'stylesheet';
            cssLink.href = CONFIG.CDN.CSS;
            document.head.appendChild(cssLink);

            const script = document.createElement('script');
            script.src = CONFIG.CDN.JS;
            script.onload = resolve;
            script.onerror = () => reject(new Error('Failed to load TOAST UI Editor'));
            document.head.appendChild(script);
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
        return new window.toastui.Editor({
            el: state.container,
            height: CONFIG.HEIGHT.MODE,
            minHeight: CONFIG.HEIGHT.MIN,
            initialValue,
            initialEditType: state.editType,
            previewStyle: state.previewStyle,
            toolbarItems: CONFIG.TOOLBAR,
            hooks: {
                addImageBlobHook: handleImageBlob
            }
        });
    }

    // ==============================
    // React Integration
    // ==============================
    function syncToReactTextarea() {
        const content = state.editor.getMarkdown();
        const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set;
        setter.call(state.textarea, content);
        
        state.textarea.dispatchEvent(new Event('input', { bubbles: true }));
        state.textarea.dispatchEvent(new Event('change', { bubbles: true }));
    }

    // ==============================
    // Style Management
    // ==============================
    function applyCustomStyles() {
        const textareaStyles = window.getComputedStyle(state.textarea);
        
        const styleSheet = document.createElement('style');
        styleSheet.textContent = `
            #${CONFIG.SELECTORS.EDITOR_CONTAINER} .toastui-editor-md-container,
            #${CONFIG.SELECTORS.EDITOR_CONTAINER} .toastui-editor-contents {
                background: white !important;
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
                color: ${textareaStyles.color} !important;
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
        `;
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
            const modeSwitch = state.container.querySelector(CONFIG.SELECTORS.MODE_SWITCH);
            if (!modeSwitch) {
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
                // Force sync to update content
                syncToReactTextarea();
                
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
        
        syncToReactTextarea();
        
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
        state.editor.on('change', syncToReactTextarea);
        
        setTimeout(() => {
            const editableArea = state.container.querySelector(CONFIG.SELECTORS.EDITABLE);
            if (!editableArea) return;
            
            editableArea.setAttribute('spellcheck', 'true');
            // Use capture phase (true) to intercept BEFORE the editor processes the key
            editableArea.addEventListener('keydown', createKeydownHandler(), true);
            editableArea.addEventListener('paste', createPasteHandler());
            editableArea.addEventListener('input', syncToReactTextarea);
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

                // Sync to editor if value changed externally (edit message feature)
                if (state.editor && typeof newValue === 'string' && newValue !== state.editor.getMarkdown()) {
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
        let reinitScheduled = false;
        
        const observer = new MutationObserver(() => {
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

        observer.observe(document.body, {
            childList: true,
            subtree: true
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
