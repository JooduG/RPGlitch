/**
 * @file src/platform/transport.js
 *
 * 🔌 LLM SERVICE    The Transport Layer
 *
 * PURPOSE
 * LlmService is the single point of contact with the Perchance AI plugin
 * (window.ai or window.pluginAi). All callers—the engine, the enhancement UI, Echo—route here.
 *
 * RESPONSIBILITIES
 * - Streaming : Connects token output to app.start_stream / update_stream / end_stream.
 * - Sanitization: Strips quotes, code fences, and conversational filler.
 * - Resilience : Classifies network errors and re-throws typed messages.
 *
 * WHAT IT IS NOT
 * LlmService has no opinion on prompt content. It injects no rules and knows
 * nothing about the narrative. It only sends and receives.
 */

import { strip_cognition_blocks, escapeXml } from "@intelligence";
import { app } from "@state";

/************************************************************************************
 * [SECTION: SANITIZATION]
 * ----------------------------------------------------------------------------------
 * Shared text-cleaning applied post-LLM to ensure clean, diegetic output.
 * Strips artifacts that Perchance AI frequently adds: code fences, filler
 * phrases, and outer quotation marks.
 ************************************************************************************/
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
  return text
    .replace(/^(here is|sure|certainly|i can help|enhanced text:|the enhanced text).*?:/i, "")
    .replace(/^["']|[ "']$/g, "")
    .replace(/^\s*```.*?[\r\n]/gm, "")
    .replace(/```\s*$/gm, "")
    .trim();
}

/************************************************************************************
 * [SECTION: LLM SERVICE]
 * ----------------------------------------------------------------------------------
 * The primary abstraction for window.ai. All prompt execution flows through here.
 ************************************************************************************/
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
   * The primary abstraction for window.ai. Handles streaming state,
   * network resilience, and raw token orchestration.
   *
   * @param {Object}  payload                       - The prompt payload.
   * @param {string}  [payload.system]               - The system prompt string.
   * @param {Array<{role: string, content?: string, text?: string, character_name?: string}>} [payload.messages] - Conversation history.
   * @param {string}  [payload.startWith]           - Text to prepend to the model response.
   * @param {string}  [payload.role]                - Optional role for the generation (e.g., 'ai', 'fractal').
   * @param {string}  [payload.node_id]             - UI node ID for the stream.
   * @param {any}  [payload.params]              - Generation parameters.
   * @param {string[]} [payload.stopSequences]       - Stop sequences.
   * @param {Object} [options]                      - Runtime overrides.
   * @param {boolean} [options.silent]              - Suppress streaming UI and console errors.
   * @param {boolean} [options.raw]                 - Skip post-processing sanitization.
   * @param {number}  [options.temperature]         - Override temperature.
   * @param {number}  [options.top_p]               - Override top_p.
   * @param {number}  [options.repetition_penalty]  - Override repetition penalty.
   * @param {number}  [options.max_tokens]           - Override max tokens.
   * @param {string}  [options.model]               - Override model.
   * @param {Function}[options.onToken]             - Per-token streaming callback.
   * @param {boolean} [options.json]                - Request structured JSON output.
   * @param {AbortSignal} [options.signal]          - Abort signal for cancellation.
   * @returns {Promise<string>}
   */
  generate: async (payload, options = {}) => {
    // [SAFETY] Guard against missing plugin in non-Perchance environments
    // Integrates window.pluginAi seamlessly as our native production fallback
    const get_ai_engine = () => {
      if (typeof window === "undefined") return null;
      try {
        if (typeof window.ai === "function") return window.ai;
      } catch (_e) {
        /* ignore */
      }
      try {
        if (typeof window.pluginAi === "function") return window.pluginAi;
      } catch (_e) {
        /* ignore */
      }

      try {
        if (typeof ai === "function") return ai;
      } catch (_e) {
        // ignore
      }

      try {
        if (typeof pluginAi === "function") return pluginAi; // eslint-disable-line no-undef
      } catch (_e) {
        // ignore
      }

      // Debug log removed to prevent SecurityError from cross-origin window.parent access.

      try {
        if (typeof window.parent !== "undefined" && typeof window.parent.ai === "function") return window.parent.ai;
        if (typeof window.parent !== "undefined" && typeof window.parent.pluginAi === "function") return window.parent.pluginAi;
      } catch (_e) {
        // Ignore cross-origin errors if we're somehow sandboxed
      }
      return null;
    };

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

      const msg = "LLM Engine Unavailable: window.ai or window.pluginAi not found. This simulation requires the Perchance AI plugin.";
      if (!options.silent) console.error(msg);
      throw new Error(msg);
    }

    // --- BROWSER / PERCHANCE ENGINE ---
    // 1. Format conversation history into a flat readable string
    const chat_history = llm_service._format_history(payload.messages || []);

    // 2. Assemble the final instruction block
    let instruction = payload.system || "";
    if (chat_history) {
      if (instruction.endsWith("</SYSTEM>")) {
        instruction =
          instruction.substring(0, instruction.length - 10) + `\n\n<CONVERSATION_HISTORY>\n${chat_history}\n</CONVERSATION_HISTORY>\n</SYSTEM>`;
      } else {
        instruction += `\n\n<CONVERSATION_HISTORY>\n${chat_history}\n</CONVERSATION_HISTORY>`;
      }
    }
    if (payload.startWith) {
      instruction += `\n\n[START RESPONSE WITH]\n${payload.startWith}`;
    }

    try {
      // 3. Prepare generation parameters
      const gen_options = {
        temperature: options.temperature ?? payload.params?.temperature ?? 0.8,
        top_p: options.top_p ?? payload.params?.top_p,
        repetition_penalty: options.repetition_penalty ?? payload.params?.repetition_penalty,
        max_tokens: options.max_tokens ?? payload.params?.max_tokens,
        model: options.model ?? payload.params?.model,
        stop_sequences: payload.stopSequences || [],
        signal: options.signal,
        silent: options.silent,
      };

      // 4. Wire streaming to the app layer
      /**
       * @param {any} data
       */
      const on_chunk = (data) => {
        const chunk = typeof data === "string" ? data : data?.textChunk || "";
        if (!options.silent) {
          if (!app.streaming.active) {
            /** @type {any} */
            const role = payload.role || "ai";
            app.start_stream(payload.node_id || "temp", role);
          }
          app.update_stream(chunk);
        }
        if (options.onToken) options.onToken(chunk);
      };

      // 5. Execute via our securely resolved engine instance
      let result;
      try {
        result = await ai_engine(instruction, {
          ...gen_options,
          onToken: on_chunk,
          onChunk: on_chunk,
        });
      } catch (cloneErr) {
        if (String(cloneErr).includes("DataClone") || String(cloneErr).includes("could not be cloned")) {
          console.warn("[llm_service] Cross-origin function proxy rejected streaming callbacks. Retrying without stream.");
          result = await ai_engine(instruction, {
            ...gen_options,
          });
        } else {
          throw cloneErr;
        }
      }

      // Stream is left active so orchestrator can gracefully hand off to permanent log

      // 6. Sanitize unless caller opted out with raw: true
      if (typeof result === "string" && !options.raw) {
        result = sanitize_llm(result);
      }
      return result;
    } catch (err) {
      if (!options.silent) app.end_stream(); // Always end stream on error to prevent locking
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
    return `<think>Here's a "long quote, with *italics* and **bold** and even ***both***". Just the *italics* and just the **bold** and here's ***both***.</think>\n\nHere's a "long quote, with *italics* and **bold** and even ***both***". Just the *italics* and just the **bold** and here's ***both***.`;
  },

  /**
   * Local Dev/Test mock generation driver to simulate stream rendering.
   * @param {any} payload
   * @param {any} options
   * @returns {Promise<string>}
   */
  _mock_generate: async (payload, options = {}) => {
    const text = llm_service.get_mock_message();

    const chunkSize = 4;
    let index = 0;

    while (index < text.length) {
      if (options.signal?.aborted) {
        throw new Error("Generation aborted by caller.");
      }

      const end = Math.min(index + chunkSize, text.length);
      const chunk = text.slice(index, end);

      const on_chunk = chunk;
      if (options.onToken) options.onToken(on_chunk);

      if (!options.silent) {
        if (!app.streaming.active) {
          const role = payload.role || "ai";
          app.start_stream(payload.node_id || "temp", role);
        }
        app.update_stream(on_chunk);
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
    if (!Array.isArray(messages) || messages.length === 0) return "";
    /** @type {any[]} */
    const collapsed = [];
    for (const m of messages) {
      // Guard against system role telemetry leaks
      if (m.role === "system") continue;

      const roleAttr = m.role === "user" ? "USER_PERSONA" : m.role === "prologue" ? "FRACTAL" : "AI_CHARACTER";
      const label = m.character_name || (m.role === "user" ? "User" : m.role === "prologue" ? "Fractal" : "Character");
      const text = strip_cognition_blocks(m.content || m.text || "").trim();
      if (!text) continue;

      if (collapsed.length > 0 && collapsed[collapsed.length - 1].label === label) {
        collapsed[collapsed.length - 1].text += `\n\n${text}`;
      } else {
        collapsed.push({ roleAttr, label, text });
      }
    }
    return collapsed.map((c) => `  <entry role="${escapeXml(c.roleAttr)}" name="${escapeXml(c.label)}">${escapeXml(c.text)}</entry>`).join("\n");
  },
};
