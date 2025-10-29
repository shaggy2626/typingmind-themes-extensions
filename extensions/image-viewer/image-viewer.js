/* ===================================================================
 * TypingMind Image Viewer Extension
 * 
 * This script lets you view and download images easily from chat messages.
 * It shows hover buttons when you move your mouse over an image, and opens
 * a full-screen viewer when you click on images.
 * =================================================================== */

(() => {
  'use strict';

  // ============================== Configuration ==============================
  const CONFIG = {
    selectors: {
      root: '.dynamic-chat-content-container, [data-element-id="ai-response"], [data-element-id="user-message"]',
      attachment: '.group\\/attachment',
      excludeParents: '[data-element-id="chat-avatar-container"]'
    },
    detection: {
      minSize: 96,
      excludeClasses: ['user-avatar', 'emoji', 'icon', 'logo', 'w-4', 'h-4', 'w-5', 'h-5', 'w-8', 'h-8']
    },
    photoswipe: {
      cssUrl: 'https://cdn.jsdelivr.net/npm/photoswipe@5.4.4/dist/photoswipe.css',
      esmUrl: 'https://cdn.jsdelivr.net/npm/photoswipe@5.4.4/dist/photoswipe.esm.min.js'
    }
  };

  // ============================== Utility Functions ==============================
  const Utils = {
    toAbsURL: (url) => { try { return new URL(url, location.href).toString(); } catch { return url; } },
    
    getFileExt: (src) => {
      try {
        const name = new URL(src, location.href).pathname.split('/').pop().split('?')[0];
        const match = name.match(/\.(png|jpe?g|webp|gif|bmp|tiff)$/i);
        return match ? match[0] : '.png';
    } catch { return '.png'; }
    },

    generateFilename: (ext) => {
    const now = new Date();
      const pad = n => String(n).padStart(2, '0');
      const mm = pad(now.getMonth() + 1), dd = pad(now.getDate()), yy = pad(now.getFullYear() % 100);
      const HH = pad(now.getHours()), MM = pad(now.getMinutes());
    const rnd = Math.floor(Math.random() * 900) + 100;
    return `img${rnd}-${mm}-${dd}-${yy}-${HH}-${MM}${ext}`;
    },

        async downloadImage(srcUrl, imgElement = null) {
      try {
        // Due to S3 CORS restrictions, we cannot fetch/download programmatically
        // Use window.open to ensure it opens in a new tab
        const img = imgElement || document.querySelector(`img[src="${srcUrl}"], img[currentSrc="${srcUrl}"]`);
        const finalSrc = img ? (img.getAttribute('src') || img.src) : srcUrl;
        
        // Use window.open to force new tab (more reliable than <a> tag)
        window.open(finalSrc, '_blank', 'noopener,noreferrer');
        
        return true;
        
      } catch (error) {
        console.error('[TM Image Viewer] Download failed:', error);
        return false;
      }
    },

    async copyImage(srcUrl) {
      try {
        if (!window.ClipboardItem) {
          // Fallback: copy URL to clipboard
          await navigator.clipboard.writeText(srcUrl);
          return true;
        }

        // Try to fetch and copy image
        const response = await fetch(srcUrl);
        if (!response.ok) throw new Error(`Fetch failed: ${response.status}`);
        
        const blob = await response.blob();
        
        // Convert to PNG if not supported format (fixes jpeg issue)
        if (blob.type === 'image/jpeg' || blob.type === 'image/webp' || blob.type === 'image/gif') {
          const pngBlob = await this.convertToPNG(blob);
          await navigator.clipboard.write([new ClipboardItem({ 'image/png': pngBlob })]);
        } else {
          // Try original format first
          await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
        }
        
        return true;
      } catch (error) {
        console.error('[TM Image Viewer] Copy failed:', error);
        
        // Final fallback: copy URL
        try {
          await navigator.clipboard.writeText(srcUrl);
          return true;
        } catch (urlError) {
          console.error('[TM Image Viewer] URL copy also failed:', urlError);
          return false;
        }
      }
    },

    // Convert image to PNG format using canvas (more compatible with clipboard)
    async convertToPNG(blob) {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.naturalWidth || img.width;
          canvas.height = img.naturalHeight || img.height;
          
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0);
          
          canvas.toBlob(resolve, 'image/png');
        };
        
        img.onerror = reject;
        img.src = URL.createObjectURL(blob);
      });
    }
  };

  // ============================== Resource Loader ==============================
  class ResourceLoader {
    static cssLoaded = false;
    static photoSwipe = null;
    static photoSwipePromise = null;

    static loadCSS(href) {
      return new Promise((resolve, reject) => {
        if (this.cssLoaded) return resolve();
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = href;
        link.onload = () => { this.cssLoaded = true; resolve(); };
        link.onerror = reject;
        document.head.appendChild(link);
      });
    }

    static async loadPhotoSwipe() {
      if (this.photoSwipe) return this.photoSwipe;
      if (this.photoSwipePromise) return this.photoSwipePromise;

      this.photoSwipePromise = (async () => {
        // Preconnect for faster loading
        ['preconnect', 'dns-prefetch'].forEach((rel) => {
          const id = `tmiv-${rel}`;
          if (!document.getElementById(id)) {
            const link = document.createElement('link');
            link.id = id;
            link.rel = rel;
            link.href = 'https://cdn.jsdelivr.net';
            document.head.appendChild(link);
          }
        });

        await this.loadCSS(CONFIG.photoswipe.cssUrl);
        const module = await import(CONFIG.photoswipe.esmUrl);
        this.photoSwipe = module.default;
        return this.photoSwipe;
    })();

      return this.photoSwipePromise;
    }

    static preloadSoon() {
      const start = () => this.loadPhotoSwipe().catch(() => {});
    if ('requestIdleCallback' in window) requestIdleCallback(start, { timeout: 3000 });
    else setTimeout(start, 300);
  }
  }

  // ============================== Main Image Viewer Class ==============================
  class ImageViewer {
    constructor() {
      this.state = {
        hoveredImage: null,
        resizeObserver: null,
        scrollRaf: 0,
        preloadStarted: false
      };

      // Bind scroll handler once for performance
      this.boundScrollCheck = this.scheduleScrollCheck.bind(this);

      // Create single ResizeObserver to reuse
      this.createResizeObserver();

      this.createHoverUI();
      this.attachEventListeners();
      this.initPreload();
    }

    // Image detection methods
    isViewableImage(el) {
      if (!el || el.tagName !== 'IMG') return false;
      
      // Check if image is in a chat message
      const inMessage = !!el.closest('[data-element-id="ai-response"], [data-element-id="user-message"], .dynamic-chat-content-container');
      const isAttachment = !!el.closest(CONFIG.selectors.attachment);
      if (!inMessage && !isAttachment) return false;
      
      // Exclude avatars and other UI images
      if (el.closest(CONFIG.selectors.excludeParents)) return false;
      
      const classes = el.className || '';
      if (CONFIG.detection.excludeClasses.some(cls => classes.includes(cls))) return false;
      
      // Attachments are always viewable
      if (isAttachment) return true;
      
      // For message images, just check if they're large enough
      // (Don't rely on CSS classes since AI images may not have them)
      const rect = el.getBoundingClientRect();
      return Math.max(rect.width, rect.height) >= CONFIG.detection.minSize;
    }

    findImageFromEvent(e) {
      return e?.target?.closest?.('img');
    }

    isAttachmentPreview(el) {
      return !!el?.closest(CONFIG.selectors.attachment);
    }

    // Create reusable ResizeObserver
    createResizeObserver() {
      if (!window.ResizeObserver) return;
      try {
        this.state.resizeObserver = new ResizeObserver(() => {
          if (this.state.hoveredImage) {
            this.positionHoverUI(this.state.hoveredImage);
          }
        });
      } catch (e) {
        console.warn('[TM Image Viewer] ResizeObserver not available');
      }
    }

    // Hover UI creation and management
    createHoverUI() {
      this.hoverContainer = document.createElement('div');
      this.hoverContainer.className = 'tmiv-hover-container';
      this.hoverContainer.style.display = 'none';

            // Create download button
      this.dlBtn = this.createButton('Download image', 'Download', this.getDownloadIcon());
      this.downloadResetTimer = null;

      // Create copy button
      this.copyBtn = this.createButton('Copy image', 'Copy', this.getCopyIcon());
      this.copyResetTimer = null;

      this.dlBtn.onclick = async (e) => {
        e.preventDefault(); e.stopPropagation();
        if (this.state.hoveredImage) {
          const success = await Utils.downloadImage(
            Utils.toAbsURL(this.state.hoveredImage.currentSrc || this.state.hoveredImage.src),
            this.state.hoveredImage
          );
          if (success) {
            this.dlBtn.innerHTML = this.getDownloadCheckIcon();
            this.scheduleDownloadReset(1500);
          }
        }
      };

      this.copyBtn.onclick = async (e) => {
        e.preventDefault(); e.stopPropagation();
        if (!this.state.hoveredImage) return;
        
        const src = Utils.toAbsURL(this.state.hoveredImage.currentSrc || this.state.hoveredImage.src);
        const success = await Utils.copyImage(src);
        
        if (success) {
          this.copyBtn.innerHTML = this.getCheckIcon();
          this.scheduleCopyReset(1500);
        } else {
          this.copyBtn.style.transform = 'scale(0.8)';
          setTimeout(() => this.copyBtn.style.transform = '', 200);
          this.scheduleCopyReset(600);
        }
      };

      this.hoverContainer.append(this.dlBtn, this.copyBtn);
      document.body.appendChild(this.hoverContainer);
      
      // Handle leaving the hover container
      this.hoverContainer.addEventListener('pointerleave', (e) => {
        const target = e.relatedTarget;
        if (this.state.hoveredImage && !this.state.hoveredImage.contains(target)) {
          this.hideHoverUI();
        }
      });
      
      this.injectStyles();
    }

    createButton(label, title, innerHTML) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.setAttribute('aria-label', label);
      btn.title = title;
      btn.className = 'tmiv-btn';
      btn.innerHTML = innerHTML;
      return btn;
    }

    getCopyIcon() {
      return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
      </svg>`;
    }

        getCheckIcon() {
      return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="20 6 9 17 4 12"></polyline>
      </svg>`;
    }

    getDownloadIcon() {
      return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
        <polyline points="7 10 12 15 17 10"/>
        <line x1="12" y1="15" x2="12" y2="3"/>
      </svg>`;
    }

    getDownloadCheckIcon() {
      return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="20 6 9 17 4 12"></polyline>
      </svg>`;
    }

    scheduleCopyReset(delay = 1200) {
      clearTimeout(this.copyResetTimer);
      this.copyResetTimer = setTimeout(() => this.copyBtn.innerHTML = this.getCopyIcon(), delay);
    }

    scheduleDownloadReset(delay = 1200) {
      clearTimeout(this.downloadResetTimer);
      this.downloadResetTimer = setTimeout(() => this.dlBtn.innerHTML = this.getDownloadIcon(), delay);
    }

    showHoverUI(img) {
      if (this.isAttachmentPreview(img)) return this.hideHoverUI();
      
      this.state.hoveredImage = img;
      this.copyBtn.innerHTML = this.getCopyIcon();
      this.dlBtn.innerHTML = this.getDownloadIcon();
      this.positionHoverUI(img);
      this.hoverContainer.style.display = 'flex';
      img.style.cursor = 'pointer';
      this.attachScrollListeners();
      
      // Add one-time listener for when we leave this specific image
      const handleImageLeave = (e) => {
        const target = e.relatedTarget;
        if (!this.hoverContainer.contains(target)) {
          this.hideHoverUI();
        }
        img.removeEventListener('pointerleave', handleImageLeave);
      };
      img.addEventListener('pointerleave', handleImageLeave);
    }

    hideHoverUI() {
      this.state.hoveredImage = null;
      this.hoverContainer.style.display = 'none';
      clearTimeout(this.copyResetTimer);
      clearTimeout(this.downloadResetTimer);
      this.detachScrollListeners();
    }

    positionHoverUI(img) {
      const rect = img.getBoundingClientRect();
      const top = Math.max(rect.top + 8, 8);
      const left = Math.min(rect.right - 8 - this.hoverContainer.offsetWidth, window.innerWidth - (this.hoverContainer.offsetWidth + 8));
      this.hoverContainer.style.top = `${top}px`;
      this.hoverContainer.style.left = `${left}px`;
    }

    // PhotoSwipe viewer
    async openViewer(img) {
      const PhotoSwipe = await ResourceLoader.loadPhotoSwipe();
      const src = Utils.toAbsURL(img.currentSrc || img.src);
      const width = img.naturalWidth || Math.max(1600, Math.round((img.width || 800) * devicePixelRatio));
      const height = img.naturalHeight || Math.max(1200, Math.round((img.height || 600) * devicePixelRatio));
      
    const pswp = new PhotoSwipe({
        dataSource: [{ src, width, height, element: img }],
        wheelToZoom: true, zoom: true, padding: 8, showHideAnimationType: 'zoom', bgOpacity: 0.9, preloadFirstSlide: false
      });

      // Add download button to PhotoSwipe
    pswp.on('uiRegister', () => {
      pswp.ui.registerElement({
          name: 'tmDownload', ariaLabel: 'Download image', order: 15, isButton: true, appendTo: 'bar',
        className: 'pswp__button pswp__button--tm-download',
          html: `<svg aria-hidden="true" class="pswp__icn" viewBox="0 0 32 32" width="32" height="32">
            <path d="M16 6v14 M10 14l6 6 6-6 M6 24v4h20v-4" fill="none" stroke-linecap="round" stroke-linejoin="round" stroke="currentColor" stroke-width="2.2"></path>
          </svg>`,
          onClick: () => { 
            if (pswp.currSlide?.data?.src) {
              Utils.downloadImage(pswp.currSlide.data.src, pswp.currSlide.data.element).catch(console.error);
            }
          }
        });
        this.injectPhotoSwipeStyles();
      });

    pswp.on('close', () => pswp.destroy());
    pswp.init();
  }

    // Scroll handling to keep buttons positioned correctly
    attachScrollListeners() {
      // Only need one scroll listener - window captures all scroll events
      window.addEventListener('scroll', this.boundScrollCheck, { passive: true, capture: true });
    }

    detachScrollListeners() {
      window.removeEventListener('scroll', this.boundScrollCheck, true);
    }

    scheduleScrollCheck() {
      if (this.state.scrollRaf) return;
      this.state.scrollRaf = requestAnimationFrame(() => {
        this.state.scrollRaf = 0;
        this.handleScroll();
      });
    }

    handleScroll() {
      if (!this.state.hoveredImage) return;
      
      const rect = this.state.hoveredImage.getBoundingClientRect();
      
      // If image is out of viewport, hide buttons
      if (rect.bottom < 0 || rect.top > window.innerHeight) {
        this.hideHoverUI();
        return;
      }
      
      // Reposition buttons to follow the image
      this.positionHoverUI(this.state.hoveredImage);
    }

    // Event handling - single delegation for performance
    attachEventListeners() {
      const root = document.body;
      root.addEventListener('pointerover', this.handleEvent.bind(this), true);
      root.addEventListener('click', this.handleEvent.bind(this), true);
      window.addEventListener('resize', () => { if (this.state.hoveredImage) this.positionHoverUI(this.state.hoveredImage); });
      document.addEventListener('visibilitychange', () => { if (document.hidden) this.hideHoverUI(); });
    }

    handleEvent(e) {
      const img = this.findImageFromEvent(e);

      if (e.type === 'pointerover' && img && this.isViewableImage(img)) {
        this.startPreload();
        this.showHoverUI(img);
        this.observeResize(img);
      } else if (e.type === 'click' && img && this.isViewableImage(img) && !this.hoverContainer.contains(e.target) && !e.ctrlKey && !e.metaKey) {
        e.preventDefault(); e.stopPropagation();
        this.openViewer(img);
      }
    }

    observeResize(img) {
      if (!this.state.resizeObserver) return;
      try {
        // Disconnect previous observations and observe new image
        this.state.resizeObserver.disconnect();
        this.state.resizeObserver.observe(img);
      } catch (e) {
        // Silently fail if ResizeObserver has issues
      }
    }

    startPreload() {
      if (this.state.preloadStarted) return;
      this.state.preloadStarted = true;
      ResourceLoader.preloadSoon();
    }

    initPreload() {
      if (document.readyState !== 'loading') this.startPreload();
      else document.addEventListener('DOMContentLoaded', () => this.startPreload());
    }

    // Inject styles
    injectStyles() {
      if (document.getElementById('tmiv-hover-styles')) return;
      const style = document.createElement('style');
      style.id = 'tmiv-hover-styles';
      style.textContent = `
        .tmiv-hover-container { position: fixed; z-index: 2147483000; display: none; gap: 6px; }
        .tmiv-btn { cursor: pointer; background: rgba(0,0,0,0.45); border: 1px solid rgba(0,0,0,0.05); color: #fff; padding: 6px 7px; border-radius: 10px; backdrop-filter: blur(6px); box-shadow: 0 2px 8px rgba(0,0,0,0.25); line-height: 0; transition: background-color 0.12s ease-in-out, transform 0.12s ease-in-out; }
        .tmiv-btn:hover { background: rgba(0,0,0,0.65); }
        .tmiv-btn svg { display: block; }
      `;
      document.head.appendChild(style);
    }

    injectPhotoSwipeStyles() {
      if (document.getElementById('tm-pswp-download-style')) return;
      const style = document.createElement('style');
      style.id = 'tm-pswp-download-style';
      style.textContent = `
        .pswp__button--tm-download .pswp__icn { color: var(--pswp-icon-color); filter: drop-shadow(0 0 1px rgba(0,0,0,0.35)); }
        .pswp__button.pswp__button--tm-download { margin-left: 6px; }
      `;
      document.head.appendChild(style);
    }
  }

  // ============================== Initialize Extension ==============================
  new ImageViewer();

})();