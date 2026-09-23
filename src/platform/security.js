/**
 * src/platform/security.js
 * 🛡️ SECURITY, ZERO-TRUST DATA SANITIZATION & BROWSER HARDENING
 *
 * Core Responsibilities:
 * 1. HTML Sanitization & Escaping:
 *    - Sanitizes untrusted user/LLM HTML strings to safe strings or DocumentFragments via DOMPurify.
 *    - Escapes special HTML characters to prevent cross-site scripting (XSS) injection.
 * 2. Binary File & Image Security Validation:
 *    - Validates binary image files against size limits, declared MIME types, and magic byte signatures (JPEG, PNG, GIF, WebP, AVIF).
 * 3. Browser Environment Hardening & Sandbox Silencing:
 *    - Patches ResizeObserver to execute callbacks inside `requestAnimationFrame` ticks, breaking layout loops.
 *    - Suppresses known benign browser warnings and Perchance sandbox frame errors ("Symbol", "numActualScriptLines").
 * 4. Multi-Tier Session Checkpointing:
 *    - Persists and recovers lightweight session state across page reloads during schema upgrades and iframe quiescence.
 *    - Resilient 3-tier fallback: `sessionStorage` (Tier 1) ➔ `window.name` (Tier 2) ➔ `in-memory` (Tier 3).
 *
 * Dependencies & Cross-Module Invariants:
 * - `dompurify`: Authoritative browser-compatible HTML sanitization engine.
 * - Used across UI actions (`src/ui/actions.js`), bootstrap (`src/main.js`), and image uploads.
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

/** Text pattern identifying benign ResizeObserver layout deferral warnings. */
const RESIZE_OBSERVER_LOOP_PATTERN = "ResizeObserver loop";

/** Text patterns identifying benign Perchance iframe sandbox internal artifacts. */
const PERCHANCE_FRAME_ERROR_PATTERNS = ["Symbol", "numActualScriptLines"];

/** Storage key for session checkpoint entries in sessionStorage. */
export const CHECKPOINT_KEY = "rpglitch.session_checkpoint";

/**
 * @typedef {Object} SessionCheckpoint
 * @property {string | null} story_id - The active story identifier.
 * @property {number} round - The current macro round count.
 * @property {string} phase - The active execution phase.
 */

/** @type {SessionCheckpoint | null} */
let _in_memory_checkpoint = null;

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
// [SECTION 4: ENVIRONMENT HARDENING & SANDBOX ERROR SUPPRESSION]
// ============================================================================

/**
 * Suppresses benign "ResizeObserver loop completed with undelivered notifications" errors.
 */
function install_resize_observer_guard() {
  if (typeof window !== "undefined" && typeof ResizeObserver !== "undefined") {
    const original_resize_observer = ResizeObserver;

    class SafeResizeObserver extends original_resize_observer {
      /**
       * @param {ResizeObserverCallback} callback
       */
      constructor(callback) {
        const wrapped = (entries, observer) => {
          requestAnimationFrame(() => {
            try {
              callback(entries, observer);
            } catch (err) {
              console.error("[SafeResizeObserver] callback error:", err);
            }
          });
        };
        super(/** @type {ResizeObserverCallback} */ (wrapped));
      }
    }

    Object.setPrototypeOf(SafeResizeObserver, original_resize_observer);
    Object.defineProperty(window, "ResizeObserver", {
      value: SafeResizeObserver,
      writable: true,
      configurable: true,
    });
  }

  if (typeof window !== "undefined") {
    const original_onerror = window.onerror;
    window.onerror = function (msg, source, lineno, colno, error) {
      if (msg && String(msg).includes(RESIZE_OBSERVER_LOOP_PATTERN)) {
        return true; // Suppress benign loop notification
      }
      return original_onerror ? original_onerror.call(this, msg, source, lineno, colno, error) : false;
    };

    const original_add_event_listener = window.addEventListener;
    window.addEventListener = function (type, listener, options) {
      if (type === "error") {
        const wrapped = (event) => {
          const message = event?.message;
          if (message && String(message).includes(RESIZE_OBSERVER_LOOP_PATTERN)) {
            return;
          }
          return listener.call(this, event);
        };
        return original_add_event_listener.call(this, type, wrapped, options);
      }
      return original_add_event_listener.call(this, type, listener, options);
    };
  }
}

/**
 * Checks whether an error or rejection payload matches known Perchance sandbox internal errors.
 * @param {any} target
 * @returns {boolean}
 */
function is_perchance_frame_error(target) {
  if (!target) return false;
  try {
    const message = target.message ? String(target.message) : String(target);
    return PERCHANCE_FRAME_ERROR_PATTERNS.some((pattern) => message.includes(pattern));
  } catch {
    return false;
  }
}

/**
 * Silences the Perchance engine's own frame errors ("Symbol", "numActualScriptLines")
 * that surface from sandbox iframe parent boundaries.
 */
