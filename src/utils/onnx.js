/**
 * src/utils/onnx.js
 * ⚙️ ONNX/WASM RUNTIME COORDINATION
 * Serializes inference across the shared ort-wasm runtime (embeddings + Kokoro
 * TTS) and sequences its one-time initialization, so concurrent WASM users can
 * never collide on ort-wasm memory heaps or fire a device session mid-init.
 */
/**
 * Global mutex for WebAssembly ONNX runtime execution.
 * Prevents concurrent WASM inference calls (e.g. Kokoro TTS vs Embeddings)
 * from colliding on shared ort-wasm memory heaps and crashing.
 */
class OnnxMutex {
  #queue = [];
  #active = false;

  /**
   * Enqueues an async ONNX inference task for sequential execution.
   * @template T
   * @param {() => Promise<T>} fn
   * @returns {Promise<T>}
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

  async #process() {
    if (this.#active) return;
    this.#active = true;
    while (this.#queue.length > 0) {
      const task = this.#queue.shift();
      try {
        if (task) await task();
      } catch (_e) {
        // Individual task errors are captured by the promise returned in run()
      }
    }
    this.#active = false;
  }
}

export const onnx_mutex = new OnnxMutex();

/**
 * One-shot readiness signal for the shared ort-wasm runtime. The embeddings
 * pipeline is the first ort user at boot; once it constructs, ort-wasm is
 * fully initialized. Kokoro's loader awaits this before attempting any device
 * so a webgpu session never fires while ort-wasm is still mid-initialization
 * (that aborts the in-flight init and fails every backend with "WebAssembly
 * is not initialized yet").
 */
let _ort_ready_resolve = null;
const _ort_ready = new Promise((resolve) => {
  _ort_ready_resolve = resolve;
});

export function mark_ort_ready() {
  _ort_ready_resolve?.();
}

export function wait_ort_ready(timeout_ms = 45000) {
  return Promise.race([_ort_ready, new Promise((resolve) => setTimeout(resolve, timeout_ms))]);
}
