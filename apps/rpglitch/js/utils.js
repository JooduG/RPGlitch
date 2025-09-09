/* Utility helpers for RPGlitch
 * Safe storage, DOM helpers, chin management
 */

// ---------- Debug Logger ----------
let isDebug = false;
try {
  const stored = (localStorage.getItem('rpglitch.debug')) || '';
  isDebug = /^(1|true)$/i.test(String(stored).trim());
} catch {
  isDebug = false;
}

export function log(...args) {
  if (isDebug) console.log("[RPGlitch]", ...args);
}

export function setDebug(on) {
  isDebug = !!on;
  try {
    localStorage.setItem('rpglitch.debug', isDebug ? '1' : '0');
  } catch {
    void 0;
  }
  return isDebug;
}

// ---------- Safe JSON & Storage ----------
export function safeJSONParse(str, fallback = null) {
  try {
    return JSON.parse(str);
  } catch (e) {
    console.warn("⚠️ Failed to parse JSON:", e.message);
    return fallback;
  }
}

export function safeLocalStorageGet(key, fallback = []) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? safeJSONParse(raw, fallback) : fallback;
  } catch (e) {
    console.warn(`⚠️ Storage error for key "${key}"`, e.message);
    return fallback;
  }
}

// ---------- Debounce ----------
export function debounce(fn, wait = 250) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn.apply(null, args), wait);
  };
}

// ---------- Show / Hide ----------
export function hideEl(el, doc = document) {
  try {
    if (typeof el === 'string') el = doc.querySelector(el.startsWith('#') ? el : `#${el}`);
    if (!el) return;
    el.hidden = true;
    el.classList.remove("is-open");
  } catch { /* ignore */ }
}

export function showEl(el, doc = document) {
  try {
    if (typeof el === 'string') el = doc.querySelector(el.startsWith('#') ? el : `#${el}`);
    if (!el) return;
    el.hidden = false;
    el.classList.add("is-open");
  } catch { /* ignore */ }
}

