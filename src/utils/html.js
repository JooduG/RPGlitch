/**
 * src/utils/html.js
 * 🌐 HTML → TEXT INGESTION
 * Extracts clean plain text from fetched web pages: HTML entity decoding,
 * block-boundary newlines, noise/chrome stripping, and word-boundary
 * clipping. Pure + deterministic; consumed by the @platform web-fetch
 * ingestion pipeline.
 */

/**
 * Web ingestion budget (characters) applied to fetched page text for
 * character imports. Larger lore (fractal/world) imports use
 * INGESTION_LORE_LIMIT.
 */
export const INGESTION_CHAR_LIMIT = 8000;

/**
 * Web ingestion budget (characters) applied to fetched page text for
 * fractal/world (lore) imports — larger, since world-lore pages need more room.
 */
export const INGESTION_LORE_LIMIT = 10000;

/** Element tags treated as block boundaries when extracting text from HTML. */
const BLOCK_LEVEL_TAGS = new Set([
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
]);

/** Tags whose entire subtree is navigation/chrome noise, never page content. */
const NOISE_SELECTORS = [
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
];

/**
 * Compiled matcher for whole noise-subtree removal in the regex fallback —
 * built once from NOISE_SELECTORS instead of re-joining on every call.
 */
const NOISE_TAG_REGEX = new RegExp(`<(?:${NOISE_SELECTORS.join("|")})\\b[^>]*>[\\s\\S]*?</(?:${NOISE_SELECTORS.join("|")})>`, "gi");

/**
 * Decodes the most common HTML entities into plain text characters.
 * Numeric references (decimal + hex) are decoded generically.
 * @param {string} text
 * @returns {string}
 */
export function decode_html_entities(text) {
  return String(text)
    .replace(/&#x([0-9a-f]+);/gi, (_m, hex) => {
      const code = parseInt(hex, 16);
      return Number.isNaN(code) ? "" : String.fromCodePoint(code);
    })
    .replace(/&#(\d+);/g, (_m, dec) => {
      const code = Number(dec);
      return Number.isNaN(code) ? "" : String.fromCodePoint(code);
    })
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&apos;/gi, "'")
    .replace(/&hellip;/gi, "…")
    .replace(/&mdash;/gi, "—")
    .replace(/&ndash;/gi, "–");
}

/**
 * Recursively walks a DOM node, emitting text plus newline separators at block
 * boundaries so headings, paragraphs, and list items land on their own lines.
 * @param {Node} root
 * @returns {string}
 */
function _dom_to_text(root) {
  let out = "";
  /** @param {Node} node */
  function walk(node) {
    if (node.nodeType === 3) {
      out += node.textContent || "";
      return;
    }
    if (node.nodeType !== 1) return;
    const tag = /** @type {string} */ (node.nodeName).toLowerCase();
    if (tag === "br" || tag === "hr") {
      out += "\n";
      return;
    }
    if (BLOCK_LEVEL_TAGS.has(tag)) out += "\n";
    for (const child of node.childNodes) walk(child);
    if (BLOCK_LEVEL_TAGS.has(tag)) out += "\n";
  }
  walk(root);
  return out;
}

/**
 * Regex-only HTML→text fallback for environments without DOMParser.
 * Far cruder than the DOM path, but deterministic and dependency-free.
 * @param {string} html
 * @returns {string}
 */
function _regex_html_to_text(html) {
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
 * Converts a webpage's HTML into clean, readable plain text.
 * Strips scripts, navigation, and interactive chrome; block boundaries become
 * newlines. Optionally clips the result with truncate_readable.
 * @param {string} html
 * @param {{ max_chars?: number }} [options]
 * @returns {string}
 */
export function html_to_plain_text(html, options = {}) {
  if (typeof html !== "string" || !html.trim()) return "";
  const max_chars = options.max_chars || 0;
  let text;
  if (typeof DOMParser !== "undefined") {
    const doc = new DOMParser().parseFromString(html, "text/html");
    for (const selector of NOISE_SELECTORS) {
      doc.body.querySelectorAll(selector).forEach((n) => n.remove());
    }
    text = decode_html_entities(_dom_to_text(doc.body));
  } else {
    text = decode_html_entities(_regex_html_to_text(html));
  }
  text = text
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  if (max_chars > 0 && text.length > max_chars) {
    text = truncate_readable(text, max_chars);
  }
  return text;
}

/**
 * Clips text at a natural word boundary near `max_chars`, appending an ellipsis.
 * Never splits mid-word; trims trailing punctuation so the cut reads cleanly.
 * @param {string} text
 * @param {number} [max_chars]
 * @param {string} [ellipsis]
 * @returns {string}
 */
export function truncate_readable(text, max_chars = INGESTION_CHAR_LIMIT, ellipsis = "…") {
  if (typeof text !== "string" || !text) return "";
  if (text.length <= max_chars) return text;
  const budget = Math.max(1, max_chars - ellipsis.length);
  let slice = text.slice(0, budget);
  const last_space = slice.lastIndexOf(" ");
  if (last_space > Math.floor(budget * 0.5)) slice = slice.slice(0, last_space);
  slice = slice.replace(/[.,;:\s]+$/, "");
  return slice + ellipsis;
}
