/**
 * @file src/utils/ingestion.js
 * Binary image signature validation, Blob data-URL encoding, URL allowlist
 * validation, and Perchance `super-fetch-plugin` web ingestion.
 */

import { IMAGE_POLICY, LENGTH_THRESHOLDS } from "@config";
import { html_to_plain_text } from "./html.js";

/**
 * Binary magic-byte header validators for supported image formats.
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
 * Validates an uploaded image file for byte size, MIME type, and magic-byte header.
 * @param {File} file
 * @param {{ max_size?: number; allowed_types?: readonly string[] }} [options={}]
 * @returns {Promise<boolean>}
 */
export async function validate_image(file, options = {}) {
  if (!file) throw new Error("No file provided");

  const max_size = options.max_size ?? IMAGE_POLICY.UPLOAD.MAX_IMAGE_SIZE_BYTES;
  const allowed_types = options.allowed_types ?? IMAGE_POLICY.UPLOAD.ALLOWED_IMAGE_MIME_TYPES;

  if (file.size > max_size) {
    const file_mb = (file.size / 1024 / 1024).toFixed(2);
    const limit_mb = (max_size / 1024 / 1024).toFixed(2);
    throw new Error(`File too large: ${file_mb}MB. Max limit: ${limit_mb}MB`);
  }

  if (!allowed_types.includes(file.type)) {
    throw new Error(`Invalid file type: ${file.type}. Allowed types: ${allowed_types.join(", ")}`);
  }

  const header = new Uint8Array(await file.slice(0, 12).arrayBuffer());
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
 * Resolves the Perchance `super-fetch-plugin` function across window and parent frames.
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
    // @ts-ignore
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
    /* Ignore cross-origin iframe errors */
  }

  return null;
}

/**
 * Validates a web URL for ingestion, blocking unsafe schemes and enforcing optional host allowlists.
 * @param {string} raw_url
 * @param {{ allow_http?: boolean, allowed_hosts?: string[] }} [options={}]
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
    const is_allowed = options.allowed_hosts.some((entry) => {
      const clean_entry = String(entry).toLowerCase().replace(/^\./, "");
      return clean_entry && (host === clean_entry || host.endsWith(`.${clean_entry}`));
    });
    if (!is_allowed) {
      throw new Error(`Host "${parsed.hostname}" is not on the allowed list for ingestion.`);
    }
  }

  return parsed.href;
}

/**
 * Executes an outbound fetch via `super-fetch-plugin` or local-dev `fetch()`.
 * @param {string} url
 * @returns {Promise<any>}
 */
async function execute_fetch(url) {
  const engine = get_super_fetch_engine();
  if (!engine) {
    const is_local_dev =
      typeof window !== "undefined" &&
      !(typeof process !== "undefined" && process.env.VITEST) &&
      (window.location?.hostname === "localhost" || window.location?.hostname === "127.0.0.1" || import.meta.env.DEV);

    if (!is_local_dev) {
      throw new Error("fetch_web plugin unavailable. Add fetch_web = {import:super-fetch-plugin} to the Perchance left panel, then reload.");
    }

    const res = await fetch(url);
    if (!res.ok) throw new Error(`Page returned HTTP ${res.status}.`);
    return res;
  }

  let response;
  try {
    response = await engine(url);
  } catch (err) {
    throw new Error(`Network request to "${url}" failed.`, { cause: err });
  }

  const status =
    typeof response?.status === "number" ? response.status
    : response?.ok ? 200
    : null;
  if (status != null && (status < 200 || status >= 300)) {
    throw new Error(`Page returned HTTP ${status}.`);
  }

  return response;
}

/**
 * Extracts either a validated image data URL or readable plain text from a fetch response.
 * @param {string} url
 * @param {any} response
 * @param {{ as_image?: boolean, budget: number }} options
 * @returns {Promise<{ url: string, text: string } | { url: string, data_url: string }>}
 */
async function extract_fetched_payload(url, response, { as_image, budget }) {
  if (as_image) {
    const blob = await blob_from_response(response);
    if (!blob.type?.startsWith("image/")) throw new Error("That URL is not an image.");
    return { url, data_url: await blob_to_data_url(blob) };
  }

  const html = typeof response?.text === "function" ? await response.text() : String(response?.responseText ?? response?.body ?? response ?? "");
  const text = html_to_plain_text(html, { max_chars: budget });
  if (!text.trim()) throw new Error("No readable text found on that page.");
  return { url, text };
}

/**
 * Fetches a web resource for ingestion, returning plain text or an image data URL.
 * @param {string} raw_url
 * @param {{ allow_http?: boolean, allowed_hosts?: string[], max_chars?: number, as_image?: boolean }} [options={}]
 * @returns {Promise<{ url: string, text: string } | { url: string, data_url: string }>}
 */
export async function fetch_web(raw_url, options = {}) {
  const url = validate_url(raw_url, options);
  const budget = options.max_chars || LENGTH_THRESHOLDS.INGESTION;
  const response = await execute_fetch(url);
  return extract_fetched_payload(url, response, { as_image: options.as_image, budget });
}
