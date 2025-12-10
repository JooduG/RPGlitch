// apps/rpglitch/js/core-utils.js
import { db } from "./core-db.js";

// --- Constants ---
const VALID_PROTOCOLS = ["https:", "http:", "blob:", "data:"];
const VALID_IMAGE_EXTENSIONS = [
  "jpg", "jpeg", "png", "gif", "webp", "svg", "bmp", "tiff", "tif", "ico", "avif", "jfif",
];
const IMAGE_EXTENSION_REGEX = new RegExp(
  `\\.(${VALID_IMAGE_EXTENSIONS.join("|")})(\\?.*)?$`,
  "i"
);

export const SIGNATURE_COLORS = {
  red: "#d93526", pink: "#f42c6f", fuchsia: "#ed2aac", purple: "#aa40bf",
  violet: "#9062ca", indigo: "#7569da", blue: "#0f2d70", azure: "#017fc0",
  cyan: "#05a2a2", jade: "#00b478", green: "#47a417", lime: "#99c801",
  yellow: "#f2df0d", amber: "#ffbf00", pumpkin: "#d27a01", orange: "#e74b1a",
  sand: "#959082", grey: "#777777", zinc: "#6f7887", slate: "#687899",
  default: "#777",
};

// --- Color & Visual Utilities (Consolidated) ---

export function getSignatureColor(key) {
  return SIGNATURE_COLORS[key] || SIGNATURE_COLORS.default;
}

// [NEW] Random Color Generator (Excluding Default)
export function getRandomSignatureKey() {
  const keys = Object.keys(SIGNATURE_COLORS).filter(k => k !== "default");
  return keys[Math.floor(Math.random() * keys.length)];
}

export function getDeterministicColor(seed) {
  // [NOTE] Tests expect a color even for empty seeds in some legacy paths, 
  // but for explicit nulls we usually fallback to 'default' before calling this.
  if (!seed) return `hsl(0, 0%, 50%)`;
  let hash = 0;
  for (let i = 0; i < seed.length; i++)
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 40%, 60%)`;
}

export function getSignature(entity = {}) {
  // [FIX] Fallback to 'default' string to ensure a color is generated (satisfies tests), rather than Gray
  if (!entity) return getDeterministicColor("default");

  if (entity.signatureColour && entity.signatureColour !== "default") {
    // Return the CSS variable mapping
    return `var(--signature-${entity.signatureColour})`;
  }
  // Fallback to deterministic hash based on ID or Name
  const seed = [entity.name || "", ...(entity.tags || [])].filter(Boolean).join(",");
  return getDeterministicColor(seed || entity.id || entity.type || "default");
}

export function getContrastColor(hex) {
  if (!hex || typeof hex !== 'string') return '#000';

  // Handle var() or other CSS inputs gracefully-ish (fallback to black)
  if (hex.startsWith('var(')) return '#fff';

  if (hex.startsWith('#')) hex = hex.slice(1);
  if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
  if (hex.length !== 6) return '#000';

  // Parse
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);

  if (isNaN(r) || isNaN(g) || isNaN(b)) return '#000';

  // YIQ equation
  const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
  return (yiq >= 128) ? '#000' : '#fff';
}

/**
 * Darkens a hex color by a percentage (0-1).
 * Used for generating background gradients from signature colors.
 */
export function darkenColor(hex, amount) {
  if (!hex || typeof hex !== 'string') return hex;
  if (hex.startsWith('#')) hex = hex.slice(1);
  if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
  if (hex.length !== 6) return hex;

  const num = parseInt(hex, 16);
  let r = (num >> 16);
  let g = (num >> 8 & 0x00FF);
  let b = (num & 0x0000FF);

  r = Math.floor(r * (1 - amount));
  g = Math.floor(g * (1 - amount));
  b = Math.floor(b * (1 - amount));

  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

const DEFAULT_BG = ["#181c2f", "#23243a", "#1a3a4a", "#2a1a3a"]; // From _config.scss

/**
 * Updates the global app background gradient based on a signature color.
 */
export function setAppBackground(signatureKey) {
  const root = document.documentElement;
  const baseColor = SIGNATURE_COLORS[signatureKey];

  if (!signatureKey || signatureKey === "default" || !baseColor) {
    // Reset to Default
    root.style.setProperty('--bg-grad-1', DEFAULT_BG[0]);
    root.style.setProperty('--bg-grad-2', DEFAULT_BG[1]);
    root.style.setProperty('--bg-grad-3', DEFAULT_BG[2]);
    root.style.setProperty('--bg-grad-4', DEFAULT_BG[3]);
    return;
  }

  // Create atmospheric gradient (Signature -> Void)
  // Grad 1: Dark version of signature (was 0.55) -> Now 0.2 (Much lighter, prevents "muddy" yellows)
  root.style.setProperty('--bg-grad-1', darkenColor(baseColor, 0.2));
  // Grad 2: Even darker (was 0.75) -> Now 0.4
  root.style.setProperty('--bg-grad-2', darkenColor(baseColor, 0.4));
  // Grad 3: Near Black (Tinted)
  root.style.setProperty('--bg-grad-3', '#111111');
  // Grad 4: Blackish void
  root.style.setProperty('--bg-grad-4', '#080808');
}

/**
 * Generates the HTML for an entity picture (Avatar or Cover).
 * Moved from entity-structs.js to separate UI logic from Data schemas.
 */
export function getPictureHTML(entity = {}, options = {}) {
  const { cover, landscape, neutralPlaceholder = false } = options;
  const title = entity.name || "Empty";
  const type = (entity.type || "default").toLowerCase();

  // Validate URL
  const rawSrc = entity.profilePictureUrl;
  const src = (typeof rawSrc === "string" && rawSrc.trim()) ? rawSrc.trim() : "";

  const signature = getSignature(entity);
  // Note: We can't easily calculate contrast for a CSS variable, so we default to black/white 
  // or let CSS handle it. For now, hardcode contrast for known vars or fallback.
  const contrast = "#fff";

  const wrap = document.createElement("div");
  let aspectRatioClass = '';
  if (landscape === true) aspectRatioClass = ' picture--landscape';
  else if (landscape === false) aspectRatioClass = ' picture--portrait';

  wrap.className = `picture${cover ? " picture--cover" : ""}${aspectRatioClass}`;
  wrap.style.setProperty("--signature", signature);
  wrap.style.setProperty("--signature-contrast", contrast);
  wrap.style.backgroundColor = "var(--signature)";

  // 1. Image Provided
  if (src) {
    const img = document.createElement("img");
    img.alt = `${type} image for ${title}`;
    img.src = src;
    img.loading = "lazy";
    img.decoding = "async";
    img.referrerPolicy = "no-referrer";
    wrap.appendChild(img);
    return wrap;
  }

  // 2. Placeholder
  const ph = document.createElement("div");
  ph.className = "placeholder-image";
  if (!neutralPlaceholder) {
    ph.style.backgroundColor = "var(--signature)";
    ph.style.color = "var(--signature-contrast)";
  }

  const iconTemplateId = `tpl-placeholder-icon-${type}`;
  const iconTemplate = document.querySelector(`#${iconTemplateId}`) || document.querySelector("#tpl-placeholder-icon-default");

  if (iconTemplate?.content) {
    ph.appendChild(iconTemplate.content.cloneNode(true));
  }

  ph.setAttribute("role", "img");
  ph.setAttribute("aria-label", `${type} placeholder for ${title}`);
  wrap.appendChild(ph);
  return wrap;
}

