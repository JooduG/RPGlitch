/**
 * src/utils/queue.js
 * 🔀 UNIFIED ASYNC QUEUE & GLOBAL LLM PRIORITY GATE
 *
 * Single home for background execution control (Phase 1 Rank 0 unification of
 * src/utils/job-queue.js + src/engine/gate.js):
 * - Bounded worker queue (concurrency throttle, latest-pending coalescing,
 *   error isolation, teardown) for non-critical background jobs.
 * - Global LLM priority gate (single in-flight generation, foreground
 *   preemption over background work, watchdog telemetry).
 *
 * 100% self-contained: only imports canonical timing constants from @config.
 */

import { TIMING_MS } from "@config";

// ============================================================================
// [SECTION 1: JSDOC SCHEMAS & TYPE DEFINITIONS]
// ============================================================================

/**
 * @typedef {Object} JobQueueOptions
 * @property {number} [max_concurrency=1] - Maximum number of simultaneously executing async jobs.
 */

/**
 * @typedef {Object} JobRunOptions
 * @property {boolean} [latest=false] - If true, supersedes older still-queued latest tasks.
 */

/**
 * @typedef {Object} JobQueue
 * @property {<T>(task: () => Promise<T>, options?: JobRunOptions) => Promise<T | { superseded: true } | { cleared: true }>} run - Enqueues an async task.
 * @property {() => boolean} is_busy - Returns true if any task is executing or queued.
 * @property {() => void} clear - Cancels all pending unstarted jobs.
 * @property {number} queue_length - Count of pending waiting jobs.
 */

/** @type {Readonly<{ cleared: true }>} */
export const CLEARED_RESULT = Object.freeze({ cleared: true });

/** @type {Readonly<{ superseded: true }>} */
export const SUPERSEDED_RESULT = Object.freeze({ superseded: true });

// ============================================================================
// [SECTION 2: BOUNDED WORKER QUEUE FACTORY]
// ============================================================================

/**
 * Creates an asynchronous concurrency-controlled job queue.
 * @param {JobQueueOptions} [options={}]
 * @returns {JobQueue}
 */
export function create_job_queue(options = {}) {
  const max_concurrency = Math.max(1, Number(options?.max_concurrency) || 1);
  let active_count = 0;

  /**
   * @type {Array<{
   *   task: () => Promise<any>,
   *   latest: boolean,
   *   superseded: boolean,
   *   resolve: (value: any) => void,
   *   reject: (error: any) => void
   * }>}
   */
  const waiting = [];

  /**
   * Drains ready tasks up to the concurrency limit.
   */
  function drain() {
    while (active_count < max_concurrency && waiting.length > 0) {
      const job = waiting.shift();
      if (!job) break;

      if (job.superseded) {
        job.resolve(SUPERSEDED_RESULT);
        continue;
      }

      active_count += 1;
      Promise.resolve()
        .then(() => job.task())
        .then(
          (value) => {
            active_count -= 1;
            job.resolve(value);
            drain();
          },
          (error) => {
            active_count -= 1;
            job.reject(error);
            drain();
          },
        );
    }
  }

  return {
    /**
     * Enqueues an async task; resolves with its return value or cancellation flag.
     * @template T
     * @param {() => Promise<T>} task
     * @param {JobRunOptions} [opts={}]
     * @returns {Promise<T | { superseded: true } | { cleared: true }>}
     */
    run(task, opts = {}) {
      return new Promise((resolve, reject) => {
        const is_latest = !!opts?.latest;

        const job = { task, latest: is_latest, superseded: false, resolve, reject };

        if (is_latest) {
          // Supersede all older pending latest tasks
          for (let i = waiting.length - 1; i >= 0; i--) {
            if (waiting[i].latest) {
              waiting[i].superseded = true;
            }
          }
        }

        waiting.push(job);
        drain();
      });
    },

    /**
     * Checks if the queue has running workers or queued jobs.
     * @returns {boolean}
     */
    is_busy() {
      return active_count > 0 || waiting.length > 0;
    },

    /**
     * Returns the count of pending waiting jobs.
     * @returns {number}
     */
    get queue_length() {
      return waiting.length;
    },

    /**
     * Cancels all pending unstarted tasks; running workers finish normally.
     */
    clear() {
      const leftover = waiting.splice(0, waiting.length);
      for (const job of leftover) {
        job.resolve(CLEARED_RESULT);
      }
    },
  };
}

