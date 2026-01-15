// apps/rpglitch/js/core-utils.js

// --- Constants ---
// [WARDEN] Protocol validations moved to warden/security.js

import { PALETTE } from "./config.js";

// --- Color Utilities moved to Mesmer/ThemeService ---
import {
  getSignature,
  getDeterministicColor,
  getContrastColor,
  darkenColor,
  mixHex,
} from "../mesmer/ui/core/theme.js";

// Re-export for compatibility
export {
  getSignature,
  getDeterministicColor,
  getContrastColor,
  darkenColor,
  mixHex,
};

export const getSignatureColor = (key) => PALETTE[key] || PALETTE.default;
export const getSignatureKey = getSignatureColor;

export const getRandomSignatureKey = () => {
  const keys = Object.keys(PALETTE).filter((k) => k !== "default");
  return keys[Math.floor(Math.random() * keys.length)];
};

import {
  escapeHtml,
  sanitizeHtml,
  isValidImageUrl,
  extractImageUrl,
} from "../warden/security.js";
export { escapeHtml, sanitizeHtml, isValidImageUrl, extractImageUrl };

export const parseMarkdown = (text) => {
  if (typeof text !== "string") return "";

  // 1. Escape HTML (Security First)
  let html = escapeHtml(text);

  // 2. Bold (**text**)
  html = html.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");

  // 3. Italics (*text*)
  html = html.replace(/\*(.*?)\*/g, "<em>$1</em>");

  // 4. Line Breaks
  html = html.replace(/\n/g, "<br>");

  return html;
};

// isValidImageUrl and extractImageUrl imported from Warden

// --- Debug & Logging ---

let isDebug = false;

export const initDebugMode = async () => {
  try {
    const { db } = await import("../../scholar/database/db.js");
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
  if (isDebug) console["log"]("[RPGlitch]", ...args);
};

export const error = (...args) => {
  console.error("[RPGlitch]", ...args);
};

export const setDebug = async (on) => {
  isDebug = !!on;
  try {
    const { db } = await import("../../scholar/database/db.js");
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
      import("../mesmer/ui/core/orchestrator.js").then((m) =>
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

// --- Dynamic Sampling moved to Warden/Physics ---
// --- Dynamic Sampling moved to Warden/Physics ---
import { calculateBlendedParams } from "../warden/physics.js";
export { calculateBlendedParams };
export const clamp = (n, min = 0, max = 100) =>
  Math.min(max, Math.max(min, Number(n) || 0));
