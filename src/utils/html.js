/**
 * src/utils/html.js
 * 🌐 HTML TEXT INGESTION & ENTITY NORMALIZATION ENGINE
 *
 * Core Responsibilities:
 * - Extracts clean, readable plain text from fetched web pages and external lore HTML.
 * - Strips scripts, styles, forms, navigation chrome, and non-content noise subtrees.
 * - Preserves block boundaries as clean newline spacing for paragraphs, headings, and lists.
 * - Decodes decimal, hexadecimal, and named typographic HTML entities into UTF-8 characters.
 * - Clips output at natural word boundaries using configurable character budgets.
 * - Provides dual extraction strategies: DOMParser in browser environments with a robust regex fallback.
 *
 * Used by:
 * - Web Fetch ingestion pipeline (`src/platform/web-fetch.js`).
 * - External entity and world-lore card importers.
 */

import { truncate_at_word } from "./text.js";
import { LENGTH_THRESHOLDS, IMAGE_POLICY } from "@config";
import DOMPurify from "dompurify";

// ============================================================================
// [SECTION 0: HTML SANITIZATION & ESCAPING]
// ============================================================================

/** Text pattern identifying benign ResizeObserver layout deferral warnings. */
const RESIZE_OBSERVER_LOOP_PATTERN = "ResizeObserver loop";

/** Text patterns identifying benign Perchance iframe sandbox internal artifacts. */
const PERCHANCE_FRAME_ERROR_PATTERNS = ["Symbol", "numActualScriptLines"];

/**
 * Checks whether an error or rejection payload matches known Perchance sandbox internal errors.
 * @param {any} target
 * @returns {boolean}
 */
export function is_perchance_frame_error(target) {
  if (!target) return false;
  try {
    const message = target.message ? String(target.message) : String(target);
    return PERCHANCE_FRAME_ERROR_PATTERNS.some((pattern) => message.includes(pattern));
  } catch {
    return false;
  }
}

/**
 * Installs all environment hardening and sandbox error guards.
 * Uses a single unified capturing error listener and unhandledrejection handler
 * to silence benign ResizeObserver loop notices and Perchance iframe boundary faults
 * without double-dispatch or global constructor monkey-patching.
 * Synchronously invoked at bootstrap in `src/main.js` before DOM mounting.
 */
