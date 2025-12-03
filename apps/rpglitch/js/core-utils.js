// apps/rpglitch/js/core-utils.js (Final Version for Build)
import { db } from "./core-db.js";

// --- Constants (from validation.js) ---
const VALID_PROTOCOLS = ["https:", "http:", "blob:", "data:"];
const VALID_IMAGE_EXTENSIONS = [
  "jpg", "jpeg", "png", "gif", "webp", "svg", "bmp", "tiff", "tif", "ico", "avif", "jfif",
];
const IMAGE_EXTENSION_REGEX = new RegExp(
  `\\.(${VALID_IMAGE_EXTENSIONS.join("|")})(\\?.*)?$`,
  "i"
);
export const SIGNATURE_COLORS = {
  pink: "#ec4899", emerald: "#10b981", cyan: "#06b6d4",
  orange: "#f97316", purple: "#a855f7", default: "#777",
};

export function getSignatureColor(key) {
  return SIGNATURE_COLORS[key] || SIGNATURE_COLORS.default;
}

export function getContrastColor(hex) {
  if (!hex || typeof hex !== 'string') return '#000';
  if (hex.startsWith('#')) hex = hex.slice(1);
  if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
  if (hex.length !== 6) return '#000';
  if (/[^0-9a-fA-F]/.test(hex)) return '#000';

  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
  return (yiq >= 128) ? '#000' : '#fff';
}

// --- Security & HTML Utilities ---

export function escapeHtml(str) {
  if (typeof str !== "string") return "";
  return str.replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/**
 * Sanitizes HTML content using DOMPurify.
 * @returns {string} Sanitized HTML safe for innerHTML
 */
export function sanitizeHtml(html) {
  const value = typeof html === "string" ? html : String(html ?? "");

  if (typeof window === "undefined" || !window.DOMPurify) {
    const msg = "Security Error: DOMPurify not loaded. Cannot sanitize content.";
    error(msg);
    return escapeHtml(value);
  }

  try {
    return window.DOMPurify.sanitize(value);
  } catch (err) {
    error("Sanitization failed:", err);
    return "";
  }
}

// --- Validation ---

export function isValidImageUrl(urlString, allowLog = false) {
  if (typeof urlString !== "string" || urlString.length < 5) {
    return false;
  }
  try {
    const urlObj = new URL(urlString);
    if (!VALID_PROTOCOLS.includes(urlObj.protocol)) return false;
    if (urlObj.protocol === "data:") return urlString.startsWith("data:image/");
    if (urlObj.protocol === "blob:") return true;
    return IMAGE_EXTENSION_REGEX.test(urlObj.pathname);
  } catch (error) {
    if (allowLog) log("[Validation] URL parse error:", error.message);
    return false;
  }
}

export function extractImageUrl(result) {
  let url;
  if (result?.imageUrl && typeof result.imageUrl === "string") url = result.imageUrl;
  else if (result?.dataUrl && typeof result.dataUrl === "string") url = result.dataUrl;
  else if (result?.url) url = String(result.url);
  else if (result?.imageId && result?.fileExtension) url = `https://img.perchance.org/${result.imageId}.${result.fileExtension}`;
  else if (typeof result === "string") url = result;

  if (typeof url === "string") {
    url = url.trim();
    return url === "" ? undefined : url;
  }
  return undefined;
}

// --- Debug & Logging ---

let isDebug = false;

export async function initDebugMode() {
  try {
    const settings = await db.settings.get("app-settings");
    if (settings && typeof settings.debugMode !== "undefined") {
      isDebug = !!settings.debugMode;
    }
  } catch (e) {
    console.error("[RPGlitch] Failed to load debug mode:", e);
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
    let settings = await db.settings.get("app-settings");
    if (!settings) settings = { id: "app-settings" };
    settings.debugMode = isDebug;
    await db.settings.put(settings);
  } catch (e) {
    error("Failed to save debug mode to settings:", e);
  }
  return isDebug;
}

// --- Generic Utilities ---

export function generateUUID() {
  let d = new Date().getTime();
  let d2 = (typeof performance !== "undefined" && performance.now && performance.now() * 1000) || 0;
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    let r = Math.random() * 16;
    if (d > 0) {
      r = (d + r) % 16 | 0;
      d = Math.floor(d / 16);
    } else {
      r = (d2 + r) % 16 | 0;
      d2 = Math.floor(d2 / 16);
    }
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

export function debounce(fn, wait = 250) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn.apply(null, args), wait);
  };
}

export function dismissLoadingUI() {
  const modal = document.querySelector("#loading-modal");
  if (modal) {
    try {
      if (typeof modal.close === "function") modal.close();
    } catch (e) { void 0; }
    modal.style.display = "none";
    modal.removeAttribute("open");
  }
}

