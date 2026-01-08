// apps/rpglitch/js/core-utils.js

import { PHYSICS_CONSTANTS } from "../engine/physics/config.js";

// --- Constants ---
const VALID_PROTOCOLS = ["https:", "http:", "blob:", "data:"];
const VALID_IMAGE_EXTENSIONS = [
  "jpg",
  "jpeg",
  "png",
  "gif",
  "webp",
  "svg",
  "bmp",
  "tiff",
  "tif",
  "ico",
  "avif",
  "jfif",
];
const IMAGE_EXTENSION_REGEX = new RegExp(
  `\\.(${VALID_IMAGE_EXTENSIONS.join("|")})(\\?.*)?$`,
  "i",
);

import { PALETTE } from "./constants.js";

// Alias for backward compatibility
// [REMOVED] Legacy SIGNATURE_COLORS alias

// --- Color & Visual Utilities ---

export const getSignatureColor = (key) => PALETTE[key] || PALETTE.default;

export const getRandomSignatureKey = () => {
  const keys = Object.keys(PALETTE).filter((k) => k !== "default");
  return keys[Math.floor(Math.random() * keys.length)];
};

export const getDeterministicColor = (seed) => {
  if (!seed) return `hsl(0, 0%, 50%)`;
  let hash = 0;
  for (let i = 0; i < seed.length; i++)
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 40%, 60%)`;
};

export const getSignature = (entity = {}) => {
  if (!entity) return getDeterministicColor("default");

  if (entity.signatureColor && entity.signatureColor !== "default") {
    return `var(--signature-${entity.signatureColor})`;
  }
  const seed = [entity.name || "", ...(entity.tags || [])]
    .filter(Boolean)
    .join(",");
  return getDeterministicColor(seed || entity.id || entity.type || "default");
};

export const getContrastColor = (hex) => {
  if (!hex || typeof hex !== "string") return "#000";
  if (hex.startsWith("var(")) return "#fff";
  if (hex.startsWith("#")) hex = hex.slice(1);
  if (hex.length === 3)
    hex = hex
      .split("")
      .map((c) => c + c)
      .join("");
  if (hex.length !== 6) return "#000";

  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);

  if (isNaN(r) || isNaN(g) || isNaN(b)) return "#000";

  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 128 ? "#000" : "#fff";
};

/**
 * Darkens a hex color by a percentage (0-1).
 */
export const darkenColor = (hex, amount) => {
  if (!hex || typeof hex !== "string") return hex;
  if (hex.startsWith("#")) hex = hex.slice(1);
  if (hex.length === 3)
    hex = hex
      .split("")
      .map((c) => c + c)
      .join("");
  if (hex.length !== 6) return hex;

  const num = parseInt(hex, 16);
  let r = num >> 16;
  let g = (num >> 8) & 0x00ff;
  let b = num & 0x0000ff;

  r = Math.floor(r * (1 - amount));
  g = Math.floor(g * (1 - amount));
  b = Math.floor(b * (1 - amount));

  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
};

/**
 * Mixes two hex colors by a weight (0-1).
 */
export const mixHex = (c1, c2, weight) => {
  const parse = (c) => {
    c = c.replace("#", "");
    if (c.length === 3)
      c = c
        .split("")
        .map((x) => x + x)
        .join("");
    return [
      parseInt(c.substr(0, 2), 16),
      parseInt(c.substr(2, 2), 16),
      parseInt(c.substr(4, 2), 16),
    ];
  };
  const [r1, g1, b1] = parse(c1);
  const [r2, g2, b2] = parse(c2);

  const w = Math.min(1, Math.max(0, weight));
  const r = Math.round(r1 + (r2 - r1) * w);
  const g = Math.round(g1 + (g2 - g1) * w);
  const b = Math.round(b1 + (b2 - b1) * w);

  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
};

// --- Security & HTML Utilities ---

export const escapeHtml = (str) => {
  if (typeof str !== "string") return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

export const sanitizeHtml = (html) => {
  const value = typeof html === "string" ? html : String(html ?? "");

  if (typeof window === "undefined" || !window.DOMPurify) {
    if (typeof window !== "undefined") {
      console.warn("DOMPurify not found, falling back to escapeHtml");
    }
    return escapeHtml(value);
  }

  try {
    return window.DOMPurify.sanitize(value);
  } catch (err) {
    error("Sanitization failed:", err);
    return "";
  }
};

// --- Validation ---

export const isValidImageUrl = (urlString, allowLog = false) => {
  if (typeof urlString !== "string" || urlString.length < 5) return false;
  try {
    const urlObj = new URL(urlString);
    if (!VALID_PROTOCOLS.includes(urlObj.protocol)) return false;
    if (urlObj.protocol === "data:") return urlString.startsWith("data:image/");
    if (urlObj.protocol === "blob:") return true;
    return IMAGE_EXTENSION_REGEX.test(urlObj.pathname);
  } catch (err) {
    if (allowLog) log("[Validation] URL parse error:", err.message);
    return false;
  }
};

export const extractImageUrl = (result) => {
  let url;
  if (result?.imageUrl && typeof result.imageUrl === "string")
    url = result.imageUrl;
  else if (result?.dataUrl && typeof result.dataUrl === "string")
    url = result.dataUrl;
  else if (result?.url) url = String(result.url);
  else if (result?.imageId && result?.fileExtension)
    url = `https://img.perchance.org/${result.imageId}.${result.fileExtension}`;
  else if (typeof result === "string") url = result;

  if (typeof url === "string") {
    url = url.trim();
    return url === "" ? undefined : url;
  }
  return undefined;
};