export function install_environment_hardening() {
  if (typeof window === "undefined") return;

  const original_onerror = window.onerror;
  window.onerror = function (msg, source, lineno, colno, error) {
    if (msg && String(msg).includes(RESIZE_OBSERVER_LOOP_PATTERN)) {
      return true; // Suppress benign loop notification
    }
    return original_onerror ? original_onerror.call(this, msg, source, lineno, colno, error) : false;
  };

  // Single unified capture-phase error listener for ResizeObserver and Perchance sandbox artifacts
  window.addEventListener(
    "error",
    (event) => {
      const message = event?.message;
      if (message && String(message).includes(RESIZE_OBSERVER_LOOP_PATTERN)) {
        event.preventDefault?.();
        event.stopImmediatePropagation?.();
        return;
      }
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
// [SECTION 0C: SECURITY CONVENIENCE FACADE]
// ============================================================================

export const security = {
  sanitize,
  sanitize_to_fragment,
  escape_html,
  validate_image,
  install_environment_hardening,
};

/**
 * Binary magic number / header signature validators for supported image formats.
 * @type {Record<string, (header: Uint8Array) => boolean>}
 */
export const IMAGE_SIGNATURE_VALIDATORS = {
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

/**
 * Validates an image file for size, type, and binary magic number signatures.
 * @param {File} file - The file to validate.
 * @param {{ max_size?: number; allowed_types?: string[] }} [options] - Validation options.
 * @returns {Promise<boolean>} - Resolves true if valid, throws an Error otherwise.
 */
export async function validate_image(file, options = {}) {
  if (!file) throw new Error("No file provided");

  const max_size = options.max_size ?? IMAGE_POLICY.UPLOAD.MAX_IMAGE_SIZE_BYTES;
  const allowed_types = options.allowed_types ?? IMAGE_POLICY.UPLOAD.ALLOWED_IMAGE_MIME_TYPES;

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

/**
 * Reads a Response-like object into a binary Blob.
 * @param {any} response
 * @returns {Promise<Blob>}
 */
async function blob_from_response(response) {
  if (typeof response?.blob === "function") {
    const blob = await response.blob();
    if (blob) return blob;
  }
  if (typeof response?.arrayBuffer === "function") {
    return new Blob([new Uint8Array(await response.arrayBuffer())]);
  }
  if (typeof response?.text === "function") {
    return new Blob([await response.text()]);
  }
  throw new Error("Could not read data from that page.");
}

/**
 * Converts a Blob or File into a base64 data URL.
 * Shared between web image fetching and UI file drop ingestion.
 * @param {Blob} blob
 * @returns {Promise<string>}
 */
export function blob_to_data_url(blob) {
  return new Promise((resolve, reject) => {
    const reader = new globalThis.FileReader();
    reader.onload = (event) => resolve(/** @type {string} */ (event.target?.result));
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(blob);
  });
}

/**
 * Resolves the Perchance super-fetch plugin engine across window and parent-frame scopes.
 * Resolution is deliberately uncached to allow dynamic testing and hot-swapping.
 * @returns {((url: string) => Promise<any>) | null}
 */
export function get_super_fetch_engine() {
  if (typeof window === "undefined") return null;

  try {
    if (typeof window.fetch_web === "function") return window.fetch_web;
  } catch {
    /* Ignore sandbox access */
  }

  try {
    if (typeof window.pluginFetchWeb === "function") return window.pluginFetchWeb;
  } catch {
    /* Ignore sandbox access */
  }

  try {
    if (typeof window.parent !== "undefined") {
      // @ts-ignore
      if (typeof window.parent.fetch_web === "function") return window.parent.fetch_web;
      // @ts-ignore
      if (typeof window.parent.pluginFetchWeb === "function") return window.parent.pluginFetchWeb;
    }
  } catch {
    /* Ignore cross-origin errors in sandboxed iframes */
  }

  return null;
}

/**
 * @typedef {Object} UrlValidationOptions
 * @property {boolean} [allow_http] - Whether insecure http:// URLs are permitted.
 * @property {string[]} [allowed_hosts] - Optional allowlist of hostnames or domain suffixes.
 */

/**
 * Validates a web URL for ingestion.
 * Enforces https schemes (or http when explicitly allowed) and optional host allowlists.
 * Blocks dangerous schemes (javascript:, data:, file:) and returns the canonical URL string.
 * @param {string} raw_url
 * @param {UrlValidationOptions} [options]
 * @returns {string}
 */
export function validate_url(raw_url, options = {}) {
  if (typeof raw_url !== "string" || !raw_url.trim()) {
    throw new Error("A URL is required.");
  }

  const trimmed = raw_url.trim();
  let parsed;

  try {
    parsed = new URL(trimmed);
  } catch (err) {
    throw new Error(`Invalid URL "${trimmed.slice(0, 80)}". Enter a full web address, e.g. https://example.com/wiki/Page`, { cause: err });
  }

  const scheme = parsed.protocol.toLowerCase().replace(":", "");
  const allowed = options.allow_http ? ["https", "http"] : ["https"];

  if (!allowed.includes(scheme)) {
    throw new Error(`Blocked URL scheme "${scheme}:". Only ${allowed.join(" and ")} pages are supported.`);
  }

  if (Array.isArray(options.allowed_hosts) && options.allowed_hosts.length > 0) {
    const host = parsed.hostname.toLowerCase();
    const is_allowed = options.allowed_hosts.some((allowed_entry) => {
      const clean_entry = String(allowed_entry).toLowerCase().replace(/^\./, "");
      return clean_entry && (host === clean_entry || host.endsWith(`.${clean_entry}`));
    });

    if (!is_allowed) {
      throw new Error(`Host "${parsed.hostname}" is not on the allowed list for ingestion.`);
    }
  }

  return parsed.href;
}

/**
 * @typedef {Object} WebFetchOptions
 * @property {boolean} [allow_http] - Whether http:// URLs are allowed.
 * @property {string[]} [allowed_hosts] - Optional domain whitelist.
 * @property {'character' | 'fractal' | 'world'} [type] - Entity category for lore budget selection.
 * @property {number} [max_chars] - Character budget override for plain text extraction.
 * @property {boolean} [as_image] - Whether to fetch as a binary image and return a data URL.
 */

/**
 * Fetches a web resource for ingestion.
 * Uses the super-fetch-plugin (CORS-free, binary-safe) when available; falls back to native fetch in local dev.
 * Extracts clean plain text within character budget or converts binary image responses to data URLs.
 * @param {string} raw_url
 * @param {WebFetchOptions} [options]
 * @returns {Promise<{ url: string, text: string } | { url: string, data_url: string }>}
 */
export async function fetch_web(raw_url, options = {}) {
  const url = validate_url(raw_url, options);
  const budget = options.max_chars || LENGTH_THRESHOLDS.INGESTION;

  const engine = get_super_fetch_engine();

  if (!engine) {
    const is_local_dev =
      typeof window !== "undefined" &&
      !(typeof process !== "undefined" && process.env.VITEST) &&
      (window.location?.hostname === "localhost" || window.location?.hostname === "127.0.0.1" || import.meta.env.DEV);

    if (is_local_dev) {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Page returned HTTP ${res.status}.`);

      if (options.as_image) {
        const blob = await blob_from_response(res);
        if (!blob.type?.startsWith("image/")) throw new Error("That URL is not an image.");
        return { url, data_url: await blob_to_data_url(blob) };
      }

      const html = await res.text();
      const text = html_to_plain_text(html, { max_chars: budget });
      if (!text.trim()) throw new Error("No readable text found on that page.");
      return { url, text };
    }

    throw new Error("fetch_web plugin unavailable. Add fetch_web = {import:super-fetch-plugin} to the Perchance left panel, then reload.");
  }

  let response;
  try {
    response = await engine(url);
  } catch (err) {
    throw new Error(`Network request to "${url}" failed.`, { cause: err });
  }

  const status = typeof response?.status === "number" ? response.status : response?.ok ? 200 : null;
  if (status != null && (status < 200 || status >= 300)) {
    throw new Error(`Page returned HTTP ${status}.`);
  }

  if (options.as_image) {
    const blob = await blob_from_response(response);
    if (!blob.type?.startsWith("image/")) throw new Error("That URL is not an image.");
    return { url, data_url: await blob_to_data_url(blob) };
  }

  const html = typeof response?.text === "function" ? await response.text() : String(response?.responseText ?? response?.body ?? response ?? "");

  const text = html_to_plain_text(html, { max_chars: budget });
  if (!text.trim()) throw new Error("No readable text found on that page.");

  return { url, text };
}

// ============================================================================
// [SECTION 1: CONSTANTS & INGESTION BUDGETS]
// ============================================================================

/**
 * Element tags treated as block boundaries when extracting text from HTML.
 * @type {ReadonlySet<string>}
 */
export const BLOCK_LEVEL_TAGS = Object.freeze(
  new Set([
    "address",
    "article",
    "aside",
    "blockquote",
    "dd",
    "div",
    "dl",
    "dt",
    "figcaption",
    "figure",
    "footer",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "header",
    "hr",
    "li",
    "main",
    "ol",
    "p",
    "pre",
    "section",
    "table",
    "tr",
    "ul",
  ]),
);

/**
 * Tag names whose entire subtree is noise/chrome rather than page content.
 * @type {readonly string[]}
 */
export const NOISE_SELECTORS = Object.freeze([
  "script",
  "style",
  "noscript",
  "template",
  "svg",
  "canvas",
  "iframe",
  "object",
  "embed",
  "form",
  "button",
  "input",
  "select",
  "textarea",
  "nav",
  "aside",
]);

/**
 * Compiled regex for stripping whole noise subtrees in regex fallback mode.
 */
const NOISE_TAG_REGEX = new RegExp(`<(?:${NOISE_SELECTORS.join("|")})\\b[^>]*>[\\s\\S]*?</(?:${NOISE_SELECTORS.join("|")})>`, "gi");

/**
 * Named entity replacement map for common HTML entities.
 * @type {Record<string, string>}
 */
const NAMED_ENTITIES = Object.freeze({
  "&nbsp;": " ",
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&apos;": "'",
  "&hellip;": "…",
  "&mdash;": "—",
  "&ndash;": "–",
});

// ============================================================================
// [SECTION 2: HTML ENTITY DECODER]
// ============================================================================

/**
 * Decodes numeric (decimal & hex) and standard typographic HTML entities into plain text.
 * @param {string} text - Text containing HTML entities.
 * @returns {string} Clean decoded string.
 */
export function decode_html_entities(text) {
  if (!text || typeof text !== "string") return "";

  return text
    .replace(/&#x([0-9a-f]+);/gi, (_match, hex) => {
      const code = parseInt(hex, 16);
      return Number.isNaN(code) ? "" : String.fromCodePoint(code);
    })
    .replace(/&#(\d+);/g, (_match, dec) => {
      const code = Number(dec);
      return Number.isNaN(code) ? "" : String.fromCodePoint(code);
    })
    .replace(/&(?:nbsp|amp|lt|gt|quot|apos|hellip|mdash|ndash);/gi, (match) => {
      return NAMED_ENTITIES[match.toLowerCase()] ?? match;
    });
}

// ============================================================================
// [SECTION 3: DOM & REGEX TEXT EXTRACTOR ENGINES]
// ============================================================================

/**
 * Recursively walks a DOM node tree, emitting text with block-level newlines.
 * @param {Node} root
 * @returns {string}
 */
function dom_to_text(root) {
  let output = "";

  /** @param {Node} node */
  function walk(node) {
    if (node.nodeType === 3) {
      output += node.textContent || "";
      return;
    }

    if (node.nodeType !== 1) return;

    const tag = /** @type {string} */ (node.nodeName).toLowerCase();
    if (tag === "br" || tag === "hr") {
      output += "\n";
      return;
    }

    const is_block = BLOCK_LEVEL_TAGS.has(tag);
    if (is_block) output += "\n";

    for (const child of node.childNodes) {
      walk(child);
    }

    if (is_block) output += "\n";
  }

  walk(root);
  return output;
}

/**
 * Regex fallback text extractor for headless environments lacking DOMParser.
 * @param {string} html
 * @returns {string}
 */
function regex_html_to_text(html) {
  return html
    .replace(NOISE_TAG_REGEX, " ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<hr\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|li|blockquote|h[1-6]|tr|pre|table|ul|ol|dl|dd|dt|section|article|figure|figcaption)>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ");
}

// ============================================================================
// [SECTION 4: PUBLIC INGESTION & TRUNCATION APIS]
// ============================================================================

/**
 * @typedef {Object} HtmlToTextOptions
 * @property {number} [max_chars] - Optional character cap applied via word-boundary truncation.
 */

/**
 * Converts raw webpage HTML into clean, readable plain text.
 * Strips script tags, navigation chrome, and interactive elements.
 * @param {string} html - Raw HTML source string.
 * @param {HtmlToTextOptions} [options={}]
 * @returns {string} Clean plain text.
 */
export function html_to_plain_text(html, options = {}) {
  if (typeof html !== "string" || !html.trim()) return "";

  const max_chars = options.max_chars || 0;
  let text;

  if (typeof DOMParser !== "undefined") {
    const doc = new DOMParser().parseFromString(html, "text/html");
    for (const selector of NOISE_SELECTORS) {
      doc.body.querySelectorAll(selector).forEach((node) => node.remove());
    }
    text = decode_html_entities(dom_to_text(doc.body));
  } else {
    text = decode_html_entities(regex_html_to_text(html));
  }

  text = text
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  if (max_chars > 0 && text.length > max_chars) {
    return truncate_readable(text, max_chars);
  }

  return text;
}

/**
 * Clips text at a natural word boundary near `max_chars`, appending an ellipsis.
 * Trims trailing punctuation before the ellipsis to maintain prose fluency.
 * @param {string} text - Source text to clip.
 * @param {number} [max_chars=LENGTH_THRESHOLDS.INGESTION] - Maximum character limit.
 * @param {string} [ellipsis="…"] - Trailing ellipsis string.
 * @returns {string}
 */
export function truncate_readable(text, max_chars = LENGTH_THRESHOLDS.INGESTION, ellipsis = "…") {
  if (typeof text !== "string" || !text) return "";
  return truncate_at_word(text, max_chars, {
    ellipsis,
    reserve_ellipsis: true,
    min_bound_ratio: 0.5,
    strip_trailing_punctuation: true,
  });
}

/**
 * CHANGELOG:
 * - 2026-09-25: `truncate_readable` now delegates to the shared `truncate_at_word`
 *   (reserve_ellipsis + 50% minimum word boundary + trailing-punctuation trim), so the
 *   ingestion clip and every other word-boundary clip share one implementation.
 * - 2026-08-29: Applied /harmonize protocol: added Universal File Architecture header block,
 *   structured section dividers, exported frozen BLOCK_LEVEL_TAGS and NOISE_SELECTORS sets,
 *   optimized entity lookup table, and verified full unit test coverage.
 * - 2026-06-15: Added word-boundary truncation and noise subtree stripping for web-fetch pipeline.
 */
