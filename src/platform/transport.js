/**
 * @file src/platform/transport.js
 *
 * 🔌 LLM SERVICE    The Transport Layer
 *
 * PURPOSE
 * LlmService is the single point of contact with the Perchance AI plugin
 * (window.generate_text or window.pluginGenerateText). All callers—the engine, the enhancement UI, Echo—route here.
 *
 * RESPONSIBILITIES
 * - Streaming : Connects token output to stream_bridge.start / update / end.
 * - Sanitization: Strips quotes, code fences, and conversational filler.
 * - Resilience : Classifies network errors and re-throws typed messages.
 *
 * WHAT IT IS NOT
 * LlmService has no opinion on prompt content. It injects no rules and knows
 * nothing about the narrative. It only sends and receives.
 */

import { collapse_history, escape_xml, stream_bridge } from "@utils";

/************************************************************************************
 * [SECTION: SANITIZATION]
 * ----------------------------------------------------------------------------------
 * Shared text-cleaning applied post-LLM to ensure clean, diegetic output.
 * Strips artifacts that Perchance AI frequently adds: code fences, filler
 * phrases, and outer quotation marks.
 ************************************************************************************/
/**
 * Detects a mid-sentence / truncated generation. Strips think blocks and checks
 * whether the remaining prose ends on terminal punctuation. Think-only responses
 * (no prose at all) also count as truncated. A trailing quote is treated as a
 * valid dialogue close only if a punctuation mark precedes it (a stray opening
 * quote at the end means the line was cut).
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
  if (!stripped) return true; // think-only or empty prose = cut before any narrative
  const last = stripped[stripped.length - 1];
  const quotes = `"'“”‘’`;
  if (quotes.includes(last)) {
    const prev = stripped.slice(0, -1).trimEnd();
    const prevLast = prev[prev.length - 1] || "";
    return !/[.!?…"]/.test(prevLast);
  }
  return !/[.!?…]/.test(last);
}

/**
 * Normalizes an llm_service raw result (primitive string or String object with
 * `.text`/`.generatedText`/`.stopReason`) into plain text.
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
 * Returns the Director's reason for a truncated/failed output, if the transport
 * surfaced one (server stop reason attached to the raw String object).
 * @param {any} raw
 * @returns {string}
 */
export function raw_stop_reason(raw) {
  if (raw && typeof raw === "object" && !(raw instanceof String)) return "";
  return raw && typeof raw === "object" && raw.stopReason ? String(raw.stopReason) : "";
}

/**
 * Strips code fences, outer quotes, and common conversational filler from LLM output.
 * @param {string} text
 * @returns {string}
 */
export function sanitize_llm(text) {
  if (!text) return "";

  // 1. Clean standard AI filler and artifacts
  // Note: We intentionally DO NOT strip cognition blocks here so they can be
  // saved to the database and rendered in DevMode.
  // _format_history() handles stripping them for the context window.
  let out = text
    .replace(/^(here is|sure|certainly|i can help|enhanced text:|the enhanced text).*?:/i, "")
    .replace(/^\s*```.*?[\r\n]/gm, "")
    .replace(/```\s*$/gm, "")
    .trim();

  // 2. Outer-quote cleanup: strip a LEADING quote only when it is unmatched
  // (a stray opening artifact). Never strip a trailing quote — it is usually
  // the closing mark of in-character dialogue, and wrap_dialogue renders it.
  if (out.length > 1) {
    const first = out[0];
    if ((first === '"' || first === "'") && out[out.length - 1] !== first) {
      out = out.slice(1).trim();
    }
  }

  return out;
}

/************************************************************************************
 * [SECTION: LLM SERVICE]
 * ----------------------------------------------------------------------------------
 * The primary abstraction for window.generate_text. All prompt execution flows through here.
 ************************************************************************************/

let _resolved_ai_engine = null;
let _engine_check_count = 0;

