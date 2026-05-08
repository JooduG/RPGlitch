/**
 * src/media/resilience.js
 * 🛡️ RESILIENCE LAYER
 * Implements defensive patterns to handle external API volatility.
 */

/**
 * @typedef {Object} RetryOptions
 * @property {number} [maxAttempts]
 * @property {number} [initialDelay]
 * @property {number} [maxDelay]
 */

/**
 * @typedef {Object} BreakerOptions
 * @property {number} [failureThreshold]
 * @property {number} [successThreshold]
 * @property {number} [recoveryTimeout]
 */

/**
 * Exponential Backoff Retryer
 * Retries an asynchronous function with increasing delays.
 */
export class ExponentialBackoffRetryer {
  /**
   * @param {RetryOptions} [options]
   */
  constructor(options = {}) {
    this.maxAttempts = options.maxAttempts || 3;
    this.initialDelay = options.initialDelay || 1000;
    this.maxDelay = options.maxDelay || 10000;
  }

  /**
   * Executes a function with retries.
   * @param {Function} fn - Async function to execute.
   * @param {Function} onRetry - Callback for reporting retry attempts.
   */
  async retry(fn, onRetry = () => {}) {
    let lastError;
    let delay = this.initialDelay;

    for (let attempt = 1; attempt <= this.maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (err) {
        lastError = err;

        if (attempt === this.maxAttempts) break;

        if (onRetry) onRetry(attempt, lastError);

        await new Promise((resolve) => setTimeout(resolve, delay));
        delay = Math.min(delay * 2, this.maxDelay);
      }
    }

    throw lastError;
  }
}

/**
 * Circuit Breaker Pattern
 * Prevents calling a failing service to allow it to recover.
 */
export class CircuitBreaker {
  /**
   *
   */
  constructor(options = { failureThreshold: 3, successThreshold: 2, recoveryTimeout: 30000 }) {
    this.failureThreshold = options.failureThreshold ?? 3;
    this.successThreshold = options.successThreshold ?? 2;
    this.recoveryTimeout = options.recoveryTimeout ?? 30000; // 30s default

    this.state = "CLOSED"; // CLOSED, OPEN, HALF_OPEN
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = 0;
  }

  /**
   *
   */
  get isClosed() {
    return this.state === "CLOSED";
  }
  /**
   *
   */
  get isOpen() {
    return this.state === "OPEN";
  }
  /**
   *
   */
  get isHalfOpen() {
    return this.state === "HALF_OPEN";
  }

  /**
   * Executes a function protected by the circuit breaker.
   * @param {Function} fn
   */
  async execute(fn) {
    this._evaluateState();

    if (this.isOpen) {
      throw new Error("Circuit breaker is OPEN. Service is temporarily unavailable.");
    }

    try {
      const result = await fn();
      this._onSuccess();
      return result;
    } catch (err) {
      this._onFailure();
      throw err;
    }
  }

  /**
   *
   */
  _onSuccess() {
    this.failureCount = 0;
    if (this.isHalfOpen) {
      this.successCount++;
      if (this.successCount >= this.successThreshold) {
        this.state = "CLOSED";
        this.successCount = 0;
      }
    }
  }

  /**
   *
   */
  _onFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.isHalfOpen || this.failureCount >= this.failureThreshold) {
      this.state = "OPEN";
    }
  }

  /**
   *
   */
  _evaluateState() {
    if (this.isOpen && Date.now() - this.lastFailureTime > this.recoveryTimeout) {
      this.state = "HALF_OPEN";
      this.successCount = 0;
    }
  }
}
