/**
 * src/utils/llm-sanitize.js
 * ============================================================================
 * LLM transport extraction, cognition stripping and JSON recovery.
 * Pure, stateless, domain-agnostic. No imports.
 * Phase 1 unification: moved verbatim from src/utils/text.js and
 * src/data/parser.js. `extract_reasoning_block` naming: the export keeps the
 * canonical name `parse_think_block` (callers + tests pin it); it always
 * returns `think: string` (never null).
 * ============================================================================
 */

/**
 * Model artifact leading prefixes to strip from prose output.
 */
const MODEL_ARTIFACT_PATTERNS = [/^Mattis\b(?:\.\s*Archetypes:[^\n]*\n*|\.|:|\s)*/i];

/**
 * @typedef {Object} ParsedRelationalVector
 * @property {string} source_name - Source node entity name.
 * @property {string} target_name - Target node entity name.
 * @property {string} dynamic - Relationship bond or tension dynamic.
 * @property {string} raw - Original unparsed string.
 */

/**
 * @typedef {Object} StoryTitlePart
 * @property {string} text - Text slice.
 * @property {string} [color] - Entity signature color code.
 */

/**
 * @typedef {Object} HistoryMessage
 * @property {string} [role] - Message turn role.
 * @property {string} [content] - Message primary content.
 * @property {string} [text] - Fallback text content.
 * @property {string} [character_name] - Name of speaking character.
 */

/**
 * @typedef {Object} CollapsedHistoryEntry
 * @property {string} role - Standardized role ("user_persona" | "fractal" | "ai_character").
 * @property {string} name - Entity display name.
 * @property {string} content - Collapsed message content.
 */

// ============================================================================
// [SECTION 2: COGNITION & SANITIZATION UTILITIES]
// ============================================================================

/**
 * Strips cognition blocks (`<thinking>...</thinking>`), leaked <DYNAMICS> state blocks,
 * and model artifacts from prose.
 * @param {string | null | undefined} text - Input text.
 * @returns {string} Cleaned prose without internal thoughts.
 */
export function strip_cognition_blocks(text) {
  if (!text) return "";
  let clean = text.replace(/<think\b[^>]*>[\s\S]*?(?:<\/think\s*>|$)\r?\n?/gi, "");
  clean = clean.replace(/<\/think\s*>/gi, "");
  clean = clean.replace(/<DYNAMICS\b[^>]*>[\s\S]*?(?:<\/DYNAMICS\s*>|$)\r?\n?/gi, "");
  clean = clean.replace(/<\/?DYNAMICS\s*>/gi, "");
  for (const pattern of MODEL_ARTIFACT_PATTERNS) {
    clean = clean.replace(pattern, "");
  }
  return clean.trim();
}

/**
 * Extracts the outermost JSON object from a raw string.
 * Strips markdown code fences and isolates the substring between the first "{" and last "}".
 * @param {string | null | undefined} raw
 * @returns {string | null} Extracted JSON string, or null if no braces found.
 */
export function extract_json_block(raw) {
  if (!raw || typeof raw !== "string") return null;
  const stripped = raw.replace(/```json\n?|```/g, "").trim();
  const first_brace = stripped.indexOf("{");
  const last_brace = stripped.lastIndexOf("}");
  if (first_brace === -1 || last_brace === -1) return null;
  return stripped.substring(first_brace, last_brace + 1);
}

/**
 * Replaces unescaped interior double-quotes with backslashed equivalents (\") inside JSON string values.
 * @param {string} json_string
 * @returns {string}
 */
export function escape_unescaped_json_quotes(json_string) {
  if (typeof json_string !== "string") return json_string;
  return json_string.replace(/:\s*"([\s\S]*?)"(?=,\s*"[^"]+"\s*:|\s*\}|\s*\]|$)/g, (_match, value) => {
    const escaped_value = value.replace(/(?<!\\)"/g, '\\"');
    return `: "${escaped_value}"`;
  });
}

/**
 * Repairs raw control characters (literal newlines/tabs) inside JSON string
 * values so payloads with unescaped newlines (e.g. visualizer thought text)
 * still parse. Operates only inside double-quoted spans.
 * @param {string} json_text
 * @returns {string}
 */