function get_ai_engine() {
  if (_resolved_ai_engine) {
    if (typeof _resolved_ai_engine === "function") return _resolved_ai_engine;
    _resolved_ai_engine = null;
  }

  _engine_check_count++;
  if (typeof window === "undefined") return null;
  try {
    if (typeof window.generate_text === "function") return (_resolved_ai_engine = window.generate_text);
  } catch (_e) {
    /* ignore */
  }
  try {
    if (typeof window.pluginGenerateText === "function") return (_resolved_ai_engine = window.pluginGenerateText);
  } catch (_e) {
    /* ignore */
  }

  try {
    if (typeof generate_text === "function") return (_resolved_ai_engine = generate_text);
  } catch (_e) {
    /* ignore */
  }

  try {
    if (typeof pluginGenerateText === "function") return (_resolved_ai_engine = pluginGenerateText);
  } catch (_e) {
    /* ignore */
  }

  try {
    if (typeof window.parent !== "undefined" && typeof window.parent.generate_text === "function")
      return (_resolved_ai_engine = window.parent.generate_text);
    if (typeof window.parent !== "undefined" && typeof window.parent.pluginGenerateText === "function")
      return (_resolved_ai_engine = window.parent.pluginGenerateText);
  } catch (_e) {
    /* Ignore cross-origin errors if we're somehow sandboxed */
  }
  return null;
}

