/**
 * src/engine/legacy-transport.js
 * ============================================================================
 * 🔌 LLM TRANSPORT ENGINE (MIGRATED FROM PLATFORM)
 * ============================================================================
 *
 * Provides the legacy llm_service singleton for callers during Phase 1-3
 * migration before total intelligence/state eradication.
 * ============================================================================
 */

import { stream_bridge, sanitize_llm, merge_abort_signals } from "@utils";
import { LLM_PRIORITY, get_llm_gate_status, run_llm_job } from "./gate.js";

function get_ai_engine() {
  if (typeof window === "undefined") return null;

  if (typeof window.generate_text === "function") return window.generate_text;
  if (typeof window.generateText === "function") return window.generateText;
  if (typeof window.pluginGenerateText === "function") return window.pluginGenerateText;

  try {
    if (window.parent && window.parent !== window) {
      if (typeof window.parent.generate_text === "function") return window.parent.generate_text;
      if (typeof window.parent.generateText === "function") return window.parent.generateText;
      if (typeof window.parent.pluginGenerateText === "function") return window.parent.pluginGenerateText;
    }
  } catch {
    // Cross-origin iframe boundary
  }

  return null;
}

export const llm_service = {
  async enhance(payload) {
    const result = await this.generate(payload, { silent: true, raw: true });
    return typeof result === "string" ? sanitize_llm(result) : result;
  },

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

    const priority = options.priority === "background" ? LLM_PRIORITY.BACKGROUND : LLM_PRIORITY.FOREGROUND;
    return run_llm_job((gate_signal) => this._execute_generation(ai_engine, payload, options, gate_signal), priority);
  },

  async _execute_generation(ai_engine, payload, options, gate_signal) {
    options = { ...options, signal: merge_abort_signals(options.signal, gate_signal) };
    const instruction = String(payload.system || "").trim();

    try {
      const gen_options = {
        stop_sequences: payload.stopSequences || [],
        startWith: payload.startWith || undefined,
        signal: options.signal,
        silent: options.silent,
      };

      if (!options.silent) {
        const role = payload.role || "ai";
        stream_bridge.start(payload.node_id || "temp", role);
      }

      let raw_result;
      try {
        raw_result = await ai_engine({
          instruction: () => instruction,
          ...gen_options,
          onToken: (chunk) => {
            if (options.onToken) options.onToken(chunk);
            if (!options.silent) stream_bridge.update(chunk);
          },
          onChunk: (chunk) => {
            const text_piece = typeof chunk === "string" ? chunk : chunk?.textChunk || "";
            if (options.onToken) options.onToken(text_piece);
            if (!options.silent) stream_bridge.update(text_piece);
          },
        });
      } catch (stream_err) {
        const err_msg = stream_err?.message || "";
        const is_clone_error =
          err_msg.includes("DataCloneError") ||
          err_msg.includes("clone") ||
          err_msg.includes("could not be cloned") ||
          err_msg.includes("cross-origin");

        if (is_clone_error) {
          console.warn("[llm_service] Cross-origin function proxy rejected streaming callbacks. Retrying without stream.");
          raw_result = await ai_engine({
            instruction: () => instruction,
            ...gen_options,
          });
        } else {
          throw stream_err;
        }
      }

      if (!options.silent) {
        stream_bridge.end();
      }

      const normalized = typeof raw_result === "string" ? raw_result : String(raw_result?.generatedText ?? raw_result?.text ?? raw_result ?? "");

      if (options.raw) {
        return raw_result;
      }

      return sanitize_llm(normalized);
    } catch (err) {
      if (!options.silent) {
        stream_bridge.end();
      }
      if (err.name === "AbortError" || options.signal?.aborted) {
        return "";
      }
      throw err;
    }
  },

  gate_status() {
    return get_llm_gate_status();
  },

  get_mock_message() {
    return `<think>Evaluating physical variables and drafting response vector.</think>\n\nHere's a "long quote, with *italics* and **bold** and even ***both***". Just the *italics* and just the **bold** and here's ***both***.`;
  },

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
};
