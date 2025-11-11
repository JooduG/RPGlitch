import { entities } from "./entities.js";
import { db } from "./db.js";
/* Utility helpers for RPGlitch
 * Safe storage, DOM helpers, chin management
 */

// Signature Color constants
// These must match the Signature Color options in entity-form.js and _variables.scss
export const BASE_COLOUR_MAP = {
  pink: "#ec4899", // --brand-pink
  emerald: "#10b981", // --brand-emerald
  cyan: "#06b6d4", // --brand-cyan
  orange: "#f97316", // --brand-orange
  purple: "#a855f7", // --brand-purple
  default: "#777", // --brand-default (fallback/auto-generated)
};

// UI Timing Constants
export const AUTO_UNLOCK_DELAYS_MS = [0, 50, 200];
export const UI_WATCHDOG_INTERVAL_MS = 500;

export function generateUUID() {
  // Public Domain/MIT
  let d = new Date().getTime(); //Timestamp
  let d2 =
    (typeof performance !== "undefined" &&
      performance.now &&
      performance.now() * 1000) ||
    0; //Time in microseconds since page-load or 0 if unsupported
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    let r = Math.random() * 16; //random number between 0 and 16
    if (d > 0) {
      //Use timestamp until depleted
      r = (d + r) % 16 | 0;
      d = Math.floor(d / 16);
    } else {
      //Use microseconds since page-load if available
      r = (d2 + r) % 16 | 0;
      d2 = Math.floor(d2 / 16);
    }
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

/**
 * Creates an async copy of an entity.
 * @param {string} type - 'character' or 'world'
 * @param {string} id - The ID of the entity to copy.
 * @returns {Promise<Object|null>} A promise resolving to the new entity or null.
 */
export async function copyEntity(type, id) {
  console.log(`Attempting to copy entity of type ${type} with id ${id}`);

  // 1. Get the entity asynchronously
  const entityToCopy = await entities.get(type, id);
  if (!entityToCopy) {
    console.error(`Entity with type ${type} and id ${id} not found.`);
    return null;
  }

  // 2. Create the new entity object
  const newEntity = {
    ...entityToCopy,
    sections: { ...entityToCopy.sections }, // Deep copy sections
  };

  // 3. Remove ID (so upsert creates a new one) and mark as custom
  delete newEntity.id;
  newEntity.isPremade = false;
  newEntity.name = `${newEntity.name || "Untitled"} (Clone)`;

  return newEntity;
}

export function escapeHtml(str) {
  if (typeof str !== "string") {
    return "";
  }
  // WARNING: This is NOT a sanitizer. It only escapes HTML for display in text.
  // For safe HTML, use a library like DOMPurify.
  return str.replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// ---------- Error Handling ----------

/**
 * Standardized async error handler wrapper
 * @param {Function} asyncFn - Async function to execute
 * @param {Object} options - Error handling options
 * @param {string} options.errorMessage - User-facing error message
 * @param {string} options.context - Context for logging (e.g., 'save entity', 'delete message')
 * @param {boolean} options.showAlert - Whether to show alert to user (default: true)
 * @param {*} options.fallback - Fallback value to return on error
 * @returns {Promise<*>} Result of asyncFn or fallback value
 */
export async function handleAsyncError(asyncFn, options = {}) {
  const {
    errorMessage = "An error occurred. Please try again.",
    context = "operation",
    showAlert = true,
    fallback = null,
  } = options;

  try {
    return await asyncFn();
  } catch (error) {
    console.error(`Failed to ${context}:`, error);
    if (showAlert) {
      window.alert(errorMessage);
    }
    return fallback;
  }
}

/**
 * Detects if a text string is an HTML error page (e.g., server returned HTML instead of JSON)
 * @param {*} text - Text to check
 * @returns {boolean} True if text appears to be an HTML document
 */
export function isHtmlErrorPage(text) {
  if (typeof text !== "string") {
    return false;
  }
  const trimmedText = text.trim().toLowerCase();
  // FIX: Add correct parentheses for operator precedence
  return trimmedText.startsWith("<!doctype") || trimmedText.startsWith("<html");
}

// ---------- Event Handler Utilities ----------

/**
 * Safely replace an event listener, removing old handler if it exists
 * @param {HTMLElement} element - Target element
 * @param {string} eventType - Event type (e.g., 'click', 'submit')
 * @param {Function} handler - New event handler function
 * @param {string} handlerKey - Property name to store handler reference (default: '_handler')
 */
export function replaceEventHandler(
  element,
  eventType,
  handler,
  handlerKey = "_handler"
) {
  if (!element) return;

  // Remove old handler if it exists
  if (element[handlerKey]) {
    element.removeEventListener(eventType, element[handlerKey]);
  }

  // Add new handler and store reference
  element.addEventListener(eventType, handler);
  element[handlerKey] = handler;
}

// ---------- Debug Logger ----------
// Uses IndexedDB for persistence (migrated from localStorage)
let isDebug = false;

/**
 * Initializes debug mode from IndexedDB settings.
 * Should be called during app initialization.
 */
export async function initDebugMode() {
  try {
    const settings = await db.settings.get("app-settings");
    if (settings && typeof settings.debugMode !== "undefined") {
      isDebug = !!settings.debugMode;
    }
  } catch (e) {
    console.error("Failed to load debug mode from settings:", e);
    isDebug = false;
  }
  return isDebug;
}

export function log(...args) {
  if (isDebug) console.log("[RPGlitch]", ...args);
}

export function error(...args) {
  console.error("[RPGlitch]", ...args);
}

export async function setDebug(on) {
  isDebug = !!on;
  try {
    // Get existing settings or create new one
    let settings = await db.settings.get("app-settings");
    if (!settings) {
      settings = { id: "app-settings" };
    }
    settings.debugMode = isDebug;
    await db.settings.put(settings);
  } catch (e) {
    error("Failed to save debug mode to settings:", e);
  }
  return isDebug;
}

// ---------- Safe JSON & Storage ----------
// safeJSONParse and safeLocalStorageGet have been removed as they are no longer used.

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
    if (typeof el === "string")
      el = doc.querySelector(el.startsWith("#") ? el : `#${el}`);
    if (!el) return;
    el.hidden = true;
    el.classList.remove("is-open");
  } catch {
    /* ignore */
  }
}