export const llm_service = {
  /**
   * HIGH-FIDELITY STORYMODE ENHANCER
   * Transforms draft text into visceral, first-person narrative based on
   * field-specific directives from the Entity Definition.
   *
   * @param {Object} payload - The generated enhancement prompt payload.
   * @returns {Promise<string>}
   */
  async enhance(payload) {
    // Use raw: true so generate() returns unprocessed output
    // enhance() owns its own sanitization pass so it isn't double-stripped.
    const result = await this.generate(payload, { silent: true, raw: true });
    return typeof result === "string" ? sanitize_llm(result) : result;
  },

  /**
   * CORE GENERATION
   * The primary abstraction for window.generate_text. Handles streaming state,
   * network resilience, and raw token orchestration.
   *
   * @param {Object}  payload                       - The prompt payload.
   * @param {string}  [payload.system]               - The system prompt string (stable prefix).
   * @param {string}  [payload.task]                - The task directive (volatile, placed after history for cache efficiency).
   * @param {Array<{role: string, content?: string, text?: string, character_name?: string}>} [payload.messages] - Conversation history.
   * @param {string}  [payload.startWith]            - Text to force the model response to begin with (native plugin option).
   * @param {string}  [payload.role]                - Optional role for the generation (e.g., 'ai', 'fractal').
   * @param {string}  [payload.node_id]             - UI node ID for the stream.
   * @param {string[]} [payload.stopSequences]       - Stop sequences.
   * @param {Object} [options]                      - Runtime overrides.
   * @param {boolean} [options.silent]              - Suppress streaming UI and console errors.
   * @param {boolean} [options.raw]                 - Skip post-processing sanitization.
   * @param {Function}[options.onToken]             - Per-token streaming callback.
   * @param {boolean} [options.json]                - Request structured JSON output.
   * @param {AbortSignal} [options.signal]          - Abort signal for cancellation.
   * @returns {Promise<string>}
   */
  generate: async (payload, options = {}) => {
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

    // --- BROWSER / PERCHANCE ENGINE ---
    // 1. Format conversation history into a flat readable string
    const chat_history = llm_service._format_history(payload.messages || []);

    // 2. Assemble the final instruction block
    //    Structure: [stable system prefix] → [append-only conversation history] → [volatile task directive]
    //    This ordering maximizes prefix-cache hits: the system block and all prior
    //    history entries form a cached prefix; only the newest entry + task change per turn.
    let instruction = payload.system || "";
    if (chat_history) {
      instruction += `\n\n<CONVERSATION_HISTORY>\n${chat_history}\n</CONVERSATION_HISTORY>`;
    }
    if (payload.task) {
      instruction += `\n\n${payload.task}`;
    }

    try {
      // 3. Prepare generation parameters
      const gen_options = {
        stop_sequences: payload.stopSequences || [],
        startWith: payload.startWith || undefined,
        signal: options.signal,
        silent: options.silent,
      };

      // 4. Wire streaming to the app layer
      if (!options.silent) {
        /** @type {any} */
        const role = payload.role || "ai";
        stream_bridge.start(payload.node_id || "temp", role);
      }

      /**
       * @param {any} data
       */
      const on_chunk = (data) => {
        const chunk = typeof data === "string" ? data : data?.textChunk || "";
        if (!options.silent) {
          stream_bridge.update(chunk);
        }
        if (options.onToken) options.onToken(chunk);
      };

      // 5. Execute via our securely resolved engine instance.
      //    The Perchance ai-text-plugin returns a thenable that also exposes a
      //    `.stop()` method to halt streaming server-side. It does NOT honor
      //    AbortSignal, so we wire the caller's signal to `.stop()` manually.
      let result;
      let abort_listener = null;
      try {
        const generation = ai_engine(instruction, {
          ...gen_options,
          onToken: on_chunk,
          onChunk: on_chunk,
        });
        // Bridge AbortSignal -> plugin .stop(). The plugin's thenable carries
        // a .stop() that posts a stopStream message to its worker iframe.
        if (options.signal && typeof generation?.stop === "function") {
          if (options.signal.aborted) {
            generation.stop();
          } else {
            abort_listener = () => generation.stop();
            options.signal.addEventListener("abort", abort_listener);
          }
        }
        result = await generation;
        // .stop() resolves the promise with partial text (stopReason:"user")
        // rather than rejecting. Convert to AbortError so the orchestrator's
        // catch block treats it as a clean interrupt and skips memory commit.
        if (options.signal?.aborted) {
          const err = new Error("Generation aborted by caller.");
          err.name = "AbortError";
          throw err;
        }
      } catch (cloneErr) {
        if (String(cloneErr).includes("DataClone") || String(cloneErr).includes("could not be cloned")) {
          console.warn("[llm_service] Cross-origin function proxy rejected streaming callbacks. Retrying without stream.");
          result = await ai_engine(instruction, {
            ...gen_options,
          });
        } else {
          throw cloneErr;
        }
      } finally {
        if (abort_listener && options.signal) {
          options.signal.removeEventListener("abort", abort_listener);
        }
      }

      // Stream is left active so orchestrator can gracefully hand off to permanent log

      // 6. Coerce String object from ai-text-plugin to primitive, then sanitize.
      //    The plugin returns `new String(text)` with extra props (.text, .stopReason, etc.)
      //    typeof check fails for String objects, so sanitization was silently skipped.
      //    When `raw` is requested we KEEP the String object so callers can read
      //    `.stopReason` (the server's stop reason — "length" means truncated output).
      if (result != null && typeof result !== "string") {
        const stop_reason = result.stopReason;
        const text = String(result.text ?? result.generatedText ?? result);
        if (options.raw) {
          const kept = new String(text);
          kept.stopReason = stop_reason;
          kept.text = text;
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
        stream_bridge.end(); // Always end stream on error to prevent locking
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
   * Centralized mock message generator for Local Dev & Control Panel tests.
   */
  get_mock_message: () => {
    return `<think>Evaluating physical variables and drafting response vector.</think>\n\nHere's a "long quote, with *italics* and **bold** and even ***both***". Just the *italics* and just the **bold** and here's ***both***.`;
  },

  /**
   * Local Dev/Test mock generation driver to simulate stream rendering.
   * @param {any} payload
   * @param {any} options
   * @returns {Promise<string>}
   */
  _mock_generate: async (payload, options = {}) => {
    const text = llm_service.get_mock_message();

    const chunk_size = 4;
    let index = 0;

    while (index < text.length) {
      if (options.signal?.aborted) {
        throw new Error("Generation aborted by caller.");
      }

      const end = Math.min(index + chunk_size, text.length);
      const chunk = text.slice(index, end);

      const on_chunk = chunk;
      if (options.onToken) options.onToken(on_chunk);

      if (!options.silent) {
        if (!stream_bridge.is_active()) {
          const role = payload.role || "ai";
          stream_bridge.start(payload.node_id || "temp", role);
        }
        stream_bridge.update(on_chunk);
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
   * Formats message history into a plain readable string for the instruction block.
   * Collapses consecutive messages from the same character label into a single entry.
   * Skips any system telemetry log entries to prevent prompt pollution.
   * @param {Array<{role: string, content?: string, text?: string, character_name?: string}>} messages
   * @returns {string}
   */
  _format_history: (messages) => {
    const collapsed = collapse_history(messages, { separator: "\n\n" });
    if (collapsed.length === 0) return "";
    return collapsed
      .map((c) => {
        const label = c.name || (c.role === "USER_PERSONA" ? "User" : c.role === "FRACTAL" ? "Fractal" : "Character");
        return `  <entry role="${escape_xml(c.role)}" name="${escape_xml(label)}">${escape_xml(c.content)}</entry>`;
      })
      .join("\n");
  },
};