function repair_unescaped_newlines(json_text) {
  let out = "";
  let in_string = false;
  let escaped = false;
  for (let i = 0; i < json_text.length; i++) {
    const ch = json_text[i];
    if (in_string) {
      if (escaped) {
        out += ch;
        escaped = false;
      } else if (ch === "\\") {
        out += ch;
        escaped = true;
      } else if (ch === '"') {
        out += ch;
        in_string = false;
      } else if (ch === "\n") out += "\\n";
      else if (ch === "\r") out += "\\r";
      else if (ch === "\t") out += "\\t";
      else if (ch < " ") out += "\\u" + ch.charCodeAt(0).toString(16).padStart(4, "0");
      else out += ch;
    } else {
      out += ch;
      if (ch === '"') in_string = true;
    }
  }
  return out;
}

/**
 * Safely parses the first JSON object or array contained within raw text/prose.
 * If prefix is supplied (e.g. from startWith), it evaluates raw with and without prefix.
 * Falls back to unescaped-newline repair before giving up.
 * Returns the parsed payload or null if no valid JSON is found.
 * @param {string | null | undefined} raw - Input string potentially containing JSON.
 * @param {object} [options={}]
 * @param {string} [options.prefix=""] - Optional prefill string (e.g. startWith) to reattach if model continued it.
 * @returns {any | null} Parsed object/array or null.
 */
export function safe_parse_json(raw, options = {}) {
  if (!raw || typeof raw !== "string") return null;

  const prefix = typeof options === "string" ? options : options?.prefix || "";
  const candidates = [raw];
  if (prefix) {
    candidates.push(prefix + raw);
  }

  for (const candidate of candidates) {
    const start = candidate.indexOf("{");
    const end = candidate.lastIndexOf("}");

    if (start !== -1 && end !== -1 && end > start) {
      const sliced = candidate.slice(start, end + 1);
      try {
        return JSON.parse(sliced);
      } catch (_) {
        try {
          return JSON.parse(repair_unescaped_newlines(sliced));
        } catch (_) {
          // Continue to array check or next candidate
        }
      }
    }

    const arr_start = candidate.indexOf("[");
    const arr_end = candidate.lastIndexOf("]");
    if (arr_start !== -1 && arr_end !== -1 && arr_end > arr_start) {
      try {
        return JSON.parse(candidate.slice(arr_start, arr_end + 1));
      } catch (_) {
        // Continue to next candidate
      }
    }
  }

  return null;
}

// ============================================================================
// [SECTION 14: LLM PROSE SANITIZATION & NORMALIZATION]
// ============================================================================

/**
 * Detects whether an LLM generation ended abruptly or truncated mid-sentence.
 * Strips `<think>` tags and checks if the terminal character is valid sentence-ending punctuation.
 * @param {string} text
 * @returns {boolean}
 */