// ---------- Loading/Overlay guards ----------
export function dismissLoadingUI() {
  try {
    const doc = document;
    // Heal documentElement / html early
    try {
      doc.documentElement.removeAttribute('inert');
      if (doc.documentElement && doc.documentElement.style) {
        doc.documentElement.style.pointerEvents = 'auto';
      }
    } catch {
      void 0;
    }
    const dlg = doc.querySelector("#loading-modal");
    if (dlg) {
      try {
        if (typeof dlg.close === "function") dlg.close();
      } catch {
        void 0;
      }
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
        try {
          if (typeof d.close === 'function') d.close();
        } catch {
          void 0;
        }
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
    // Explicitly hide the watchdog indicator if it's visible
    const guardIndicator = doc.querySelector('#rpglitch-guard-indicator');
    if (guardIndicator) {
      guardIndicator.style.display = 'none';
    }
    // Aggressively ensure main containers are interactive
    const roots = [
      doc.documentElement,
      doc.body,
      doc.querySelector('#main'),
      doc.querySelector('#chin-container'),
      doc.querySelector('#storyboard-screen'),
      doc.querySelector('#profile-screen'),
      doc.querySelector('#character-form-screen'),
      doc.querySelector('#world-form-screen'),
    ].filter(Boolean);
    roots.forEach((el) => {
      el.removeAttribute('inert');
      try {
        el.style.pointerEvents = 'auto';
      } catch {
        void 0;
      }
      try {
        el.style.opacity = '';
      } catch {
        void 0;
      }
      try {
        el.style.visibility = '';
      } catch {
        void 0;
      }
      if (el === doc.body || el === doc.documentElement) {
        try {
          el.style.overflow = 'auto';
          el.style.position = '';
          el.style.zIndex = '';
          el.style.top = '';
          el.style.left = '';
          el.style.right = '';
          el.style.bottom = '';
          el.style.width = '';
          el.style.height = '';
          el.style.transform = '';
          el.style.filter = '';
        } catch {
          void 0;
        }
      }
    });
    log?.('dismissLoadingUI: ensured interactive state');
  } catch (e) {
    try {
      console.warn('dismissLoadingUI failed', e);
    } catch {
      void 0;
    }
  }
}

// ---------- UI Block Detection / Watchdog ----------
const isDialogOpen = () => {
  const dialogQuery = document.querySelector('dialog[open]:not(#emergency-modal)');
  if (dialogQuery) return {
    blocked: true,
    reason: 'dialog-open',
    node: dialogQuery
  };

  try {
    const doc = document;
    // Any open non-emergency dialog
    const openDialog = doc.querySelector('dialog[open]:not(#emergency-modal)');
    if (openDialog) return {
      blocked: true,
      reason: 'dialog-open',
      node: openDialog
    };
    // Any aria-busy elements in the DOM
    const busy = doc.querySelector('[aria-busy="true"]');
    if (busy) return {
      blocked: true,
      reason: 'aria-busy',
      node: busy
    };
    // Pointer-events disabled on body or main containers
    const candidates = [
      doc.documentElement,
      doc.body,
      doc.querySelector('#main'),
      doc.querySelector('#chin-container'),
    ].filter(Boolean);
    for (const el of candidates) {
      const cs = getComputedStyle?.(el);
      if (cs && cs.pointerEvents === 'none') {
        return {
          blocked: true,
          reason: 'pointer-events-none',
          node: el
        };
      }
      if (el.hasAttribute('inert')) {
        return {
          blocked: true,
          reason: 'inert',
          node: el
        };
      }
    }

    // Heuristic A: hit-test the viewport center and confirm the element belongs to our app
    try {
      const vw = window.innerWidth || doc.documentElement.clientWidth || 0;
      const vh = window.innerHeight || doc.documentElement.clientHeight || 0;
      if (vw && vh) {
        const cx = Math.floor(vw / 2);
        const cy = Math.floor(vh / 2);
        const el = doc.elementFromPoint?.(cx, cy);
        if (el) {
          const ok = el.closest?.('#main, header, #chin-container, .chin');
          if (!ok) {
            return {
              blocked: true,
              reason: 'hit-test-overlay',
              node: el
            };
          }
        }
      }
    } catch {
      void 0;
    }

    // Heuristic B: scan body children for full-viewport overlays (fallback)
    try {
      const vw = window.innerWidth || doc.documentElement.clientWidth || 0;
      const vh = window.innerHeight || doc.documentElement.clientHeight || 0;
      if (vw && vh) {
        const kids = Array.from(doc.body?.children || []);
        // Scan from the end (top-most appended) up to 100 nodes
        for (let i = kids.length - 1, n = 0; i >= 0 && n < 100; i--, n++) {
          const el = kids[i];
          const cs = getComputedStyle?.(el);
          if (!cs || cs.pointerEvents === 'none') continue;
          const pos = cs.position;
          if (pos !== 'fixed' && pos !== 'absolute') continue;
          const r = el.getBoundingClientRect?.();
          if (!r) continue;
          const covers = r.width >= vw * 0.9 && r.height >= vh * 0.9 && r.left <= 5 && r.top <= 5;
          if (covers && !el.closest?.('#main, header, #chin-container, .chin')) {
            return {
              blocked: true,
              reason: 'viewport-overlay',
              node: el
            };
          }
        }
      }
    } catch {
      void 0;
    }
    return {
      blocked: false
    };
  } catch {
    return {
      blocked: false
    };
  }
};;;;;;;;

let uiWatchdogTimer = null;
export let _uiWatchdogStarted = false;
export function startUIWatchdog() {
  try {
    if (uiWatchdogTimer) return;
    let lastBlocked = undefined;
    let blockedSince = 0;
    let lastWarnAt = 0;
    const doc = document;
    // Lightweight in-app indicator for persistent blocks
    function installStatusIndicator() {
      try {
        if (doc.querySelector('#rpglitch-guard-indicator')) return;
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
          try {
            unlockNow?.();
            dismissLoadingUI?.();
          } catch {
            void 0;
          }
          wrap.style.display = 'none';
        });
        wrap.append(text, btn);
        doc.body.appendChild(wrap);
      } catch {
        void 0;
      }
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
      } catch {
        void 0;
      }
    }

    function probeAndHealOverlay() {
      try {
        const vw = window.innerWidth || doc.documentElement.clientWidth || 0;
        const vh = window.innerHeight || doc.documentElement.clientHeight || 0;
        if (!vw || !vh) return;
        const px = Math.floor(vw / 2);
        const py = Math.floor(vh / 2);
        const el = doc.elementFromPoint?.(px, py);
        if (!el) return;
        const allowedRoot = doc.querySelector('#main') || doc.body;
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
      } catch {
        return '';
      }
    };
    const tick = () => {
      const st = isDialogOpen?.() || {
        blocked: false
      };
      log?.('ui.watchdog: tick', st);
      // If the blocking node is our own guard indicator, don't report it as blocked
      if (st.blocked && st.node && st.node.id === 'rpglitch-guard-indicator') {
        st.blocked = false;
      }
      if (st.blocked) {
        if (lastBlocked !== true) {
          // Always surface first detection once for diagnostics
          try {
            console.log('[RPGlitch] ui.watchdog: blocked', {
              reason: st.reason,
              node: describe(st.node)
            });
          } catch {
            void 0;
          }
          log?.('ui.watchdog: blocked', {
            reason: st.reason,
            node: describe(st.node)
          });
        }
        // Attempt to self-heal our own overlays
        dismissLoadingUI?.();
        // Heuristic overlay healing using hit-test
        probeAndHealOverlay();
        const now = Date.now();
        if (!blockedSince) blockedSince = now;
        // Emit a quiet-but-visible warning if blocked persists without debug enabled
        const elapsed = now - blockedSince;
        if (!isDebug && elapsed > 1500 && now - lastWarnAt > 3000) {
          try {
            const info = {
              reason: st.reason,
              node: describe(st.node)
            };
            // Use console.log so external scribblers capture it reliably
            console.log('[RPGlitch] ui.watchdog: still blocked', info);
            lastWarnAt = now;
          } catch {
            void 0;
          }
        }
        // Show small in-app hint if block persists
        try {
          if (elapsed > 1500) {
            installStatusIndicator();
            const wrap = doc.querySelector('#rpglitch-guard-indicator');
            const text = doc.querySelector('#rpglitch-guard-text');
            if (wrap && text) {
              text.textContent = `UI blocked: ${st.reason || 'unknown'}`;
              wrap.style.display = 'inline-flex';
            }
          }
        } catch {
          void 0;
        }
        lastBlocked = true;
      } else if (lastBlocked !== false) {
        log?.('ui.watchdog: unblocked');
        blockedSince = 0;
        lastBlocked = false;
        try {
          const wrap = doc.querySelector('#rpglitch-guard-indicator');
          if (wrap) wrap.style.display = 'none';
        } catch { /* noop */ }
      }
      // Always run a light heal pass to be resilient in embed contexts
      try {
        dismissLoadingUI?.();
      } catch {
        void 0;
      }
      try {
        probeAndHealOverlay();
      } catch {
        void 0;
      }
    };
    uiWatchdogTimer = setInterval(tick, 500);
    // Run immediately once
    tick();
    try {
      console.log('[RPGlitch] ui.watchdog: armed');
    } catch {
      void 0;
    }
  } catch {
    // ignore
  }
}

