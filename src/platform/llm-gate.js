/**
 * src/platform/llm-gate.js
 * 🚦 GLOBAL LLM PRIORITY GATE: Serialized, Preemptible Perchance Generation Dispatch
 *
 * Core Responsibilities:
 * - Enforces a single in-flight Perchance text generation at a time. The hosted
 *   text-generation embed serves one stream per client and drops queued requests as
 *   "stale" once its keep-alive threshold is reached, which starves the foreground reply.
 * - Priority scheduling: foreground (user-visible) turns always outrank background
 *   enrichment (memory forge consolidation, optics image-prompt synthesis).
 * - Preemption: when a foreground request arrives while a background generation is
 *   running, the background generation is aborted so the user's reply is never queued
 *   behind opportunistic work.
 * - Exposes queue telemetry so the freeze watchdog can tell "waiting on the LLM gate"
 *   apart from a genuinely hung simulation.
 *
 * No imports: this module is dependency-free so both `platform` and `state` may use it
 * without introducing a layer cycle.
 */

// ============================================================================
// [SECTION 1: PRIORITY CONTRACT]
// ============================================================================

/**
 * Canonical LLM job priorities (higher value = scheduled sooner).
 * @type {Readonly<{ FOREGROUND: number, BACKGROUND: number }>}
 */
export const LLM_PRIORITY = Object.freeze({ FOREGROUND: 10, BACKGROUND: 1 });

// ============================================================================
// [SECTION 2: GATE STATE]
// ============================================================================

/**
 * @typedef {Object} GateJob
 * @property {(signal: AbortSignal) => Promise<any>} run
 * @property {number} priority
 * @property {number} seq
 * @property {(value: any) => void} resolve
 * @property {(error: any) => void} reject
 */

/** @type {GateJob | null} */
let active_job = null;
/** @type {AbortController | null} */
let active_controller = null;
/** @type {number} */
let active_priority = 0;
/** @type {Array<GateJob & { _settled?: boolean }>} */
const waiting = [];
/** @type {number} */
let sequence = 0;
/** How long to wait after a preempt abort before force-releasing a wedged slot (ms). */
const PREEMPT_FALLBACK_MS = 4000;

// ============================================================================
// [SECTION 3: DISPATCH LOOP]
// ============================================================================

/**
 * Releases the gate slot and schedules the next ready job.
 * @param {GateJob} job - The job that owns the current slot
 */
function release_slot(job) {
  if (active_job !== job) return;
  active_job = null;
  active_controller = null;
  active_priority = 0;
  pump();
}

/**
 * Aborts the currently running background job so a waiting foreground job can proceed.
 */
function preempt_active() {
  const job = active_job;
  if (!job || !active_controller) return;
  try {
    active_controller.abort();
  } catch {
    /* Signal already aborted */
  }
  // Safety valve: if the underlying generation ignores `.stop()`, don't wedge the gate.
  const controller = active_controller;
  setTimeout(() => {
    if (active_job === job && active_controller === controller) {
      release_slot(job);
    }
  }, PREEMPT_FALLBACK_MS);
}

/**
 * Starts queued jobs up to the single-slot concurrency limit, preempting background
 * work when a foreground job is waiting.
 */
function pump() {
  if (active_job) {
    const foreground_waiting = waiting.some((job) => job.priority >= LLM_PRIORITY.FOREGROUND);
    if (active_priority < LLM_PRIORITY.FOREGROUND && foreground_waiting) preempt_active();
    return;
  }

  if (waiting.length === 0) return;

  waiting.sort((a, b) => b.priority - a.priority || a.seq - b.seq);
  const job = waiting.shift();
  if (!job) return;

  const controller = new AbortController();
  active_job = job;
  active_controller = controller;
  active_priority = job.priority;

  Promise.resolve()
    .then(() => job.run(controller.signal))
    .then(
      (value) => {
        release_slot(job);
        job.resolve(value);
      },
      (error) => {
        release_slot(job);
        job.reject(error);
      },
    );
}

// ============================================================================
// [SECTION 4: PUBLIC API]
// ============================================================================

/**
 * Enqueues an LLM generation under the global gate.
 * @template T
 * @param {(signal: AbortSignal) => Promise<T>} run - Job body; abort `signal` on preemption.
 * @param {number} [priority=LLM_PRIORITY.FOREGROUND] - Scheduling priority.
 * @returns {Promise<T>}
 */
export function run_llm_job(run, priority = LLM_PRIORITY.FOREGROUND) {
  return new Promise((resolve, reject) => {
    waiting.push({ run, priority, seq: sequence++, resolve, reject });
    pump();
  });
}

/**
 * Reports gate telemetry for diagnostics and the freeze watchdog.
 * @returns {{ active: boolean, active_priority: number, queued: number, foreground_queued: number }}
 */
export function get_llm_gate_status() {
  return {
    active: active_job !== null,
    active_priority,
    queued: waiting.length,
    foreground_queued: waiting.filter((job) => job.priority >= LLM_PRIORITY.FOREGROUND).length,
  };
}

/**
 * Merges a caller AbortSignal with the gate's preemption signal.
 * @param {AbortSignal | undefined | null} caller
 * @param {AbortSignal | undefined | null} gate
 * @returns {AbortSignal | undefined}
 */
export function merge_abort_signals(caller, gate) {
  if (!caller) return gate || undefined;
  if (!gate) return caller;
  if (caller.aborted || gate.aborted) {
    const controller = new AbortController();
    controller.abort();
    return controller.signal;
  }
  if (typeof AbortSignal !== "undefined" && typeof AbortSignal.any === "function") {
    return AbortSignal.any([caller, gate]);
  }
  const controller = new AbortController();
  const relay = () => controller.abort();
  caller.addEventListener("abort", relay, { once: true });
  gate.addEventListener("abort", relay, { once: true });
  return controller.signal;
}

/**
 * CHANGELOG:
 * - 2026-09-25: Created. Serializes Perchance generation behind a single-slot priority
 *   gate so background memory-forge/optics calls can no longer starve the foreground reply
 *   (the "Stream keep alive timeout" / stale-abort freeze class).
 */
