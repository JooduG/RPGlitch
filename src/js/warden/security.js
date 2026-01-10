/**
 * src/js/warden/security.js
 * WARDEN SECURITY PROTOCOLS
 * HTML Sanitization, Input Validation, and Safety Checks.
 */

import { CONFIG } from "../gamemaster/config.js";

const { MESSAGES } = CONFIG;
const { REFUSAL_TRIGGERS } = MESSAGES;

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

// ============================================================================
// 1. DATA SANITIZATION (HTML/CONTENT)
// ============================================================================

export const escapeHtml = (str) => {
  if (typeof str !== "string") return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

/**
 * Sanitizes HTML using DOMPurify if available, falling back to escapeHtml.
 * CRITICAL for preventing XSS in user/AI content.
 */
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
    console.error("[Warden] Sanitization failed:", err);
    return "";
  }
};

/**
 * Cleans raw LLM output by removing stop sequences and system leaks.
 * Ensures the output is pure narrative or JSON.
 */
export const cleanLlmOutput = (rawText) => {
  if (!rawText) return "";
  return String(rawText)
    .replace(/STOP SEQUENCE.*$/i, "")
    .replace(/STOP PROTOCOL.*$/i, "")
    .replace(/\(Glitch must react\).*$/i, "")
    .replace(
      /(?:^|\n)(?:The )?(?:Hook|Result|Scene|Analysis|Meta|Response):\s*/gi,
      "$1",
    )
    .trim();
};

// ============================================================================
// 2. INPUT VALIDATION (URLS/FILES)
// ============================================================================

export const isValidImageUrl = (urlString) => {
  if (typeof urlString !== "string" || urlString.length < 5) return false;
  try {
    const urlObj = new URL(urlString);
    if (!VALID_PROTOCOLS.includes(urlObj.protocol)) return false;
    if (urlObj.protocol === "data:") return urlString.startsWith("data:image/");
    if (urlObj.protocol === "blob:") return true;
    return IMAGE_EXTENSION_REGEX.test(urlObj.pathname);
  } catch (err) {
    return false;
  }
};

/**
 * Extracts a usable image URL from various LLM result formats.
 */
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

// ============================================================================
// 3. POLICY ENFORCEMENT (REFUSALS)
// ============================================================================

/**
 * Checks if the response contains a refusal or policy violation.
 * @returns {boolean} True if the text is rejected.
 */
export const checkRefusal = (text) => {
  if (!text || text.length < 15) return true; // Too short is suspicious
  const clean = text.toLowerCase();
  // Refusal usually happens in short responses. Long responses might mention "sorry" in dialogue.
  return REFUSAL_TRIGGERS.some((m) => clean.includes(m)) && text.length < 300;
};
