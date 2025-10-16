/**
 * Quote Reply Extension for TypingMind
 *
 * This script allows users to select text within chat messages,
 * collect multiple selections as quotes, and then send them
 * as a formatted block-quote reply.
 */
(() => {
    'use strict';

    class QuoteReply {
        // Initializes the extension state, selectors, and UI elements.
        constructor() {
            this.state = {
                selectedText: "",
                isProcessing: false,
                mouseX: 0,
                mouseY: 0,
            };

            this.SELECTORS = {
                responseBlock: '[data-element-id="response-block"]',
                messageInput: '[data-element-id="message-input"]',
                inputRow: '[data-element-id="input-row"]',
                textboxContainer: '[data-element-id="chat-input-textbox-container"]',
                textbox: '[data-element-id="chat-input-textbox"]',
                sendButton: '[data-element-id="send-button"]',
                quoteLabel: '[data-element-id="inline-character-label"]',
            };

            this.popover = this.createPopover();
            this.debouncedShowPopover = this.debounce(this.showPopover.bind(this), 10);
        }

        // Utility to limit the rate at which a function gets called.
        debounce(func, delay) {
            let timeout;
            return (...args) => {
                clearTimeout(timeout);
                timeout = setTimeout(() => func.apply(this, args), delay);
            };
        }

        // Creates and appends the 'Quote' popover button to the DOM.
        createPopover() {
            const popover = document.createElement("button");
            popover.className = "fixed rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 shadow-lg p-1.5 cursor-pointer z-50 flex items-center justify-center w-auto h-auto";
            popover.innerHTML = `
                <div class="flex items-center justify-center px-2 py-1">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 mr-1">
                        <path d="M7.5 13.25C7.98703 13.25 8.45082 13.1505 8.87217 12.9708C8.46129 14.0478 7.62459 15.5792 6.35846 15.76C5.81173 15.8382 5.43183 16.3447 5.50993 16.8914C5.58804 17.4382 6.09457 17.8181 6.6413 17.7399C9.19413 17.3753 10.7256 14.4711 11.169 12.1909C11.4118 10.942 11.3856 9.58095 10.8491 8.44726C10.2424 7.16517 8.92256 6.24402 7.48508 6.25001C5.55895 6.25805 4 7.82196 4 9.74998C4 11.683 5.567 13.25 7.5 13.25Z" fill="currentColor"></path>
                        <path d="M16.18 13.25C16.667 13.25 17.1308 13.1505 17.5522 12.9708C17.1413 14.0478 16.3046 15.5792 15.0385 15.76C14.4917 15.8382 14.1118 16.3447 14.1899 16.8914C14.268 17.4382 14.7746 17.8181 15.3213 17.7399C17.8741 17.3753 19.4056 14.4711 19.849 12.1909C20.0918 10.942 20.0656 9.58095 19.5291 8.44726C18.9224 7.16517 17.6026 6.24402 16.1651 6.25001C14.2389 6.25805 12.68 7.82196 12.68 9.74998C12.68 11.683 14.247 13.25 16.18 13.25Z" fill="currentColor"></path>
                    </svg>
                    <span class="text-sm font-medium">Quote</span>
                </div>`;
            popover.style.display = "none";
            popover.onclick = () => {
                this.addQuoteLabel(this.state.selectedText);
                this.hidePopover();
            };
            document.body.appendChild(popover);
            return popover;
        }

        // Safely gets the currently selected text from the window.
        getSelectionText() {
            const selection = window.getSelection();
            return selection ? selection.toString().trim() : "";
        }

        // Displays the quote popover above the selected text.
        showPopover(e) {
            const selection = window.getSelection();

            if (!selection || selection.isCollapsed) {
                return;
            }

            // Check if the selected text is within a response block
            const range = selection.getRangeAt(0);
            const container = range.commonAncestorContainer;
            const element = container.nodeType === Node.TEXT_NODE ? container.parentElement : container;
            const responseBlock = element.closest(this.SELECTORS.responseBlock);

            if (!responseBlock) {
                return;
            }
            
            this.state.selectedText = this.getSelectionText();

            if (this.state.selectedText) {
                const scrollTop  = window.pageYOffset || document.documentElement.scrollTop;
                const GAP        = 20; // pixels between cursor and popover

                // Show popover first to get accurate dimensions
                this.popover.style.display = "flex";
                this.popover.style.visibility = "hidden"; // Hide while positioning
                
                // Force reflow to ensure dimensions are calculated
                void this.popover.offsetHeight;

                const popoverRect = this.popover.getBoundingClientRect();

                // Position the popover so its bottom edge is GAP pixels above the cursor
                let left = this.state.mouseX - popoverRect.width / 2;
                let top  = scrollTop + this.state.mouseY - popoverRect.height - GAP;

                // If there isn't enough space above, place it below the cursor instead
                if (top < scrollTop) {
                    top = scrollTop + this.state.mouseY + GAP;
                }

                // Ensure the popover doesn't go off the left/right edges of the screen
                const windowWidth = window.innerWidth;
                if (left < 0) left = 0;
                if (left + popoverRect.width > windowWidth) {
                    left = windowWidth - popoverRect.width - 10;
                }

                this.popover.style.left = `${left}px`;
                this.popover.style.top  = `${top}px`;
                this.popover.style.visibility = "visible"; // Now show it
            } else {
                this.hidePopover();
            }
        }

        // Hides the quote popover and clears the selection state.
        hidePopover() {
            this.popover.style.display = "none";
            this.state.selectedText = "";
        }

        // Creates and displays a quote label above the chat input.
        addQuoteLabel(quote) {
            if (!quote) return;

            const previewQuote = quote.length > 100 ? `${quote.substring(0, 97)}...` : quote;

            const newLabel = document.createElement("div");
            newLabel.setAttribute("data-element-id", "inline-character-label");
            newLabel.className = "text-sm text-slate-600 dark:text-slate-400 pb-0.5 rounded-t-lg w-full -mb-1 bg-slate-100 dark:bg-slate-900/70 relative border-b border-slate-200 dark:border-slate-800";
            newLabel.innerHTML = `
                <div class="flex items-start justify-between w-full">
                    <div class="flex items-center justify-start gap-2 p-2 flex-grow">
                        <span class="error-fallback-gray flex-shrink-0 w-5 h-5 flex items-center justify-center">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-slate-500">
                                <path fill-rule="evenodd" clip-rule="evenodd" d="M5 6C5.55228 6 6 6.44772 6 7V11C6 11.5523 6.44772 12 7 12H16.5858L14.2929 9.70711C13.9024 9.31658 13.9024 8.68342 14.2929 8.29289C14.6834 7.90237 15.3166 7.90237 15.7071 8.29289L19.7071 12.2929C20.0976 12.6834 20.0976 13.3166 19.7071 13.7071L15.7071 17.7071C15.3166 18.0976 14.6834 18.0976 14.2929 17.7071C13.9024 17.3166 13.9024 16.6834 14.2929 16.2929L16.5858 14H7C5.34315 14 4 12.6569 4 11V7C4 6.44772 4.44772 6 5 6Z" fill="currentColor"></path>
                            </svg>
                        </span>
                        <span class="pr-8 font-normal"><i data-full-quote="${quote.replace(/"/g, "&quot;")}">${previewQuote}</i></span>
                    </div>
                    <button class="p-2 text-slate-500 hover:text-slate-900 dark:hover:text-white rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 absolute top-1 right-1">
                        <svg class="h-4 w-4" width="18px" height="18px" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
                            <g fill="currentColor">
                                <path d="M14 4L4 14" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"></path>
                                <path d="M4 4L14 14" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"></path>
                            </g>
                        </svg>
                    </button>
                </div>`;
            
            newLabel.querySelector('button').addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                newLabel.remove();
            });

            const wfullDiv = document.querySelector(`${this.SELECTORS.inputRow} .w-full`);
            const chatInputContainer = wfullDiv?.querySelector(this.SELECTORS.textboxContainer)?.parentElement;
            if (chatInputContainer) {
                wfullDiv.insertBefore(newLabel, chatInputContainer);
                const textArea = document.querySelector(this.SELECTORS.textbox);
                if (textArea) textArea.focus();
            }
        }

        // Formats all collected quotes and sends them as a message.
        async processAndSend() {
            if (this.state.isProcessing) return;
            this.state.isProcessing = true;

            const textArea = document.querySelector(this.SELECTORS.textbox);
            const quoteLabels = document.querySelectorAll(this.SELECTORS.quoteLabel);
            if (!textArea || quoteLabels.length === 0) {
                this.state.isProcessing = false;
                return;
            }

            try {
                const quotes = Array.from(quoteLabels).map((label) => {
                    const quoteElement = label.querySelector("i");
                    const fullQuote = quoteElement?.getAttribute("data-full-quote") || quoteElement?.textContent || "";
                    return fullQuote.split('\n').map(line => `> ${line}`).join('\n');
                });

                const newText = quotes.join("\n\n") + (textArea.value ? `\n\n${textArea.value}` : "");

                const reactKey = Object.keys(textArea).find((k) => k.startsWith("__reactProps$"));
                if (textArea[reactKey]?.onChange) {
                    const event = { target: { value: newText }, currentTarget: { value: newText } };
                    textArea[reactKey].onChange(event);
                } else {
                    textArea.value = newText;
                    textArea.dispatchEvent(new Event("input", { bubbles: true }));
                }
                
                quoteLabels.forEach((label) => label.remove());

                await new Promise(resolve => setTimeout(resolve, 50));
                
                const sendButton = document.querySelector(this.SELECTORS.sendButton);
                sendButton?.click();

            } catch (error) {
                console.error("QuoteReply Error:", error);
            } finally {
                this.state.isProcessing = false;
            }
        }

        // Binds all necessary global event listeners for mouse and keyboard actions.
        attachEventListeners() {
            document.addEventListener('mousemove', (e) => {
                this.state.mouseX = e.clientX;
                this.state.mouseY = e.clientY;
            });
            
            document.addEventListener('mouseup', this.debouncedShowPopover);
            
            document.addEventListener('mousedown', (e) => {
                if (!this.popover.contains(e.target)) {
                    this.hidePopover();
                }
            });

            document.addEventListener('scroll', () => this.hidePopover(), true);

            document.addEventListener('keydown', (e) => {
                const textArea = document.querySelector(this.SELECTORS.textbox);
                if (e.key === 'Enter' && !e.shiftKey && document.activeElement === textArea) {
                    const quoteLabels = document.querySelectorAll(this.SELECTORS.quoteLabel);
                    if (quoteLabels.length > 0) {
                        e.preventDefault();
                        e.stopPropagation();
                        this.processAndSend();
                    }
                }
            }, true);
        }

        // Watches for the send button to appear and attaches a click handler.
        observeSendButton() {
            const observer = new MutationObserver((mutations) => {
                const sendButton = document.querySelector(this.SELECTORS.sendButton);
                if (sendButton && !sendButton.dataset.quoteReplyHandler) {
                    sendButton.dataset.quoteReplyHandler = 'true';
                    sendButton.addEventListener('click', (e) => {
                        const quoteLabels = document.querySelectorAll(this.SELECTORS.quoteLabel);
                        if (quoteLabels.length > 0) {
                            e.preventDefault();
                            e.stopPropagation();
                            e.stopImmediatePropagation();
                            this.processAndSend();
                        }
                    }, { capture: true });
                }
            });
            observer.observe(document.body, { childList: true, subtree: true });
        }

        // Kicks off the extension by attaching listeners and observers.
        init() {
            this.attachEventListeners();
            this.observeSendButton();
            console.log("Quote Reply extension loaded.");
        }
    }

    const quoteReplyInstance = new QuoteReply();
    quoteReplyInstance.init();

})();
  