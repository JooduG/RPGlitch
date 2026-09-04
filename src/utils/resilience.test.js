import { describe, expect, it, beforeEach, vi } from "vitest";
import { CircuitBreaker, ExponentialBackoffRetryer } from "./resilience.js";

describe("ExponentialBackoffRetryer", () => {
  it("should return result if first call succeeds", async () => {
    const retryer = new ExponentialBackoffRetryer({
      max_attempts: 3,
      initial_delay: 10,
      max_delay: 100,
    });
    const fn = vi.fn().mockResolvedValue("success");

    const result = await retryer.retry(fn);
    expect(result).toBe("success");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("should retry the specified number of times on failure", async () => {
    const retryer = new ExponentialBackoffRetryer({
      max_attempts: 3,
      initial_delay: 10,
      max_delay: 100,
    });
    const fn = vi.fn().mockRejectedValue(new Error("fail"));
    const on_retry = vi.fn();

    await expect(retryer.retry(fn, on_retry)).rejects.toThrow("fail");
    expect(fn).toHaveBeenCalledTimes(3);
    expect(on_retry).toHaveBeenCalledTimes(2);
  });

  it("should succeed if a retry succeeds", async () => {
    const retryer = new ExponentialBackoffRetryer({
      max_attempts: 3,
      initial_delay: 10,
      max_delay: 100,
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
      failure_threshold: 2,
      success_threshold: 1,
      recovery_timeout: 50,
      max_concurrent: 2,
    });
  });

  it("should start in CLOSED state and expose state getters", () => {
    expect(breaker.state).toBe("CLOSED");
    expect(breaker.is_closed).toBe(true);
    expect(breaker.is_open).toBe(false);
    expect(breaker.is_half_open).toBe(false);
  });

  it("should trip (OPEN) after threshold failures", async () => {
    const fn = vi.fn().mockRejectedValue(new Error("fail"));

    await expect(breaker.execute(fn)).rejects.toThrow("fail");
    await expect(breaker.execute(fn)).rejects.toThrow("fail");

    expect(breaker.state).toBe("OPEN");
    expect(breaker.is_open).toBe(true);
    await expect(breaker.execute(fn)).rejects.toThrow("Circuit breaker is OPEN");
  });

  it("should reset after recovery timeout (HALF_OPEN -> CLOSED)", async () => {
    const fn = vi.fn().mockRejectedValue(new Error("fail"));

    // Trip it
    await expect(breaker.execute(fn)).rejects.toThrow("fail");
    await expect(breaker.execute(fn)).rejects.toThrow("fail");
    expect(breaker.is_open).toBe(true);

    // Wait for timeout
    await new Promise((r) => setTimeout(r, 60));

    const success_fn = vi.fn().mockResolvedValue("fixed");
    const result = await breaker.execute(success_fn);

    expect(result).toBe("fixed");
    expect(breaker.is_closed).toBe(true);
  });

  it("limits concurrent executions to max_concurrent", async () => {
    let peak_active = 0;
    const task = async () => {
      peak_active = Math.max(peak_active, breaker.active_count);
      await new Promise((r) => setTimeout(r, 20));
      return "ok";
    };

    const results = await Promise.all([breaker.execute(task), breaker.execute(task), breaker.execute(task)]);

    expect(results).toEqual(["ok", "ok", "ok"]);
    expect(peak_active).toBeLessThanOrEqual(2);
  });
});