// ============================================================================
// [SECTION 3: GLOBAL LLM PRIORITY GATE]
// ============================================================================

/** Foreground (user-visible) turns outrank background work (caretaker/optics). */
export const LLM_PRIORITY = Object.freeze({ FOREGROUND: 10, BACKGROUND: 1 });

/** @type {any} */
let active_job = null;
/** @type {AbortController | null} */
let active_controller = null;
/** @type {number} */
let active_priority = 0;
/** @type {Array<any>} */
const waiting = [];
/** @type {number} */
let sequence = 0;
/** @type {ReturnType<typeof setTimeout> | null} */
let preempt_timer = null;

function clear_preempt_timer() {
  if (preempt_timer !== null) {
    clearTimeout(preempt_timer);
    preempt_timer = null;
  }
}

function release_slot(job) {
  if (active_job !== job) return;
  active_job = null;
  active_controller = null;
  active_priority = 0;
  clear_preempt_timer();
  pump();
}

function preempt_active() {
  const job = active_job;
  if (!job || !active_controller) return;
  try {
    active_controller.abort();
  } catch {
    /* Signal already aborted */
  }
  const controller = active_controller;
  clear_preempt_timer();
  preempt_timer = setTimeout(() => {
    if (active_job === job && active_controller === controller) {
      preempt_timer = null;
      release_slot(job);
    } else {
      preempt_timer = null;
    }
  }, TIMING_MS.INTERACTION);
}

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

/**
 * Enqueues an LLM generation under the global gate (single in-flight).
 * @template T
 * @param {(signal: AbortSignal) => Promise<T>} run - Job body; abort `signal` on preemption.
 * @param {number} [priority=LLM_PRIORITY.FOREGROUND] - Scheduling priority.
 * @returns {Promise<T>}
 */
export function enqueue_llm_job(run, priority = LLM_PRIORITY.FOREGROUND) {
  return new Promise((resolve, reject) => {
    waiting.push({ run, priority, seq: sequence++, resolve, reject });
    pump();
  });
}

/**
 * Maps a transport priority name to its gate constant (single home for the
 * foreground/background string boundary; model/transport layers speak lowercase).
 * @param {string} [priority_name] - "background" for background work, anything else foreground.
 * @returns {number} LLM_PRIORITY member.
 */
export function resolve_priority(priority_name) {
  return priority_name === "background" ? LLM_PRIORITY.BACKGROUND : LLM_PRIORITY.FOREGROUND;
}

/**
 * Reports gate telemetry for diagnostics and the freeze watchdog.
 * @returns {{ active: boolean, active_priority: number, queued: number, foreground_queued: number }}
 */
export function get_queue_status() {
  return {
    active: active_job !== null,
    active_priority,
    queued: waiting.length,
    foreground_queued: waiting.filter((job) => job.priority >= LLM_PRIORITY.FOREGROUND).length,
  };
}

/**
 * Resets gate state (strictly for test suites). Aborts the in-flight job and
 * clears any pending preemption watchdog so no stale timer can release a
 * future slot.
 */
export function reset_queue_for_testing() {
  if (active_controller) {
    try {
      active_controller.abort();
    } catch {
      /* Signal already aborted */
    }
  }
  clear_preempt_timer();
  active_job = null;
  active_controller = null;
  active_priority = 0;
  waiting.length = 0;
  sequence = 0;
}

/**
 * CHANGELOG:
 * - 2026-11-17: Phase 1 Rank 0 — created by merging job-queue.js (verbatim worker
 *   queue) + engine/gate.js (renamed run_llm_job -> enqueue_llm_job,
 *   get_llm_gate_status -> get_queue_status, _reset_gate_for_testing ->
 *   reset_queue_for_testing; preempt watchdog is now tracked and cleared on
 *   reset alongside an abort of the in-flight controller).
 */
