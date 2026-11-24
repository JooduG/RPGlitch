/**
 * @file src/engine/transport.js
 * Single home for LLM transport: plugin discovery, local mock fallback,
 * priority-gated streaming, and abort detection.
 */

import { sanitize_llm } from "@simulation";
import { execution } from "@state";
import { enqueue_llm_job, merge_abort_signals, resolve_perchance_plugin } from "@utils";

export function get_mock_message() {
  return `<think>Evaluating physical variables and drafting response vector.</think>\n\nHere's a "long quote, with *italics* and **bold** and even ***both***". Just the *italics* and just the **bold** and here's ***both***.`;
}

/**
 * Checks whether an error or signal represents an aborted generation.
 *
 * @param {unknown} err
 * @param {AbortSignal | null} [signal=null]
 * @returns {boolean}
 */
export function is_abort_error(err, signal = null) {
  const error = /** @type {{ name?: string, message?: string } | null | undefined} */ (err);
  return error?.name === "AbortError" || String(error?.message || "").includes("aborted") || Boolean(signal?.aborted);
}

/**
 * Mock runner: streams the pinned think-block message in fixed chunks.
 * Each chunk is delivered at most once (onChunk preferred, onToken fallback).
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
    execution.start_stream(payload.node_id || "temp", payload.role || "ai");
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

    return !options.raw ? sanitize_llm(text) : text;
  } finally {
    if (!options.silent) {
      execution.end_stream();
    }
  }
}

function to_piece(chunk) {
  return typeof chunk === "string" ? chunk : chunk?.textChunk || "";
}

function is_clone_error(err) {
  const err_msg = err?.message || "";
  return err_msg.includes("DataCloneError") || err_msg.includes("clone") || err_msg.includes("could not be cloned") || err_msg.includes("cross-origin");
}

function normalize_completion_result(res, accumulated) {
  if (typeof res === "string") return res;
  if (res?.text || res?.generatedText) return res.text || res.generatedText;
  if (accumulated) return accumulated;
  if (res != null && typeof res === "object") return res;
  return "";
}

function safe_stop_generation(generation) {
  try {
    generation.stop();
  } catch {
    /* engine teardown is best-effort */
  }
}

/**
 * Unified completion core: accumulates chunks, deduplicates onToken/onChunk,
 * merges abort signals, and wires generation.stop() before the first await.
 */
async function run_completion(ai_engine, job, options = {}, gate_signal = null) {
  const effective_signal = merge_abort_signals(options.signal, gate_signal);

  if (effective_signal?.aborted) {
    const err = new Error("Stream aborted by user.");
    err.name = "AbortError";
    throw err;
  }

  const system_text = typeof job.system === "string" ? job.system : "";
  const prompt_text = typeof job.prompt === "string" ? job.prompt : "";
  const instruction = () => {
    if (typeof job.prompt === "function") return job.prompt();
    if (typeof job.system === "function") return job.system();
    return system_text.trim() || prompt_text || String(job.prompt ?? job.system ?? "");
  };

  let accumulated = "";
  let token_streamed = false;

  const handle_chunk = (chunk) => {
    const piece = to_piece(chunk);
    if (!piece) return;
    accumulated += piece;
    if (!options.silent) execution.update_stream(piece);
    if (options.onChunk) options.onChunk(piece);
  };

  const stop_sequences = options.stopSequences || options.stop_sequences || [];
  const gen_options = {
    startWith: options.startWith != null ? String(options.startWith) : "",
    stopSequences: stop_sequences,
    stop_sequences,
    signal: effective_signal,
  };
  const handlers = {
    onToken: (chunk) => {
      token_streamed = true;
      handle_chunk(chunk);
    },
    onChunk: (chunk) => {
      if (!token_streamed) handle_chunk(chunk);
    },
  };

  if (!options.silent) {
    execution.start_stream(job.node_id || "temp", job.role || "ai");
  }
  try {
    // Invoke without awaiting so generation.stop() survives until signal wiring.
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
  } finally {
    if (!options.silent) {
      execution.end_stream();
    }
  }
}

/**
 * Creates a live browser streaming function backed by the Perchance AI plugin,
 * falling back to the local mock runner when no plugin is present.
 */
export function create_live_stream_fn() {
  return (prompt, options = {}) => {
    const ai_engine = resolve_perchance_plugin("generate_text");

    if (!ai_engine || typeof ai_engine !== "function") {
      return run_mock_generation({ role: options.role || "ai", node_id: options.node_id }, options);
    }

    return enqueue_llm_job(
      (gate_signal) => run_completion(ai_engine, { prompt, role: options.role, node_id: options.node_id }, options, gate_signal),
      options.priority,
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
