/* ============================================================================
 * TypingMind Image Viewer
 *
 * This script improves how you view and save images in TypingMind.
 *
 * --- FEATURES ---
 * 1. Click any image to open it in a full-screen gallery (uses PhotoSwipe).
 * 2. A "Download" button appears in the top-right corner of the gallery.
 *    - Its icon color adapts to the image, just like the "Close" (X) button.
 * 3. Hover your mouse over an image in the chat to see a quick-download button.
 * 4. Saved images get a custom filename like `img123-08-15-24-10-30.png`.
 * ========================================================================== */

(() => {
  'use strict';

  // ==============================
  // --- Configuration ---
  // These settings help the script decide which images to make clickable.
  // ==============================
  // Where to look for images in the TypingMind interface.
  const ROOT_SEL = '.dynamic-chat-content-container, [data-element-id="ai-response"], [data-element-id="user-message"]';
  // The smallest image size (in pixels) to consider a "real" image.
  const MIN_RENDER_SIZE = 96;
  // CSS classes that usually mean it's a content image we want.
  const CLASS_HINTS_INCLUDE = ['rounded-md', 'max-w-', 'max-h-'];
  // CSS classes to ignore (like tiny icons, logos, or avatars).
  const CLASS_HINTS_EXCLUDE = ['user-avatar', 'emoji', 'icon', 'logo', 'w-4', 'h-4', 'w-5', 'h-5'];

  // ==============================
  // --- Image Gallery (PhotoSwipe) ---
  // This section handles loading the PhotoSwipe gallery library when needed.
  // It's loaded on demand to keep the initial page load fast.
  // ==============================
  // The web addresses for the PhotoSwipe library's files (CSS style and JS code).
  const PSWP_CSS = 'https://cdn.jsdelivr.net/npm/photoswipe@5.4.4/dist/photoswipe.css';
  const PSWP_ESM = 'https://cdn.jsdelivr.net/npm/photoswipe@5.4.4/dist/photoswipe.esm.min.js';

  // These variables keep track of the PhotoSwipe loading process.
  let PSWP = null, cssLoaded = false, preloadStarted = false, ensurePSWPPromise = null;

  // Adds the PhotoSwipe stylesheet to the page so the gallery looks correct.
  function loadCSS(href) {
    return new Promise((res, rej) => {
      if (cssLoaded) return res();
      const l = document.createElement('link');
      l.rel = 'stylesheet';
      l.href = href;
      l.onload = () => { cssLoaded = true; res(); };
      l.onerror = rej;
      document.head.appendChild(l);
    });
  }
  // Makes sure the PhotoSwipe library is loaded and ready to use.
  // If it's already loading, it waits; if not, it starts loading.
  async function ensurePhotoSwipe() {
    if (PSWP) return PSWP;
    if (ensurePSWPPromise) return ensurePSWPPromise;
    ensurePSWPPromise = (async () => {
      await loadCSS(PSWP_CSS);
      const mod = await import(PSWP_ESM);
      PSWP = mod.default;
      return PSWP;
    })();
    return ensurePSWPPromise;
  }
  // Starts preloading PhotoSwipe in the background when the page is idle
  // or when you first hover over an image. This makes the gallery open
  // instantly when you finally click an image.
  function preloadPhotoSwipeSoon() {
    if (preloadStarted) return;
    preloadStarted = true;
    const start = () => { ensurePhotoSwipe().catch(() => {}); };
    if ('requestIdleCallback' in window) requestIdleCallback(start, { timeout: 3000 });
    else setTimeout(start, 300);
  }

  // ==============================
  // --- Helper Functions ---
  // Small utility functions that do specific jobs for the main features.
  // ==============================

  // Checks if an element on the page is a main chat image we should handle.
  // It ignores small icons, avatars, and emojis.
  function isChatImage(el) {
    if (!el || el.tagName !== 'IMG') return false;
    if (!el.closest('[data-element-id="ai-response"], [data-element-id="user-message"], .dynamic-chat-content-container')) return false;
    if (el.closest('[data-element-id="chat-avatar-container"]')) return false;
    const classes = (el.className || '') + '';
    if (CLASS_HINTS_EXCLUDE.some(k => classes.includes(k))) return false;
    const rect = el.getBoundingClientRect();
    const largeEnough = Math.max(rect.width, rect.height) >= MIN_RENDER_SIZE;
    const hasContentClass = CLASS_HINTS_INCLUDE.some(k => classes.includes(k));
    return largeEnough || hasContentClass;
  }

  // Converts a relative URL (like "/image.png") into a full, absolute URL.
  function toAbs(urlLike) { try { return new URL(urlLike, location.href).toString(); } catch { return urlLike; } }
  
  // Gathers the necessary details from an image to show it in the gallery.
  // This includes its full URL, width, and height.
  function slideFrom(imgEl) {
    const src = toAbs(imgEl.currentSrc || imgEl.src || '');
    const w = imgEl.naturalWidth || Math.max(1600, Math.round((imgEl.width || 800) * devicePixelRatio));
    const h = imgEl.naturalHeight || Math.max(1200, Math.round((imgEl.height || 600) * devicePixelRatio));
    return { src, width: w, height: h, element: imgEl };
  }

  // Figures out the file extension (like .png or .jpg) from an image URL.
  function getExtFromURL(src) {
    try {
      const u = new URL(src, location.href);
      const name = (u.pathname.split('/').pop() || '').split('?')[0];
      const m = name.match(/\.(png|jpe?g|webp|gif|bmp|tiff)$/i);
      return m ? m[0] : '.png';
    } catch { return '.png'; }
  }
  
  // Adds a leading zero to a number if it's less than 10 (e.g., 7 -> "07").
  function pad2(n) { return String(n).padStart(2, '0'); }
  
  // Creates the custom filename for downloads (e.g., "img123-08-15-24-10-30.png").
  function buildCustomFilename(ext) {
    const now = new Date();
    const mm = pad2(now.getMonth() + 1);
    const dd = pad2(now.getDate());
    const yy = pad2(now.getFullYear() % 100);
    const HH = pad2(now.getHours());
    const MM = pad2(now.getMinutes());
    const rnd = Math.floor(Math.random() * 900) + 100;
    return `img${rnd}-${mm}-${dd}-${yy}-${HH}-${MM}${ext}`;
  }
  
  // Triggers the browser's "Save As..." dialog to download the image.
  async function downloadViaAnchor(srcUrl) {
    const filename = buildCustomFilename(getExtFromURL(srcUrl));
    const a = document.createElement('a');
    a.href = srcUrl;
    a.download = filename;
    a.rel = 'noopener';
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  // ==============================
  // --- Main Gallery Feature ---
  // This is the core function that opens an image in the PhotoSwipe gallery.
  // ==============================
  async function openFor(imgEl) {
    const PhotoSwipe = await ensurePhotoSwipe();

    const pswp = new PhotoSwipe({
      dataSource: [slideFrom(imgEl)],
      wheelToZoom: true,
      zoom: true,
      padding: 8,
      showHideAnimationType: 'zoom',
      bgOpacity: 0.9,
      preloadFirstSlide: false
    });

    // --- Gallery Download Button ---
    // This part adds the custom "Download" button to the gallery's top toolbar.
    pswp.on('uiRegister', () => {
      pswp.ui.registerElement({
        name: 'tmDownload',
        ariaLabel: 'Download image',
        order: 15,
        isButton: true,
        appendTo: 'bar',
        className: 'pswp__button pswp__button--tm-download',
        html: `
          <svg aria-hidden="true" class="pswp__icn" viewBox="0 0 32 32" width="32" height="32">
            <path class="pswp__icn-shadow" d="M16 6v14 M10 14l6 6 6-6 M6 24v4h20v-4" fill="none" stroke-linecap="round" stroke-linejoin="round"></path>
            <path d="M16 6v14 M10 14l6 6 6-6 M6 24v4h20v-4" fill="none" stroke-linecap="round" stroke-linejoin="round"></path>
          </svg>
        `,
        onClick: () => {
          const src = pswp.currSlide?.data?.src;
          if (src) downloadViaAnchor(src);
        }
      });
    });

    // --- Gallery Button Styling ---
    // This adds the CSS rules that make our custom download button look right
    // and adapt its color to the background, just like the other buttons.
    const styleId = 'tm-pswp-download-style';
    if (!document.getElementById(styleId)) {
      const s = document.createElement('style');
      s.id = styleId;
      s.textContent = `
        .pswp__button--tm-download .pswp__icn { color: var(--pswp-icon-color); }
        .pswp__button--tm-download .pswp__icn path:not(.pswp__icn-shadow) { stroke: currentColor; }
        .pswp__button--tm-download .pswp__icn-shadow { stroke: var(--pswp-icon-color-secondary); }
        .pswp__button--tm-download .pswp__icn-shadow { stroke-width: 3.6; opacity: 0.95; }
        .pswp__button--tm-download .pswp__icn path:not(.pswp__icn-shadow) { stroke-width: 2.2; }
        .pswp__button.pswp__button--tm-download { margin-left: 6px; }
        .pswp__button--tm-download svg { display: block; }
        .pswp__button--tm-download .pswp__icn { filter: drop-shadow(0 0 1px rgba(0,0,0,0.35)); }
      `;
      document.head.appendChild(s);
    }

    pswp.on('close', () => pswp.destroy());
    pswp.init();
  }

  // ==============================
  // --- Hover Download Button ---
  // This section creates the small download button that appears when you
  // hover your mouse over an image directly in the chat.
  // ==============================
  const dlBtn = document.createElement('button');
  dlBtn.type = 'button';
  dlBtn.setAttribute('aria-label', 'Download image');
  dlBtn.title = 'Download';
  dlBtn.style.cssText = `
    position: fixed;
    z-index: 2147483000;
    display: none;
    padding: 6px 7px;
    border-radius: 10px;
    border: 1px solid rgba(0,0,0,0.05);
    color: #fff;
    background: rgba(0,0,0,0.45);
    backdrop-filter: blur(6px);
    box-shadow: 0 2px 8px rgba(0,0,0,0.25);
    cursor: pointer;
  `;
  dlBtn.innerHTML = `
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:block">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="7 10 12 15 17 10"/>
      <line x1="12" y1="15" x2="12" y2="3"/>
    </svg>
  `;
  document.body.appendChild(dlBtn);

  // --- Hover Button Logic ---
  // These functions handle showing, hiding, and positioning the hover button.
  let hoveredImg = null;
  let lastCursorTarget = null;

  // Calculates where to place the button based on the image's position.
  function positionBtnFor(imgEl) {
    const r = imgEl.getBoundingClientRect();
    const top = Math.max(r.top + 8, 8);
    const left = Math.min(r.right - 8 - 32, window.innerWidth - 40);
    dlBtn.style.top = `${top}px`;
    dlBtn.style.left = `${left}px`;
  }
  // Shows the button and sets the mouse cursor to a pointer.
  function showBtn(imgEl) {
    hoveredImg = imgEl;
    positionBtnFor(imgEl);
    dlBtn.style.display = 'block';
    if (lastCursorTarget && lastCursorTarget !== imgEl) lastCursorTarget.style.cursor = '';
    imgEl.style.cursor = 'pointer';
    lastCursorTarget = imgEl;
  }
  // Hides the button and resets the mouse cursor.
  function hideBtn() {
    hoveredImg = null;
    dlBtn.style.display = 'none';
    if (lastCursorTarget) { lastCursorTarget.style.cursor = ''; lastCursorTarget = null; }
  }

  window.addEventListener('scroll', () => { if (hoveredImg) positionBtnFor(hoveredImg); }, { passive: true });
  window.addEventListener('resize', () => { if (hoveredImg) positionBtnFor(hoveredImg); });

  dlBtn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (hoveredImg) {
      const src = toAbs(hoveredImg.currentSrc || hoveredImg.src || '');
      downloadViaAnchor(src);
    }
  });

  // ==============================
  // --- Event Listeners & Startup ---
  // This final section activates all the features by listening for user actions
  // like mouse movements, clicks, and page loads.
  // ==============================
  const root = document.querySelector(ROOT_SEL) || document.body;

  // --- Mouse Move: Show Hover Button & Preload Gallery ---
  // When you move your mouse, this checks if you're hovering over a chat image.
  // If so, it shows the hover-download button and starts preloading PhotoSwipe.
  root.addEventListener('mousemove', (e) => {
    const el = e.target.closest('img');
    if (el && isChatImage(el)) {
      preloadPhotoSwipeSoon();
      showBtn(el);
    } else if (hoveredImg) {
      const overCurrent = hoveredImg.contains(e.target);
      const overBtn = dlBtn.contains(e.target);
      if (!overCurrent && !overBtn) hideBtn();
    } else if (lastCursorTarget) {
      lastCursorTarget.style.cursor = '';
      lastCursorTarget = null;
    }
  }, { passive: true });

  // --- Page Load: Preload Gallery ---
  // When the page finishes loading, start preloading the gallery in the background.
  if (document.readyState !== 'loading') preloadPhotoSwipeSoon();
  else document.addEventListener('DOMContentLoaded', preloadPhotoSwipeSoon);

  // --- Click: Open Gallery ---
  // When you click anywhere in the chat area, this checks if you clicked an image.
  // If you did, it prevents the browser's default action and opens our gallery instead.
  root.addEventListener('click', (e) => {
    const el = e.target.closest('img');
    if (!el) return;
    if (!isChatImage(el)) return;
    if (dlBtn.contains(e.target)) return;
    if (e.ctrlKey || e.metaKey) return;
    e.preventDefault();
    e.stopPropagation();
    openFor(el);
  }, true);

  // --- Tab Focus: Hide Hover Button ---
  // If you switch to another browser tab, hide the hover button to be tidy.
  document.addEventListener('visibilitychange', () => { if (document.hidden) hideBtn(); });
})();
  