// --- Debug & Logging ---

let isDebug = false;

export const initDebugMode = async () => {
  try {
    const { db } = await import("./db.js");
    const settings = await db.settings.get("app-settings");
    if (settings && typeof settings.debugMode !== "undefined") {
      isDebug = !!settings.debugMode;
    }
  } catch (e) {
    console.error("[RPGlitch] Failed to load debug mode:", e);
    isDebug = false;
  }
  return isDebug;
};

export const log = (...args) => {
  if (isDebug) console.log("[RPGlitch]", ...args);
};

export const error = (...args) => {
  console.error("[RPGlitch]", ...args);
};

export const setDebug = async (on) => {
  isDebug = !!on;
  try {
    const { db } = await import("./db.js");
    let settings = await db.settings.get("app-settings");
    if (!settings) settings = { id: "app-settings" };
    settings.debugMode = isDebug;
    await db.settings.put(settings);
  } catch (e) {
    error("Failed to save debug mode to settings:", e);
  }
  return isDebug;
};

// --- Generic Utilities ---

export const generateUUID = () => {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  // Fallback for legacy environments
  let d = new Date().getTime();
  let d2 =
    (typeof performance !== "undefined" &&
      performance.now &&
      performance.now() * 1000) ||
    0;
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    let r = Math.random() * 16;
    if (d > 0) {
      r = ((d + r) % 16) | 0;
      d = Math.floor(d / 16);
    } else {
      r = ((d2 + r) % 16) | 0;
      d2 = Math.floor(d2 / 16);
    }
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
};

export const debounce = (fn, wait = 250) => {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn.apply(null, args), wait);
  };
};

export const handleAsyncError = async (asyncFn, options = {}) => {
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
    if (showAlert)
      import("../ui/orchestrator.js").then((m) =>
        m.showAlert("Error", errorMessage),
      );

    return fallback;
  }
};

// --- Plugins Mocking ---
export const mockPlugins = () => {
  window.pluginAi = async () => "Mock AI Response";
  window.pluginTextToImage = async () => "https://via.placeholder.com/512x768";
  window.pluginRemember = { get: () => null, set: () => {} };
  window.pluginSuperFetch = async () => ({ text: async () => "" });
  window.pluginUpload = {
    upload: async () => "https://via.placeholder.com/150",
  };
};

// --- Dynamic Sampling ---

export const clamp = (n, min = 0, max = 100) =>
  Math.min(max, Math.max(min, Number(n) || 0));

const mapRange = (value, inMin, inMax, outMin, outMax) => {
  return ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
};

export const calculateBlendedParams = (ai, user, fractal) => {
  const defaults = { entropy: 10, velocity: 10, resonance: 10 };
  const getDyn = (entity) => entity?.dynamics || defaults;

  const aiDyn = getDyn(ai);
  const userDyn = getDyn(user);
  const fractalDyn = getDyn(fractal);

  // 1. Temperature (Chaos)
  const rawTemp =
    fractalDyn.entropy * PHYSICS_CONSTANTS.TEMP_ENTROPY_WEIGHT_FRACTAL +
    aiDyn.entropy * PHYSICS_CONSTANTS.TEMP_ENTROPY_WEIGHT_AI;
  const temperature = mapRange(
    rawTemp,
    0,
    100,
    PHYSICS_CONSTANTS.TEMP_BASE,
    1.35,
  );

  // 2. Repetition Penalty (Pacing)
  const rawRep = Math.max(
    aiDyn.velocity,
    userDyn.velocity,
    fractalDyn.velocity,
  );
  const repetition_penalty = mapRange(
    rawRep,
    0,
    100,
    PHYSICS_CONSTANTS.PENALTY_BASE,
    1.18,
  );

  // 3. Top_P (Focus)
  const top_p = mapRange(
    aiDyn.resonance,
    0,
    100,
    PHYSICS_CONSTANTS.TOP_P_BASE,
    0.65,
  );

  return {
    temperature: parseFloat(temperature.toFixed(2)),
    repetition_penalty: parseFloat(repetition_penalty.toFixed(2)),
    top_p: parseFloat(top_p.toFixed(2)),
  };
};