// ---------- On-demand unlock + optional auto-unlock ----------
export function unlockNow() {
  try {
    dismissLoadingUI?.();
    const doc = document;
    // Heal html/body first
    try {
      doc.documentElement.removeAttribute('inert');
      if (doc.documentElement && doc.documentElement.style) doc.documentElement.style.pointerEvents = 'auto';
      doc.body && doc.body.removeAttribute('inert');
      if (doc.body && doc.body.style) {
        doc.body.style.pointerEvents = 'auto';
        doc.body.style.overflow = 'auto';
      }
    } catch {
      void 0;
    }
    const root = doc.querySelector('#main') || doc.body || doc.documentElement;
    // Heal obvious blockers inside our root
    const all = root.querySelectorAll('dialog, [role="dialog"], [data-overlay], [data-block-ui]');
    all.forEach((el) => {
      try {
        el.removeAttribute('inert');
        el.removeAttribute('open');
        el.style.pointerEvents = 'none';
        el.style.display = 'none';
        el.setAttribute('aria-hidden', 'true');
      } catch {
        void 0;
      }
    });
  } catch {
    void 0;
  }
}

let autoUnlockBound = false;
export function enableAutoUnlock() {
  try {
    if (autoUnlockBound) return;
    autoUnlockBound = true;
    window.addEventListener('pointerdown', () => {
      // Run after other handlers to avoid interference; repeat to catch late overlays
      setTimeout(() => unlockNow?.(), 0);
      setTimeout(() => unlockNow?.(), 50);
      setTimeout(() => unlockNow?.(), 200);
    }, true);
    log?.('ui.autounlock: enabled');
  } catch {
    void 0;
  }
}

