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
 * - One chunk pipeline (run_completion): accumulate, onToken/onChunk dedup,
 *   abort merge, cross-origin clone retry, result normalization. Drives the
 *   `streaming` store directly when `!options.silent`; silent callers own
 *   streaming themselves (turn runner forwards chunks via app.*).
 * - Two thin contracts over the core: foreground streaming (transport,
 *   throws on abort) and direct generation with stream side effects
 *   (generate_text, maps aborts to "").
 *
 * Blast radius note: create_live_stream_fn keeps its exact pinned behavior
 * (prompt function-or-string, startWith/stopSequences passthrough, dedup).
 * generate_text keeps mock-or-throw policy and AbortError-to-"" mapping.
 */

import { enqueue_llm_job, merge_abort_signals, resolve_perchance_plugin, resolve_priority } from "@utils";
import { execution } from "@state";
import { sanitize_llm } from "@simulation";

export function get_mock_message() {
  return `<think>Evaluating physical variables and drafting response vector.</think>\n\nHere's a "long quote, with *italics* and **bold** and even ***both***". Just the *italics* and just the **bold** and here's ***both***.`;
}

/**
 * Mock runner: streams the pinned think-block message in fixed chunks.
 * Each chunk is delivered exactly once (onChunk preferred, onToken
 * fallback) so callers never see double-delivery. Drives `streaming`
 * when `!options.silent`, with end_stream() in a finally.
 */
async function run_mock_generation(payload, options = {}) {
  const text = get_mock_message();
  const chunk_size = 4;
  let index = 0;

  const deliver = (chunk) => {
    if (options.onChunk) options.onChunk(chunk);
    else if (options.onToken) options.onToken(chunk);
  };

  if (!options.silent) {
    const role = payload.role || "ai";
    execution.start_stream(payload.node_id || "temp", role);
  }
  try {
    while (index < text.length) {
      if (options.signal?.aborted) {
        const err = new Error("Generation aborted by caller.");
        err.name = "AbortError";
        throw err;
      }

      const end = Math.min(index + chunk_size, text.length);
      const chunk = text.slice(index, end);

      deliver(chunk);
      if (!options.silent) {
        execution.update_stream(chunk);
      }

      index = end;
      await new Promise((resolve) => setTimeout(resolve, 15));
    }

    if (typeof text === "string" && !options.raw) {
      return sanitize_llm(text);
    }
    return text;
  } finally {
    if (!options.silent) {
      execution.end_stream();
    }
  }
}

/** Extracts the text piece from a streamed chunk (string or { textChunk }). */
function to_piece(chunk) {
  return typeof chunk === "string" ? chunk : chunk?.textChunk || "";
}

/** True when the engine rejected a streaming-callback proxy (cross-origin function clone). */
function is_clone_error(err) {
  const err_msg = err?.message || "";
  return err_msg.includes("DataCloneError") || err_msg.includes("clone") || err_msg.includes("could not be cloned") || err_msg.includes("cross-origin");
}

/** Result precedence for completion: explicit text wins, then generatedText,
 * then what we accumulated. A non-text result object with empty accumulation
 * passes through untouched (enhance_text pins this for exotic engine shapes). */
function normalize_completion_result(res, accumulated) {
  if (typeof res === "string") return res;
  if (res?.text || res?.generatedText) return res.text || res.generatedText;
  if (accumulated) return accumulated;
  if (res != null && typeof res === "object") return res;
  return "";
}

function is_abort_error(err, signal) {
  return err?.name === "AbortError" || String(err?.message || "").includes("aborted") || signal?.aborted;
}

function safe_stop_generation(generation) {
  try {
    generation.stop();
  } catch {
    /* engine teardown is best-effort */
  }
}

/**
 * Unified completion core: accumulates chunks, guards against
 * onToken/onChunk double-delivery, merges abort signals, wires .stop().
 *
 * - Drives `streaming` (start/update/end) when `!options.silent`; silent
 *   callers own streaming themselves.
 * - `options.throw_on_abort` selects the abort contract: foreground
 *   streaming throws so chrono can roll back; direct generation resolves ""
 *   so background callers never throw on cancellation.
 */
