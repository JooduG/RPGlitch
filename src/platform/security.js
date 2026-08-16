import DOMPurify from "dompurify";

/**
 * src/platform/security.js
 * 🛡️ SECURITY: The Shield
 * Zero-Trust enforcement and data sanitization.
 */
/**
 * @param {any} dirty
 */
export const sanitize = (dirty) => {
  if (typeof window === "undefined") return dirty;
  return DOMPurify.sanitize(dirty, { RETURN_DOM_FRAGMENT: false, SANITIZE_DOM: true, SANITIZE_NAMED_PROPS: true }); // String output
};
/**
 * @param {any} dirty
 */
export const sanitize_to_fragment = (dirty) => {
  if (typeof window === "undefined") return dirty;
  return DOMPurify.sanitize(dirty, { RETURN_DOM_FRAGMENT: true, SANITIZE_DOM: true, SANITIZE_NAMED_PROPS: true }); // DocumentFragment output
};
/**
 * @param {any} str
 */
export const escape_html = (str) => {
  if (str === null || str === undefined) return "";
  return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
};
/**
 * Validates an image file for size, type, and magic numbers.
 * @param {File} file - The file to validate.
 * @param {any} [options] - Validation options (max_size, allowed_types).
 * @returns {Promise<boolean>} - Resolves if valid, throws error otherwise.
 */
export const validate_image = async (file, options = {}) => {
  const max_size = /** @type {any} */ (options).max_size ?? 25 * 1024 * 1024; // Default 25MB
  const allowed_types = /** @type {any} */ (options).allowed_types ?? ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"];

  if (!file) throw new Error("No file provided");

  // 1. Size Check
  if (file.size > max_size) {
    throw new Error(`File too large: ${(file.size / 1024 / 1024).toFixed(2)}MB. Max limit: ${max_size / 1024 / 1024}MB`);
  }

  // 2. MIME Type Check
  if (!allowed_types.includes(file.type)) {
    throw new Error(`Invalid file type: ${file.type}. Allowed types: ${allowed_types.join(", ")}`);
  }

  // 3. Magic Number Verification (File Signature)
  // We read the first 12 bytes to cover JPEG, PNG, GIF, and WebP
  const buffer = await file.slice(0, 12).arrayBuffer();
  const header = new Uint8Array(buffer);
  const signatures = {
    "image/jpeg": (/** @type {Uint8Array} */ h) => h[0] === 0xff && h[1] === 0xd8 && h[2] === 0xff,
    "image/png": (/** @type {Uint8Array} */ h) => h[0] === 0x89 && h[1] === 0x50 && h[2] === 0x4e && h[3] === 0x47,
    "image/gif": (/** @type {Uint8Array} */ h) => h[0] === 0x47 && h[1] === 0x49 && h[2] === 0x46 && h[3] === 0x38,
    "image/webp": (/** @type {Uint8Array} */ h) =>
      h[0] === 0x52 && h[1] === 0x49 && h[2] === 0x46 && h[3] === 0x46 && h[8] === 0x57 && h[9] === 0x45 && h[10] === 0x42 && h[11] === 0x50,
    "image/avif": (/** @type {Uint8Array} */ h) =>
      h[4] === 0x66 &&
      h[5] === 0x74 &&
      h[6] === 0x79 &&
      h[7] === 0x70 &&
      ((h[8] === 0x61 && h[9] === 0x76 && h[10] === 0x69 && h[11] === 0x66) || (h[8] === 0x61 && h[9] === 0x76 && h[10] === 0x69 && h[11] === 0x73)),
  };

  const verify = /** @type {any} */ (signatures)[file.type];
  if (verify) {
    if (!verify(header)) {
      throw new Error("Security verification failed: File content does not match its declared type.");
    }
  } else {
    // Fail if the type is allowed but we don't have a signature check for it to maintain Zero-Trust
    throw new Error(`Security verification failed: No signature check available for type ${file.type}`);
  }

  return true;
};

export const security = {
  sanitize,
  sanitize_to_fragment,
  escape: escape_html,
  escape_html,
  validate_image,
};
export { escape_html as escape };
export default {
  security,
};