// ---------- Recovery Hooks (focus/visibility + hotkey) ----------
let uiHooksInstalled = false;
export function installUIRecoveryHooks() {
  try {
    if (uiHooksInstalled) return;
    uiHooksInstalled = true;
    const doc = document;
    // On focus/visibility/pageshow, attempt to clear blockers
    window.addEventListener('focus', () => dismissLoadingUI?.(), true);
    doc.addEventListener('visibilitychange', () => dismissLoadingUI?.());
    window.addEventListener('pageshow', () => dismissLoadingUI?.());
    // Panic hotkey: Ctrl+Shift+D to dismiss overlays immediately
    doc.addEventListener('keydown', (e) => {
      try {
        const ctrl = e.ctrlKey || e.metaKey; // allow Cmd on macOS
        if (ctrl && e.shiftKey && (e.key === 'D' || e.key === 'd')) {
          dismissLoadingUI?.();
          log?.('ui.recovery: hotkey Ctrl+Shift+D');
        }
      } catch { /* ignore */ }
    });
    log?.('ui.recovery: hooks installed');
  } catch { /* ignore */ }
}

// ---------- Attribute observer to neutralize new blockers instantly ----------
let uiAttrObserver = null;
export function installUIBlockerAttributeObserver() {
  try {
    if (uiAttrObserver) return;
    const doc = document;
    const nodes = [
      doc.documentElement,
      doc.body,
      doc.querySelector('#main'),
      doc.querySelector('#chin-container'),
    ].filter(Boolean);
    const heal = (who) => {
      try {
        if (!who) return;
        who.removeAttribute('inert');
        who.style && (who.style.pointerEvents = 'auto');
        if (who === doc.body) who.style.overflow = 'auto';
      } catch {
        void 0;
      }
    };
    const obs = new MutationObserver((recs) => {
      for (const r of recs) {
        if (r.type === 'attributes') {
          if (r.attributeName === 'inert' || r.attributeName === 'style') {
            heal(r.target);
            // Run the full dismissor as a fallback
            dismissLoadingUI?.();
          }
        }
      }
    });
    nodes.forEach((n) =>
      obs.observe(n, {
        attributes: true,
        attributeFilter: ['inert', 'style']
      })
    );
    uiAttrObserver = obs;
    log?.('ui.attrObserver: installed');
  } catch {
    // ignore
  }
}

