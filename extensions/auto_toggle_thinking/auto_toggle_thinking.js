// Always-On Thinking Button for TypingMind (Refactored Version)
(() => {
    // ----------------------------------------
    // Configuration & State
    // ----------------------------------------
    const STORAGE_KEY = 'thinking_button_preference';
    const DEBUG = true;            // Set to false to silence logs
    const CLICK_RETRY_DELAY = 800; // Milliseconds to wait before re-clicking
    const INITIAL_CHECK_DELAY = 2000; // Delay before first attempt to find button
  
    let ourButtonState = localStorage.getItem(STORAGE_KEY) === 'true';
    let currentButton = null;
    let observerActive = false;
  
    // Timers and counters
    let checkInterval = null;
    let clickAttempts = 0;
    let lastNavTime = 0;
  
    // Keep references to original History methods
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;
  
    // ----------------------------------------
    // Utility / Logging
    // ----------------------------------------
    function log(...args) {
      if (DEBUG) console.log('[ThinkingButton]', ...args);
    }
  
    function saveState(isOn) {
      ourButtonState = isOn;
      localStorage.setItem(STORAGE_KEY, String(isOn));
      log(`Saved state: ${isOn ? 'ON' : 'OFF'}`);
    }
  
    function isButtonOn(button) {
      return (
        button.classList.contains('bg-blue-200') ||
        button.classList.contains('dark:bg-blue-800')
      );
    }
  
    // ----------------------------------------
    // Button Discovery
    // ----------------------------------------
    function findButton() {
      // If we already have a valid button reference, use it
      if (currentButton && document.body.contains(currentButton)) {
        return currentButton;
      }
      currentButton = null; // Invalidate reference
  
      // Method 1: By data-tooltip-content
      const tooltipButtons = document.querySelectorAll(
        'button[data-tooltip-content="Toggle thinking mode"]'
      );
      if (tooltipButtons.length > 0) {
        currentButton = tooltipButtons[tooltipButtons.length - 1];
        return currentButton;
      }
  
      // Method 2: By scanning action bar icons
      const actionBar = document.querySelector('[data-element-id="chat-input-actions"]');
      if (actionBar) {
        const allButtons = actionBar.querySelectorAll('button');
        for (const btn of allButtons) {
          const icons = btn.querySelectorAll('svg');
          for (const icon of icons) {
            if (icon.innerHTML.includes('M14,6.75c0-3.113-2.846-5.562-6.078-4.887')) {
              currentButton = btn;
              return currentButton;
            }
          }
        }
      }
      return null;
    }
  
    // ----------------------------------------
    // Clicking the Button Safely
    // ----------------------------------------
    function safeClickButton(button) {
      if (!button) return;
  
      // Clear any previous scheduled clicks
      if (window.pendingButtonClick) {
        clearTimeout(window.pendingButtonClick);
      }
  
      // Schedule a click event
      window.pendingButtonClick = setTimeout(() => {
        try {
          log('Attempting to click button');
          // Simulate user events
          const mouseDown = new MouseEvent('mousedown', { bubbles: true, cancelable: true });
          const mouseUp = new MouseEvent('mouseup', { bubbles: true, cancelable: true });
          const click = new MouseEvent('click', { bubbles: true, cancelable: true });
  
          button.dispatchEvent(mouseDown);
          button.dispatchEvent(mouseUp);
          button.dispatchEvent(click);
  
          log('Button clicked successfully');
          clickAttempts = 0; // Reset attempts
        } catch (err) {
          log('Error during button click:', err);
          clickAttempts++;
          if (clickAttempts < 3) {
            log(`Retrying click, attempt ${clickAttempts}`);
            setTimeout(() => safeClickButton(button), CLICK_RETRY_DELAY * 2);
          }
        }
      }, CLICK_RETRY_DELAY);
    }
  
    // ----------------------------------------
    // Button State Management
    // ----------------------------------------
    function applyStateToButton(button) {
      if (!button) return false;
      const currentlyOn = isButtonOn(button);
      // If actual state differs from preferred state, click
      if (currentlyOn !== ourButtonState) {
        log(
          `Button state (${currentlyOn ? 'ON' : 'OFF'}) differs from preference (${
            ourButtonState ? 'ON' : 'OFF'
          })`
        );
        safeClickButton(button);
        return true;
      }
      log(`Button already in desired state: ${ourButtonState ? 'ON' : 'OFF'}`);
      return false;
    }
  
    function attachClickListener(button) {
      if (!button || button.hasAttribute('data-thinking-tracked')) return;
  
      button.setAttribute('data-thinking-tracked', 'true');
      log('Adding click listener to button');
  
      button.addEventListener('click', () => {
        // Delay state check because button classes update after animation
        setTimeout(() => {
          const newState = isButtonOn(button);
          log(`Button clicked manually, new state: ${newState ? 'ON' : 'OFF'}`);
          saveState(newState);
        }, 50);
      });
    }
  
    function manageButton() {
      try {
        const button = findButton();
        if (!button) return false;
  
        attachClickListener(button);
        applyStateToButton(button);
  
        // Once we find/configure the button, stop repeated checks
        if (checkInterval) {
          clearInterval(checkInterval);
          checkInterval = null;
          log('Cleared check interval - button is configured');
        }
        return true;
      } catch (err) {
        log('Error in manageButton:', err);
        return false;
      }
    }
  
    // ----------------------------------------
    // Observing UI Changes
    // ----------------------------------------
    function setupObserver() {
      if (observerActive) return;
      try {
        const observer = new MutationObserver((mutations) => {
          let shouldCheck = false;
  
          for (const mutation of mutations) {
            if (mutation.type !== 'childList' || mutation.addedNodes.length === 0) continue;
            for (const node of mutation.addedNodes) {
              if (node.nodeType !== 1) continue; // elements only
              if (
                (node.getAttribute && node.getAttribute('data-element-id') === 'chat-input-actions') ||
                (node.querySelector && node.querySelector('[data-element-id="chat-input-actions"]'))
              ) {
                shouldCheck = true;
                break;
              }
            }
            if (shouldCheck) break;
          }
  
          if (shouldCheck) {
            clearTimeout(window.thinkingButtonDebounce);
            window.thinkingButtonDebounce = setTimeout(() => {
              log('Chat UI changed, checking for button');
              if (manageButton()) {
                log('Button found and configured after UI change');
              }
            }, 500);
          }
        });
  
        observer.observe(document.body, { childList: true, subtree: true });
        observerActive = true;
        log('Observer activated');
        window.thinkingButtonObserver = observer;
      } catch (err) {
        log('Error setting up observer:', err);
      }
    }
  
    // ----------------------------------------
    // Navigation Handling
    // ----------------------------------------
    function handleNavigation(eventLabel) {
      const now = Date.now();
      if (now - lastNavTime < 500) {
        log(`Ignoring rapid navigation event (${eventLabel})`);
        return;
      }
      lastNavTime = now;
  
      log(`Navigation detected: ${eventLabel}`);
      currentButton = null; // We need to re-find button if DOM changes
  
      // Try after a short delay
      setTimeout(() => {
        if (manageButton()) {
          log('Button configured after navigation delay');
          return;
        }
        // If still not found, schedule a few additional attempts
        if (checkInterval) clearInterval(checkInterval);
  
        let checkIndex = 0;
        const checkDelays = [1000, 2000, 3000];
  
        checkInterval = setInterval(() => {
          if (manageButton()) {
            log('Button found in delayed check');
            clearInterval(checkInterval);
            checkInterval = null;
            return;
          }
          checkIndex++;
          if (checkIndex >= checkDelays.length) {
            log('Max check attempts reached - stopping');
            clearInterval(checkInterval);
            checkInterval = null;
          }
        }, checkDelays[checkIndex]);
      }, 1500);
    }
  
    // Override history methods
    history.pushState = function(...args) {
      originalPushState.apply(this, args);
      handleNavigation('pushState');
    };
  
    history.replaceState = function(...args) {
      originalReplaceState.apply(this, args);
      handleNavigation('replaceState');
    };
  
    // Listen for popstate
    window.addEventListener('popstate', () => {
      handleNavigation('popstate');
    });
  
    // Listen for tab visibility
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        log('Tab became visible');
        handleNavigation('visibilityChange');
      }
    });
  
    // ----------------------------------------
    // Cleanup
    // ----------------------------------------
    function cleanup() {
      if (window.thinkingButtonObserver) {
        window.thinkingButtonObserver.disconnect();
        observerActive = false;
      }
      if (checkInterval) {
        clearInterval(checkInterval);
        checkInterval = null;
      }
      if (window.thinkingButtonDebounce) {
        clearTimeout(window.thinkingButtonDebounce);
      }
      if (window.pendingButtonClick) {
        clearTimeout(window.pendingButtonClick);
      }
  
      // Restore original history methods
      history.pushState = originalPushState;
      history.replaceState = originalReplaceState;
  
      log('Thinking button script cleaned up');
    }
  
    // ----------------------------------------
    // Initialization
    // ----------------------------------------
    log(`Script started. Preference is ${ourButtonState ? 'ON' : 'OFF'}`);
  
    // Delay first check to ensure UI has initialized
    setTimeout(() => {
      setupObserver();
      // Attempt to manage the button after a short delay
      setTimeout(() => {
        if (manageButton()) {
          log('Button found and configured on initial check');
        } else {
          log('Button not found initially, will check again on UI changes');
        }
      }, 1000);
    }, INITIAL_CHECK_DELAY);
  
    // Expose global controls
    window.thinkingButton = {
      turnOn: () => {
        saveState(true);
        setTimeout(manageButton, 100);
      },
      turnOff: () => {
        saveState(false);
        setTimeout(manageButton, 100);
      },
      check: manageButton,
      getState: () => ourButtonState,
      cleanup,
    };
  })();
  