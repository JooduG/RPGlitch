/**
 * src/utils/job-queue.js
 * 🔀 ASYNCHRONOUS JOB QUEUE: Concurrency & Background Worker Pool
 *
 * Core Responsibilities:
 * - Manages asynchronous execution of non-critical background jobs (Memory Forge, visual prompt synthesis,
 *   Dexie checkpoints, ghost sweeps) without blocking the critical narrative path or UI.
 * - Concurrency Control: Throttles execution up to `max_concurrency` parallel workers.
 * - Latest-Pending Coalescing: Tasks enqueued with `{ latest: true }` supersede older still-queued
 *   `latest` tasks, ensuring only the freshest snapshot executes while superseded promises resolve `{ superseded: true }`.
 * - Error Isolation: Worker rejections settle individual job promises without stalling subsequent queue draining.
 * - Queue Teardown: `clear()` cancels unstarted queued tasks with `{ cleared: true }` while active workers finish.
 */

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
 * @property {string} [story_id] - Lifecycle gate: story this task belongs to.
 * @property {number} [round] - Lifecycle gate: round this task belongs to.
 */

/**
 * @typedef {Object} JobQueue
 * @property {<T>(task: () => Promise<T>, options?: JobRunOptions) => Promise<T | { superseded: true } | { cleared: true }>} run - Enqueues an async task.
 * @property {() => boolean} is_busy - Returns true if any task is executing or queued.
 * @property {() => void} clear - Cancels all pending unstarted jobs.
 */

/** @type {Readonly<{ cleared: true }>} */
export const CLEARED_RESULT = Object.freeze({ cleared: true });

/** @type {Readonly<{ superseded: true }>} */
export const SUPERSEDED_RESULT = Object.freeze({ superseded: true });

/** @type {Readonly<{ stale: true }>} */
export const STALE_RESULT = Object.freeze({ stale: true });

// ============================================================================
// [SECTION 2: JOB QUEUE FACTORY]
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
   * Current lifecycle context. Jobs enqueued with a story_id/round older than
   * this resolve `{ stale: true }` instead of executing.
   * @type {{ story_id?: string|null, round?: number|null }}
   */
  let lifecycle = { story_id: null, round: null };

  /**
   * Advances the lifecycle gate: pending jobs gated to an older story or
   * round resolve `{ stale: true }` without executing.
   * @param {{ story_id?: string|null, round?: number|null }} [context={}]
   */
  function advance(context = {}) {
    if (context?.story_id !== undefined) lifecycle.story_id = context.story_id;
    if (context?.round !== undefined) lifecycle.round = context.round;
  }

  /**
   * True when a gated job predates the current lifecycle context.
   */
  function is_stale(job) {
    if (job.story_id != null && lifecycle.story_id != null && String(job.story_id) !== String(lifecycle.story_id)) return true;
    if (job.round != null && lifecycle.round != null && Number(job.round) !== Number(lifecycle.round)) return true;
    return false;
  }

  /**
   * @type {Array<{
   *   task: () => Promise<any>,
   *   latest: boolean,
   *   superseded: boolean,
   *   story_id?: string|null,
   *   round?: number|null,
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

      if (is_stale(job)) {
        job.resolve(STALE_RESULT);
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

        const job = {
          task,
          latest: is_latest,
          superseded: false,
          story_id: opts?.story_id ?? null,
          round: opts?.round ?? null,
          resolve,
          reject,
        };

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

    /**
     * Advances the lifecycle gate (see `advance` above).
     * @param {{ story_id?: string|null, round?: number|null }} [context={}]
     */
    advance(context = {}) {
      advance(context);
    },
  };
}

/**
 * CHANGELOG:
 * - 2026-08-29: Applied /harmonize protocol: added Universal File Architecture header block,
 *   structured section dividers, defined JobQueue JSDoc typedefs, exported frozen settlement
 *   tokens (CLEARED_RESULT, SUPERSEDED_RESULT), and verified 100% test pass.
 * - 2026-06-15: Added latest-pending task superseding and error isolation.
 */