// ---------- Branding ----------
// Deterministic brand color (mirrors entities.js logic)
function getDeterministicColor(seed) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++)
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 40%, 60%)`;
}
export function deriveBrand(entity = {}) {
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
}

export function applyBrand(container, entity) {
  if (!container) return;
  const color = deriveBrand?.(entity || {}) || "";
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
}

// ---------- Selection helper ----------
export function setSelected(el, all) {
  if (!el || !all) return;
  Array.from(all).forEach((node) =>
    node.classList.toggle("selected", node === el)
  );
}

// ---------- Hash query (used by forms/navigation) ----------
export function getHashQuery() {
  const h = location?.hash || "";
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
}

import {
  getPictureHTML
} from './entities.js';

// ---------- Image helper ----------
export function getPictureNode(entity, opts = {}) {
  const html =
    (getPictureHTML || getPictureHTML)?.(
      entity || {},
      opts
    ) || "";
  const frag = document.createDocumentFragment().appendChild(document.createTextNode(html));
  return frag.firstElementChild || document.createElement("div");
}

// ---------- Navigation shims ----------
export function navigateBackOrReturnDefault(returnTo = "#storyboard", router) {
  const q = getHashQuery?.() || new URLSearchParams("");
  const fallback = q.get("return") || returnTo;
  router?.navigate?.(fallback);
}

export function goBackWithFallback(returnTo = "#storyboard", fallback = "#storyboard", router) {
  try {
    navigateBackOrReturnDefault?.(returnTo, router) ??
      router?.navigate(fallback);
  } catch {
    router?.navigate?.(fallback);
  }
}

// ---------- Top Bar ----------
export function setTopBarRight(mode) {
  const doc = document;
  const topBarRightStoryboard =
    doc.querySelector("#top-bar-right-storyboard");
  const topBarRightForm =
    doc.querySelector("#top-bar-right-form");
  const topBarRightProfile =
    doc.querySelector("#top-bar-right-profile");
  const sectionMap = {
    storyboard: topBarRightStoryboard,
    form: topBarRightForm,
    profile: topBarRightProfile,
  };
  Object.values(sectionMap).forEach((sec) => sec && hideEl(sec));
  if (sectionMap[mode]) showEl(sectionMap[mode]);
}


// ---------- Chin controls ----------
function getButtons() {
  // Query both header top-bar buttons and any in-container toggles
  return document.querySelectorAll("header [data-chin], #chin-container [data-chin]");
}

function getPanels() {
  const container = () => document.querySelector("#chin-container");
  return container()?.querySelectorAll(".chin[data-chin]") || document.querySelectorAll(".chin[data-chin]");
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
  const cont = document.querySelector("#chin-container");
  if (cont && cont.style) {
    cont.style.pointerEvents = anyOpen ? 'auto' : 'none';
  }
  const bd = document.querySelector("#chin-backdrop");
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
    document.body.classList.add("chin-open");
  } else {
    cont?.setAttribute("hidden", "");
    cont?.setAttribute("aria-hidden", "true");
    document.body.classList.remove("chin-open");
  }
  log?.('chin.sync', {
    anyOpen,
    count: (panels || []).length
  });
}

function closeAll() {
  getPanels().forEach((p) => p.setAttribute("hidden", ""));
  sync();
  log?.('chin.closeAll');
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
  log?.('chin.open', {
    name
  });
}

function toggle(name) {
  const panel = [...getPanels()].find((p) => p.dataset.chin === name);
  if (!panel) return;
  if (panel.hasAttribute("hidden")) open(name);
  else close(name);
  log?.('chin.toggle', {
    name
  });
}

let chinBound = false;
function initChin() {
  const doc = document;
  // Ensure backdrop exists and is clickable to close all
  const cont = document.querySelector("#chin-container");
  if (cont && !document.querySelector("#chin-backdrop")) {
    const bd = doc.createElement('div');
    bd.id = 'chin-backdrop';
    bd.setAttribute('hidden', '');
    bd.setAttribute('aria-hidden', 'true');
    cont.prepend(bd);
  }
  const bd = document.querySelector("#chin-backdrop");
  if (bd && !bd._bound) {
    bd.addEventListener('click', () => {
      try {
        log('chin.backdrop: click detected, closing all chins');
        closeAll();
        dismissLoadingUI?.();
      } catch {
        void 0;
      }
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
  if (!chinBound) {
    doc.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeAll();
    });
    chinBound = true;
  }
  // Removed document-level outside click in favor of in-container backdrop
  // Ensure only one active MutationObserver tracks hidden-state changes
  try {
    if (chinObserver && typeof chinObserver.disconnect === "function") {
      chinObserver.disconnect();
    }
  } catch { /* noop */ }
  const observer = new MutationObserver(sync);
  let chinObserver = observer;
  getPanels().forEach((p) =>
    observer.observe(p, {
      attributes: true,
      attributeFilter: ["hidden"]
    })
  );
  const cont2 = document.querySelector("#chin-container");
  if (cont2)
    observer.observe(cont2, {
      attributes: true,
      attributeFilter: ["hidden"]
    });
  sync();
  log?.('chin.init: listeners attached');
}

export const chin = {
  getButtons,
  getPanels,
  open,
  close,
  closeAll,
  toggle,
  sync,
  init: initChin
};


export function toggleChinContent(name) {
  chin.toggle(name);
}


// ---------- Profile layout sizing (left image column width) ----------
export function setProfileLayoutSizing(ratio = 0.35) {
  try {
    const doc = document;
    const topBar = doc.querySelector("#top-bar");
    const header = topBar?.closest("header") || doc.querySelector("header");
    const container = header?.classList.contains("container") ?
      header :
      header?.closest?.(".container") || header;
    const rect = container?.getBoundingClientRect?.();
    const vw = window.innerWidth || doc.documentElement.clientWidth || 1280;
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
}
