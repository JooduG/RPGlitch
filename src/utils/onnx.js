/**
 * src/utils/onnx.js
 * ⚙️ ONNX / WASM RUNTIME COORDINATION & INFERENCE MUTEX
 *
 * Core Responsibilities:
 * - Serializes inference across the shared `ort-wasm` runtime (semantic embeddings + Kokoro-82M TTS).
 * - Eliminates race conditions and memory heap collisions on single-threaded WASM heaps.
 * - Coordinates one-shot runtime readiness (`mark_ort_ready` / `wait_ort_ready`) so secondary subsystems
 *   never attempt WebGPU / WASM device session initialization while the primary runtime is mid-initialization.
 * - Provides clean test resets (`reset_ort_ready_for_testing`) for deterministic test isolation.
 *
 * Consumed by:
 * - `src/platform/embeddings.svelte.js` (Embeddings pipeline creation and inference calls).
 * - `src/media/audio.svelte.js` (Kokoro-82M TTS model loading and speech synthesis).
 */

// ============================================================================
// [SECTION 1: ONNX MUTEX SERIALIZATION ENGINE]
// ============================================================================

/**
 * Global mutex for WebAssembly ONNX runtime execution.
 * Serializes async WASM inference tasks to protect shared memory heaps.
 */
export class OnnxMutex {
  /** @type {Array<() => Promise<void>>} */
  #queue = [];
  #active = false;

  /**
   * Enqueues an async ONNX inference task for sequential execution.
   * @template T
   * @param {() => Promise<T>} fn - Inference or initialization task.
   * @returns {Promise<T>} Resolves with the task output or rejects on worker failure.
   */
  async run(fn) {
    return new Promise((resolve, reject) => {
      this.#queue.push(async () => {
        try {
          const result = await fn();
          resolve(result);
        } catch (err) {
          reject(err);
        }
      });
      this.#process();
    });
  }

  /**
   * Drains the serialized execution queue sequentially.
   * @returns {Promise<void>}
   */
  async #process() {
    if (this.#active) return;
    this.#active = true;

    while (this.#queue.length > 0) {
      const task = this.#queue.shift();
      try {
        if (task) await task();
      } catch (_error) {
        // Individual task errors are captured and routed to the task promise in run()
      }
    }

    this.#active = false;
  }

  /**
   * Checks if an ONNX task is currently executing or queued.
   * @returns {boolean}
   */
  is_busy() {
    return this.#active || this.#queue.length > 0;
  }

  /**
   * Returns current count of queued waiting tasks.
   * @returns {number}
   */
  get queue_length() {
    return this.#queue.length;
  }
}

/**
 * Singleton instance of the ONNX execution mutex.
 */
export const onnx_mutex = new OnnxMutex();

// ============================================================================
// [SECTION 2: RUNTIME READINESS SIGNAL & HANDSHAKE]
// ============================================================================

/** @type {(() => void) | null} */
let _ort_ready_resolve = null;

/** @type {Promise<void>} */
let _ort_ready = new Promise((resolve) => {
  _ort_ready_resolve = resolve;
});

/**
 * Signals that the shared ONNX runtime has successfully initialized.
 * Typically invoked by the embeddings pipeline upon successful model construction.
 */
export function mark_ort_ready() {
  _ort_ready_resolve?.();
}

/**
 * Awaits the ONNX runtime readiness signal or times out.
 * @param {number} [timeout_ms=45000] - Maximum wait duration before proceeding.
 * @returns {Promise<void>}
 */
export function wait_ort_ready(timeout_ms = 45000) {
  return Promise.race([_ort_ready, new Promise((resolve) => setTimeout(resolve, timeout_ms))]);
}

/**
 * Resets the runtime readiness signal. Used exclusively in automated tests.
 */
export function reset_ort_ready_for_testing() {
  _ort_ready = new Promise((resolve) => {
    _ort_ready_resolve = resolve;
  });
}

// ============================================================================
// [CHANGELOG]
// ============================================================================
/**
 * CHANGELOG:
 * - 2026-08-29: Applied /harmonize protocol: added Universal File Architecture header block,
 *   structured section dividers, exported OnnxMutex class alongside singleton, added is_busy()
 *   and queue_length inspection, added reset_ort_ready_for_testing(), and added unit test suite.
 * - 2026-06-15: Initial ONNX mutex and boot readiness coordination for Kokoro TTS and embeddings.
 */
