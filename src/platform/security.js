/**
 * src/platform/security.js
 * 🛡️ SECURITY & ZERO-TRUST DATA SANITIZATION
 *
 * Core Responsibilities:
 * - Sanitizes untrusted user/LLM HTML strings to safe strings or DocumentFragments via DOMPurify.
 * - Escapes special HTML characters to prevent cross-site scripting (XSS) injection.
 * - Validates binary image files against size limits, declared MIME types, and magic byte signatures (JPEG, PNG, GIF, WebP, AVIF).
 *
 * Dependencies & Cross-Module Invariants:
 * - `dompurify`: Authoritative browser-compatible HTML sanitization engine.
 * - Used across UI actions (`src/ui/actions.js`), bootstrap error templates (`src/main.js`), and image uploads.
 * - Invariant: Zero-Trust — reject unverified binary headers even if file MIME type is in the allowed list.
 */

import DOMPurify from "dompurify";

// ============================================================================
// [SECTION 1: CONSTANTS & VALIDATION CONFIGURATION]
// ============================================================================

/** Default maximum permissible image upload size in bytes (25 MB). */
export const DEFAULT_MAX_IMAGE_SIZE_BYTES = 25 * 1024 * 1024;

/** Default allowed image MIME types. */
export const DEFAULT_ALLOWED_IMAGE_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"];

/**
 * Binary magic number / header signature validators for supported image formats.
 * @type {Record<string, (header: Uint8Array) => boolean>}
 */
const IMAGE_SIGNATURE_VALIDATORS = {
  "image/jpeg": (header) => header[0] === 0xff && header[1] === 0xd8 && header[2] === 0xff,
  "image/png": (header) => header[0] === 0x89 && header[1] === 0x50 && header[2] === 0x4e && header[3] === 0x47,
  "image/gif": (header) => header[0] === 0x47 && header[1] === 0x49 && header[2] === 0x46 && header[3] === 0x38,
  "image/webp": (header) =>
    header[0] === 0x52 &&
    header[1] === 0x49 &&
    header[2] === 0x46 &&
    header[3] === 0x46 &&
    header[8] === 0x57 &&
    header[9] === 0x45 &&
    header[10] === 0x42 &&
    header[11] === 0x50,
  "image/avif": (header) =>
    header[4] === 0x66 &&
    header[5] === 0x74 &&
    header[6] === 0x79 &&
    header[7] === 0x70 &&
    ((header[8] === 0x61 && header[9] === 0x76 && header[10] === 0x69 && header[11] === 0x66) ||
      (header[8] === 0x61 && header[9] === 0x76 && header[10] === 0x69 && header[11] === 0x73)),
};

// ============================================================================
// [SECTION 2: HTML SANITIZATION & ESCAPING]
// ============================================================================

/**
 * Sanitizes dirty HTML string and returns safe sanitized HTML string.
 * @param {any} dirty
 * @returns {string}
 */
export function sanitize(dirty) {
  if (typeof window === "undefined") return dirty;
  return DOMPurify.sanitize(dirty, {
    RETURN_DOM_FRAGMENT: false,
    SANITIZE_DOM: true,
    SANITIZE_NAMED_PROPS: true,
  });
}

/**
 * Sanitizes dirty HTML string and returns a safe sanitized DocumentFragment.
 * @param {any} dirty
 * @returns {DocumentFragment | any}
 */
export function sanitize_to_fragment(dirty) {
  if (typeof window === "undefined") return dirty;
  return DOMPurify.sanitize(dirty, {
    RETURN_DOM_FRAGMENT: true,
    SANITIZE_DOM: true,
    SANITIZE_NAMED_PROPS: true,
  });
}

/**
 * Escapes special HTML characters (&, <, >, ", ') into safe entity equivalents.
 * @param {any} str
 * @returns {string}
 */
export function escape_html(str) {
  if (str === null || str === undefined) return "";
  return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

// ============================================================================
// [SECTION 3: BINARY FILE & IMAGE SECURITY VALIDATION]
// ============================================================================

/**
 * Validates an image file for size, type, and binary magic number signatures.
 * @param {File} file - The file to validate.
 * @param {{ max_size?: number; allowed_types?: string[] }} [options] - Validation options.
 * @returns {Promise<boolean>} - Resolves true if valid, throws an Error otherwise.
 */
export async function validate_image(file, options = {}) {
  if (!file) throw new Error("No file provided");

  const max_size = options.max_size ?? DEFAULT_MAX_IMAGE_SIZE_BYTES;
  const allowed_types = options.allowed_types ?? DEFAULT_ALLOWED_IMAGE_MIME_TYPES;

  // 1. File size verification
  if (file.size > max_size) {
    const file_mb = (file.size / 1024 / 1024).toFixed(2);
    const limit_mb = (max_size / 1024 / 1024).toFixed(2);
    throw new Error(`File too large: ${file_mb}MB. Max limit: ${limit_mb}MB`);
  }

  // 2. MIME type verification
  if (!allowed_types.includes(file.type)) {
    throw new Error(`Invalid file type: ${file.type}. Allowed types: ${allowed_types.join(", ")}`);
  }

  // 3. Magic number verification (first 12 bytes cover JPEG, PNG, GIF, WebP, AVIF)
  const buffer = await file.slice(0, 12).arrayBuffer();
  const header = new Uint8Array(buffer);
  const validator = IMAGE_SIGNATURE_VALIDATORS[file.type];

  if (!validator) {
    throw new Error(`Security verification failed: No signature check available for type ${file.type}`);
  }

  if (!validator(header)) {
    throw new Error("Security verification failed: File content does not match its declared type.");
  }

  return true;
}

// ============================================================================
// [SECTION 4: SINGLETON FACADE & EXPORTS]
// ============================================================================

export const security = {
  sanitize,
  sanitize_to_fragment,
  escape: escape_html,
  escape_html,
  validate_image,
};

export { escape_html as escape };

// ============================================================================
// [CHANGELOG]
// ============================================================================
/**
 * CHANGELOG:
 * - 2026-08-29: Applied /harmonize protocol: added Universal File Architecture header block,
 *   structured section dividers, extracted `IMAGE_SIGNATURE_VALIDATORS` and constants, converted
 *   to standard function declarations, purged redundant default object export, and verified unit test suite.
 * - 2026-08-18: Added AVIF file signature validation and zero-trust unknown MIME type rejection.
 * - 2026-08-10: Initialized DOMPurify wrapper and binary image magic number verification.
 */
