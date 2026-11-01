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

export const DEFAULT_STOP_SEQUENCES = [];

/**
 * Creates a streaming transport instance.
 *
 * @param {object} [options]
 * @param {(prompt: string, options: { onChunk: (chunk: string) => void, stopSequences?: string[], signal?: AbortSignal }) => Promise<string>} [options.stream_fn]
 * @param {number} [options.max_concurrency=1]
 * @returns {{ stream: (prompt: string, options?: { onChunk?: (chunk: string) => void, stopSequences?: string[], signal?: AbortSignal }) => Promise<string>, is_busy: () => boolean }}
 */
export function create_transport({ stream_fn = null, max_concurrency = 1 } = {}) {
  let active_count = 0;
  let active_stream_handle = null;
  const queue = [];

  const default_mock_stream = async (_prompt, { onChunk }) => {
    const mock_response = "Alice steps forward, her eyes scanning the dim catwalk.";
    if (onChunk) {
      onChunk(mock_response);
    }
    return mock_response;
  };

  const execute_stream = stream_fn || default_mock_stream;

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
        stopSequences: options.stopSequences || DEFAULT_STOP_SEQUENCES,
      });

      // Retain handle for cancellation via .stop()
      active_stream_handle = stream_promise;

      const result = await stream_promise;

      // Extract resolved text string (handles Perchance String object with .text)
      const raw_resolved = typeof result === "string" ? result : result?.text || accumulated;

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
      if (active_stream_handle && typeof active_stream_handle.stop === "function") {
        active_stream_handle.stop();
        return true;
      }
      return false;
    },
    async stream(prompt, options = {}) {
      return new Promise((resolve, reject) => {
        queue.push({ prompt, options, resolve, reject });
        process_queue();
      });
    },
  };
}
