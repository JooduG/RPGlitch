// apps/rpglitch/js/utils.js
/* Utility helpers for RPGlitch
 * Safe storage, DOM helpers, chin management
 */

(function (global) {
  const App = (global.App = global.App || {});

  // ---------- Debug Logger ----------
  // Debug flag (persistable via localStorage: 'rpglitch.debug' => '1'|'true')
  try {
    const stored = (global.localStorage && global.localStorage.getItem('rpglitch.debug')) || '';
    const on = /^(1|true)$/i.test(String(stored).trim());
    App.debug = typeof App.debug === 'boolean' ? App.debug : on;
  } catch {
    App.debug = App.debug ?? false;
  }
  App.log = function (...args) {
    if (App.debug) console.log("[RPGlitch]", ...args);
  };

  App.setDebug = function (on) {
    const v = !!on;
    App.debug = v;
    try { global.localStorage && global.localStorage.setItem('rpglitch.debug', v ? '1' : '0'); } catch (e) { void e; }
    return v;
  };

  // ---------- Safe JSON & Storage ----------
  App.safeJSONParse = function (str, fallback = null) {
    try {
      return JSON.parse(str);
    } catch (e) {
      console.warn("⚠️ Failed to parse JSON:", e.message);
      return fallback;
    }
  };

  App.safeLocalStorageGet = function (key, fallback = []) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? App.safeJSONParse(raw, fallback) : fallback;
    } catch (e) {
      console.warn(`⚠️ Storage error for key "${key}"`, e.message);
      return fallback;
    }
  };

  // ---------- Debounce ----------
  App.debounce =
    App.debounce ||
    function (fn, wait = 250) {
      let t;
      return (...args) => {
        clearTimeout(t);
        t = setTimeout(() => fn.apply(null, args), wait);
      };
    };

  // ---------- Show / Hide ----------
  App.hideEl = function (el) {
    try {
      if (typeof el === 'string') el = global.document.getElementById(el);
      if (!el) return;
      el.setAttribute("hidden", "");
      el.classList.remove("is-open");
    } catch { /* ignore */ }
  };
  App.showEl = function (el) {
    try {
      if (typeof el === 'string') el = global.document.getElementById(el);
      if (!el) return;
      el.removeAttribute("hidden");
      el.classList.add("is-open");
    } catch { /* ignore */ }
  };

  // ---------- Loading/Overlay guards ----------
  // Force-close the loading modal and clear common busy states that can block the UI.
  App.dismissLoadingUI = function () {
    try {
      const doc = global.document;
      // Heal documentElement / html early
      try {
        doc.documentElement.removeAttribute('inert');
        if (doc.documentElement && doc.documentElement.style) {
          doc.documentElement.style.pointerEvents = 'auto';
        }
      } catch (e) { void e; }
      const dlg = doc.getElementById("loading-modal");
      if (dlg) {
        try { typeof dlg.close === "function" && dlg.close(); } catch (e) { void e; }
        dlg.removeAttribute("open");
        dlg.setAttribute("aria-hidden", "true");
        dlg.style.display = "none";
      }
      // Remove aria-busy from any lingering element
      doc.querySelectorAll('[aria-busy]')
        .forEach((el) => el.removeAttribute('aria-busy'));
      // Close any open dialogs except an emergency modal
      doc.querySelectorAll('dialog[open]')
        .forEach((d) => {
          if (d.id === 'emergency-modal') return;
          try { typeof d.close === 'function' && d.close(); } catch (e) { void e; }
          d.removeAttribute('open');
        });
      // Defensive: ensure <dialog> elements that are not open don’t intercept clicks
      doc.querySelectorAll('dialog:not([open])').forEach((d) => {
        d.style.display = 'none';
        d.setAttribute('aria-hidden', 'true');
      });
      // If any custom overlays exist, clear permissive data attributes
      doc.querySelectorAll('[data-overlay],[data-block-ui]')
        .forEach((el) => {
          el.removeAttribute('data-overlay');
          el.removeAttribute('data-block-ui');
          el.removeAttribute('open');
          el.style.pointerEvents = 'none';
          el.style.display = 'none';
        });
      // Aggressively ensure main containers are interactive
      const roots = [
        doc.documentElement,
        doc.body,
        doc.getElementById('main'),
        doc.getElementById('chin-container'),
        doc.getElementById('storyboard-screen'),
        doc.getElementById('profile-screen'),
        doc.getElementById('character-form-screen'),
        doc.getElementById('world-form-screen'),
      ].filter(Boolean);
      roots.forEach((el) => {
        el.removeAttribute('inert');
        try { el.style.pointerEvents = 'auto'; } catch (e) { void e; }
        try { el.style.opacity = ''; } catch (e) { void e; }
        try { el.style.visibility = ''; } catch (e) { void e; }
        if (el === doc.body) {
          try { el.style.overflow = 'auto'; } catch (e) { void e; }
        }
      });
      App.log?.('dismissLoadingUI: ensured interactive state');
    } catch (e) {
      try { console.warn('dismissLoadingUI failed', e); } catch (err) { void err; }
    }
  };

  // ---------- UI Block Detection / Watchdog ----------
  App.isUIBlocked = function () {
    try {
      const doc = global.document;
      // Any open non-emergency dialog
      const openDialog = doc.querySelector('dialog[open]:not(#emergency-modal)');
      if (openDialog) return { blocked: true, reason: 'dialog-open', node: openDialog };
      // Any aria-busy elements in the DOM
      const busy = doc.querySelector('[aria-busy="true"]');
      if (busy) return { blocked: true, reason: 'aria-busy', node: busy };
      // Pointer-events disabled on body or main containers
      const candidates = [
        doc.documentElement,
        doc.body,
        doc.getElementById('main'),
        doc.getElementById('chin-container'),
      ].filter(Boolean);
      for (const el of candidates) {
        const cs = global.getComputedStyle?.(el);
        if (cs && cs.pointerEvents === 'none') {
          return { blocked: true, reason: 'pointer-events-none', node: el };
        }
        if (el.hasAttribute('inert')) {
          return { blocked: true, reason: 'inert', node: el };
        }
      }

      // Heuristic A: hit-test the viewport center and confirm the element belongs to our app
      try {
        const vw = global.innerWidth || doc.documentElement.clientWidth || 0;
        const vh = global.innerHeight || doc.documentElement.clientHeight || 0;
        if (vw && vh) {
          const cx = Math.floor(vw / 2);
          const cy = Math.floor(vh / 2);
          const el = doc.elementFromPoint?.(cx, cy);
          if (el) {
            const ok = el.closest?.('#main, header, #chin-container, .chin');
            if (!ok) {
              return { blocked: true, reason: 'hit-test-overlay', node: el };
            }
          }
        }
      } catch (e) { void e; }

      // Heuristic B: scan body children for full-viewport overlays (fallback)
      try {
        const vw = global.innerWidth || doc.documentElement.clientWidth || 0;
        const vh = global.innerHeight || doc.documentElement.clientHeight || 0;
        if (vw && vh) {
          const kids = Array.from(doc.body?.children || []);
          // Scan from the end (top-most appended) up to 100 nodes
          for (let i = kids.length - 1, n = 0; i >= 0 && n < 100; i--, n++) {
            const el = kids[i];
            const cs = global.getComputedStyle?.(el);
            if (!cs || cs.pointerEvents === 'none') continue;
            const pos = cs.position;
            if (pos !== 'fixed' && pos !== 'absolute') continue;
            const r = el.getBoundingClientRect?.();
            if (!r) continue;
            const covers = r.width >= vw * 0.9 && r.height >= vh * 0.9 && r.left <= 5 && r.top <= 5;
            if (covers && !el.closest?.('#main, header, #chin-container, .chin')) {
              return { blocked: true, reason: 'viewport-overlay', node: el };
            }
          }
        }
      } catch (e) { void e; }
      return { blocked: false };
    } catch (e) {
      return { blocked: false };
    }
  };

  App.startUIWatchdog = function () {
    try {
      if (App._uiWatchdogStarted) return;
      App._uiWatchdogStarted = true;
      if (App.isTestMode && App.isTestMode()) return; // keep tests deterministic
      let lastBlocked = undefined;
      let blockedSince = 0;
      let lastWarnAt = 0;
      const doc = global.document;
      // Lightweight in-app indicator for persistent blocks
      function installStatusIndicator() {
        try {
          if (doc.getElementById('rpglitch-guard-indicator')) return;
          const wrap = doc.createElement('div');
          wrap.id = 'rpglitch-guard-indicator';
          wrap.style.cssText = [
            'position:fixed',
            'top:8px',
            'left:8px',
            'z-index:2147483646',
            'background:rgba(0,0,0,0.7)',
            'color:#fff',
            'padding:6px 8px',
            'border-radius:6px',
            'font:12px/1.2 system-ui,sans-serif',
            'display:none',
            'gap:8px',
            'align-items:center',
            'pointer-events:auto',
          ].join(';');
          const text = doc.createElement('span');
          text.id = 'rpglitch-guard-text';
          text.textContent = 'UI blocked';
          const btn = doc.createElement('button');
          btn.textContent = 'Force Unlock';
          btn.style.cssText = [
            'margin-left:8px',
            'background:#ec4899',
            'color:#fff',
            'border:0',
            'border-radius:4px',
            'padding:4px 6px',
            'cursor:pointer',
          ].join(';');
          btn.addEventListener('click', () => {
            try { App.unlockNow?.(); App.dismissLoadingUI?.(); } catch {}
            wrap.style.display = 'none';
          });
          wrap.append(text, btn);
          doc.body.appendChild(wrap);
        } catch (e) { void e; }
      }
      function neutralizeNodeChain(node) {
        try {
          let n = node;
          let hops = 0;
          while (n && n !== doc.body && hops < 3) {
            if (n.id !== 'emergency-modal') {
              n.removeAttribute?.('open');
              n.removeAttribute?.('inert');
              if (n.style) {
                const t = (n.tagName || '').toLowerCase();
                if (t !== 'html' && t !== 'body') {
                  n.style.pointerEvents = 'none';
                  n.style.display = 'none';
                  n.style.visibility = '';
                  n.style.opacity = '';
                }
              }
              n.setAttribute?.('aria-hidden', 'true');
            }
            n = n.parentElement;
            hops++;
          }
        } catch (e) { void e; }
      }
      function probeAndHealOverlay() {
        try {
          const vw = global.innerWidth || doc.documentElement.clientWidth || 0;
          const vh = global.innerHeight || doc.documentElement.clientHeight || 0;
          if (!vw || !vh) return;
          const px = Math.floor(vw / 2);
          const py = Math.floor(vh / 2);
          const el = doc.elementFromPoint?.(px, py);
          if (!el) return;
          const allowedRoot = doc.getElementById('main') || doc.body;
          const isRoot = el === doc.body || el === doc.documentElement;
          const ok = isRoot || el.closest?.('#main, header, #chin-container, .chin');
          if (!ok && allowedRoot && !allowedRoot.contains(el)) {
            neutralizeNodeChain(el);
          }
        } catch { /* noop */ }
      }
      const describe = (n) => {
        try {
          if (!n) return '';
          const id = n.id ? `#${n.id}` : '';
          const cls = n.className ? `.${String(n.className).split(/\s+/).filter(Boolean).join('.')}` : '';
          const tag = (n.tagName || '').toLowerCase();
          return `${tag}${id}${cls}`;
        } catch { return ''; }
      };
      const tick = () => {
        const st = App.isUIBlocked?.() || { blocked: false };
        if (st.blocked) {
          if (lastBlocked !== true) {
            // Always surface first detection once for diagnostics
          try { console.log('[RPGlitch] ui.watchdog: blocked', { reason: st.reason }); } catch (e) { void e; }
            App.log?.('ui.watchdog: blocked', { reason: st.reason });
          }
          // Attempt to self-heal our own overlays
          App.dismissLoadingUI?.();
          // Heuristic overlay healing using hit-test
          probeAndHealOverlay();
          const now = Date.now();
          if (!blockedSince) blockedSince = now;
          // Emit a quiet-but-visible warning if blocked persists without debug enabled
          const elapsed = now - blockedSince;
          if (!App.debug && elapsed > 1500 && now - lastWarnAt > 3000) {
            try {
              const info = { reason: st.reason, node: describe(st.node) };
              // Use console.log so external scribblers capture it reliably
              console.log('[RPGlitch] ui.watchdog: still blocked', info);
              lastWarnAt = now;
            } catch (e) { void e; }
          }
          // Show small in-app hint if block persists
          try {
            if (elapsed > 1500) {
              installStatusIndicator();
              const wrap = doc.getElementById('rpglitch-guard-indicator');
              const text = doc.getElementById('rpglitch-guard-text');
              if (wrap && text) {
                text.textContent = `UI blocked: ${st.reason || 'unknown'}`;
                wrap.style.display = 'inline-flex';
              }
            }
          } catch (e) { void e; }
          lastBlocked = true;
        } else if (lastBlocked !== false) {
          App.log?.('ui.watchdog: unblocked');
          blockedSince = 0;
          lastBlocked = false;
          try {
            const wrap = doc.getElementById('rpglitch-guard-indicator');
            if (wrap) wrap.style.display = 'none';
          } catch { /* noop */ }
        }
        // Always run a light heal pass to be resilient in embed contexts
        try { App.dismissLoadingUI?.(); } catch (e) { void e; }
        try { probeAndHealOverlay(); } catch (e) { void e; }
      };
      App._uiWatchdogTimer = global.setInterval(tick, 500);
      // Run immediately once
      tick();
      try { console.log('[RPGlitch] ui.watchdog: armed'); } catch (e) { void e; }
    } catch (e) {
      // ignore
    }
  };

  // ---------- On-demand unlock + optional auto-unlock ----------
  App.unlockNow = function () {
    try {
      App.dismissLoadingUI?.();
      const doc = global.document;
      // Heal html/body first
      try {
        doc.documentElement.removeAttribute('inert');
        if (doc.documentElement && doc.documentElement.style) doc.documentElement.style.pointerEvents = 'auto';
        doc.body && doc.body.removeAttribute('inert');
        if (doc.body && doc.body.style) {
          doc.body.style.pointerEvents = 'auto';
          doc.body.style.overflow = 'auto';
        }
      } catch (e) { void e; }
      const root = doc.getElementById('main') || doc.body || doc.documentElement;
      // Heal obvious blockers inside our root
      const all = root.querySelectorAll('dialog, [role="dialog"], [data-overlay], [data-block-ui]');
      all.forEach((el) => {
        try {
          el.removeAttribute('inert');
          el.removeAttribute('open');
          el.style.pointerEvents = 'none';
          el.style.display = 'none';
          el.setAttribute('aria-hidden', 'true');
        } catch {}
      });
    } catch {}
  };

  App.enableAutoUnlock = function () {
    try {
      if (App.isTestMode && App.isTestMode()) return; // skip in tests
      if (App._autoUnlockBound) return;
      App._autoUnlockBound = true;
      global.addEventListener('pointerdown', () => {
        // Run after other handlers to avoid interference; repeat to catch late overlays
        setTimeout(() => App.unlockNow?.(), 0);
        setTimeout(() => App.unlockNow?.(), 50);
        setTimeout(() => App.unlockNow?.(), 200);
      }, true);
      App.log?.('ui.autounlock: enabled');
    } catch {}
  };

  // ---------- Recovery Hooks (focus/visibility + hotkey) ----------
  App.installUIRecoveryHooks = function () {
    try {
      if (App._uiHooksInstalled) return;
      App._uiHooksInstalled = true;
      const doc = global.document;
      // On focus/visibility/pageshow, attempt to clear blockers
      global.addEventListener('focus', () => App.dismissLoadingUI?.(), true);
      doc.addEventListener('visibilitychange', () => App.dismissLoadingUI?.());
      global.addEventListener('pageshow', () => App.dismissLoadingUI?.());
      // Panic hotkey: Ctrl+Shift+D to dismiss overlays immediately
      doc.addEventListener('keydown', (e) => {
        try {
          const ctrl = e.ctrlKey || e.metaKey; // allow Cmd on macOS
          if (ctrl && e.shiftKey && (e.key === 'D' || e.key === 'd')) {
            App.dismissLoadingUI?.();
            App.log?.('ui.recovery: hotkey Ctrl+Shift+D');
          }
        } catch { /* ignore */ }
      });
      App.log?.('ui.recovery: hooks installed');
    } catch { /* ignore */ }
  };

  // ---------- Attribute observer to neutralize new blockers instantly ----------
  App.installUIBlockerAttributeObserver = function () {
    try {
      if (App._uiAttrObserverInstalled) return;
      App._uiAttrObserverInstalled = true;
      if (App.isTestMode && App.isTestMode()) return;
      const doc = global.document;
      const nodes = [
        doc.documentElement,
        doc.body,
        doc.getElementById('main'),
        doc.getElementById('chin-container'),
      ].filter(Boolean);
      const heal = (who) => {
        try {
          if (!who) return;
          who.removeAttribute('inert');
          who.style && (who.style.pointerEvents = 'auto');
          if (who === doc.body) who.style.overflow = 'auto';
        } catch (e) { void e; }
      };
      const obs = new MutationObserver((recs) => {
        for (const r of recs) {
          if (r.type === 'attributes') {
            if (r.attributeName === 'inert' || r.attributeName === 'style') {
              heal(r.target);
              // Run the full dismissor as a fallback
              App.dismissLoadingUI?.();
            }
          }
        }
      });
      nodes.forEach((n) =>
        obs.observe(n, { attributes: true, attributeFilter: ['inert', 'style'] })
      );
      App._uiAttrObserver = obs;
      App.log?.('ui.attrObserver: installed');
    } catch (e) {
      // ignore
    }
  };

  // ---------- Branding ----------
  // Deterministic brand color (mirrors entities.js logic)
  function getDeterministicColor(seed) {
    let hash = 0;
    for (let i = 0; i < seed.length; i++)
      hash = seed.charCodeAt(i) + ((hash << 5) - hash);
    const hue = Math.abs(hash) % 360;
    return `hsl(${hue}, 40%, 60%)`;
  }
  App.deriveBrand =
    App.deriveBrand ||
    function (entity = {}) {
      if (entity && typeof entity === "object") {
        if (
          entity.palette &&
          typeof entity.palette === "object" &&
          entity.palette.brand
        )
          return entity.palette.brand;
        if (entity.brandColor) return entity.brandColor;
        if (entity.color) return entity.color;
      }
      const seed =
        [entity?.name || entity?.title || "", ...(entity?.tags || [])].join(
          ","
        ) ||
        entity?.id ||
        entity?.kind ||
        "";
      return getDeterministicColor(String(seed));
    };

  App.applyBrand = function (container, entity) {
    if (!container) return;
    const color = App.deriveBrand?.(entity || {}) || "";
    if (color) {
      const c = String(color);
      container.style.setProperty("--brand-color", c);
      container.style.setProperty("--brand", c);
      container.classList.add("has-brand");
    } else {
      container.style.removeProperty("--brand-color");
      container.style.removeProperty("--brand");
      container.classList.remove("has-brand");
    }
  };

  // ---------- Selection helper ----------
  App.setSelected = function (el, all) {
    if (!el || !all) return;
    Array.from(all).forEach((node) =>
      node.classList.toggle("selected", node === el)
    );
  };

  // ---------- Hash query (used by forms/navigation) ----------
  App.getHashQuery = function () {
    const h = global.location?.hash || "";
    const qIndex = h.indexOf("?");
    const q = qIndex >= 0 ? h.slice(qIndex + 1) : "";
    try {
      return new URLSearchParams(q);
    } catch {
      const params = new URLSearchParams();
      q.split("&").forEach((pair) => {
        const [k, v] = pair.split("=");
        if (k) params.set(decodeURIComponent(k), decodeURIComponent(v || ""));
      });
      return params;
    }
  };

  // ---------- Image helper ----------
  App.getPictureNode =
    App.getPictureNode ||
    function getPictureNode(entity, opts = {}) {
      const html =
        (global.getPictureHTML || globalThis.getPictureHTML)?.(
          entity || {},
          opts
        ) || "";
      const frag = global.document.createRange().createContextualFragment(html);
      return frag.firstElementChild || global.document.createElement("div");
    };

  // ---------- Navigation shims ----------
  App.navigateBackOrReturnDefault =
    App.navigateBackOrReturnDefault ||
    function (returnTo = "#storyboard") {
      const q = App.getHashQuery?.() || new URLSearchParams("");
      const fallback = q.get("return") || returnTo;
      App.router?.navigate?.(fallback);
    };

  App.goBackWithFallback =
    App.goBackWithFallback ||
    function (returnTo = "#storyboard", fallback = "#storyboard") {
      try {
        App.navigateBackOrReturnDefault?.(returnTo) ??
          App.router?.navigate(fallback);
      } catch {
        App.router?.navigate?.(fallback);
      }
    };

  // ---------- Chin controls ----------
  App.chin = (function (doc) {
    const container = () => doc.getElementById("chin-container");
    const backdrop = () => doc.getElementById("chin-backdrop");

    function getButtons() {
      // Query both header top-bar buttons and any in-container toggles
      return doc.querySelectorAll("header [data-chin], #chin-container [data-chin]");
    }

    function getPanels() {
      return container()?.querySelectorAll(".chin[data-chin]") || doc.querySelectorAll(".chin[data-chin]");
    }

    function sync() {
      const buttons = getButtons();
      const panels = getPanels();
      let anyOpen = false;
      panels.forEach((panel) => {
        const name = panel.dataset.chin;
        const hidden = panel.hasAttribute("hidden");
        const btn = [...buttons].find((b) => b.dataset.chin === name);
        const selected = !hidden;
        if (btn) {
          btn.classList.toggle("selected", selected);
          btn.setAttribute("aria-selected", selected ? "true" : "false");
          btn.setAttribute("aria-expanded", selected ? "true" : "false");
          btn.setAttribute("tabindex", selected ? "0" : "-1");
        }
        if (selected) anyOpen = true;
      });
      const cont = container();
      if (cont && cont.style) {
        cont.style.pointerEvents = anyOpen ? 'auto' : 'none';
      }
      const bd = backdrop();
      if (bd) {
        if (anyOpen) {
          bd.removeAttribute('hidden');
          bd.style.pointerEvents = 'auto';
        } else {
          bd.setAttribute('hidden', '');
          bd.style.pointerEvents = 'none';
        }
      }
      if (anyOpen) {
        cont?.removeAttribute("hidden");
        cont?.setAttribute("aria-hidden", "false");
        doc.body.classList.add("chin-open");
      } else {
        cont?.setAttribute("hidden", "");
        cont?.setAttribute("aria-hidden", "true");
        doc.body.classList.remove("chin-open");
      }
      App.log?.('chin.sync', { anyOpen, count: (panels||[]).length });
    }

    function closeAll() {
      getPanels().forEach((p) => p.setAttribute("hidden", ""));
      sync();
      App.log?.('chin.closeAll');
    }

    function close(name) {
      const panel = [...getPanels()].find((p) => p.dataset.chin === name);
      if (panel) panel.setAttribute("hidden", "");
      sync();
      App.log?.('chin.close', { name });
    }

    function open(name) {
      if (!name) return;
      const panels = getPanels();
      panels.forEach((p) => {
        if (p.dataset.chin === name) {
          p.removeAttribute("hidden");
          const focusTarget =
            p.querySelector("[tabindex], button, input, select, textarea, a") ||
            p;
          focusTarget.focus?.();
        } else {
          p.setAttribute("hidden", "");
        }
      });
      sync();
      App.log?.('chin.open', { name });
    }

    function toggle(name) {
      const panel = [...getPanels()].find((p) => p.dataset.chin === name);
      if (!panel) return;
      if (panel.hasAttribute("hidden")) open(name);
      else close(name);
      App.log?.('chin.toggle', { name });
    }

    function init() {
      // Ensure backdrop exists and is clickable to close all
      const cont = container();
      if (cont && !backdrop()) {
        const bd = doc.createElement('div');
        bd.id = 'chin-backdrop';
        bd.setAttribute('hidden', '');
        bd.setAttribute('aria-hidden', 'true');
        cont.prepend(bd);
      }
      const bd = backdrop();
      if (bd && !bd._bound) {
        bd.addEventListener('click', () => {
          try { closeAll(); App.dismissLoadingUI?.(); } catch (e) { void e; }
        });
        bd._bound = true;
      }
      const buttons = getButtons();
      buttons.forEach((btn) => {
        if (btn._chinBound) return; // idempotent
        btn.addEventListener("click", () => {
          const name = btn.dataset.chin;
          const panel = [...getPanels()].find((p) => p.dataset.chin === name);
          const hidden = panel?.hasAttribute("hidden");
          if (hidden) open(name);
          else close(name);
        });
        btn._chinBound = true;
      });
      if (!App._chinEscBound) {
        doc.addEventListener("keydown", (e) => {
          if (e.key === "Escape") App.chin.closeAll();
        });
        App._chinEscBound = true;
      }
      // Removed document-level outside click in favor of in-container backdrop
      // Ensure only one active MutationObserver tracks hidden-state changes
      try {
        if (App._chinObserver && typeof App._chinObserver.disconnect === "function") {
          App._chinObserver.disconnect();
        }
      } catch { /* noop */ }
      const observer = new MutationObserver(sync);
      App._chinObserver = observer;
      getPanels().forEach((p) =>
        observer.observe(p, { attributes: true, attributeFilter: ["hidden"] })
      );
      const cont2 = container();
      if (cont2)
        observer.observe(cont2, { attributes: true, attributeFilter: ["hidden"] });
      sync();
      App.log?.('chin.init: listeners attached');
    }

    return { getButtons, getPanels, open, close, closeAll, toggle, sync, init };
  })(global.document);

  App._toggleChinContent = function (name) {
    App.chin.toggle(name);
  };


  // ---------- Profile layout sizing (left image column width) ----------
  App.setProfileLayoutSizing = function (ratio = 0.35) {
    try {
      const doc = global.document;
      const topBar = doc.getElementById("top-bar");
      const header = topBar?.closest("header") || doc.querySelector("header");
      const container = header?.classList.contains("container")
        ? header
        : header?.closest?.(".container") || header;
      const rect = container?.getBoundingClientRect?.();
      const vw = global.innerWidth || doc.documentElement.clientWidth || 1280;
      const refWidth = Math.max(0, rect?.width || vw);
      const leftWidth = Math.round(
        Math.max(260, Math.min(refWidth * ratio, Math.min(520, vw * 0.45)))
      );
      const containerMargin = Math.max(0, Math.round((vw - refWidth) / 2));
      doc.documentElement.style.setProperty(
        "--profile-left-width",
        `${leftWidth}px`
      );
      doc.documentElement.style.setProperty(
        "--container-margin",
        `${containerMargin}px`
      );
    } catch {
      /* ignore */
    }
  };
})(this);
