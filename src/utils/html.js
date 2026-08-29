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

// ============================================================================
// [SECTION 1: CONSTANTS & INGESTION BUDGETS]
// ============================================================================

/**
 * Character budget applied to fetched web text for character profile imports.
 */
export const INGESTION_CHAR_LIMIT = 8000;

/**
 * Character budget applied to fetched web text for fractal / world-lore imports.
 */
export const INGESTION_LORE_LIMIT = 10000;

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
 * @param {number} [max_chars=INGESTION_CHAR_LIMIT] - Maximum character limit.
 * @param {string} [ellipsis="…"] - Trailing ellipsis string.
 * @returns {string}
 */
export function truncate_readable(text, max_chars = INGESTION_CHAR_LIMIT, ellipsis = "…") {
  if (typeof text !== "string" || !text) return "";
  if (text.length <= max_chars) return text;

  const budget = Math.max(1, max_chars - ellipsis.length);
  let slice = text.slice(0, budget);
  const last_space = slice.lastIndexOf(" ");

  if (last_space > Math.floor(budget * 0.5)) {
    slice = slice.slice(0, last_space);
  }

  slice = slice.replace(/[.,;:\s]+$/, "");
  return slice + ellipsis;
}

// ============================================================================
// [CHANGELOG]
// ============================================================================
/**
 * CHANGELOG:
 * - 2026-08-29: Applied /harmonize protocol: added Universal File Architecture header block,
 *   structured section dividers, exported frozen BLOCK_LEVEL_TAGS and NOISE_SELECTORS sets,
 *   optimized entity lookup table, and verified full unit test coverage.
 * - 2026-06-15: Added word-boundary truncation and noise subtree stripping for web-fetch pipeline.
 */