export function showEl(el, doc = document) {
  try {
    if (typeof el === "string")
      el = doc.querySelector(el.startsWith("#") ? el : `#${el}`);
    if (!el) return;
    el.hidden = false;
    el.classList.add("is-open");
  } catch {
    /* ignore */
  }
}

// ---------- Loading/Overlay guards ----------
export function dismissLoadingUI() {
  try {
    const doc = document;
    // Heal documentElement / html early
    try {
      doc.documentElement.removeAttribute("inert");
      if (doc.documentElement && doc.documentElement.style) {
        doc.documentElement.style.pointerEvents = "auto";
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
    doc
      .querySelectorAll("[aria-busy]")
      .forEach((el) => el.removeAttribute("aria-busy"));
    // Close any open dialogs except an emergency modal
    doc.querySelectorAll("dialog[open]").forEach((d) => {
      if (d.id === "emergency-modal") return;
      try {
        if (typeof d.close === "function") d.close();
      } catch {
        void 0;
      }
      d.removeAttribute("open");
    });
    // Defensive: ensure <dialog> elements that are not open don’t intercept clicks
    doc.querySelectorAll("dialog:not([open])").forEach((d) => {
      d.style.display = "none";
      d.setAttribute("aria-hidden", "true");
    });
    // If any custom overlays exist, clear permissive data attributes
    doc.querySelectorAll("[data-overlay],[data-block-ui]").forEach((el) => {
      el.removeAttribute("data-overlay");
      el.removeAttribute("data-block-ui");
      el.removeAttribute("open");
      el.style.pointerEvents = "none";
      el.style.display = "none";
    });
    // Explicitly hide the watchdog indicator if it's visible
    const guardIndicator = doc.querySelector("#rpglitch-guard-indicator");
    if (guardIndicator) {
      guardIndicator.style.display = "none";
    }
    // Aggressively ensure main containers are interactive
    const roots = [
      doc.documentElement,
      doc.body,
      doc.querySelector("#main"),
      doc.querySelector("#storyboard-screen"),
      doc.querySelector("#profile-screen"),
      doc.querySelector("#character-form-screen"),
      doc.querySelector("#world-form-screen"),
    ].filter(Boolean);
    roots.forEach((el) => {
      el.removeAttribute("inert");
      try {
        el.style.pointerEvents = "auto";
      } catch {
        void 0;
      }
      el.style.opacity = "";
      try {
        el.style.visibility = "";
      } catch {
        void 0;
      }
      if (el === doc.body || el === doc.documentElement) {
        try {
          el.style.overflow = "auto";
          el.style.position = "";
          el.style.zIndex = "";
          el.style.top = "";
          el.style.left = "";
          el.style.right = "";
          el.style.bottom = "";
          el.style.width = "";
          el.style.height = "";
          el.style.transform = "";
          el.style.filter = "";
        } catch {
          void 0;
        }
      }
    });
    log?.("dismissLoadingUI: ensured interactive state");
  } catch (e) {
    try {
      console.warn("dismissLoadingUI failed", e);
    } catch {
      void 0;
    }
  }
}

// ---------- UI Block Detection / Watchdog ----------
const isDialogOpen = () => {
  const dialogQuery = document.querySelector(
    "dialog[open]:not(#emergency-modal)"
  );
  if (dialogQuery)
    return {
      blocked: true,
      reason: "dialog-open",
      node: dialogQuery,
    };

  try {
    const doc = document;
    // Any open non-emergency dialog
    const openDialog = doc.querySelector("dialog[open]:not(#emergency-modal)");
    if (openDialog)
      return {
        blocked: true,
        reason: "dialog-open",
        node: openDialog,
      };
    // Any aria-busy elements in the DOM
    const busy = doc.querySelector('[aria-busy="true"]');
    if (busy)
      return {
        blocked: true,
        reason: "aria-busy",
        node: busy,
      };
    // Pointer-events disabled on body or main containers
    const candidates = [
      doc.documentElement,
      doc.body,
      doc.querySelector("#main"),
      doc.querySelector("#chin-container"),
    ].filter(Boolean);
    for (const el of candidates) {
      const cs = getComputedStyle?.(el);
      if (cs && cs.pointerEvents === "none") {
        // Special case: chin-container is allowed to have pointer-events:none when all chins are closed
        // This is intentional behavior controlled by chin.updateState() in line 1058
        if (el.id === "chin-container") {
          const openChins = doc.querySelectorAll(
            ".chin[data-chin]:not([hidden])"
          );
          if (openChins.length === 0) {
            // No chins are open, so pointer-events:none is expected - skip this check
            continue;
          }
          // If chins ARE open but container still has pointer-events:none, that's a real block
        }
        return {
          blocked: true,
          reason: "pointer-events-none",
          node: el,
        };
      }
      if (el.hasAttribute("inert")) {
        return {
          blocked: true,
          reason: "inert",
          node: el,
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
          const ok = el.closest?.(
            "#main, header, #chin-container, .chin, #output-container"
          );
          if (!ok) {
            return {
              blocked: true,
              reason: "hit-test-overlay",
              node: el,
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
          if (!cs || cs.pointerEvents === "none") continue;
          const pos = cs.position;
          if (pos !== "fixed" && pos !== "absolute") continue;
          const r = el.getBoundingClientRect?.();
          if (!r) continue;
          const covers =
            r.width >= vw * 0.9 &&
            r.height >= vh * 0.9 &&
            r.left <= 5 &&
            r.top <= 5;
          if (
            covers &&
            !el.closest?.("#main, header, #chin-container, .chin")
          ) {
            return {
              blocked: true,
              reason: "viewport-overlay",
              node: el,
            };
          }
        }
      }
    } catch {
      void 0;
    }
    return {
      blocked: false,
    };
  } catch {
    return {
      blocked: false,
    };
  }
};

let uiWatchdogTimer = null;
export let _uiWatchdogStarted = false;
let chinObserver;
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
        if (doc.querySelector("#rpglitch-guard-indicator")) return;
        const wrap = doc.createElement("div");
        wrap.id = "rpglitch-guard-indicator";
        wrap.style.cssText = [
          "position:fixed",
          "top:8px",
          "left:8px",
          "z-index:2147483646",
          "background:rgba(0,0,0,0.7)",
          "color:#fff",
          "padding:6px 8px",
          "border-radius:6px",
          "font:12px/1.2 system-ui,sans-serif",
          "display:none",
          "gap:8px",
          "align-items:center",
          "pointer-events:auto",
        ].join(";");
        const text = doc.createElement("span");
        text.id = "rpglitch-guard-text";
        text.textContent = "UI blocked";
        const btn = doc.createElement("button");
        btn.textContent = "Force Unlock";
        btn.style.cssText = [
          "margin-left:8px",
          "background:#ec4899",
          "color:#fff",
          "border:0",
          "border-radius:4px",
          "padding:4px 6px",
          "cursor:pointer",
        ].join(";");
        btn.addEventListener("click", () => {
          try {
            unlockNow?.();
            dismissLoadingUI?.();
          } catch {
            void 0;
          }
          wrap.style.display = "none";
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
          if (n.id !== "emergency-modal") {
            n.removeAttribute?.("open");
            n.removeAttribute?.("inert");
            if (n.style) {
              const t = (n.tagName || "").toLowerCase();
              if (t !== "html" && t !== "body") {
                n.style.pointerEvents = "none";
                n.style.display = "none";
                n.style.visibility = "";
                n.style.opacity = "";
              }
            }
            n.setAttribute?.("aria-hidden", "true");
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
        const allowedRoot = doc.querySelector("#main") || doc.body;
        const isRoot = el === doc.body || el === doc.documentElement;
        const ok =
          isRoot || el.closest?.("#main, header, #chin-container, .chin");
        if (!ok && allowedRoot && !allowedRoot.contains(el)) {
          neutralizeNodeChain(el);
        }
      } catch {
        /* noop */
      }
    }
    const describe = (n) => {
      try {
        if (!n) return "";
        const id = n.id ? `#${n.id}` : "";
        const cls = n.className
          ? `.${String(n.className).split(/\s+/).filter(Boolean).join(".")}`
          : "";
        const tag = (n.tagName || "").toLowerCase();
        return `${tag}${id}${cls}`;
      } catch {
        return "";
      }
    };
    const tick = () => {
      const st = isDialogOpen?.() || {
        blocked: false,
      };
      log?.("ui.watchdog: tick", st);
      // If the blocking node is our own guard indicator, don't report it as blocked
      if (st.blocked && st.node && st.node.id === "rpglitch-guard-indicator") {
        st.blocked = false;
      }
      if (st.blocked) {
        if (lastBlocked !== true) {
          // Always surface first detection once for diagnostics
          try {
            console.log("[RPGlitch] ui.watchdog: blocked", {
              reason: st.reason,
              node: describe(st.node),
            });
          } catch {
            void 0;
          }
          log?.("ui.watchdog: blocked", {
            reason: st.reason,
            node: describe(st.node),
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
              node: describe(st.node),
            };
            // Use console.log so external scribblers capture it reliably
            console.log("[RPGlitch] ui.watchdog: still blocked", info);
            lastWarnAt = now;
          } catch {
            void 0;
          }
        }
        // Show small in-app hint if block persists
        try {
          if (elapsed > 1500) {
            installStatusIndicator();
            const wrap = doc.querySelector("#rpglitch-guard-indicator");
            const text = doc.querySelector("#rpglitch-guard-text");
            if (wrap && text) {
              text.textContent = `UI blocked: ${st.reason || "unknown"}`;
              wrap.style.display = "inline-flex";
            }
          }
        } catch {
          void 0;
        }
        lastBlocked = true;
      } else if (lastBlocked !== false) {
        log?.("ui.watchdog: unblocked");
        blockedSince = 0;
        lastBlocked = false;
        try {
          const wrap = doc.querySelector("#rpglitch-guard-indicator");
          if (wrap) wrap.style.display = "none";
        } catch {
          /* noop */
        }
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
    uiWatchdogTimer = setInterval(tick, UI_WATCHDOG_INTERVAL_MS);
    // Run immediately once
    tick();
    try {
      console.log("[RPGlitch] ui.watchdog: armed");
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
      doc.documentElement.removeAttribute("inert");
      if (doc.documentElement && doc.documentElement.style)
        doc.documentElement.style.pointerEvents = "auto";
      doc.body && doc.body.removeAttribute("inert");
      if (doc.body && doc.body.style) {
        doc.body.style.pointerEvents = "auto";
        doc.body.style.overflow = "auto";
      }
    } catch {
      void 0;
    }
    const root = doc.querySelector("#main") || doc.body || doc.documentElement;
    // Heal obvious blockers inside our root
    const all = root.querySelectorAll(
      'dialog, [role="dialog"], [data-overlay], [data-block-ui]'
    );
    all.forEach((el) => {
      try {
        el.removeAttribute("inert");
        el.removeAttribute("open");
        el.style.pointerEvents = "none";
        el.style.display = "none";
        el.setAttribute("aria-hidden", "true");
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
    window.addEventListener(
      "pointerdown",
      () => {
        // Run after other handlers to avoid interference; repeat to catch late overlays
        AUTO_UNLOCK_DELAYS_MS.forEach((delay) =>
          setTimeout(() => unlockNow?.(), delay)
        );
      },
      true
    );
    log?.("ui.autounlock: enabled");
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
    window.addEventListener("focus", () => dismissLoadingUI?.(), true);
    doc.addEventListener("visibilitychange", () => dismissLoadingUI?.());
    window.addEventListener("pageshow", () => dismissLoadingUI?.());
    // Panic hotkey: Ctrl+Shift+D to dismiss overlays immediately
    doc.addEventListener("keydown", (e) => {
      try {
        const ctrl = e.ctrlKey || e.metaKey; // allow Cmd on macOS
        if (ctrl && e.shiftKey && (e.key === "D" || e.key === "d")) {
          dismissLoadingUI?.();
          log?.("ui.recovery: hotkey Ctrl+Shift+D");
        }
      } catch {
        /* ignore */
      }
    });
    log?.("ui.recovery: hooks installed");
  } catch {
    /* ignore */
  }
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
      doc.querySelector("#main"),
      doc.querySelector("#chin-container"),
    ].filter(Boolean);
    const heal = (who) => {
      try {
        if (!who) return;
        who.removeAttribute("inert");
        who.style && (who.style.pointerEvents = "auto");
        if (who === doc.body) who.style.overflow = "auto";
      } catch {
        void 0;
      }
    };
    const obs = new MutationObserver((recs) => {
      for (const r of recs) {
        if (r.type === "attributes") {
          if (r.attributeName === "inert" || r.attributeName === "style") {
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
        attributeFilter: ["inert", "style"],
      })
    );
    uiAttrObserver = obs;
    log?.("ui.attrObserver: installed");
  } catch {
    // ignore
  }
}

// ---------- Branding ----------

// --- [SIGNATURE COLOUR FIX] ---
// This is the applySignature function. It correctly
// removes all classes, then adds the one we want. This fixes
// the "randomly working" bug.
export function applySignature(container, entity) {
  if (!container) return;

  // Remove all possible signature classes first
  container.classList.remove(
    "signature-pink",
    "signature-emerald",
    "signature-cyan",
    "signature-orange",
    "signature-purple"
  );

  // 1. If a signature colour exists AND it's not "default", add the specific class.
  // 2. If it's "default" or missing, we add NO class, and the base CSS takes over.
  if (
    entity &&
    entity.signatureColour &&
    entity.signatureColour !== "default"
  ) {
    container.classList.add(`signature-${entity.signatureColour}`);
  }
}
// --- [END SIGNATURE COLOUR FIX] ---

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

import { getPictureHTML } from "./entities.js";

export function renderTags(container, entity, options = {}) {
  const { singleTag = false } = options;

  // For single tag mode, only show the entity type
  if (singleTag) {
    const entityType = entity.type || entity.kind || "Entity";
    const typeLabel = entityType.charAt(0).toUpperCase() + entityType.slice(1);

    const wrap = document.createElement("div");
    wrap.className = "tag-chips";

    const chip = document.createElement("span");
    chip.className = "tag-chip";
    chip.textContent = typeLabel;

    // Apply signature color if available
    if (entity.signatureColour && entity.signatureColour !== "default") {
      chip.style.backgroundColor = BASE_COLOUR_MAP[entity.signatureColour];
      chip.style.color = "white";
    }

    wrap.appendChild(chip);
    container.appendChild(wrap);
    return;
  }

  // Original multi-tag behavior for backward compatibility
  const tags = entity.tags || [];
  if (entity.isPremade) {
    tags.unshift("Premade");
  }

  if (tags.length === 0) return;

  const wrap = document.createElement("div");
  wrap.className = "tag-chips";
  tags.forEach((t) => {
    const chip = document.createElement("span");
    chip.className = "tag-chip";
    chip.textContent = t;

    if (
      t === "Premade" &&
      entity.signatureColour &&
      entity.signatureColour !== "default"
    ) {
      chip.style.backgroundColor = BASE_COLOUR_MAP[entity.signatureColour];
      chip.style.color = "white";
    }
    wrap.appendChild(chip);
  });
  container.appendChild(wrap);
}

export function buildHero(entity, options = {}) {
  const wrap = document.createElement("div");
  wrap.className = "hero-wrap";
  const pic = getPictureHTML
    ? getPictureHTML(entity, {
        cover: true,
      })
    : null;
  if (pic) {
    pic.classList?.add("hero-bleed");

    // Signature Colour implementation for placeholder
    const placeholder = pic.querySelector(".placeholder-image");
    if (
      placeholder &&
      entity.signatureColour &&
      entity.signatureColour !== "default"
    ) {
      placeholder.style.backgroundColor =
        BASE_COLOUR_MAP[entity.signatureColour];
    }

    wrap.appendChild(pic);
  }
  renderTags(wrap, entity, options);
  return wrap;
}

// ---------- Navigation shims ----------
export function navigateBackOrReturnDefault(returnTo = "#storyboard", router) {
  const q = getHashQuery?.() || new URLSearchParams("");
  const fallback = q.get("return") || returnTo;
  router?.navigate?.(fallback);
}

export function goBackWithFallback(
  returnTo = "#storyboard",
  fallback = "#storyboard",
  router
) {
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
  const topBarRightStoryboard = doc.querySelector("#top-bar-right-storyboard");
  const topBarRightForm = doc.querySelector("#top-bar-right-form");
  const topBarRightProfile = doc.querySelector("#top-bar-right-profile");
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
  return document.querySelectorAll(
    "header [data-chin], #chin-container [data-chin]"
  );
}

function getPanels() {
  const container = () => document.querySelector("#chin-container");
  return (
    container()?.querySelectorAll(".chin[data-chin]") ||
    document.querySelectorAll(".chin[data-chin]")
  );
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
    cont.style.pointerEvents = anyOpen ? "auto" : "none";
  }
  const bd = document.querySelector("#chin-backdrop");
  if (bd) {
    if (anyOpen) {
      bd.removeAttribute("hidden");
      bd.style.pointerEvents = "auto";
      bd.style.display = "block";
    } else {
      bd.setAttribute("hidden", "");
      bd.style.pointerEvents = "none";
      bd.style.display = "none";
    }
  }
  if (anyOpen) {
    cont?.removeAttribute("hidden");
    cont?.setAttribute("aria-hidden", "false");
    // Set display:block when chins are open to make container visible
    cont?.style.setProperty("display", "block");
    document.body.classList.add("chin-open");
  } else {
    if (document.activeElement && cont?.contains(document.activeElement)) {
      document.activeElement.blur();
    }
    cont?.setAttribute("hidden", "");
    cont?.setAttribute("aria-hidden", "true");
    // Don't set display:none when closed - hidden attribute handles visibility
    // while keeping container in document flow for correct positioning
    document.body.classList.remove("chin-open");
  }
  log?.("chin.sync", {
    anyOpen,
    count: (panels || []).length,
  });
}

function closeAll() {
  getPanels().forEach((p) => p.setAttribute("hidden", ""));
  sync();
  log?.("chin.closeAll");
}

function open(name) {
  if (!name) return;
  const panels = getPanels();
  panels.forEach((p) => {
    if (p.dataset.chin === name) {
      p.hidden = false;
      p.removeAttribute("hidden"); // Explicitly remove the attribute
      const focusTarget =
        p.querySelector("[tabindex], button, input, select, textarea, a") || p;
      focusTarget.focus?.();
    } else {
      p.hidden = true;
      p.setAttribute("hidden", ""); // Explicitly set the attribute
    }
  });
  sync();
  log?.("chin.open", {
    name,
  });
}

function close(name) {
  if (!name) return;
  const panels = getPanels();
  panels.forEach((p) => {
    if (p.dataset.chin === name) {
      p.hidden = true;
      p.setAttribute("hidden", ""); // Explicitly set the attribute
    }
  });
  sync();
  if (chinObserver) initChinObserver();
  log?.("chin.close", {
    name,
  });
}

function initChinObserver() {
  if (chinObserver) {
    chinObserver.disconnect();
  }
  const observer = new MutationObserver(sync);
  chinObserver = observer; // Assign to the exported variable
  getPanels().forEach((p) =>
    observer.observe(p, {
      attributes: true,
      attributeFilter: ["hidden"],
    })
  );
  const cont2 = document.querySelector("#chin-container");
  if (cont2)
    observer.observe(cont2, {
      attributes: true,
      attributeFilter: ["hidden"],
    });
  log?.("chin.initObserver: listeners attached");
}

function toggle(name) {
  const panel = [...getPanels()].find((p) => p.dataset.chin === name);
  if (!panel) return;
  if (panel.hasAttribute("hidden")) open(name);
  else close(name);
  log?.("chin.toggle", {
    name,
  });
}

let chinBound = false;
function initChin() {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initChin);
    return;
  }
  const doc = document;
  // Ensure backdrop exists and is clickable to close all
  const cont = document.querySelector("#chin-container");
  if (cont && !document.querySelector("#chin-backdrop")) {
    const bd = doc.createElement("div");
    bd.id = "chin-backdrop";
    bd.setAttribute("hidden", "");
    bd.setAttribute("aria-hidden", "true");
    cont.prepend(bd);
  }
  const bd = document.querySelector("#chin-backdrop");
  if (bd && !bd._bound) {
    bd.addEventListener("click", () => {
      try {
        log("chin.backdrop: click detected, closing all chins");
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
    btn.addEventListener("click", (e) => {
      // Stop propagation to prevent document click handler from closing the chin
      e.stopPropagation();
      const name = btn.dataset.chin;
      toggle(name);
    });
    btn._chinBound = true;
  });
  if (!chinBound) {
    const topBar = doc.querySelector("#top-bar");

    doc.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeAll();
    });

    doc.addEventListener("click", (e) => {
      // If the click is on a button in the top bar, let its own handler manage it.
      if (topBar && topBar.contains(e.target)) {
        return;
      }

      // If the click is inside an open chin panel's content area, do nothing.
      if (e.target.closest(".chin")) {
        return;
      }

      // Otherwise, the click was outside, so close any open chin.
      // This will correctly handle clicks on the body or the chin backdrop.
      closeAll();
    });

    chinBound = true;
  }

  // Initial sync to set the correct state of the backdrop
  sync();
}

export const chin = {
  getButtons,
  getPanels,
  open,
  close,
  closeAll,
  toggle,
  sync,
  init: initChin,
};

export function toggleChinContent(name) {
  chin.toggle(name);
}
