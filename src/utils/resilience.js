/**
 * src/utils/resilience.js
 * 🛡️ FAULT TOLERANCE & NETWORK RESILIENCE ENGINE
 *
 * Core Responsibilities:
 * - Exponential Backoff Retryer: Executes unreliable asynchronous operations with exponential backoff,
 *   configurable retry caps, initial/max delays, and per-attempt retry notifications.
 * - Concurrency-Aware Circuit Breaker: Fails fast on failing endpoints to prevent cascading service failure.
 *   Transitions across three deterministic states:
 *     - CLOSED: Normal operation, routing requests up to concurrency limit.
 *     - OPEN: Tripped on consecutive failures, dropping queued/incoming requests immediately.
 *     - HALF_OPEN: Trial period after recovery timeout; resets to CLOSED on sufficient consecutive successes.
 * - 100% pure and self-contained with zero external dependencies.
 */

// ============================================================================
// [SECTION 1: JSDOC SCHEMAS & RESILIENCE STATE TYPES]
// ============================================================================

/**
 * @typedef {"CLOSED" | "OPEN" | "HALF_OPEN"} CircuitBreakerState
 */

/**
 * @typedef {Object} RetryOptions
 * @property {number} [max_attempts=3] - Maximum execution attempts before throwing.
 * @property {number} [maxAttempts=3] - Alias for max_attempts.
 * @property {number} [initial_delay=1000] - Initial backoff delay in milliseconds.
 * @property {number} [initialDelay=1000] - Alias for initial_delay.
 * @property {number} [max_delay=10000] - Maximum backoff delay cap in milliseconds.
 * @property {number} [maxDelay=10000] - Alias for max_delay.
 */

/**
 * @typedef {Object} CircuitBreakerOptions
 * @property {number} [failure_threshold=3] - Consecutive failures needed to trip breaker OPEN.
 * @property {number} [failureThreshold=3] - Alias for failure_threshold.
 * @property {number} [success_threshold=2] - Consecutive successes in HALF_OPEN to reset to CLOSED.
 * @property {number} [successThreshold=2] - Alias for success_threshold.
 * @property {number} [recovery_timeout=30000] - Duration in ms before OPEN breaker transitions to HALF_OPEN.
 * @property {number} [recoveryTimeout=30000] - Alias for recovery_timeout.
 * @property {number} [max_concurrent=3] - Maximum parallel in-flight executions.
 * @property {number} [maxConcurrent=3] - Alias for max_concurrent.
 */

// ============================================================================
// [SECTION 2: EXPONENTIAL BACKOFF RETRYER]
// ============================================================================

/**
 * Retries an asynchronous function with exponential backoff delays.
 */
export class ExponentialBackoffRetryer {
  /**
   * @param {RetryOptions} [options={}]
   */
  constructor(options = {}) {
    this.max_attempts = options.max_attempts ?? options.maxAttempts ?? 3;
    this.initial_delay = options.initial_delay ?? options.initialDelay ?? 1000;
    this.max_delay = options.max_delay ?? options.maxDelay ?? 10000;
  }

  /**
   * Executes a function with automatic retries on rejection.
   * @template T
   * @param {() => Promise<T>} fn - Asynchronous function to execute.
   * @param {(attempt: number, error: unknown) => void} [on_retry] - Callback invoked on retry attempt.
   * @returns {Promise<T>} Output of the successful invocation.
   */
  async retry(fn, on_retry = () => {}) {
    let last_error;
    let delay = this.initial_delay;

    for (let attempt = 1; attempt <= this.max_attempts; attempt++) {
      try {
        return await fn();
      } catch (err) {
        last_error = err;

        if (attempt === this.max_attempts) break;

        on_retry(attempt, last_error);

        await new Promise((resolve) => setTimeout(resolve, delay));
        delay = Math.min(delay * 2, this.max_delay);
      }
    }

    throw last_error;
  }
}

// ============================================================================
// [SECTION 3: CONCURRENCY-AWARE CIRCUIT BREAKER]
// ============================================================================

