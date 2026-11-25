/**
 * @file src/utils/async.js
 * Bounded worker queues, single-flight LLM priority gate, abort signal composition,
 * exponential backoff retries, and concurrency-aware circuit breaking.
 */

import { LLM_PRIORITY, PATIENCE_POLICY, TIMING_MS } from "@config";

// ============================================================================
// 1. Bounded Worker Queue
// ============================================================================

/** @type {Readonly<{ cleared: true }>} */
const CLEARED_RESULT = Object.freeze({ cleared: true });

/** @type {Readonly<{ superseded: true }>} */
const SUPERSEDED_RESULT = Object.freeze({ superseded: true });

/**
 * Creates a concurrency-bounded FIFO job queue with optional `latest`-superseding.
 * @param {{ max_concurrency?: number }} [options={}]
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
     * @template T
     * @param {() => Promise<T>} task
     * @param {{ latest?: boolean }} [opts={}]
     * @returns {Promise<T | { superseded: true } | { cleared: true }>}
     */
    run(task, opts = {}) {
      return new Promise((resolve, reject) => {
        const is_latest = !!opts?.latest;
        const job = { task, latest: is_latest, superseded: false, resolve, reject };

        if (is_latest) {
          for (let i = waiting.length - 1; i >= 0; i--) {
            if (waiting[i].latest) waiting[i].superseded = true;
          }
        }

        waiting.push(job);
        drain();
      });
    },

    is_busy() {
      return active_count > 0 || waiting.length > 0;
    },

    get queue_length() {
      return waiting.length;
    },

    clear() {
      const leftover = waiting.splice(0, waiting.length);
      for (const job of leftover) {
        job.resolve(CLEARED_RESULT);
      }
    },
  };
}

// ============================================================================
// 2. Global LLM Priority Gate
// ============================================================================

/** Foreground turns outrank background consolidation/optics jobs. */
// (LLM_PRIORITY lives in @config)

/** @type {any} */
let active_job = null;
/** @type {AbortController | null} */
let active_controller = null;
let active_priority = 0;
/** @type {Array<any>} */
const gate_waiting = [];
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
  active_controller.abort();
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
    const foreground_waiting = gate_waiting.some((job) => job.priority >= LLM_PRIORITY.FOREGROUND);
    if (active_priority < LLM_PRIORITY.FOREGROUND && foreground_waiting) preempt_active();
    return;
  }

  if (gate_waiting.length === 0) return;

  gate_waiting.sort((a, b) => b.priority - a.priority || a.seq - b.seq);
  const job = gate_waiting.shift();
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
 * Enqueues an LLM generation under the single-flight global priority gate.
 * @template T
 * @param {(signal: AbortSignal) => Promise<T>} run
 * @param {number} [priority=LLM_PRIORITY.FOREGROUND]
 * @returns {Promise<T>}
 */
export function enqueue_llm_job(run, priority = "foreground") {
  const numeric_priority = typeof priority === "number" ? priority : resolve_priority(priority);
  return new Promise((resolve, reject) => {
    gate_waiting.push({ run, priority: numeric_priority, seq: sequence++, resolve, reject });
    pump();
  });
}

/**
 * Maps a transport priority string (`"background"` vs foreground) to `LLM_PRIORITY`.
 * @param {string} [priority_name]
 * @returns {number}
 */
function resolve_priority(priority_name) {
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
    queued: gate_waiting.length,
    foreground_queued: gate_waiting.filter((job) => job.priority >= LLM_PRIORITY.FOREGROUND).length,
  };
}

/**
 * Resets global LLM gate state for isolated test suites.
 */
export function reset_queue_for_testing() {
  if (active_controller) {
    active_controller.abort();
  }
  clear_preempt_timer();
  active_job = null;
  active_controller = null;
  active_priority = 0;
  gate_waiting.length = 0;
  sequence = 0;
}

// ============================================================================
// 3. Abort Signals, Exponential Backoff & Circuit Breaker
// ============================================================================

/**
 * Merges two optional `AbortSignal` instances into a single signal.
 * @param {AbortSignal | undefined | null} caller
 * @param {AbortSignal | undefined | null} secondary
 * @returns {AbortSignal | undefined}
 */
export function merge_abort_signals(caller, secondary) {
  if (!caller) return secondary || undefined;
  if (!secondary) return caller;
  if (caller.aborted) return caller;
  if (secondary.aborted) return secondary;
  if (typeof AbortSignal !== "undefined" && typeof AbortSignal.any === "function") {
    return AbortSignal.any([caller, secondary]);
  }
  const controller = new AbortController();
  const relay = (event) => {
    caller.removeEventListener("abort", relay);
    secondary.removeEventListener("abort", relay);
    controller.abort(event?.target?.reason);
  };
  caller.addEventListener("abort", relay, { once: true });
  secondary.addEventListener("abort", relay, { once: true });
  return controller.signal;
}

