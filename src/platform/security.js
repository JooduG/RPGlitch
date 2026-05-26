import DOMPurify from "dompurify";
/**
 * src/core/security.js
 * 🛡️ SECURITY: The Shield
 * Zero-Trust enforcement and data sanitization.
 */
/**
 * @param {any} dirty
 */
export const sanitize = (dirty) => {
  if (typeof window === "undefined") return dirty;
  return DOMPurify.sanitize(dirty, { RETURN_DOM_FRAGMENT: false, SANITIZE_DOM: true }); // String output
};
/**
 * @param {any} dirty
 */
export const sanitizeToFragment = (dirty) => {
  if (typeof window === "undefined") return dirty;
  return DOMPurify.sanitize(dirty, { RETURN_DOM_FRAGMENT: true, SANITIZE_DOM: true }); // DocumentFragment output
};
/**
 * @param {any} str
 */
export const escape = (str) => {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
};
/**
 * Evaluates if a given text should be refused based on safety or policy rules.
 * Currently a pass-through placeholder that always returns false.
 * @returns {boolean}
 */
export const checkRefusal = () => false;
/**
 * @param {any} text
 */
export const clean = (text) => (text ? text.trim() : "");
export const IMMUTABLE_CONSTRAINTS = [
  "Gravity is constant.",
  "Characters cannot change their own inventory without permission.",
  "Damage thresholds are binary.",
];

/**
 * Validates an image file for size, type, and magic numbers.
 * @param {File} file - The file to validate.
 * @param {any} [options] - Validation options (maxSize, allowedTypes).
 * @returns {Promise<boolean>} - Resolves if valid, throws error otherwise.
 */
export const validateImage = async (file, options = {}) => {
  const maxSize = /** @type {any} */ (options).maxSize ?? 5 * 1024 * 1024; // Default 5MB
  const allowedTypes = /** @type {any} */ (options).allowedTypes ?? [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
  ];

  if (!file) throw new Error("No file provided");

  // 1. Size Check
  if (file.size > maxSize) {
    throw new Error(
      `File too large: ${(file.size / 1024 / 1024).toFixed(2)}MB. Max limit: ${maxSize / 1024 / 1024}MB`,
    );
  }

  // 2. MIME Type Check
  if (!allowedTypes.includes(file.type)) {
    throw new Error(`Invalid file type: ${file.type}. Allowed types: ${allowedTypes.join(", ")}`);
  }

  // 3. Magic Number Verification (File Signature)
  // We read the first 12 bytes to cover JPEG, PNG, GIF, and WebP
  const buffer = await file.slice(0, 12).arrayBuffer();
  const header = new Uint8Array(buffer);
  const signatures = {
    "image/jpeg": (/** @type {Uint8Array} */ h) => h[0] === 0xff && h[1] === 0xd8 && h[2] === 0xff,
    "image/png": (/** @type {Uint8Array} */ h) =>
      h[0] === 0x89 && h[1] === 0x50 && h[2] === 0x4e && h[3] === 0x47,
    "image/gif": (/** @type {Uint8Array} */ h) =>
      h[0] === 0x47 && h[1] === 0x49 && h[2] === 0x46 && h[3] === 0x38,
    "image/webp": (/** @type {Uint8Array} */ h) =>
      h[0] === 0x52 &&
      h[1] === 0x49 &&
      h[2] === 0x46 &&
      h[3] === 0x46 &&
      h[8] === 0x57 &&
      h[9] === 0x45 &&
      h[10] === 0x42 &&
      h[11] === 0x50,
  };

  const verify = /** @type {any} */ (signatures)[file.type];
  if (verify) {
    if (!verify(header)) {
      throw new Error(
        "Security verification failed: File content does not match its declared type.",
      );
    }
  } else {
    // Fail if the type is allowed but we don't have a signature check for it to maintain Zero-Trust
    throw new Error(
      `Security verification failed: No signature check available for type ${file.type}`,
    );
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
  IMMUTABLE_CONSTRAINTS,
  /**
   * @param {any} _prompt
   * @param {any} [_options]
   */
  authorizeVisuals: (_prompt, _options = {}) => true,
  /**
   * 🛡️ PROCESS (Causality & Physics Scan)
   * Evaluates if an action is possible within the current simulation context.
   * Currently a pass-through placeholder for future logic.
   * @param {string} _input
   * @param {any} _character
   * @param {any} _fractal
   * @returns {Promise<{causality: {result: string;constraint?: string;};}>}
   */
  process: async (_input, _character, _fractal) => {
    return {
      causality: { result: "success" },
    };
  },
};
// Backward Compatibility Alias
export const Shield = Security;
export const Snitch = Security;
export default {
  Security,
};