export function renderTags(container, entity, options = {}) {
  const { singleTag = false } = options;

  if (singleTag) {
    const entityType = entity.type || entity.kind || "Entity";
    const typeLabel = entityType.charAt(0).toUpperCase() + entityType.slice(1);
    const wrap = document.createElement("div");
    wrap.className = "tag-chips";
    const chip = document.createElement("span");
    chip.className = "tag-chip";
    chip.textContent = typeLabel;

    if (entity.signatureColour && entity.signatureColour !== "default") {
      chip.style.backgroundColor = SIGNATURE_COLORS[entity.signatureColour];
      chip.style.color = "white";
    }
    wrap.appendChild(chip);
    container.appendChild(wrap);
    return;
  }

  const tags = entity.tags || [];
  if (entity.isPremade) tags.unshift("Premade");

  if (tags.length === 0) return;

  const wrap = document.createElement("div");
  wrap.className = "tag-chips";
  tags.forEach((t) => {
    const chip = document.createElement("span");
    chip.className = "tag-chip";
    chip.textContent = t;

    if (t === "Premade" && entity.signatureColour && entity.signatureColour !== "default") {
      chip.style.backgroundColor = SIGNATURE_COLORS[entity.signatureColour];
      chip.style.color = "white";
    }
    wrap.appendChild(chip);
  });
  container.appendChild(wrap);
}

// --- Missing Exports from Original utils.js (ADDED) ---
export async function handleAsyncError(asyncFn, options = {}) {
  const {
    errorMessage = "An error occurred. Please try again.",
    context = "operation",
    showAlert = true,
    fallback = null,
  } = options;

  try {
    return await asyncFn();
  } catch (err) {
    error(`Failed to ${context}:`, err);
    if (showAlert) window.alert(errorMessage);
    return fallback;
  }
}

export const chin = {
  init: () => {
    document.addEventListener('click', (e) => {
      const container = document.getElementById('chin-container');
      if (!container || container.hidden) return;
      if (e.target.id === 'chin-backdrop') {
        chin.closeAll();
      }
    });
    // Attach toggle listeners
    document.querySelectorAll('[data-chin]').forEach(btn => {
      if (btn.dataset.chinInitialized) return;
      if (btn.tagName === 'BUTTON' || btn.getAttribute('role') === 'button') {
        btn.dataset.chinInitialized = "true";
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const name = btn.getAttribute('data-chin');
          chin.toggle(name);
        });
      }
    });
  },
  open: (name) => {
    chin.closeAll();
    const el = document.querySelector(`.chin[data-chin="${name}"]`);
    const container = document.getElementById('chin-container');
    const backdrop = document.getElementById('chin-backdrop');

    if (el) el.removeAttribute('hidden');
    if (container) {
      container.removeAttribute('hidden');
      container.style.pointerEvents = 'auto';
    }
    if (backdrop) backdrop.removeAttribute('hidden');
  },
  close: (name) => {
    const el = document.querySelector(`.chin[data-chin="${name}"]`);
    if (el) el.setAttribute('hidden', '');

    const visible = document.querySelector('.chin:not([hidden])');
    if (!visible) {
      const container = document.getElementById('chin-container');
      if (container) {
        container.setAttribute('hidden', '');
        container.style.pointerEvents = 'none';
      }
    }
  },
  closeAll: () => {
    const chins = document.querySelectorAll('.chin');
    chins.forEach(c => c.setAttribute('hidden', ''));
    const container = document.getElementById('chin-container');
    if (container) {
      container.setAttribute('hidden', '');
      container.style.pointerEvents = 'none';
    }
    const backdrop = document.getElementById('chin-backdrop');
    if (backdrop) backdrop.setAttribute('hidden', '');
  },
  toggle: (name) => {
    const el = document.querySelector(`.chin[data-chin="${name}"]`);
    if (el && !el.hasAttribute('hidden')) chin.close(name);
    else chin.open(name);
  }
};

export function setTopBarRight(mode) {
  // Simplified stub based on need in ui-views.js
  const doc = document;
  const topBarRightStoryboard = doc.querySelector("#top-bar-right-storyboard");
  const topBarRightForm = doc.querySelector("#top-bar-right-form");
  const topBarRightProfile = doc.querySelector("#top-bar-right-profile");
  const sectionMap = {
    storyboard: topBarRightStoryboard,
    form: topBarRightForm,
    profile: topBarRightProfile,
  };
  Object.values(sectionMap).forEach((sec) => sec && sec.setAttribute("hidden", ""));
  if (sectionMap[mode]) sectionMap[mode].removeAttribute("hidden");
}

export function hideEl(el, doc = document) {
  if (typeof el === 'string') el = doc.getElementById(el);
  if (el) el.setAttribute('hidden', '');
}

export function showEl(el, doc = document) {
  if (typeof el === 'string') el = doc.getElementById(el);
  if (el) el.removeAttribute('hidden');
}

export function replaceEventHandler(el, event, handler, handlerName) {
  if (!el) return;
  if (el[handlerName]) {
    el.removeEventListener(event, el[handlerName]);
  }
  el[handlerName] = handler;
  el.addEventListener(event, handler);
}