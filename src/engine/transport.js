/**
 * src/engine/transport.js
 * ============================================================================
 * 🚇 ENGINE TRANSPORT
 * ============================================================================
 *
 * The single home for talking to the language model: engine discovery,
 * mock fallback, the shared gate-backed transport, and the unified
 * streaming completion core.
 *
 * - One engine probe (window then parent frame).
 * - One mock runner (chunked think-block message, same pipeline as live).
 * - One chunk pipeline (accumulate, onToken/onChunk dedup, abort merge,
 *   cross-origin clone retry, result normalization).
 * - Two thin contracts over the core: foreground streaming (transport) and
 *   direct generation with stream-bridge side effects (generate_text).
 *
 * Blast radius note: create_live_stream_fn keeps its exact pinned behavior
 * (prompt function-or-string, startWith/stopSequences passthrough, dedup);
 * generate_text keeps mock-or-throw policy and AbortError-to-"" mapping.
 */

import { resolve_priority, run_llm_job } from "./gate.js";
import { merge_abort_signals } from "../utils/resilience.js";
import { stream_bridge, sanitize_llm } from "../utils/index.js";

export function get_mock_message() {
  return `<think>Evaluating physical variables and drafting response vector.</think>\n\nHere's a "long quote, with *italics* and **bold** and even ***both***". Just the *italics* and just the **bold** and here's ***both***.`;
}

