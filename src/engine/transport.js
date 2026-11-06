/**
 * src/engine/transport.js
 * ============================================================================
 * 📜 STREAMING TRANSPORT GATEWAY & DI BOUNDARY
 * ============================================================================
 *
 * Lightweight, dependency-injected streaming transport interface.
 * Handles sequential single-concurrency execution and stop-sequence enforcement.
 *
 * Zero speculative features (no slash command interceptors or retry loops in Gate 1).
 * ============================================================================
 */

/**
 * Creates a streaming transport instance.
 *
 * @param {object} [options]
 * @param {(prompt: string, options: { onChunk: (chunk: string) => void, stopSequences?: string[], signal?: AbortSignal }) => Promise<string>} [options.stream_fn]
 * @param {number} [options.max_concurrency=1]
 * @returns {{ stream: (prompt: string, options?: { onChunk?: (chunk: string) => void, stopSequences?: string[], signal?: AbortSignal }) => Promise<string>, is_busy: () => boolean, stop: () => boolean }}
 */
export function create_transport({ stream_fn = null, max_concurrency = 1 } = {}) {
  let active_count = 0;
  let active_stream_handle = null;
  const queue = [];

  const execute_stream =
    stream_fn ||
    (async () => {
      throw new Error("No stream_fn provided to transport.");
    });

  async function process_queue() {
    if (active_count >= max_concurrency || queue.length === 0) return;

    active_count++;
    const { prompt, options, resolve, reject } = queue.shift();

    try {
      let accumulated = "";
      const wrapped_on_chunk = (chunk) => {
        // Handle both Perchance data object ({ textChunk }) and plain string
        const text_piece = typeof chunk === "string" ? chunk : chunk?.textChunk || "";
        accumulated += text_piece;
        if (options.onChunk) {
          options.onChunk(text_piece);
        }
      };

      const stream_promise = execute_stream(prompt, {
        ...options,
        onChunk: wrapped_on_chunk,
        stopSequences: options.stopSequences || [],
      });

      // Retain handle for cancellation via .stop()
      active_stream_handle = stream_promise;

      const result = await stream_promise;

      // Extract resolved text string (handles Perchance String object with .text)
      const raw_resolved = typeof result === "string" ? result : result?.text || accumulated;
      // DIAGNOSTIC (resolve-divergence, removable): log which result field won and their lengths.
      try {
        if (typeof result !== "string" && result != null) {
          const picked = result?.text != null ? "text" : "accumulated";
          console.log(
            "[resolve-divergence] engine transport picked=" +
              picked +
              " " +
              JSON.stringify({
                text: typeof result?.text === "string" ? result.text.length : null,
                generatedText: typeof result?.generatedText === "string" ? result.generatedText.length : null,
                accumulated: accumulated.length,
              }),
          );
        }
      } catch {
        /* diagnostic must never throw */
      }

      resolve(raw_resolved);
    } catch (err) {
      reject(err);
    } finally {
      active_stream_handle = null;
      active_count--;
      process_queue();
    }
  }

  return {
    is_busy() {
      return active_count > 0;
    },
    stop() {
      let stopped = false;
      if (active_stream_handle && typeof active_stream_handle.stop === "function") {
        active_stream_handle.stop();
        stopped = true;
      }
      // Drain and reject all pending queue items to prevent orphaned executions
      while (queue.length > 0) {
        const pending = queue.shift();
        pending.reject(new Error("Stream aborted by user."));
        stopped = true;
      }
      return stopped;
    },
    async stream(prompt, options = {}) {
      if (options.signal?.aborted) {
        throw new Error("Stream aborted by user.");
      }
      return new Promise((resolve, reject) => {
        if (options.signal) {
          const on_abort = () => {
            const index = queue.findIndex((item) => item.resolve === resolve);
            if (index !== -1) {
              queue.splice(index, 1);
            }
            reject(new Error("Stream aborted by user."));
          };
          options.signal.addEventListener("abort", on_abort, { once: true });
        }
        queue.push({ prompt, options, resolve, reject });
        process_queue();
      });
    },
  };
}
