/**
 * src/platform/transport.js
 * 🔌 LLM TRANSPORT LAYER & PERCHANCE AI DRIVER
 *
 * Core Responsibilities:
 * - Single point of communication with the Perchance AI text generation engine (`window.generate_text` / `window.pluginGenerateText`).
 * - Formats prompt instruction blocks: `[System Prefix]` ➔ `[Conversation History]` ➔ `[Task Directive]`.
 * - Bridges streaming tokens to `stream_bridge` (`start`, `update`, `end`) for real-time UI typewriter rendering.
 * - Handles AbortSignal cancellation by invoking Perchance plugin `.stop()` hooks.
 * - Normalizes and sanitizes raw model output (unwrapping `String` objects, stripping outer quotes, code fences, and conversational filler).
 * - Provides a mock streaming driver for local development and offline automated testing.
 *
 * Dependencies & Cross-Module Invariants:
 * - `@utils` (`collapse_history`, `escape_xml`, `stream_bridge`): Conversation history formatting and reactive stream dispatch.
 * - Invariant: Transport does NOT alter narrative content or invent prompt rules; it exclusively transports, streams, and cleans.
 */

import { collapse_history, escape_xml, stream_bridge } from "@utils";

// ============================================================================
// [SECTION 1: SANITIZATION & NORMALIZATION UTILITIES]
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

  const stripped = text
    .replace(/<think>[\s\S]*?<\/think>/gi, "")
    .replace(/<\/?think>/gi, "")
    .trim();

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

// ============================================================================
// [SECTION 2: ENGINE RESOLUTION & ENVIRONMENT PROBE]
// ============================================================================

let _resolved_ai_engine = null;

/**
 * Resolves the Perchance AI generation engine across global and window.parent scopes.
 * @returns {Function | null}
 */
function get_ai_engine() {
  if (_resolved_ai_engine) {
    if (typeof _resolved_ai_engine === "function") return _resolved_ai_engine;
    _resolved_ai_engine = null;
  }

  if (typeof window === "undefined") return null;

  try {
    if (typeof window.generate_text === "function") return (_resolved_ai_engine = window.generate_text);
  } catch {
    /* Ignore sandbox access */
  }

  try {
    if (typeof window.pluginGenerateText === "function") return (_resolved_ai_engine = window.pluginGenerateText);
  } catch {
    /* Ignore sandbox access */
  }

  try {
    // @ts-ignore
    if (typeof generate_text === "function") return (_resolved_ai_engine = generate_text);
  } catch {
    /* Ignore undefined global */
  }

  try {
    // @ts-ignore
    if (typeof pluginGenerateText === "function") return (_resolved_ai_engine = pluginGenerateText);
  } catch {
    /* Ignore undefined global */
  }

  try {
    if (typeof window.parent !== "undefined") {
      // @ts-ignore
      if (typeof window.parent.generate_text === "function") return (_resolved_ai_engine = window.parent.generate_text);
      // @ts-ignore
      if (typeof window.parent.pluginGenerateText === "function") return (_resolved_ai_engine = window.parent.pluginGenerateText);
    }
  } catch {
    /* Cross-origin sandbox boundary guard */
  }

  return null;
}

// ============================================================================
// [SECTION 3: CONVERSATION HISTORY ENCODING]
// ============================================================================

/**
 * Formats message history into an XML-tagged conversation block for instruction assembly.
 * Collapses consecutive messages from the same character label into a single entry.
 * @param {Array<{role: string, content?: string, text?: string, character_name?: string}>} messages
 * @returns {string}
 */
export function format_conversation_history(messages) {
  const collapsed = collapse_history(messages, { separator: "\n\n" });
  if (!collapsed || collapsed.length === 0) return "";

  return collapsed
    .map((entry) => {
      const label = entry.name || (entry.role === "USER_PERSONA" ? "User" : entry.role === "FRACTAL" ? "Fractal" : "Character");
      return `  <entry role="${escape_xml(entry.role)}" name="${escape_xml(label)}">${escape_xml(entry.content)}</entry>`;
    })
    .join("\n");
}

