/* ============================================================================
 * TypingMind – Trello-Style Plugin Reorder w/ Auto-Scroll (2025-06-25)
 * Drag plugins like Trello cards, auto-scrolls list when near top/bottom.
 * Saves order in localStorage across sessions.
 * ========================================================================== */
(() => {
    /* ­­­­­­­­­ tiny storage helper ­­­­­­­­­ */
    class Store {
      constructor(key) { this.key = key; }
      get()  { return JSON.parse(localStorage.getItem(this.key) || '[]'); }
      save(o){ localStorage.setItem(this.key, JSON.stringify(o)); }
    }
  
    /* ­­­­­­­­­ main sorter ­­­­­­­­­ */
    class Sorter {
      KEY = 'tm_plugin_custom_order';
      SEL = {
        list : '[id^="headlessui-menu-items-"] div.overflow-y-auto.custom-scrollbar',
        row  : '[role="menuitem"]',
        wrap : '.flex.items-center.justify-center.gap-2.truncate'
      };
  
      constructor() {
        this.store = new Store(this.KEY);
        this.drag  = {};
        this.#css();
        this.#watch();
      }
  
      /* inject css */
      #css() {
        if (document.getElementById('tm-plugin-sorter-style')) return;
        const style = document.createElement('style');
        style.id = 'tm-plugin-sorter-style';
        style.textContent = `
          .tm-handle{cursor:grab;display:flex;align-items:center}
          .tm-placeholder{background:#9ab3ff33;border:2px dashed #4880ff;
            border-radius:8px;margin:4px 0;min-height:36px}
          .tm-dragging{opacity:.9;transform:rotate(2deg);box-shadow:0 8px 20px #0003}
        `;
        document.head.appendChild(style);
      }
  
      /* observe plugin menus */
      #watch() {
        new MutationObserver(muts=>{
          muts.forEach(m=>{
            m.addedNodes.forEach(n=>{
              const list = n.querySelector?.(this.SEL.list);
              if(list && !list.dataset.sortAttach) this.#init(list);
            });
          });
        }).observe(document.body,{subtree:true,childList:true});
      }
  
      /* initialise one list */
      #init(list) {
        list.dataset.sortAttach = '1';
        this.#applySaved(list);
        list.querySelectorAll(this.SEL.row).forEach(r=>this.#grip(r));
        console.log('[PluginSorter] ready');
      }
  
      /* add grip */
      #grip(row) {
        if(row.dataset.hasHandle) return;
        row.dataset.hasHandle='1';
        const h = document.createElement('div');
        h.className = 'tm-handle';
        h.innerHTML = `<svg class="w-5 h-5 text-slate-400" width="18" height="18" viewBox="0 0 18 18"
          xmlns="http://www.w3.org/2000/svg"><g fill="none" stroke="currentColor" stroke-width="1.5"
          stroke-linecap="round"><circle cx="6.75" cy="3.75" r=".75"/><circle cx="6.75" cy="9" r=".75"/>
          <circle cx="6.75" cy="14.25" r=".75"/><circle cx="11.25" cy="3.75" r=".75"/>
          <circle cx="11.25" cy="9" r=".75"/><circle cx="11.25" cy="14.25" r=".75"/></g></svg>`;
        h.onpointerdown = e => this.#down(e,row);
        row.querySelector(this.SEL.wrap)?.prepend(h);
      }
  
      /* start drag */
      #down(e,row){
        e.preventDefault();
        const list=row.closest(this.SEL.list);
        const rect=row.getBoundingClientRect();
        const ph=document.createElement('div');
        ph.className='tm-placeholder';
        ph.style.height=`${rect.height}px`;
        row.before(ph);
  
        Object.assign(row.style,{
          width:`${rect.width}px`,position:'fixed',zIndex:999,
          left:`${rect.left}px`,top:`${rect.top}px`,pointerEvents:'none'
        });
        row.classList.add('tm-dragging');
  
        this.drag={
          row,list,ph,
          offX:e.clientX-rect.left,
          offY:e.clientY-rect.top,
          edge:40                         // auto-scroll trigger region (px)
        };
        document.onpointermove=this.#move.bind(this);
        document.onpointerup  =this.#up.bind(this);
      }
  
      /* move */
      #move(e){
        const {row,ph,offX,offY,list,edge}=this.drag;
        row.style.left=`${e.clientX-offX}px`;
        row.style.top =`${e.clientY-offY}px`;
  
        /* auto-scroll: if near top/bottom, scroll container */
        const r=list.getBoundingClientRect();
        if(e.clientY < r.top + edge)        list.scrollTop -= edge;                // scroll up
        else if(e.clientY > r.bottom - edge) list.scrollTop += edge;               // scroll down
  
        /* reposition placeholder */
        [...list.querySelectorAll(this.SEL.row)]
          .filter(i=>i!==row)
          .some(item=>{
            const ir=item.getBoundingClientRect();
            if(e.clientY>ir.top && e.clientY<ir.bottom){
              (e.clientY<ir.top+ir.height/2?item.before(ph):item.after(ph));
              return true;
            }
            return false;
          });
      }
  
      /* finish drag */
      #up(){
        const {row,ph,list}=this.drag;
        ph.replaceWith(row);
        row.classList.remove('tm-dragging');
        Object.assign(row.style,{position:'',left:'',top:'',width:'',pointerEvents:''});
        this.#save(list);
        document.onpointermove=document.onpointerup=null;
        this.drag={};
      }
  
      /* save order */
      #save(list){
        const order=[...list.querySelectorAll(this.SEL.row)]
          .map(r=>r.querySelector('.truncate')?.textContent.trim())
          .filter(Boolean);
        this.store.save(order);
      }
  
      /* apply saved order */
      #applySaved(list){
        const saved=this.store.get();
        if(!saved.length) return;
        const map=new Map();
        list.querySelectorAll(this.SEL.row).forEach(r=>{
          const n=r.querySelector('.truncate')?.textContent.trim();
          if(n) map.set(n,r);
        });
        saved.forEach(n=>{ const el=map.get(n); if(el) list.appendChild(el); });
      }
    }
  
    new Sorter();  // boot
  })();
  