// --- Security & HTML Utilities ---

export function escapeHtml(str) {
  if (typeof str !== "string") return "";
  return str.replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

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
  if (typeof urlString !== "string" || urlString.length < 5) return false;
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

// --- UI Helpers (Chin, TopBar) ---

export const chin = {
  init: () => {
    document.addEventListener('click', (e) => {
      const container = document.getElementById('chin-container');
      if (!container || container.hidden) return;
      if (e.target.id === 'chin-backdrop') {
        chin.closeAll();
      }
    });
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

// --- Dynamic Sampling ---

function mapRange(value, inMin, inMax, outMin, outMax) {
  return ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
}

export function calculateBlendedParams(ai, user, world) {
  // 1. Safety Defaults
  const defaults = { entropy: 10, velocity: 10, resonance: 10 };

  const getDyn = (entity) => entity?.dynamics || defaults;

  const aiDyn = getDyn(ai);
  const userDyn = getDyn(user);
  const worldDyn = getDyn(world);

  // 2. Temperature (Creativity/Chaos)
  // Formula: (World_Entropy * 0.7) + (AI_Entropy * 0.3)
  // Mapping: 0-100 -> 0.5-1.35
  const rawTemp = (worldDyn.entropy * 0.7) + (aiDyn.entropy * 0.3);
  const temperature = mapRange(rawTemp, 0, 100, 0.5, 1.35);

  // 3. Repetition Penalty (Pacing)
  // Formula: Max of AI, User, World Velocities
  // Mapping: 0-100 -> 1.0-1.18
  const rawRep = Math.max(aiDyn.velocity, userDyn.velocity, worldDyn.velocity);
  const repetition_penalty = mapRange(rawRep, 0, 100, 1.0, 1.18);

  // 4. Top_P (Focus/Coherence)
  // Formula: AI_Resonance
  // Mapping: 0-100 -> 1.0 down to 0.65
  const rawTopP = aiDyn.resonance;
  const top_p = mapRange(rawTopP, 0, 100, 1.0, 0.65);

  return {
    temperature: parseFloat(temperature.toFixed(2)),
    repetition_penalty: parseFloat(repetition_penalty.toFixed(2)),
    top_p: parseFloat(top_p.toFixed(2))
  };
}