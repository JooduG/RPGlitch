import { beforeEach, describe, expect, it, vi } from "vitest";
import { CircuitBreaker, create_job_queue, enqueue_llm_job, ExponentialBackoffRetryer, get_queue_status, reset_queue_for_testing } from "./async.js";

const tick = (ms = 5) => new Promise((r) => setTimeout(r, ms));

describe("create_job_queue", () => {
  it("executes tasks sequentially under max_concurrency=1", async () => {
    const q = create_job_queue({ max_concurrency: 1 });
    const order = [];
    await Promise.all([
      q.run(async () => {
        order.push("a");
        await tick(10);
      }),
      q.run(async () => {
        order.push("b");
      }),
    ]);
    expect(order).toEqual(["a", "b"]);
    expect(q.is_busy()).toBe(false);
  });

  it("supersedes older queued latest tasks and cancels queued tasks on clear()", async () => {
    const q = create_job_queue({ max_concurrency: 1 });
    const blocker = q.run(async () => tick(25));
    const ran = [];
    const first = q.run(
      async () => {
        ran.push("first");
        return 1;
      },
      { latest: true },
    );
    const second = q.run(
      async () => {
        ran.push("second");
        return 2;
      },
      { latest: true },
    );
    const [, r1, r2] = await Promise.all([blocker, first, second]);
    expect(r1).toEqual({ superseded: true });
    expect(r2).toBe(2);
    expect(ran).toEqual(["second"]);

    const running = q.run(async () => {
      await tick(15);
      return "done";
    });
    const queued = q.run(async () => "never");
    q.clear();
    expect(await queued).toEqual({ cleared: true });
    expect(await running).toBe("done");
  });

  it("isolates errors without stalling subsequent tasks", async () => {
    const q = create_job_queue({ max_concurrency: 1 });
    await expect(
      q.run(async () => {
        throw new Error("boom");
      }),
    ).rejects.toThrow("boom");
    await expect(q.run(async () => "alive")).resolves.toBe("alive");
  });
});

describe("llm priority gate", () => {
  it("preempts background jobs when foreground queues", async () => {
    reset_queue_for_testing();
    let bg_aborted = false;
    const bg = enqueue_llm_job(
      (signal) =>
        new Promise((_, reject) => {
          signal.addEventListener("abort", () => {
            bg_aborted = true;
            reject(new Error("preempted"));
          });
        }),
      "background",
    );
    bg.catch(() => {});
    await tick(5);
    await expect(enqueue_llm_job(async () => "fg-wins")).resolves.toBe("fg-wins");
    expect(bg_aborted).toBe(true);
    expect(get_queue_status().active).toBe(false);
    reset_queue_for_testing();
  });
});

describe("ExponentialBackoffRetryer & CircuitBreaker", () => {
  it("retries failing calls up to max_attempts and resolves on recovery", async () => {
    const retryer = new ExponentialBackoffRetryer({ max_attempts: 3, initial_delay: 5, max_delay: 20 });
    const fn = vi.fn().mockRejectedValueOnce(new Error("fail")).mockResolvedValueOnce("recovered");
    const on_retry = vi.fn();

    await expect(retryer.retry(fn, on_retry)).resolves.toBe("recovered");
    expect(fn).toHaveBeenCalledTimes(2);
    expect(on_retry).toHaveBeenCalledTimes(1);
  });

  describe("CircuitBreaker", () => {
    /** @type {CircuitBreaker} */
    let breaker;

    beforeEach(() => {
      breaker = new CircuitBreaker({ failure_threshold: 2, success_threshold: 1, recovery_timeout: 50, max_concurrent: 2 });
    });

    it("trips OPEN at threshold and recovers HALF_OPEN -> CLOSED after timeout", async () => {
      expect(breaker.state).toBe("CLOSED");
      expect(breaker.is_closed).toBe(true);

      const fail_fn = vi.fn().mockRejectedValue(new Error("fail"));
      await expect(breaker.execute(fail_fn)).rejects.toThrow("fail");
      await expect(breaker.execute(fail_fn)).rejects.toThrow("fail");
      expect(breaker.is_open).toBe(true);
      await expect(breaker.execute(fail_fn)).rejects.toThrow("Circuit breaker is OPEN");

      await tick(60);
      await expect(breaker.execute(vi.fn().mockResolvedValue("fixed"))).resolves.toBe("fixed");
      expect(breaker.is_closed).toBe(true);
    });

    it("limits concurrent executions to max_concurrent", async () => {
      let peak_active = 0;
      const task = async () => {
        peak_active = Math.max(peak_active, breaker.active_count);
        await tick(20);
        return "ok";
      };
      const results = await Promise.all([breaker.execute(task), breaker.execute(task), breaker.execute(task)]);
      expect(results).toEqual(["ok", "ok", "ok"]);
      expect(peak_active).toBeLessThanOrEqual(2);
    });
  });
});