function resolve_ai_engine() {
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

async function run_mock_generation(payload, options = {}) {
  const text = get_mock_message();
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

    if (options.onChunk) options.onChunk(chunk);
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
}

/** Extracts the text piece from a streamed chunk (string or { textChunk }). */
function to_piece(chunk) {
  return typeof chunk === "string" ? chunk : chunk?.textChunk || "";
}

/**
 * Invokes the model once, retrying without streaming callbacks when a
 * cross-origin function proxy rejects streaming (DataCloneError).
 */
async function invoke_with_retry(ai_engine, instruction, gen_options, handlers) {
  try {
    return await ai_engine({ instruction, ...gen_options, ...handlers });
  } catch (err) {
    const err_msg = err?.message || "";
    const is_clone_error =
      err_msg.includes("DataCloneError") ||
      err_msg.includes("clone") ||
      err_msg.includes("could not be cloned") ||
      err_msg.includes("cross-origin");
    if (is_clone_error) {
      return await ai_engine({ instruction, ...gen_options });
    }
    throw err;
  }
}

/** Result precedence for foreground streaming: explicit text wins, then generatedText, then what we accumulated. */
function normalize_transport_result(res, accumulated) {
  return typeof res === "string" ? res : res?.text || res?.generatedText || accumulated;
}

/** Result precedence for direct generation: generatedText wins, then text, then raw. */
function normalize_direct_result(res) {
  return typeof res === "string" ? res : String(res?.generatedText ?? res?.text ?? res ?? "");
}

/**
 * Foreground streaming completion: accumulates chunks, guards against
 * onToken/onChunk double-delivery, merges abort signals, wires .stop().
 * Never touches the stream bridge — callers forward chunks themselves.
 */
function transport_completion(ai_engine, prompt, options, gate_signal) {
  return new Promise((resolve, reject) => {
    const effective_signal = merge_abort_signals(options.signal, gate_signal);

    if (effective_signal?.aborted) {
      reject(new Error("Stream aborted by user."));
      return;
    }
    let accumulated = "";

    // Deduplication guard: once onToken fires, onChunk echoes are skipped.
    let token_streamed = false;

    const handle_chunk = (chunk) => {
      const piece = to_piece(chunk);
      if (!piece) return;
      accumulated += piece;
      if (options.onChunk) {
        options.onChunk(piece);
      }
    };

    const instruction = () => (typeof prompt === "function" ? prompt() : String(prompt || ""));

    let generation;
    try {
      generation = invoke_with_retry(
        ai_engine,
        instruction,
        {
          startWith: options.startWith != null ? String(options.startWith) : "",
          stopSequences: options.stopSequences || options.stop_sequences || [],
          stop_sequences: options.stopSequences || options.stop_sequences || [],
          signal: effective_signal,
        },
        {
          onToken: (chunk) => {
            token_streamed = true;
            handle_chunk(chunk);
          },
          onChunk: (chunk) => {
            // Only handle if onToken is not actively processing to prevent double-counting
            if (!token_streamed) {
              handle_chunk(chunk);
            }
          },
        },
      );
    } catch (err) {
      reject(err);
      return;
    }

    if (effective_signal && typeof generation?.stop === "function") {
      effective_signal.addEventListener("abort", () => generation.stop(), { once: true });
    }

    if (generation && typeof generation.then === "function") {
      generation
        .then((res) => {
          resolve(normalize_transport_result(res, accumulated));
        })
        .catch(reject);
    } else {
      resolve(accumulated);
    }
  });
}

/**
 * Creates a live browser streaming function backed by window AI plugins.
 * Without an engine it falls back to the mock runner (dev/test).
 */
export function create_live_stream_fn() {
  return (prompt, options = {}) => {
    const ai_engine = resolve_ai_engine();

    if (!ai_engine || typeof ai_engine !== "function") {
      return run_mock_generation({ role: options.role || "ai", node_id: options.node_id }, options);
    }

    const priority = resolve_priority(options.priority);

    return run_llm_job((gate_signal) => transport_completion(ai_engine, prompt, options, gate_signal), priority);
  };
}

let _shared_transport = null;

/** Shared gate-backed transport adapter for the active session. */
export function get_transport() {
  if (!_shared_transport) {
    _shared_transport = Object.freeze({
      stream: (prompt, options = {}) => {
        const stream_fn = create_live_stream_fn();
        return stream_fn(prompt, options);
      },
    });
  }
  return _shared_transport;
}

export function reset_transport() {
  _shared_transport = null;
}

/**
 * Direct generation with stream-bridge lifecycle side effects.
 * Maps aborts to "" so background callers never throw on cancellation.
 */
async function direct_completion(ai_engine, payload, options, gate_signal) {
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

    // Dedup guard (transport core parity): once onToken fires, onChunk echoes are skipped.
    let token_streamed = false;
    const bridge_update = (piece) => {
      if (!options.silent) stream_bridge.update(piece);
    };

    const raw_result = await invoke_with_retry(ai_engine, () => instruction, gen_options, {
      onToken: (chunk) => {
        token_streamed = true;
        if (options.onToken) options.onToken(chunk);
        bridge_update(to_piece(chunk));
      },
      onChunk: (chunk) => {
        if (token_streamed) return;
        const text_piece = to_piece(chunk);
        if (options.onToken) options.onToken(text_piece);
        if (!options.silent) stream_bridge.update(text_piece);
      },
    });

    if (!options.silent) {
      stream_bridge.end();
    }

    const normalized = normalize_direct_result(raw_result);

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
}

export async function generate_text(payload, options = {}) {
  const ai_engine = resolve_ai_engine();

  if (!ai_engine || typeof ai_engine !== "function") {
    const is_mockable =
      typeof window !== "undefined" &&
      !(typeof process !== "undefined" && process.env.VITEST) &&
      (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1" || import.meta.env.DEV);

    if (is_mockable) {
      console.warn("[generate_text] AI engine function not found. Running in local Mock Mode.");
      return await run_mock_generation(payload, options);
    }

    const msg =
      "LLM Engine Unavailable: window.generate_text or window.pluginGenerateText not found. This simulation requires the Perchance AI plugin.";
    if (!options.silent) console.error(msg);
    throw new Error(msg);
  }

  const priority = resolve_priority(options.priority);
  return run_llm_job((gate_signal) => direct_completion(ai_engine, payload, options, gate_signal), priority);
}

export async function enhance_text(payload) {
  const result = await generate_text(payload, { silent: true, raw: true });
  return typeof result === "string" ? sanitize_llm(result) : result;
}

/**
 * CHANGELOG:
 * - 2026-11-10: Created from bridge.js transport atoms (T1-T8): single engine
 *   probe, single mock runner, single chunk pipeline shared by foreground and
 *   direct contracts. Fixes onToken/onChunk double-delivery on the direct path.
 *   Renames get_gate_stream/reset_gate_stream to get_transport/reset_transport.
 */