async function run_completion(ai_engine, job, options = {}, gate_signal = null) {
  const effective_signal = merge_abort_signals(options.signal, gate_signal);

  const fail_from_abort = () => {
    const err = new Error("Stream aborted by user.");
    err.name = "AbortError";
    if (options.throw_on_abort) throw err;
    return "";
  };

  if (effective_signal?.aborted) {
    return fail_from_abort();
  }

  const system_text = typeof job.system === "string" ? job.system : "";
  const prompt_text = typeof job.prompt === "string" ? job.prompt : "";
  const instruction = () => {
    if (typeof job.prompt === "function") return job.prompt();
    if (typeof job.system === "function") return job.system();
    return system_text.trim() || prompt_text || String(job.prompt ?? job.system ?? "");
  };
  const role = job.role || "ai";
  const node_id = job.node_id || "temp";

  let accumulated = "";

  // Deduplication guard: once onToken fires, onChunk echoes are skipped.
  let token_streamed = false;

  const handle_chunk = (chunk) => {
    const piece = to_piece(chunk);
    if (!piece) return;
    accumulated += piece;
    if (!options.silent) execution.update_stream(piece);
    if (options.onChunk) {
      options.onChunk(piece);
    }
  };

  const gen_options = {
    startWith: options.startWith != null ? String(options.startWith) : "",
    stopSequences: options.stopSequences || options.stop_sequences || [],
    stop_sequences: options.stopSequences || options.stop_sequences || [],
    signal: effective_signal,
  };
  const handlers = {
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
  };

  if (!options.silent) {
    execution.start_stream(node_id, role);
  }
  try {
    // Invoke WITHOUT awaiting so the engine's .stop() handle survives;
    // wire it to the effective signal before the first await (the old
    // async wrapper awaited internally, stripping .stop and leaving the
    // wiring branch dead).
    let generation;
    try {
      generation = ai_engine({ instruction, ...gen_options, ...handlers });
    } catch (sync_err) {
      if (!is_clone_error(sync_err)) throw sync_err;
      generation = ai_engine({ instruction, ...gen_options });
    }

    if (effective_signal && generation && typeof generation.stop === "function") {
      if (effective_signal.aborted) safe_stop_generation(generation);
      else effective_signal.addEventListener("abort", () => safe_stop_generation(generation), { once: true });
    }

    let res;
    try {
      res = await generation;
    } catch (err) {
      if (!is_clone_error(err)) throw err;
      res = await ai_engine({ instruction, ...gen_options });
    }
    return normalize_completion_result(res, accumulated);
  } catch (err) {
    if (is_abort_error(err, effective_signal) && !options.throw_on_abort) {
      return "";
    }
    throw err;
  } finally {
    if (!options.silent) {
      execution.end_stream();
    }
  }
}

/**
 * Creates a live browser streaming function backed by window AI plugins.
 * Without an engine it falls back to the mock runner (dev/test).
 * Foreground contract: throws on abort so callers can roll back.
 */
export function create_live_stream_fn() {
  return (prompt, options = {}) => {
    const ai_engine = resolve_perchance_plugin("generate_text");

    if (!ai_engine || typeof ai_engine !== "function") {
      return run_mock_generation({ role: options.role || "ai", node_id: options.node_id }, options);
    }

    const priority = resolve_priority(options.priority);

    return enqueue_llm_job(
      (gate_signal) => run_completion(ai_engine, { prompt, role: options.role, node_id: options.node_id }, { ...options, throw_on_abort: true }, gate_signal),
      priority,
    );
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
 * Direct generation with stream side effects.
 * Background contract: maps aborts to "" so background callers never throw
 * on cancellation.
 */
export async function generate_text(payload, options = {}) {
  const ai_engine = resolve_perchance_plugin("generate_text");

  if (!ai_engine || typeof ai_engine !== "function") {
    const is_mockable =
      typeof window !== "undefined" &&
      !(typeof process !== "undefined" && process.env.VITEST) &&
      (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1" || import.meta.env.DEV);

    if (is_mockable) {
      console.warn("[generate_text] AI engine function not found. Running in local Mock Mode.");
      return await run_mock_generation(payload, options);
    }

    const msg = "LLM Engine Unavailable: window.generate_text or window.pluginGenerateText not found. This simulation requires the Perchance AI plugin.";
    if (!options.silent) console.error(msg);
    throw new Error(msg);
  }

  const priority = resolve_priority(options.priority);
  return enqueue_llm_job((gate_signal) => run_completion(ai_engine, payload, { ...options, throw_on_abort: false }, gate_signal), priority);
}

/**
 * Silent refinement helper: normalizes { text, generatedText } payloads
 * before sanitizing so engine result objects never leak through raw.
 */
export async function enhance_text(payload) {
  const result = await generate_text(payload, { silent: true, raw: true });
  const text_value = typeof result === "string" ? result : (result?.text ?? result?.generatedText);
  return typeof text_value === "string" ? sanitize_llm(text_value) : result;
}

/**
 * CHANGELOG:
 * - 2026-11-10: Created from bridge.js transport atoms (T1-T8): single engine
 *   probe, single mock runner, single chunk pipeline shared by foreground and
 *   direct contracts. Fixes onToken/onChunk double-delivery on the direct path.
 *   Renames get_gate_stream/reset_gate_stream to get_transport/reset_transport.
 * - Phase 5: Unified transport_completion + direct_completion into a single
 *   run_completion core (silent-gated streaming drive, .stop() wired before
 *   the first await, single text-first result normalization). Mock runner
 *   deduplicates onToken/onChunk and ends the stream in a finally.
 *   enhance_text normalizes { text, generatedText } before sanitize_llm.
 */
