// ============================================================================
// [SECTION 6: ALTERNATION MACROS - SELECTABLE OPTIONS & DICE RESOLUTION]
// ============================================================================

/**
 * Matches Perchance alternation groups `{Option A|Option B}` - the "macro leak"
 * syntax. Group 1 is the pipe-separated body.
 * @type {RegExp}
 */
export const ALTERNATION_PATTERN = /\{([^{}]+(?:\|[^{}]+)+)\}/g;

/**
 * Extracts every alternation group from a string.
 * @param {string | null | undefined} text
 * @returns {{ raw: string, options: string[] }[]}
 */
export function extract_alternations(text) {
  if (typeof text !== "string" || !text) return [];
  return [...text.matchAll(ALTERNATION_PATTERN)]
    .map((m) => ({
      raw: m[0],
      options: m[1]
        .split("|")
        .map((s) => s.trim())
        .filter(Boolean),
    }))
    .filter((g) => g.options.length >= 2);
}

/**
 * Whether a string contains at least one resolvable alternation group.
 * @param {string | null | undefined} text
 * @returns {boolean}
 */
export function has_alternations(text) {
  return extract_alternations(text).length > 0;
}

/**
 * Resolves every alternation group in a string to exactly ONE option.
 * This is the code-side DICE ROLL used by the image pipeline: each group picks
 * a uniformly random option (injectable `random` for determinism), and every
 * pick is reported through the optional `onPick` callback so it can be logged.
 * @param {string | null | undefined} text
 * @param {{ random?: () => number, onPick?: (pick: { raw: string, options: string[], index: number, option: string }) => void }} [opts={}]
 * @returns {{ text: string, picks: { raw: string, options: string[], index: number, option: string }[] }}
 */
export function resolve_alternations(text, opts = {}) {
  if (typeof text !== "string") return { text: text ?? "", picks: [] };
  const { random = Math.random, onPick = null } = opts;
  const picks = [];
  const resolved = text.replace(ALTERNATION_PATTERN, (raw, body) => {
    const options = body
      .split("|")
      .map((s) => s.trim())
      .filter(Boolean);
    if (options.length < 2) return raw;
    const index = Math.min(options.length - 1, Math.floor(random() * options.length));
    const pick = { raw, options, index, option: options[index] };
    picks.push(pick);
    if (typeof onPick === "function") onPick(pick);
    return options[index];
  });
  return { text: resolved, picks };
}

/**
 * Detects which alternation option a resolved string committed to.
 * Used on the text path: the LLM reads the braced options in its input and
 * writes a resolved value into state - this diff identifies the pick so it can
 * be logged as `[ALT] FIELD → option N "..." (narrative)`.
 * @param {string | null | undefined} source - Braced source text (what the LLM saw).
 * @param {string | null | undefined} resolved - Committed value (what the LLM wrote back).
 * @returns {{ raw: string, options: string[], index: number, option: string }[]}
 */
export function diff_alternation_picks(source, resolved) {
  if (typeof resolved !== "string") return [];
  const picks = [];
  for (const g of extract_alternations(source)) {
    const chosen = g.options.find((o) => o && resolved.includes(o));
    if (chosen) picks.push({ raw: g.raw, options: g.options, index: g.options.indexOf(chosen), option: chosen });
  }
  return picks;
}

/**
 * Belt-and-suspenders strip: resolves any alternation group that leaked into a
 * generated OUTPUT back to a single option (deterministically the first), so
 * story prose never surfaces braces or pipes.
 * @param {string | null | undefined} text
 * @returns {string}
 */
export function strip_alternation_braces(text) {
  if (typeof text !== "string") return text;
  return text.replace(ALTERNATION_PATTERN, (_raw, body) => {
    const options = body
      .split("|")
      .map((s) => s.trim())
      .filter(Boolean);
    return options[0] || "";
  });
}

/**
 * Human-friendly field label for an alternation group: the enclosing
 * `[KEY: ...]` bracket (e.g. `[SHIRT: {red|black}]` → "SHIRT"), or "" if the
 * group is not inside a bracket.
 * @param {string | null | undefined} text
 * @param {string} raw - The exact alternation group (`{A|B}`) to locate.
 * @returns {string}
 */
export function alternation_field_label(text, raw) {
  if (typeof text !== "string") return "";
  const idx = text.indexOf(raw);
  if (idx < 0) return "";
  const before = text.slice(0, idx);
  const last_open = before.lastIndexOf("[");
  const last_close = before.lastIndexOf("]");
  if (last_open > last_close) {
    const key = before
      .slice(last_open + 1)
      .split(":")[0]
      .trim();
    if (key) return key.toUpperCase();
  }
  return "";
}