// ============================================================================
// [SECTION 4: CORE LLM SERVICE & GENERATION DRIVER]
// ============================================================================

/**
 * @typedef {Object} PromptPayload
 * @property {string} [system] - The stable system prompt prefix.
 * @property {string} [task] - The volatile task directive.
 * @property {Array<{role: string, content?: string, text?: string, character_name?: string}>} [messages] - Conversation history.
 * @property {string} [startWith] - Prefix to force model generation to begin with.
 * @property {string} [role] - Generation speaker role (e.g. 'ai', 'fractal').
 * @property {string} [node_id] - UI node identifier for stream targeting.
 * @property {string[]} [stopSequences] - Sequence triggers that halt generation.
 */

/**
 * @typedef {Object} GenerationOptions
 * @property {boolean} [silent] - Suppress streaming UI and non-fatal logs.
 * @property {boolean} [raw] - Skip post-processing sanitization and preserve plugin objects.
 * @property {((token: string) => void)} [onToken] - Streaming token callback.
 * @property {boolean} [json] - Hint for structured JSON output.
 * @property {AbortSignal} [signal] - Abort controller signal for cancellation.
 */

export const llm_service = {
  /**
   * Transforms draft text into visceral, in-character narrative based on entity profile directives.
   * @param {PromptPayload} payload
   * @returns {Promise<string>}
   */
  async enhance(payload) {
    const result = await this.generate(payload, { silent: true, raw: true });
    return typeof result === "string" ? sanitize_llm(result) : result;
  },

  /**
   * Primary prompt execution and streaming method.
   * @param {PromptPayload} payload
   * @param {GenerationOptions} [options]
   * @returns {Promise<string | any>}
   */
  async generate(payload, options = {}) {
    const ai_engine = get_ai_engine();

    if (!ai_engine || typeof ai_engine !== "function") {
      const is_mockable =
        typeof window !== "undefined" &&
        !(typeof process !== "undefined" && process.env.VITEST) &&
        (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1" || import.meta.env.DEV);

      if (is_mockable) {
        console.warn("[llm_service] AI engine function not found. Running in local Mock Mode.");
        return await llm_service._mock_generate(payload, options);
      }

      const msg =
        "LLM Engine Unavailable: window.generate_text or window.pluginGenerateText not found. This simulation requires the Perchance AI plugin.";
      if (!options.silent) console.error(msg);
      throw new Error(msg);
    }

    // 1. Assemble instruction block: [System Prefix] ➔ [Conversation History] ➔ [Task Directive]
    const chat_history = format_conversation_history(payload.messages || []);
    let instruction = payload.system || "";

    if (chat_history) {
      instruction += `\n\n<CONVERSATION_HISTORY>\n${chat_history}\n</CONVERSATION_HISTORY>`;
    }
    if (payload.task) {
      instruction += `\n\n${payload.task}`;
    }

    try {
      // 2. Prepare Perchance plugin parameters
      const gen_options = {
        stop_sequences: payload.stopSequences || [],
        startWith: payload.startWith || undefined,
        signal: options.signal,
        silent: options.silent,
      };

      // 3. Connect streaming to the app layer
      if (!options.silent && !stream_bridge.is_active()) {
        const role = payload.role || "ai";
        stream_bridge.start(payload.node_id || "temp", role);
      }

      /** @param {any} data */
      const on_chunk = (data) => {
        const chunk = typeof data === "string" ? data : data?.textChunk || "";
        if (!options.silent) {
          stream_bridge.update(chunk);
        }
        if (options.onToken) {
          options.onToken(chunk);
        }
      };

      // 4. Execute generation with AbortSignal bridge to plugin `.stop()`
      if (options.signal?.aborted) {
        const err = new Error("Generation aborted by caller.");
        err.name = "AbortError";
        throw err;
      }

      let result;
      let abort_listener = null;

      try {
        const generation = ai_engine(instruction, {
          ...gen_options,
          onToken: on_chunk,
          onChunk: on_chunk,
        });

        if (options.signal && typeof generation?.stop === "function") {
          if (options.signal.aborted) {
            generation.stop();
          } else {
            abort_listener = () => generation.stop();
            options.signal.addEventListener("abort", abort_listener);
          }
        }

        result = await generation;

        if (options.signal?.aborted) {
          const err = new Error("Generation aborted by caller.");
          err.name = "AbortError";
          throw err;
        }
      } catch (clone_err) {
        if (String(clone_err).includes("DataClone") || String(clone_err).includes("could not be cloned")) {
          console.warn("[llm_service] Cross-origin function proxy rejected streaming callbacks. Retrying without stream.");
          result = await ai_engine(instruction, {
            ...gen_options,
          });
        } else {
          throw clone_err;
        }
      } finally {
        if (abort_listener && options.signal) {
          options.signal.removeEventListener("abort", abort_listener);
        }
      }

      // 5. Coerce plugin String object to primitive string or preserve for raw inspection
      if (result != null && typeof result !== "string") {
        const stop_reason = result.stopReason;
        const text = String(result.text ?? result.generatedText ?? result);
        if (options.raw) {
          const kept = new String(text);
          // @ts-ignore
          kept.stopReason = stop_reason;
          // @ts-ignore
          kept.text = text;
          // @ts-ignore
          kept.generatedText = result.generatedText;
          result = kept;
        } else {
          result = text;
        }
      }

      if (typeof result === "string" && !options.raw) {
        result = sanitize_llm(result);
      }

      return result;
    } catch (err) {
      if (!options.silent) {
        stream_bridge.end();
      }
      if (options.silent) {
        console.warn("[llm_service] Silent generation error (suppressed):", err);
        throw err;
      }

      const err_string = String(err);
      if (err_string.includes("stream keep alive") || err_string.includes("timeout")) {
        console.error("[llm_service] Network error:", err);
        throw new Error(`Connection lost with the Abyss.`, { cause: err });
      }
      throw err;
    }
  },

  /**
   * Returns a standard mock message for testing.
   * @returns {string}
   */
  get_mock_message() {
    return `<think>Evaluating physical variables and drafting response vector.</think>\n\nHere's a "long quote, with *italics* and **bold** and even ***both***". Just the *italics* and just the **bold** and here's ***both***.`;
  },

  /**
   * Internal simulation driver for offline and mock environments.
   * @param {PromptPayload} payload
   * @param {GenerationOptions} [options]
   * @returns {Promise<string>}
   */
  async _mock_generate(payload, options = {}) {
    const text = llm_service.get_mock_message();
    const chunk_size = 4;
    let index = 0;

    while (index < text.length) {
      if (options.signal?.aborted) {
        const err = new Error("Generation aborted by caller.");
        err.name = "AbortError";
        throw err;
      }

      const end = Math.min(index + chunk_size, text.length);
      const chunk = text.slice(index, end);

      if (options.onToken) options.onToken(chunk);

      if (!options.silent) {
        if (!stream_bridge.is_active()) {
          const role = payload.role || "ai";
          stream_bridge.start(payload.node_id || "temp", role);
        }
        stream_bridge.update(chunk);
      }

      index = end;
      await new Promise((resolve) => setTimeout(resolve, 15));
    }

    if (typeof text === "string" && !options.raw) {
      return sanitize_llm(text);
    }
    return text;
  },

  /**
   * Backwards-compatible alias for format_conversation_history.
   * @param {Array<{role: string, content?: string, text?: string, character_name?: string}>} messages
   * @returns {string}
   */
  _format_history(messages) {
    return format_conversation_history(messages);
  },
};

// ============================================================================
// [CHANGELOG]
// ============================================================================
/**
 * CHANGELOG:
 * - 2026-08-29: Applied /harmonize protocol: added Universal File Architecture header block,
 *   structured section dividers, extracted named `format_conversation_history` export, normalized
 *   method declarations, and added comprehensive unit test suite.
 * - 2026-08-20: Added AbortSignal bridge to Perchance plugin `.stop()`, String object raw property
 *   preservation (`stopReason`), and prefix-cache optimized instruction formatting.
 */
