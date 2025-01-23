(() => {
    // Type definitions and interfaces are handled internally in the JavaScript closure
    
    // Constants and Configuration
    const SELECTORS = {
      chatInput: '#chat-input-textbox',
      toolbar: '[data-element-id="chat-input-actions"] .flex.items-center',
      voiceInputButton: '[data-element-id="voice-input-button"]',
      insertCodeButton: '[data-element-id="insert-code-button"]'
    };
  
    const STYLES = {
      modal: {
        overlay: {
          position: 'fixed',
          top: '0',
          left: '0',
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: '9999'
        },
        content: {
          backgroundColor: '#ffffff',
          padding: '30px',
          borderRadius: '12px',
          maxWidth: '600px',
          width: '90%',
          boxShadow: '0 5px 15px rgba(0, 0, 0, 0.3)',
          fontFamily: 'Arial, sans-serif',
          color: '#333'
        }
      },
      button: {
        base: {
          padding: '10px 20px',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          fontSize: '14px'
        },
        primary: {
          backgroundColor: '#0066cc',
          color: '#fff'
        },
        secondary: {
          backgroundColor: '#e0e0e0',
          color: '#333'
        }
      }
    };
  
    // Language configuration
    const languages = [
      '1c', 'abnf', 'accesslog', 'actionscript', 'ada', 'apache', 'applescript',
      'arduino', 'armasm', 'asciidoc', 'aspectj', 'autohotkey', 'autoit', 'avrasm',
      'awk', 'axapta', 'bash', 'basic', 'bnf', 'brainfuck', 'cal', 'capnproto',
      'ceylon', 'clean', 'clojure-repl', 'clojure', 'cmake', 'coffeescript',
      'coq', 'cos', 'cpp', 'crmsh', 'crystal', 'cs', 'csp', 'css', 'd', 'dart',
      'delphi', 'diff', 'django', 'dns', 'dockerfile', 'dos', 'dsconfig', 'dts',
      'dust', 'ebnf', 'elixir', 'elm', 'erb', 'erlang-repl', 'erlang', 'excel',
      'fix', 'flix', 'fortran', 'fsharp', 'gams', 'gauss', 'gcode', 'gherkin',
      'glsl', 'go', 'golo', 'gradle', 'groovy', 'haml', 'handlebars', 'haskell',
      'haxe', 'hsp', 'htmlbars', 'http', 'hy', 'inform7', 'ini', 'irpf90',
      'java', 'javascript', 'json', 'julia-repl', 'julia', 'kotlin', 'lasso',
      'ldif', 'leaf', 'less', 'lisp', 'livecodeserver', 'livescript', 'llvm',
      'lsl', 'lua', 'makefile', 'markdown', 'mathematica', 'matlab', 'maxima',
      'mel', 'mercury', 'mipsasm', 'mizar', 'mojolicious', 'monkey', 'moonscript',
      'n1ql', 'nginx', 'nimrod', 'nix', 'nsis', 'objectivec', 'ocaml', 'openscad',
      'oxygene', 'parser3', 'perl', 'pf', 'php', 'plaintext', 'pony', 'powershell',
      'processing', 'profile', 'prolog', 'properties', 'protobuf', 'puppet',
      'python', 'q', 'qml', 'r', 'reasonml', 'rib', 'roboconf', 'rsl', 'ruby',
      'ruleslanguage', 'rust', 'sas', 'scala', 'scheme', 'scilab', 'scss',
      'shell', 'smali', 'smalltalk', 'sml', 'sql', 'stan', 'stata', 'step21',
      'stylus', 'subunit', 'swift', 'taggerscript', 'tap', 'tcl', 'tex',
      'thrift', 'tp', 'twig', 'typescript', 'vala', 'vbnet', 'vbscript-html',
      'vbscript', 'verilog', 'vhdl', 'vim', 'x86asm', 'xl', 'xml', 'xquery',
      'yaml', 'zephir'
    ].sort();
  
    const languageMap = {
      js: 'javascript',
      ts: 'typescript',
      yml: 'yaml',
      md: 'markdown',
      py: 'python',
      rb: 'ruby',
      ps1: 'powershell',
      psm1: 'powershell',
      sh: 'bash',
      bat: 'dos',
      h: 'c',
      hpp: 'cpp',
      cc: 'cpp',
      'c++': 'cpp',
      'h++': 'cpp',
      hh: 'cpp',
      cxx: 'cpp',
      hxx: 'cpp',
      cs: 'csharp',
      fs: 'fsharp',
      jsx: 'javascript',
      tsx: 'typescript',
      html: 'xml',
      xhtml: 'xml',
      rss: 'xml',
      atom: 'xml',
      xsl: 'xml',
      plist: 'xml',
      svg: 'xml'
    };
  
    // State management
    let state = {
      cursorPosition: 0,
      selectedLanguage: 'plaintext',
      modalOverlay: null,
      insertCodeButton: null
    };
  
    // Utility functions
    function setNativeValue(element, value) {
      const valueSetter = Object.getOwnPropertyDescriptor(element.__proto__, 'value').set;
      valueSetter.call(element, value);
      element.dispatchEvent(new Event('input', { bubbles: true }));
    }
  
    async function loadScript(url) {
      return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = url;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error(`Failed to load script: ${url}`));
        document.head.appendChild(script);
      });
    }
  
    async function loadHighlightJs() {
      if (window.hljsLoaded) return;
      try {
        // Load highlight.js
        await loadScript('https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.10.0/highlight.min.js');
        const style = document.createElement('link');
        style.rel = 'stylesheet';
        style.href = 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.10.0/styles/default.min.css';
        document.head.appendChild(style);
        
        // Load the line numbers plugin
        await loadScript('https://cdn.jsdelivr.net/npm/highlightjs-line-numbers.js@2.8.0/dist/highlightjs-line-numbers.min.js');

        window.hljsLoaded = true;
      } catch (err) {
        console.error('Error loading highlight.js:', err);
        throw new Error('Failed to load language detection library.');
      }
    }
  
    function sanitizeXmlTag(input) {
      let tag = input.toLowerCase();
      tag = tag.replace(/[^a-z0-9_.-]/g, '_');
      return /^[a-z_]/.test(tag) ? tag : `_${tag}`;
    }
  
    function detectLanguage(code) {
      if (!window.hljs) return 'plaintext';
      
      try {
        const result = window.hljs.highlightAuto(code);
        let detected = result.language || 'plaintext';
        
        if (detected === 'plaintext' && isMarkdown(code)) {
          return 'markdown';
        }
        
        return languageMap[detected] || detected;
      } catch (error) {
        console.error('Language detection error:', error);
        return 'plaintext';
      }
    }
  
    function isMarkdown(code) {
      const mdPatterns = {
        headers: /^#{1,6}\\s+\\w+/m,
        lists: /^[\\s]*[-*+]\\s+\\w+/m,
        blockquotes: /^>\\s+\\w+/m,
        codeBlocks: /^```\\w+/m,
        tables: /^\\|(?:.*\\|)+\\n\\|(?:[-:]+\\|)+$/m
      };
  
      return Object.values(mdPatterns)
        .filter(pattern => pattern.test(code))
        .length >= 2;
    }
  
    // UI Components
    function createModalOverlay() {
      const overlay = document.createElement('div');
      Object.assign(overlay.style, STYLES.modal.overlay);
      return overlay;
    }
  
    function createModalContent() {
      const content = document.createElement('div');
      Object.assign(content.style, STYLES.modal.content);
      return content;
    }
  
    /**
   * Instead of returning <tag>...</tag>, this function returns
   * a markdown-formatted code block with triple backticks,
   * including the language if detected.
   */
    function buildFinalCodeBlock(rawTag, codeContent) {
      const finalTag = sanitizeXmlTag(rawTag);
      return [
        '```' + finalTag,
        codeContent,
        '```'
      ].join('\\n');
    }
  
    function insertIntoChat(textbox, insertText) {
      const originalValue = textbox.value;
      const newValue = 
        originalValue.substring(0, state.cursorPosition) +
        insertText +
        originalValue.substring(state.cursorPosition);
  
      setNativeValue(textbox, newValue);
  
      const newCursorPos = state.cursorPosition + insertText.length;
      textbox.focus();
      textbox.setSelectionRange(newCursorPos, newCursorPos);
    }
  
    // This function updates the highlighted preview in real time
    function updatePreview(previewCodeEl, codeText) {
      // Clear previous code
      previewCodeEl.textContent = codeText;
      // Re-apply highlight
      window.hljs.highlightElement(previewCodeEl);
      // Add line numbers
      if (window.hljs.lineNumbersBlock) {
        window.hljs.lineNumbersBlock(previewCodeEl);
      }
    }

    // Modal handling
    async function handleInsertCodeClick() {
      const textbox = document.querySelector(SELECTORS.chatInput);
      if (!textbox) {
        console.error('Chat input textbox not found.');
        return;
      }
  
      state.cursorPosition = textbox.selectionStart;
  
      if (typeof hljs === 'undefined') {
        await loadHighlightJs();  // loads highlight.js and line numbers plugin
        if (typeof hljs === 'undefined') return;
      }
  
      state.modalOverlay = createModalOverlay();
      const modalContent = createModalContent();
      state.modalOverlay.appendChild(modalContent);
      document.body.appendChild(state.modalOverlay);
  
      // Build modal UI components
      const modalTitle = document.createElement('h2');
      Object.assign(modalTitle.style, {
        marginBottom: '20px',
        fontSize: '24px',
        color: '#0066cc'
      });
      modalTitle.textContent = 'Insert Your Code';
      modalContent.appendChild(modalTitle);
  
      // Code textarea
      const codeTextarea = document.createElement('textarea');
      Object.assign(codeTextarea.style, {
        width: '100%',
        height: '100px',
        fontFamily: 'Consolas, monospace',
        fontSize: '14px',
        padding: '15px',
        marginBottom: '10px',
        boxSizing: 'border-box',
        border: '1px solid #ccc',
        borderRadius: '8px'
      });
      codeTextarea.placeholder = 'Paste your code here...';
      modalContent.appendChild(codeTextarea);
  
      // Preview area (rich text)
      const previewContainer = document.createElement('div');
      Object.assign(previewContainer.style, {
        width: '100%',
        height: '200px',
        marginBottom: '20px',
        border: '1px solid #ccc',
        borderRadius: '8px',
        overflow: 'auto',
        backgroundColor: '#f5f5f5'
      });

      const previewPre = document.createElement('pre');
      const previewCode = document.createElement('code');
      previewCode.className = 'hljs';
      previewPre.appendChild(previewCode);
      previewContainer.appendChild(previewPre);
      modalContent.appendChild(previewContainer);

      // Language container
      const languageContainer = document.createElement('div');
      Object.assign(languageContainer.style, {
        marginBottom: '20px',
        display: 'flex',
        alignItems: 'center',
        flexWrap: 'wrap'
      });
      modalContent.appendChild(languageContainer);
  
      // Language detection label
      const detectedLabel = document.createElement('span');
      Object.assign(detectedLabel.style, {
        flex: '1 1 100%',
        marginBottom: '10px',
        fontSize: '16px',
        color: '#555'
      });
      detectedLabel.textContent = 'Detected Language: None';
      languageContainer.appendChild(detectedLabel);
  
      // Language input container
      const languageInputContainer = document.createElement('div');
      Object.assign(languageInputContainer.style, {
        position: 'relative',
        flex: '1',
        marginRight: '10px'
      });
      languageContainer.appendChild(languageInputContainer);
  
      // Language input
      const languageInput = document.createElement('input');
      Object.assign(languageInput.style, {
        width: '100%',
        padding: '10px',
        boxSizing: 'border-box',
        border: '1px solid #ccc',
        borderRadius: '8px',
        fontSize: '14px'
      });
      languageInput.type = 'text';
      languageInput.placeholder = 'Select language';
      languageInputContainer.appendChild(languageInput);
  
      // Dropdown list
      const dropdownList = document.createElement('ul');
      Object.assign(dropdownList.style, {
        position: 'absolute',
        top: '100%',
        left: '0',
        right: '0',
        maxHeight: '200px',
        overflowY: 'auto',
        backgroundColor: '#fff',
        border: '1px solid #ccc',
        borderTop: 'none',
        listStyle: 'none',
        padding: '0',
        margin: '0',
        zIndex: '10000',
        display: 'none',
        borderRadius: '0 0 8px 8px',
        boxShadow: '0 5px 15px rgba(0, 0, 0, 0.1)'
      });
      languageInputContainer.appendChild(dropdownList);
  
      // Custom tag input
      const customTagInput = document.createElement('input');
      Object.assign(customTagInput.style, {
        padding: '10px',
        boxSizing: 'border-box',
        border: '1px solid #ccc',
        borderRadius: '8px',
        fontSize: '14px',
        width: '150px'
      });
      customTagInput.type = 'text';
      customTagInput.placeholder = 'Custom tag';
      customTagInput.addEventListener('input', (e) => {
        e.target.value = e.target.value.replace(/\s+/g, '_');
      });
      languageContainer.appendChild(customTagInput);
  
      // Language dropdown functionality
      function updateDropdownList(filter = '') {
        dropdownList.innerHTML = '';
        const filtered = languages.filter(lang =>
          lang.toLowerCase().includes(filter.toLowerCase())
        );
        filtered.forEach(lang => {
          const li = document.createElement('li');
          Object.assign(li.style, {
            padding: '10px 15px',
            cursor: 'pointer',
            backgroundColor: '#fff',
            fontSize: '14px',
            color: '#333'
          });
          li.textContent = lang;
          li.addEventListener('mouseover', () => {
            li.style.backgroundColor = '#f5f5f5';
          });
          li.addEventListener('mouseout', () => {
            li.style.backgroundColor = '#fff';
          });
          li.addEventListener('click', () => {
            languageInput.value = lang;
            state.selectedLanguage = lang;
            dropdownList.style.display = 'none';
          });
          dropdownList.appendChild(li);
        });
        dropdownList.style.display = filtered.length ? 'block' : 'none';
      }
  
      // Language input events
      languageInput.addEventListener('focus', () => {
        languageInput.value = '';
        updateDropdownList('');
      });
      languageInput.addEventListener('input', () => {
        updateDropdownList(languageInput.value);
      });
      languageInput.addEventListener('click', (ev) => {
        ev.stopPropagation();
        languageInput.focus();
        updateDropdownList(languageInput.value);
      });
      document.addEventListener('click', (ev) => {
        if (!languageInputContainer.contains(ev.target)) {
          dropdownList.style.display = 'none';
        }
      });
  
      // Auto-detect language
      codeTextarea.addEventListener('input', () => {
        const codeText = codeTextarea.value;
        if (!codeText.trim()) {
          state.selectedLanguage = 'plaintext';
          detectedLabel.textContent = 'Detected Language: None';
          previewCode.textContent = '';
        } else {
          const detected = detectLanguage(codeText);
          state.selectedLanguage = detected;
          detectedLabel.textContent = 'Detected Language: ' + detected;
          // Update the preview
          updatePreview(previewCode, codeText);
        }
      });
  
      // Buttons container
      const buttonsContainer = document.createElement('div');
      Object.assign(buttonsContainer.style, {
        marginTop: '20px',
        textAlign: 'right'
      });
  
      // Cancel button
      const cancelButton = document.createElement('button');
      cancelButton.textContent = 'Cancel';
      Object.assign(cancelButton.style, {
        ...STYLES.button.base,
        ...STYLES.button.secondary,
        marginRight: '10px'
      });
      cancelButton.addEventListener('mouseover', () => {
        cancelButton.style.backgroundColor = '#d5d5d5';
      });
      cancelButton.addEventListener('mouseout', () => {
        cancelButton.style.backgroundColor = '#e0e0e0';
      });
      cancelButton.addEventListener('click', () => {
        document.body.removeChild(state.modalOverlay);
      });
      buttonsContainer.appendChild(cancelButton);
  
      // Insert button
      const insertButton = document.createElement('button');
      insertButton.textContent = 'Insert Code';
      Object.assign(insertButton.style, {
        ...STYLES.button.base,
        ...STYLES.button.primary
      });
      insertButton.addEventListener('mouseover', () => {
        insertButton.style.backgroundColor = '#005bb5';
      });
      insertButton.addEventListener('mouseout', () => {
        insertButton.style.backgroundColor = '#0066cc';
      });
      insertButton.addEventListener('click', () => {
        const codeText = codeTextarea.value;
        if (!codeText.trim()) {
          alert('Please paste your code.');
          return;
        }
        try {
          const rawTag = customTagInput.value.trim() ||
                        languageInput.value.trim() ||
                        state.selectedLanguage;
          const insertText = buildFinalCodeBlock(rawTag, codeText);
          insertIntoChat(textbox, insertText);
          document.body.removeChild(state.modalOverlay);
        } catch (err) {
          console.error('Error processing code:', err);
          alert('There was an error processing your code. Please try again.');
        }
      });
      buttonsContainer.appendChild(insertButton);
  
      modalContent.appendChild(buttonsContainer);
      codeTextarea.focus();
    }
  
    // Toolbar button
    function addInsertCodeButton() {
      try {
        const toolbar = document.querySelector(SELECTORS.toolbar);
        if (toolbar && !state.insertCodeButton) {
          state.insertCodeButton = document.createElement('button');
          state.insertCodeButton.setAttribute('type', 'button');
          state.insertCodeButton.setAttribute('data-element-id', 'insert-code-button');
          state.insertCodeButton.className =
            'shrink-0 rounded-md relative flex items-center justify-center py-1 px-1 text-gray-500 hover:text-gray-900 dark:hover:text-white';
          state.insertCodeButton.setAttribute('data-tooltip-id', 'global');
          state.insertCodeButton.setAttribute('data-tooltip-content', 'Insert Code');
  
          state.insertCodeButton.innerHTML = `
            <svg stroke="currentColor" fill="currentColor" stroke-width="0"
              viewBox="0 0 24 24" class="w-5 h-5" xmlns="http://www.w3.org/2000/svg">
              <path d="M8.293 6.293L2.586 12l5.707 5.707 1.414-1.414L5.414 12l4.293-4.293zm7.414 0-1.414 1.414L18.586 12l-4.293 4.293 1.414 1.414L21.414 12z"></path>
            </svg>
          `;
  
          state.insertCodeButton.addEventListener('click', handleInsertCodeClick);
  
          const voiceButton = toolbar.querySelector(SELECTORS.voiceInputButton);
          if (voiceButton && voiceButton.nextSibling) {
            toolbar.insertBefore(state.insertCodeButton, voiceButton.nextSibling);
          } else {
            toolbar.appendChild(state.insertCodeButton);
          }
        }
      } catch (error) {
        console.error('Error adding Insert Code button to toolbar:', error);
      }
    }
  
    // Initialization
    function initialize() {
      try {
        state.insertCodeButton = document.querySelector(SELECTORS.insertCodeButton);
        if (!state.insertCodeButton) {
          addInsertCodeButton();
        }
      } catch (error) {
        console.error('Error during initialization:', error);
      }
    }
  
    // Start the extension
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initialize);
    } else {
      initialize();
    }
  
    // Observe DOM changes
    const observer = new MutationObserver(() => {
      initialize();
    });
  
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  })();