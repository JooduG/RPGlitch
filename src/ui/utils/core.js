// src/core/session/utils.js
import { Security } from "@core/security.js";

// --- Debug & Logging ---
let is_dev_mode = false;
export const initDebugMode = async () => {
  try {
    const { db } = await import("@data/db.js");
    const settings = await db.settings.get("app-settings");
    if (settings && typeof settings.debug_mode !== "undefined") {
      is_dev_mode = !!settings.debug_mode;
    }
  } catch (e) {
    console.error("[Engine] Failed to load debug mode:", e);
    is_dev_mode = false;
  }
  return is_dev_mode;
};
export const log = (...args) => {
  if (is_dev_mode) console.info("[Engine]", ...args);
};
export const error = (...args) => {
  console.error("[Engine]", ...args);
};
export const setDebug = async (on) => {
  is_dev_mode = !!on;
  try {
    const { db } = await import("@data/db.js");
    let settings = await db.settings.get("app-settings");
    if (!settings) settings = { id: "app-settings" };
    settings.debug_mode = is_dev_mode;
    await db.settings.put(settings);
  } catch (e) {
    error("Failed to save debug mode to settings:", e);
  }
  return is_dev_mode;
};
// --- Generic Utilities ---
export const generateUUID = () => {
  if (!globalThis.crypto?.randomUUID) {
    throw new Error(
      "crypto.randomUUID is not available in this environment. Ensure you are in a secure context (HTTPS).",
    );
  }
  return globalThis.crypto.randomUUID();
};
export const generateSecureSeed = (limit = 1000000) => {
  if (!globalThis.crypto?.getRandomValues) {
    throw new Error(
      "crypto.getRandomValues is not available in this environment. Ensure you are in a secure context (HTTPS).",
    );
  }
  const array = new Uint32Array(1);
  globalThis.crypto.getRandomValues(array);
  return array[0] % limit;
};
export const debounce = (fn, wait = 250) => {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn.apply(null, args), wait);
  };
};
export const parseMarkdown = (text) => {
  if (typeof text !== "string") return "";
  let html = Security.sanitize(text); // Use Security for sanitization
  html = html.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\*(.*?)\*/g, "<em>$1</em>");
  html = html.replace(/\n/g, "<br>");
  return html;
};
// --- Plugins Mocking ---
export const mockPlugins = () => {
  if (!window["pluginAi"]) window["pluginAi"] = async () => "Mock AI Response";
  if (!window["pluginTextToImage"])
    window["pluginTextToImage"] = async () => "https://via.placeholder.com/512x768";
  if (!window["pluginRemember"]) window["pluginRemember"] = { get: () => null, set: () => {} };
  if (!window["pluginSuperFetch"])
    window["pluginSuperFetch"] = async () => ({ text: async () => "" });
  if (!window["pluginUpload"])
    window["pluginUpload"] = async (data) => "https://via.placeholder.com/150";
};
export const clamp = (n, min = 0, max = 100) => Math.min(max, Math.max(min, Number(n) || 0));
