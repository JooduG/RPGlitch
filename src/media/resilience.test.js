/**
 * src/media/resilience.test.js
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { ExponentialBackoffRetryer, CircuitBreaker } from "@media/resilience.js";

describe("ExponentialBackoffRetryer", () => {
  it("should return result if first call succeeds", async () => {
    const retryer = new ExponentialBackoffRetryer({
      maxAttempts: 3,
      initialDelay: 10,
      maxDelay: 100,
    });
    const fn = vi.fn().mockResolvedValue("success");

    const result = await retryer.retry(fn);
    expect(result).toBe("success");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("should retry the specified number of times on failure", async () => {
    const retryer = new ExponentialBackoffRetryer({
      maxAttempts: 3,
      initialDelay: 10,
      maxDelay: 100,
    });
    const fn = vi.fn().mockRejectedValue(new Error("fail"));

    await expect(retryer.retry(fn)).rejects.toThrow("fail");
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it("should succeed if a retry succeeds", async () => {
    const retryer = new ExponentialBackoffRetryer({
      maxAttempts: 3,
      initialDelay: 10,
      maxDelay: 100,
    });
    const fn = vi.fn().mockRejectedValueOnce(new Error("fail")).mockResolvedValueOnce("recovered");

    const result = await retryer.retry(fn);
    expect(result).toBe("recovered");
    expect(fn).toHaveBeenCalledTimes(2);
  });
});

describe("CircuitBreaker", () => {
  /** @type {CircuitBreaker} */
  let breaker;

  beforeEach(() => {
    breaker = new CircuitBreaker({
      failureThreshold: 2,
      successThreshold: 1,
      recoveryTimeout: 50,
    });
  });

  it("should start in CLOSED state", () => {
    expect(breaker.isClosed).toBe(true);
  });

  it("should trip (OPEN) after threshold failures", async () => {
    const fn = vi.fn().mockRejectedValue(new Error("fail"));

    await expect(breaker.execute(fn)).rejects.toThrow("fail");
    await expect(breaker.execute(fn)).rejects.toThrow("fail");

    expect(breaker.isOpen).toBe(true);
    await expect(breaker.execute(fn)).rejects.toThrow("Circuit breaker is OPEN");
  });

  it("should reset after recovery timeout (HALF_OPEN)", async () => {
    const fn = vi.fn().mockRejectedValue(new Error("fail"));

    // Trip it
    await expect(breaker.execute(fn)).rejects.toThrow("fail");
    await expect(breaker.execute(fn)).rejects.toThrow("fail");
    expect(breaker.isOpen).toBe(true);

    // Wait for timeout
    await new Promise((r) => setTimeout(r, 60));

    const successFn = vi.fn().mockResolvedValue("fixed");
    const result = await breaker.execute(successFn);

    expect(result).toBe("fixed");
    expect(breaker.isClosed).toBe(true);
  });
});