/**
 * Protects fragile external services by failing fast when failure thresholds are exceeded.
 */
export class CircuitBreaker {
  /** @type {CircuitBreakerState} */
  #state = "CLOSED";
  #failure_count = 0;
  #success_count = 0;
  #last_failure_time = 0;
  #active_count = 0;

  /** @type {Array<{ fn: () => Promise<any>, resolve: (val: any) => void, reject: (err: any) => void }>} */
  #queue = [];

  /**
   * @param {CircuitBreakerOptions} [options={}]
   */
  constructor(options = {}) {
    this.failure_threshold = options.failure_threshold ?? options.failureThreshold ?? 3;
    this.success_threshold = options.success_threshold ?? options.successThreshold ?? 2;
    this.recovery_timeout = options.recovery_timeout ?? options.recoveryTimeout ?? 30000;
    this.max_concurrent = options.max_concurrent ?? options.maxConcurrent ?? 3;
  }

  /** @returns {CircuitBreakerState} Current breaker state. */
  get state() {
    return this.#state;
  }

  /** @returns {boolean} True if the breaker is CLOSED (healthy). */
  get is_closed() {
    return this.#state === "CLOSED";
  }
  /** @returns {boolean} Alias for is_closed. */
  get isClosed() {
    return this.is_closed;
  }

  /** @returns {boolean} True if the breaker is OPEN (tripped). */
  get is_open() {
    return this.#state === "OPEN";
  }
  /** @returns {boolean} Alias for is_open. */
  get isOpen() {
    return this.is_open;
  }

  /** @returns {boolean} True if the breaker is HALF_OPEN (probing recovery). */
  get is_half_open() {
    return this.#state === "HALF_OPEN";
  }
  /** @returns {boolean} Alias for is_half_open. */
  get isHalfOpen() {
    return this.is_half_open;
  }

  /** @returns {number} Number of active in-flight executions. */
  get active_count() {
    return this.#active_count;
  }

  /** @returns {number} Number of queued waiting requests. */
  get queue_length() {
    return this.#queue.length;
  }

  /**
   * Executes a function protected by the circuit breaker and concurrency limiter.
   * @template T
   * @param {() => Promise<T>} fn - Target async operation.
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

  /**
   * Processes the queued requests up to max concurrency.
   * @returns {Promise<void>}
   */
  async #process_queue() {
    if (this.#active_count >= this.max_concurrent || this.#queue.length === 0) {
      return;
    }

    if (this.is_open) {
      // Drain backlog immediately with rejection if circuit tripped
      while (this.#queue.length > 0) {
        const item = this.#queue.shift();
        item?.reject(new Error("Circuit breaker opened. Dropping queued request."));
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

  /**
   * Handles successful execution.
   */
  #on_success() {
    this.#failure_count = 0;

    if (this.is_half_open) {
      this.#success_count += 1;
      if (this.#success_count >= this.success_threshold) {
        this.#state = "CLOSED";
        this.#success_count = 0;
      }
    }
  }

  /**
   * Handles failed execution.
   */
  #on_failure() {
    this.#failure_count += 1;
    this.#last_failure_time = Date.now();

    if (this.is_half_open || this.#failure_count >= this.failure_threshold) {
      this.#state = "OPEN";
    }
  }

  /**
   * Re-evaluates whether recovery timeout elapsed to move OPEN -> HALF_OPEN.
   */
  #evaluate_state() {
    if (this.is_open && Date.now() - this.#last_failure_time > this.recovery_timeout) {
      this.#state = "HALF_OPEN";
      this.#success_count = 0;
    }
  }
}

// ============================================================================
// [CHANGELOG]
// ============================================================================
/**
 * CHANGELOG:
 * - 2026-08-29: Applied /harmonize protocol: added Universal File Architecture header block,
 *   structured section dividers, private class fields (#state, #failure_count, #queue), snake_case
 *   getters with backwards-compatible aliases, typed JSDoc schemas, and comprehensive test suite.
 * - 2026-06-15: Initial implementation of exponential backoff retryer and circuit breaker.
 */
