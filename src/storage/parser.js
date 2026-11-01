/**
 * src/storage/parser.js
 * ============================================================================
 * 📜 CANONICAL BRACKET TOKENIZER & EPISTEMIC WALL
 * ============================================================================
 *
 * Single source of truth for bracket tokenization, metadata flag parsing,
 * Epistemic Wall filtering, delta merging, and memory candidate extraction.
 *
 * Bracket Format: [KEY: VALUE | flags]
 * Flags: | hide, | show, | w: <1-10>, | is_origin
 *
 * Invariant: Pipes inside `{Option A | Option B}` alternation scopes are NOT
 * treated as metadata flag separators.
 * ============================================================================
 */

/**
 * Parses a single bracket token string like "[KEY: value | hide | w: 8]".
 * Key is normalized to uppercase.
 * Safely isolates pipes inside `{A | B}` alternation scopes.
 *
 * @param {string} bracket_string
 * @returns {{ key: string, value: string, flags: { hide: boolean, show: boolean, is_origin: boolean, weight?: number }, raw: string } | null}
 */
export function parse_bracket_token(bracket_string) {
  if (!bracket_string || typeof bracket_string !== "string") return null;

  const trimmed = bracket_string.trim();
  if (!trimmed.startsWith("[") || !trimmed.endsWith("]")) return null;

  const inner = trimmed.slice(1, -1).trim();
  const colon_index = inner.indexOf(":");
  if (colon_index === -1) return null;

  const raw_key = inner.slice(0, colon_index).trim();
  const key = raw_key.toUpperCase();
  const payload = inner.slice(colon_index + 1).trim();

  // Walk payload character-by-character to locate top-level pipes outside { ... }
  const segments = [];
  let current_segment = "";
  let brace_depth = 0;

  for (let i = 0; i < payload.length; i++) {
    const character = payload[i];
    if (character === "{") {
      brace_depth++;
      current_segment += character;
    } else if (character === "}") {
      brace_depth = Math.max(0, brace_depth - 1);
      current_segment += character;
    } else if (character === "|" && brace_depth === 0) {
      segments.push(current_segment.trim());
      current_segment = "";
    } else {
      current_segment += character;
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
      const parsed_number = parseInt(parts[1]?.trim(), 10);
      if (!isNaN(parsed_number)) {
        flags.weight = Math.min(10, Math.max(1, parsed_number));
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
 * Extracts all top-level bracket tokens from a multiline string.
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
    const character = text[i];
    if (character === "[") {
      if (bracket_depth === 0) {
        start_index = i;
      }
      bracket_depth++;
    } else if (character === "]") {
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
 * @param {string} brackets_text - multiline brackets string
 * @param {object} [options]
 * @param {"all" | "own" | "none"} [options.see_hidden="own"]
 * @param {boolean} [options.is_counterpart=false] - whether this entity is counterpart across Epistemic Wall
 * @param {boolean} [options.strip_inventory=false] - whether to strip INVENTORY and STASH brackets
 * @returns {string} clean brackets string without metadata flags
 */
export function format_clean_brackets(brackets_text, options = {}) {
  const { see_hidden = "own", is_counterpart = false, strip_inventory = false } = options;
  const parsed = parse_brackets(brackets_text);

  const kept = [];

  for (const token of parsed) {
    if (!token) continue;

    // Visual/diffusion filter: strip inventory and stash containers if requested or if see_hidden === "none"
    if (strip_inventory || see_hidden === "none") {
      const upper_key = token.key.toUpperCase();
      if (upper_key === "INVENTORY" || upper_key === "STASH") {
        continue;
      }
    }

    // Epistemic Wall rules:
    // If see_hidden is "none": strip all hidden brackets
    // If see_hidden is "own": strip hidden brackets if is_counterpart is true
    // If see_hidden is "all": keep everything
    if (token.flags.hide) {
      if (see_hidden === "none") continue;
      if (see_hidden === "own" && is_counterpart) continue;
    }

    // Strip internal control flags for clean rendered output
    kept.push(`[${token.key}: ${token.value}]`);
  }

  return kept.join("\n");
}

/**
 * Merges delta brackets into an existing bracket text.
 * - Single-value keys overwrite existing entries.
 * - Multi-entry keys (INVENTORY, STASH) append to existing entries.
 * - Keys with value "none" or "cleared" delete the key.
 * - New keys append to the end.
 *
 * @param {string} existing_text - existing multiline bracket string
 * @param {string} delta_text - delta multiline bracket string
 * @returns {string} merged multiline bracket string
 */
export function apply_bracket_deltas(existing_text, delta_text) {
  const existing_tokens = parse_brackets(existing_text);
  const delta_tokens = parse_brackets(delta_text);

  if (delta_tokens.length === 0) {
    return existing_text ? existing_text.trim() : "";
  }

  // Track multi-entry keys
  const multi_entry_keys = new Set(["INVENTORY", "STASH"]);

  // Build mutable entries list from existing tokens
  // Each entry: { key: string, raw: string, value: string }
  const current_entries = existing_tokens.map((token) => ({
    key: token.key,
    raw: token.raw,
    value: token.value,
  }));

  for (const delta of delta_tokens) {
    const delta_key = delta.key;
    const lower_value = delta.value.trim().toLowerCase();

    // Check for deletion
    if (lower_value === "none" || lower_value === "cleared") {
      for (let i = current_entries.length - 1; i >= 0; i--) {
        if (current_entries[i].key === delta_key) {
          current_entries.splice(i, 1);
        }
      }
      continue;
    }

    // Multi-entry keys append
    if (multi_entry_keys.has(delta_key)) {
      current_entries.push({
        key: delta_key,
        raw: delta.raw,
        value: delta.value,
      });
      continue;
    }

    // Single-value keys overwrite or append
    const existing_index = current_entries.findIndex((entry) => entry.key === delta_key);
    if (existing_index !== -1) {
      current_entries[existing_index] = {
        key: delta_key,
        raw: delta.raw,
        value: delta.value,
      };
    } else {
      current_entries.push({
        key: delta_key,
        raw: delta.raw,
        value: delta.value,
      });
    }
  }

  return current_entries.map((entry) => entry.raw).join("\n");
}

/**
 * Converts a canonical past multiline bracket string into candidate memory objects
 * ready for Sieve RAG vector cosine similarity scoring.
 *
 * @param {string} past_text - multiline [KEY: VALUE | flags] string
 * @returns {Array<{ id: string, text: string, is_origin: boolean, weight: number, key: string }>}
 */
export function extract_memory_candidates(past_text) {
  const tokens = parse_brackets(past_text);
  if (!tokens || tokens.length === 0) return [];

  return tokens.map((token, index) => {
    return {
      id: `mem_${index}_${token.key.toLowerCase()}`,
      text: token.value,
      is_origin: Boolean(token.flags.is_origin),
      weight: typeof token.flags.weight === "number" ? token.flags.weight : 5,
      key: token.key,
    };
  });
}
