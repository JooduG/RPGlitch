/**
 * src/engine/parser.js
 * ============================================================================
 * 📜 PURE BRACKET & STREAMING PARSER
 * ============================================================================
 *
 * Handles canonical bracket extraction, flag stripping, tag closure repair,
 * and <think> extraction for RPGlitch.
 *
 * Format: [KEY: value | flags]
 * Flags: | hide, | show, | w: <1-10>, | is_origin
 *
 * Invariant: Pipes inside `{Option A | Option B}` alternation scopes are NOT
 * parsed as control flags.
 * ============================================================================
 */

/**
 * Extracts and strips <think>...</think> cognition blocks from streamed prose.
 *
 * @param {string} text
 * @returns {{ think: string, prose: string }}
 */
export function extract_think_block(text) {
  if (!text || typeof text !== "string") {
    return { think: "", prose: "" };
  }

  // Match closed <think>...</think> or unclosed <think>... at start/middle
  const think_match = /<think>([\s\S]*?)(?:<\/think>|$)/i.exec(text);

  if (!think_match) {
    return { think: "", prose: text.trim() };
  }

  const think = think_match[1].trim();
  const prose = text.replace(/<think>[\s\S]*?(?:<\/think>|$)/i, "").trim();

  return { think, prose };
}

/**
 * Parses a single bracket token like "[KEY: value | hide | w: 8]".
 * Correctly distinguishes metadata pipes from `{A | B}` alternation pipes.
 *
 * @param {string} bracketString
 * @returns {{ key: string, value: string, flags: { hide: boolean, show: boolean, is_origin: boolean, weight?: number }, raw: string } | null}
 */
export function parse_bracket_token(bracketString) {
  if (!bracketString || typeof bracketString !== "string") return null;

  const trimmed = bracketString.trim();
  if (!trimmed.startsWith("[") || !trimmed.endsWith("]")) return null;

  const inner = trimmed.slice(1, -1).trim();
  const colon_idx = inner.indexOf(":");
  if (colon_idx === -1) return null;

  const key = inner.slice(0, colon_idx).trim();
  const payload = inner.slice(colon_idx + 1).trim();

  // Walk payload character by character to safely find top-level pipes outside { ... }
  const segments = [];
  let current_segment = "";
  let brace_depth = 0;

  for (let i = 0; i < payload.length; i++) {
    const char = payload[i];
    if (char === "{") {
      brace_depth++;
      current_segment += char;
    } else if (char === "}") {
      brace_depth = Math.max(0, brace_depth - 1);
      current_segment += char;
    } else if (char === "|" && brace_depth === 0) {
      segments.push(current_segment.trim());
      current_segment = "";
    } else {
      current_segment += char;
    }
  }
  segments.push(current_segment.trim());

  const value = segments[0] || "";
  const flags = {
    hide: false,
    show: false,
    is_origin: false,
    weight: undefined,
  };

  for (let j = 1; j < segments.length; j++) {
    const flag = segments[j].toLowerCase();
    if (flag === "hide") {
      flags.hide = true;
    } else if (flag === "show") {
      flags.show = true;
    } else if (flag === "is_origin" || flag === "origin") {
      flags.is_origin = true;
    } else if (flag.startsWith("w:") || flag.startsWith("weight:")) {
      const parts = flag.split(":");
      const num = parseInt(parts[1]?.trim(), 10);
      if (!isNaN(num)) {
        flags.weight = Math.min(10, Math.max(1, num));
      }
    }
  }

  return {
    key,
    value,
    flags,
    raw: trimmed,
  };
}

/**
 * Extracts all top-level brackets from a multiline string.
 *
 * @param {string} text
 * @returns {Array<ReturnType<typeof parse_bracket_token>>}
 */
export function parse_brackets(text) {
  if (!text || typeof text !== "string") return [];

  const tokens = [];
  let bracket_depth = 0;
  let start_index = -1;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === "[") {
      if (bracket_depth === 0) {
        start_index = i;
      }
      bracket_depth++;
    } else if (char === "]") {
      if (bracket_depth > 0) {
        bracket_depth--;
        if (bracket_depth === 0 && start_index !== -1) {
          const raw = text.slice(start_index, i + 1);
          const parsed = parse_bracket_token(raw);
          if (parsed) tokens.push(parsed);
          start_index = -1;
        }
      }
    }
  }

  return tokens;
}

/**
 * Filters brackets based on visibility and strips internal flags for clean prompt rendering.
 *
 * @param {string} bracketsText - multiline brackets string
 * @param {object} options
 * @param {"all" | "own" | "none"} [options.see_hidden="own"]
 * @param {boolean} [options.is_counterpart=false] - whether this entity is counterpart across Epistemic Wall
 * @returns {string} clean brackets string without metadata flags
 */
export function format_clean_brackets(bracketsText, options = {}) {
  const { see_hidden = "own", is_counterpart = false } = options;
  const parsed = parse_brackets(bracketsText);

  const kept = [];

  for (const token of parsed) {
    if (!token) continue;

    // Epistemic Wall rules:
    // If see_hidden is "none": strip all hidden brackets
    // If see_hidden is "own": strip hidden brackets if is_counterpart is true
    // If see_hidden is "all": keep everything
    if (token.flags.hide) {
      if (see_hidden === "none") continue;
      if (see_hidden === "own" && is_counterpart) continue;
    }

    // Stripping internal control flags before output
    kept.push(`[${token.key}: ${token.value}]`);
  }

  return kept.join("\n");
}