export function looks_truncated(text) {
  if (!text || typeof text !== "string") return false;
  if (!text.trim()) return false;

  const stripped = strip_cognition_blocks(text);

  if (!stripped) return true; // Think-only response or empty narrative

  const last_char = stripped[stripped.length - 1];
  const quotes = `"'“”‘’`;

  if (quotes.includes(last_char)) {
    const preceding = stripped.slice(0, -1).trimEnd();
    const prev_last = preceding[preceding.length - 1] || "";
    return !/[.!?…"]/.test(prev_last);
  }

  return !/[.!?…]/.test(last_char);
}

/**
 * Normalizes an LLM raw output result (primitive string or plugin String object with `.text`/`.generatedText`) into plain text.
 * @param {any} raw
 * @returns {string}
 */
export function raw_to_text(raw) {
  if (typeof raw === "string") return raw.trim();
  if (raw && typeof raw === "object") {
    return String(raw.generatedText ?? raw.text ?? "").trim();
  }
  return String(raw ?? "").trim();
}

/**
 * Extracts the server stop reason from a raw Perchance plugin result if attached.
 * @param {any} raw
 * @returns {string}
 */
export function raw_stop_reason(raw) {
  if (raw && typeof raw === "object" && !(raw instanceof String)) return "";
  return raw && typeof raw === "object" && raw.stopReason ? String(raw.stopReason) : "";
}

/**
 * Strips code fences, stray outer quotes, and conversational filler prefixes from LLM output.
 * Preserves `<think>` blocks for DevMode telemetry and database persistence.
 * @param {string} text
 * @returns {string}
 */
export function sanitize_llm(text) {
  if (!text) return "";

  // 1. Strip conversational filler and code fences
  let out = text
    .replace(/^(here is|sure|certainly|i can help|enhanced text:|the enhanced text).*?:/i, "")
    .replace(/^\s*```.*?[\r\n]/gm, "")
    .replace(/```\s*$/gm, "")
    .trim();

  // 2. Outer-quote cleanup: strip leading unmatched quote without destroying trailing dialogue quotes
  if (out.length > 1) {
    const first = out[0];
    if ((first === '"' || first === "'") && out[out.length - 1] !== first) {
      out = out.slice(1).trim();
    }
  }

  return out;
}

/**
 * Parses a raw LLM profile-sorting response into a structured object.
 * Strips cognition blocks and code fences, isolates the outermost JSON object,
 * and returns null on any failure (no braces, malformed JSON).
 *
 * @param {string} raw
 * @returns {Object|null}
 */
export function parse_profile_json(raw) {
  if (typeof raw !== "string") {
    if (raw == null) return null;
    const coerced = typeof raw.text === "string" ? raw.text : String(raw);
    if (!coerced || coerced === "[object Object]") return null;
    raw = coerced;
  }
  const clean = raw
    .replace(/<think>[\s\S]*?<\/think>/gi, "")
    .replace(/```json\n?|```/g, "")
    .trim();
  return safe_parse_json(clean);
}

/**
 * Removes <image_prompt> tags, <image> tags, and Markdown images from text.
 *
 * @param {string|null|undefined} text
 * @returns {string}
 */
export function clean_image_prompts(text) {
  if (!text) return "";
  let clean = text.replace(/<image_prompt>[\s\S]*?<\/image_prompt>/gi, "");
  clean = clean.replace(/<image>[\s\S]*?<\/image>/gi, "");
  clean = clean.replace(/!\[.*?\]\(.*?\)/g, "");
  return clean.trim();
}

/**
 * Extracts <think> blocks from text.
 * Handles partial tags during streaming and merges multiple blocks cleanly.
 *
 * @param {string|null|undefined} text
 * @returns {{ content: string, think: string, prose: string }}
 */
export function parse_think_block(text) {
  if (!text) return { content: "", think: "", prose: "" };

  const think_accumulator = [];

  // 1. Match and extract closed <think>...</think> blocks
  const closed_think_regex = /<think>([\s\S]*?)<\/think>/gi;
  let match;
  while ((match = closed_think_regex.exec(text)) !== null) {
    const raw_block = match[1].replace(/<\/?think>/gi, "").trim();
    if (raw_block) {
      think_accumulator.push(raw_block);
    }
  }

  // Clean closed <think>...</think> blocks from content
  let content = text.replace(/<think>[\s\S]*?<\/think>/gi, "");

  // 2. Check for an unclosed partial block (streaming)
  const think_openers = (text.match(/<think>/gi) || []).length;
  const think_closers = (text.match(/<\/think>/gi) || []).length;

  if (think_openers > think_closers) {
    const lower_text = text.toLowerCase();
    const last_think_index = lower_text.lastIndexOf("<think>");
    if (last_think_index !== -1) {
      const partial_think = text
        .slice(last_think_index)
        .replace(/<\/?think>/gi, "")
        .trim();
      if (partial_think) {
        think_accumulator.push(partial_think);
      }
      content = text.slice(0, last_think_index);
    }
  }

  const think_string = think_accumulator.length > 0 ? think_accumulator.join("\n\n") : "";
  const cleaned_content = content.trim();

  return { content: cleaned_content, prose: cleaned_content, think: think_string || "" };
}

/**
 * Strips private directive brackets across entity boundaries.
 *
 * @param {string|null|undefined} text
 * @returns {string}
 */
export function strip_covert_directives(text) {
  if (!text || typeof text !== "string") return "";
  return text
    .replace(/\[(?:covert|secret|private|hidden)\s*:[^\]]*\]/gi, "")
    .replace(/«(?:covert|secret|private|hidden)(?::[^»]*)?»/gi, "")
    .replace(/[ \t]{2,}/g, " ");
}
