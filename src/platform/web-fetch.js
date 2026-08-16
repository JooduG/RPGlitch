/**
 * @file src/platform/web-fetch.js
 *
 * 🌐 WEB FETCH SERVICE    The Web Ingestion Transport
 *
 * PURPOSE
 * The single point of contact with the Perchance super-fetch plugin
 * (window.fetch_web / window.pluginFetchWeb). Mirrors transport.js's role for
 * the AI plugin: it only sends and receives — no opinion on what the fetched
 * page contains.
 *
 * RESPONSIBILITIES
 * - Zero-Trust URL validation: only https (optionally http) passes; opaque
 *   schemes (javascript:, data:, file:) are rejected outright; hosts may be
 *   restricted to an explicit allow-list.
 * - Fetches a page as clean, budgeted plain text (for the ingestion pipeline)
 *   or as an image data URL (for avatars), binary-safe.
 */

import { html_to_plain_text, INGESTION_CHAR_LIMIT, INGESTION_WORD_LIMIT } from "@utils";

/**
 * Resolves the super-fetch-plugin engine (window.fetch_web / pluginFetchWeb /
 * parent-frame variants), mirroring get_ai_engine's resolution order. Resolution
 * is deliberately UNCACHED: the fetch path is called once per request anyway,
 * and tests hot-swap the engine between cases.
 * NOTE: a bare lexical `fetch_web` probe is intentionally absent — that name is
 * this module's own wrapper export, so it would self-resolve into infinite recursion.
 * @returns {((url: string) => Promise<any>) | null}
 */
function get_super_fetch_engine() {
  if (typeof window === "undefined") return null;

  try {
    if (typeof window.fetch_web === "function") return window.fetch_web;
  } catch (_e) {
    /* ignore */
  }
  try {
    if (typeof window.pluginFetchWeb === "function") return window.pluginFetchWeb;
  } catch (_e) {
    /* ignore */
  }

  try {
    if (typeof window.parent !== "undefined" && typeof window.parent.fetch_web === "function") return window.parent.fetch_web;
    if (typeof window.parent !== "undefined" && typeof window.parent.pluginFetchWeb === "function") return window.parent.pluginFetchWeb;
  } catch (_e) {
    /* Ignore cross-origin errors if we're somehow sandboxed */
  }
  return null;
}

/**
 * Reads a Response-like object into a Blob (binary-safe).
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
 * Converts a Blob into a base64 data URL.
 * @param {Blob} blob
 * @returns {Promise<string>}
 */
function blob_to_data_url(blob) {
  return new Promise((resolve, reject) => {
    const reader = new globalThis.FileReader();
    reader.onload = (event) => resolve(/** @type {string} */ (event.target?.result));
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(blob);
  });
}

/**
 * Validates a web URL for ingestion (fetch_web).
 * Zero-Trust: only https (optionally http) schemes pass; the host may be
 * restricted to an explicit allow-list; opaque schemes (javascript:, data:,
 * file:) are rejected outright. Returns the normalized canonical URL.
 * @param {string} raw_url
 * @param {{ allow_http?: boolean, allowed_hosts?: string[] }} [options]
 * @returns {string}
 */
export const validate_url = (raw_url, options = {}) => {
  if (typeof raw_url !== "string" || !raw_url.trim()) {
    throw new Error("A URL is required.");
  }
  const trimmed = raw_url.trim();
  let parsed;
  try {
    parsed = new URL(trimmed);
  } catch (_e) {
    throw new Error(`Invalid URL "${trimmed.slice(0, 80)}". Enter a full web address, e.g. https://example.com/wiki/Page`, { cause: _e });
  }
  const scheme = parsed.protocol.toLowerCase().replace(":", "");
  const allowed = options.allow_http ? ["https", "http"] : ["https"];
  if (!allowed.includes(scheme)) {
    throw new Error(`Blocked URL scheme "${scheme}:". Only ${allowed.join(" and ")} pages are supported.`);
  }
  if (Array.isArray(options.allowed_hosts) && options.allowed_hosts.length > 0) {
    const host = parsed.hostname.toLowerCase();
    const allowed_host = options.allowed_hosts.some((h) => {
      const hh = String(h).toLowerCase().replace(/^\./, "");
      return hh && (host === hh || host.endsWith(`.${hh}`));
    });
    if (!allowed_host) {
      throw new Error(`Host "${parsed.hostname}" is not on the allowed list for ingestion.`);
    }
  }
  return parsed.href;
};

/**
 * Fetches a web resource for ingestion.
 * Uses the super-fetch-plugin (CORS-free, binary-safe) when present; falls back to
 * native fetch in local dev only. By default HTML is stripped to clean plain text
 * and clipped to the ingestion budget (characters: 8000, worlds/fractals: 10000);
 * with `as_image: true` the response must be an image and is returned as a data URL.
 * @param {string} raw_url
 * @param {{ allow_http?: boolean, allowed_hosts?: string[], type?: 'character' | 'fractal' | 'world', max_chars?: number, as_image?: boolean }} [options]
 * @returns {Promise<{ url: string, text: string } | { url: string, data_url: string }>}
 */
export const fetch_web = async (raw_url, options = {}) => {
  const url = validate_url(raw_url, options);
  const budget = options.max_chars || (options.type === "fractal" || options.type === "world" ? INGESTION_WORD_LIMIT : INGESTION_CHAR_LIMIT);

  const engine = get_super_fetch_engine();
  if (!engine) {
    const is_local_dev =
      typeof window !== "undefined" &&
      !(typeof process !== "undefined" && process.env.VITEST) &&
      (window.location?.hostname === "localhost" || window.location?.hostname === "127.0.0.1" || import.meta.env.DEV);
    if (is_local_dev) {
      // Local dev fallback: same-origin native fetch (CORS applies normally).
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
};
