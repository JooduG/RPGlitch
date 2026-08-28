/**
 * src/platform/web-fetch.js
 * 🌐 WEB FETCH TRANSPORT & ZERO-TRUST INGESTION
 *
 * Core Responsibilities:
 * - Single point of contact with the Perchance super-fetch plugin (`window.fetch_web` / `window.pluginFetchWeb`).
 * - Enforces zero-trust URL validation (only https / optional http permitted; opaque schemes like javascript:, data:, file: blocked).
 * - Enforces optional allowed hosts filtering for restricted wiki ingestion.
 * - Extracts clean, character-budgeted plain text from HTML web pages via `html_to_plain_text`.
 * - Fetches binary image files as base64 data URLs for character avatar ingestion.
 * - Provides `blob_to_data_url` primitive for local file and dropped image uploads.
 *
 * Dependencies & Cross-Module Invariants:
 * - `@utils` (`html_to_plain_text`, `INGESTION_CHAR_LIMIT`, `INGESTION_LORE_LIMIT`): Text extraction and character budgets.
 * - Invariant: Transport does NOT parse character cards or structured entity models; it only fetches and normalizes text/binary streams.
 */

import { html_to_plain_text, INGESTION_CHAR_LIMIT, INGESTION_LORE_LIMIT } from "@utils";

// ============================================================================
// [SECTION 1: ENGINE RESOLUTION & ENVIRONMENT PROBE]
// ============================================================================

/**
 * Resolves the Perchance super-fetch plugin engine across window and parent-frame scopes.
 * Resolution is deliberately uncached to allow dynamic testing and hot-swapping.
 * @returns {((url: string) => Promise<any>) | null}
 */
function get_super_fetch_engine() {
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

// ============================================================================
// [SECTION 2: BINARY & BLOB UTILITIES]
// ============================================================================

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

// ============================================================================
// [SECTION 3: ZERO-TRUST URL VALIDATION]
// ============================================================================

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

// ============================================================================
// [SECTION 4: CORE WEB INGESTION SERVICE]
// ============================================================================

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
  const budget = options.max_chars || (options.type === "fractal" || options.type === "world" ? INGESTION_LORE_LIMIT : INGESTION_CHAR_LIMIT);

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
// [CHANGELOG]
// ============================================================================
/**
 * CHANGELOG:
 * - 2026-08-29: Applied /harmonize protocol: added Universal File Architecture header block,
 *   structured section dividers, normalized function declarations, typed JSDoc schemas, and verified test suite.
 * - 2026-08-16: Added zero-trust URL validation, super-fetch-plugin bridge, and binary image data URL conversion.
 */
