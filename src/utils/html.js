/**
 * @file src/utils/html.js
 * DOMPurify XSS sanitization, HTML entity decoding, and readable plain-text extraction.
 */

import { LENGTH_THRESHOLDS } from "@config";
import DOMPurify from "dompurify";
import { truncate_at_word } from "./text.js";

/**
 * Sanitizes dirty HTML and returns a safe HTML string.
 * @param {any} dirty
 * @returns {string}
 */
export function sanitize(dirty) {
  if (typeof window === "undefined") return dirty;
  return DOMPurify.sanitize(dirty, { RETURN_DOM_FRAGMENT: false, SANITIZE_DOM: true, SANITIZE_NAMED_PROPS: true });
}

/**
 * Sanitizes dirty HTML and returns a safe DocumentFragment.
 * @param {any} dirty
 * @returns {DocumentFragment | any}
 */
export function sanitize_to_fragment(dirty) {
  if (typeof window === "undefined") return dirty;
  return DOMPurify.sanitize(dirty, { RETURN_DOM_FRAGMENT: true, SANITIZE_DOM: true, SANITIZE_NAMED_PROPS: true });
}

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
 * Tag names whose entire subtree is stripped as non-content chrome.
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

const NOISE_TAG_REGEX = new RegExp(`<(?:${NOISE_SELECTORS.join("|")})\\b[^>]*>[\\s\\S]*?</(?:${NOISE_SELECTORS.join("|")})>`, "gi");

const NAMED_ENTITIES = Object.freeze({
  "&nbsp;": " ",
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&apos;": "'",
  "&hellip;": "…",
  "&mdash;": "-",
  "&ndash;": "–",
});

/**
 * Decodes numeric (decimal and hex) and standard typographic HTML entities.
 * @param {string | null | undefined} text
 * @returns {string}
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
    .replace(/&(?:nbsp|amp|lt|gt|quot|apos|hellip|mdash|ndash);/gi, (match) => NAMED_ENTITIES[match.toLowerCase()] ?? match);
}

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

/**
 * Converts raw HTML into clean, readable plain text.
 * @param {string | null | undefined} html
 * @param {{ max_chars?: number }} [options={}]
 * @returns {string}
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
 * Clips text at a natural word boundary near `max_chars`, trimming trailing punctuation.
 * @param {string | null | undefined} text
 * @param {number} [max_chars=LENGTH_THRESHOLDS.INGESTION]
 * @param {string} [ellipsis="…"]
 * @returns {string}
 */
function truncate_readable(text, max_chars = LENGTH_THRESHOLDS.INGESTION, ellipsis = "…") {
  if (typeof text !== "string" || !text) return "";
  return truncate_at_word(text, max_chars, { ellipsis, reserve_ellipsis: true, min_bound_ratio: 0.5, strip_trailing_punctuation: true });
}