function silence_perchance_frame_errors() {
  if (typeof window === "undefined") return;

  window.addEventListener(
    "error",
    (event) => {
      if (is_perchance_frame_error(event)) {
        event.preventDefault?.();
        event.stopPropagation?.();
      }
    },
    true,
  );

  window.addEventListener(
    "unhandledrejection",
    (event) => {
      if (is_perchance_frame_error(event?.reason)) {
        event.preventDefault?.();
        event.stopPropagation?.();
      }
    },
    true,
  );
}

/**
 * Installs all environment hardening and sandbox error guards.
 * Synchronously invoked at bootstrap in `src/main.js` before DOM mounting.
 */
export function install_environment_hardening() {
  install_resize_observer_guard();
  silence_perchance_frame_errors();
}

// ============================================================================
// [SECTION 5: RELOAD-SAFE SESSION CHECKPOINT TIERS]
// ============================================================================

/**
 * Probes for available and usable `sessionStorage`.
 * Returns null when running in restricted or sandboxed iframe environments.
 * @returns {Storage | null}
 */
function get_session_storage() {
  try {
    if (typeof window !== "undefined" && typeof window.sessionStorage !== "undefined") {
      window.sessionStorage.getItem("__rpglitch_probe__");
      return window.sessionStorage;
    }
  } catch {
    /* Sandboxed iframe SecurityError — fall through to next tier */
  }
  return null;
}

/**
 * Persists a session checkpoint across an imminent page reload or database migration.
 * @param {SessionCheckpoint | Partial<SessionCheckpoint>} checkpoint
 */
export function save_session_checkpoint(checkpoint) {
  const payload = {
    story_id: checkpoint?.story_id ?? null,
    round: typeof checkpoint?.round === "number" ? checkpoint.round : 0,
    phase: checkpoint?.phase ?? "idle",
  };

  _in_memory_checkpoint = payload;

  const storage = get_session_storage();
  if (storage) {
    try {
      storage.setItem(CHECKPOINT_KEY, JSON.stringify(payload));
      return;
    } catch {
      /* Storage quota exceeded or blocked — continue to Tier 2 */
    }
  }

  try {
    if (typeof window !== "undefined") {
      window.name = JSON.stringify(payload);
    }
  } catch {
    /* Cross-origin window access restriction */
  }
}

/**
 * Reads the persisted session checkpoint from available storage tiers, returning null if absent or corrupt.
 * @returns {SessionCheckpoint | null}
 */
export function load_session_checkpoint() {
  if (_in_memory_checkpoint) {
    return _in_memory_checkpoint;
  }

  const storage = get_session_storage();
  if (storage) {
    try {
      const raw = storage.getItem(CHECKPOINT_KEY);
      if (raw) {
        try {
          return JSON.parse(raw);
        } catch {
          /* Corrupted storage payload — fall through to Tier 2 */
        }
      }
    } catch {
      /* Storage access error */
    }
  }

  try {
    if (typeof window !== "undefined" && window.name && window.name.startsWith("{")) {
      return JSON.parse(window.name);
    }
  } catch {
    /* Corrupted or blocked window.name */
  }

  return null;
}

/**
 * Clears the session checkpoint across all storage tiers after a successful session restoration.
 */
export function clear_session_checkpoint() {
  _in_memory_checkpoint = null;

  const storage = get_session_storage();
  if (storage) {
    try {
      storage.removeItem(CHECKPOINT_KEY);
    } catch {
      /* Storage removal error */
    }
  }

  try {
    if (typeof window !== "undefined" && window.name && window.name.startsWith("{")) {
      window.name = "";
    }
  } catch {
    /* Window.name access error */
  }
}

// ============================================================================
// [SECTION 6: SINGLETON FACADE & EXPORTS]
// ============================================================================

export const security = {
  sanitize,
  sanitize_to_fragment,
  escape_html,
  validate_image,
  install_environment_hardening,
  save_session_checkpoint,
  load_session_checkpoint,
  clear_session_checkpoint,
};

// ============================================================================
// [CHANGELOG]
// ============================================================================
/**
 * CHANGELOG:
 * - 2026-09-24: Platform layer consolidation — merged `environment.js` (ResizeObserver guard, Perchance sandbox frame error silencing) and `session-storage.js` (multi-tier reload checkpointing) directly into `security.js` under P4 Zero Backwards Compatibility.
 * - 2026-08-29: Applied /harmonize protocol: added Universal File Architecture header block,
 *   structured section dividers, extracted `IMAGE_SIGNATURE_VALIDATORS` and constants, converted
 *   to standard function declarations, purged redundant default object export, and verified unit test suite.
 * - 2026-08-18: Added AVIF file signature validation and zero-trust unknown MIME type rejection.
 * - 2026-08-10: Initialized DOMPurify wrapper and binary image magic number verification.
 */
