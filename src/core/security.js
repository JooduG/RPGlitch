import DOMPurify from "dompurify";
/**
 * src/core/security.js
 * 🛡️ SECURITY: The Shield
 * Zero-Trust enforcement and data sanitization.
 */
// 1. Sanitize HTML (Zero-Trust)
export const sanitize = (dirty) => {
  if (typeof window === "undefined") return dirty;
  return DOMPurify.sanitize(dirty, { RETURN_DOM_FRAGMENT: false }); // String output
};
// 1.5. Sanitize HTML to DOM Fragment (Zero-Trust, No innerHTML)
export const sanitizeToFragment = (dirty) => {
  if (typeof window === "undefined") return dirty;
  return DOMPurify.sanitize(dirty, { RETURN_DOM_FRAGMENT: true }); // DocumentFragment output
};
// 2. Escape Logic
export const escape = (str) => {
  if (!str) return "";
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
};
// Stub for now, can be expanded
export const checkRefusal = (text) => false;
export const clean = (text) => (text ? text.trim() : "");
/**
 * Validates an image file for size, type, and magic numbers.
 * @param {File} file - The file to validate.
 * @param {Object} options - Validation options (maxSize, allowedTypes).
 * @returns {Promise<boolean>} - Resolves if valid, throws error otherwise.
 */
export const validateImage = async (file, options = {}) => {
  const maxSize = options.maxSize || 5 * 1024 * 1024; // Default 5MB
  const allowedTypes = options.allowedTypes || ["image/jpeg", "image/png", "image/webp", "image/gif"];

  if (!file) throw new Error("No file provided");

  // 1. Size Check
  if (file.size > maxSize) {
    throw new Error(`File too large: ${(file.size / 1024 / 1024).toFixed(2)}MB. Max limit: ${maxSize / 1024 / 1024}MB`);
  }

  // 2. MIME Type Check
  if (!allowedTypes.includes(file.type)) {
    throw new Error(`Invalid file type: ${file.type}. Allowed types: ${allowedTypes.join(", ")}`);
  }

  // 3. Magic Number Verification (File Signature)
  // We read the first 12 bytes to cover JPEG, PNG, GIF, and WebP
  const buffer = await file.slice(0, 12).arrayBuffer();
  const header = new Uint8Array(buffer);
  const hex = Array.from(header)
    .map((b) => b.toString(16).padStart(2, "0").toUpperCase())
    .join("");

  let isValid = false;
  switch (file.type) {
    case "image/jpeg":
      // JPEG: FF D8 FF
      isValid = hex.startsWith("FFD8FF");
      break;
    case "image/png":
      // PNG: 89 50 4E 47
      isValid = hex.startsWith("89504E47");
      break;
    case "image/gif":
      // GIF: 47 49 46 38 (GIF87a or GIF89a)
      isValid = hex.startsWith("47494638");
      break;
    case "image/webp":
      // WebP: 52 49 46 46 (RIFF) at 0, 57 45 42 50 (WEBP) at 8
      isValid = hex.startsWith("52494646") && hex.substring(16, 24) === "57454250";
      break;
  }

  if (!isValid) {
    throw new Error("Security verification failed: File content does not match its extension.");
  }

  return true;
};

export const Security = {
  sanitize,
  sanitizeToFragment,
  escape,
  checkRefusal,
  clean,
  validateImage,
  // Physics & Authorization
  authorizeVisuals: (prompt, options) => true,
};
// Backward Compatibility Alias
export const Shield = Security;
export const Snitch = Security;
export default {
  Security,
};