/**
 * Retries an async operation with exponential backoff delays.
 */
export class ExponentialBackoffRetryer {
  /**
   * @param {{ max_attempts?: number, initial_delay?: number, max_delay?: number }} [options={}]
   */
  constructor(options = {}) {
    this.max_attempts = options.max_attempts ?? PATIENCE_POLICY.HARD_LIMIT;
    this.initial_delay = options.initial_delay ?? TIMING_MS.TICK;
    this.max_delay = options.max_delay ?? TIMING_MS.DELAY;
  }

  /**
   * @template T
   * @param {() => Promise<T>} fn
   * @param {(attempt: number, error: unknown) => void} [on_retry]
   * @returns {Promise<T>}
   */
  async retry(fn, on_retry = () => {}) {
    const max_attempts = Math.max(1, Number(this.max_attempts) || 1);
    let last_error;
    let delay = this.initial_delay;

    for (let attempt = 1; attempt <= max_attempts; attempt++) {
      try {
        return await fn();
      } catch (err) {
        last_error = err;
        if (attempt === max_attempts) break;
        on_retry(attempt, last_error);
        await new Promise((resolve) => setTimeout(resolve, delay));
        delay = Math.min(delay * 2, this.max_delay);
      }
    }

    throw last_error;
  }
}

/**
 * Concurrency-aware circuit breaker (`CLOSED` -> `OPEN` -> `HALF_OPEN`).
 */
export class CircuitBreaker {
  /** @type {"CLOSED" | "OPEN" | "HALF_OPEN"} */
  #state = "CLOSED";
  #failure_count = 0;
  #success_count = 0;
  #last_failure_time = 0;
  #active_count = 0;
  /** @type {Array<{ fn: () => Promise<any>, resolve: (val: any) => void, reject: (err: any) => void }>} */
  #queue = [];

  /**
   * @param {{ failure_threshold?: number, success_threshold?: number, recovery_timeout?: number, max_concurrent?: number }} [options={}]
   */
  constructor(options = {}) {
    this.failure_threshold = options.failure_threshold ?? PATIENCE_POLICY.HARD_LIMIT;
    this.success_threshold = options.success_threshold ?? PATIENCE_POLICY.SOFT_LIMIT;
    this.recovery_timeout = options.recovery_timeout ?? TIMING_MS.STEP;
    this.max_concurrent = options.max_concurrent ?? PATIENCE_POLICY.HARD_LIMIT;
  }

  get state() {
    return this.#state;
  }

  set state(new_state) {
    this.#state = new_state;
  }

  get is_closed() {
    return this.#state === "CLOSED";
  }

  get is_open() {
    return this.#state === "OPEN";
  }

  get is_half_open() {
    return this.#state === "HALF_OPEN";
  }

  get active_count() {
    return this.#active_count;
  }

  get queue_length() {
    return this.#queue.length;
  }

  reset() {
    this.#state = "CLOSED";
    this.#failure_count = 0;
    this.#success_count = 0;
    this.#last_failure_time = 0;
    const pending = this.#queue.splice(0, this.#queue.length);
    for (const item of pending) {
      item?.reject(new Error("Circuit breaker reset. Dropping queued request."));
    }
  }

  /**
   * @template T
   * @param {() => Promise<T>} fn
   * @returns {Promise<T>}
   */
  async execute(fn) {
    this.#evaluate_state();
    if (this.is_open) {
      throw new Error("Circuit breaker is OPEN. Service is temporarily unavailable.");
    }

    return new Promise((resolve, reject) => {
      this.#queue.push({ fn, resolve, reject });
      this.#process_queue();
    });
  }

  async #process_queue() {
    if (this.#active_count >= this.max_concurrent || this.#queue.length === 0) return;

    if (this.is_open) {
      while (this.#queue.length > 0) {
        this.#queue.shift()?.reject(new Error("Circuit breaker opened. Dropping queued request."));
      }
      return;
    }

    const item = this.#queue.shift();
    if (!item) return;

    this.#active_count += 1;
    try {
      const result = await item.fn();
      this.#on_success();
      item.resolve(result);
    } catch (err) {
      this.#on_failure();
      item.reject(err);
    } finally {
      this.#active_count -= 1;
      this.#process_queue();
    }
  }

  #on_success() {
    this.#failure_count = 0;
    if (!this.is_half_open) return;
    this.#success_count += 1;
    if (this.#success_count >= this.success_threshold) {
      this.#state = "CLOSED";
      this.#success_count = 0;
    }
  }

  #on_failure() {
    this.#failure_count += 1;
    this.#last_failure_time = Date.now();
    if (this.is_half_open || this.#failure_count >= this.failure_threshold) {
      this.#state = "OPEN";
    }
  }

  #evaluate_state() {
    if (this.is_open && Date.now() - this.#last_failure_time > this.recovery_timeout) {
      this.#state = "HALF_OPEN";
      this.#success_count = 0;
    }
  }
}
