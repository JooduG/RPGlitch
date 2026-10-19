import { describe, expect, it } from "vitest";
import { create_job_queue } from "./job-queue.js";

const tick = (ms = 5) => new Promise((r) => setTimeout(r, ms));

describe("create_job_queue", () => {
  it("executes tasks and resolves with their results", async () => {
    const q = create_job_queue({ max_concurrency: 1 });
    const result = await q.run(async () => 42);
    expect(result).toBe(42);
    expect(q.is_busy()).toBe(false);
  });

  it("executes tasks in submission order under serial concurrency", async () => {
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
      q.run(async () => {
        order.push("c");
      }),
    ]);
    expect(order).toEqual(["a", "b", "c"]);
  });

  it("runs concurrent workers up to max_concurrency and no higher", async () => {
    const q = create_job_queue({ max_concurrency: 2 });
    let active = 0;
    let peak = 0;
    const task = async () => {
      active += 1;
      peak = Math.max(peak, active);
      await tick(10);
      active -= 1;
    };
    await Promise.all([q.run(task), q.run(task), q.run(task)]);
    expect(peak).toBe(2);
  });

  it("supersedes an older queued latest-pending task (only the freshest runs)", async () => {
    const q = create_job_queue({ max_concurrency: 1 });
    const blocker = q.run(async () => {
      await tick(30);
    });
    const ran = [];
    const first = q.run(
      async () => {
        ran.push("first");
        return "first-result";
      },
      { latest: true },
    );
    const second = q.run(
      async () => {
        ran.push("second");
        return "second-result";
      },
      { latest: true },
    );
    const [, r1, r2] = await Promise.all([blocker, first, second]);
    expect(r1).toEqual({ superseded: true });
    expect(r2).toBe("second-result");
    expect(ran).toEqual(["second"]);
  });

  it("supersedes ALL older queued latest tasks (only the freshest of three runs)", async () => {
    const q = create_job_queue({ max_concurrency: 1 });
    const blocker = q.run(async () => {
      await tick(30);
    });
    const ran = [];
    const first = q.run(
      async () => {
        ran.push("first");
        return "first-result";
      },
      { latest: true },
    );
    const second = q.run(
      async () => {
        ran.push("second");
        return "second-result";
      },
      { latest: true },
    );
    const third = q.run(
      async () => {
        ran.push("third");
        return "third-result";
      },
      { latest: true },
    );
    const [, r1, r2, r3] = await Promise.all([blocker, first, second, third]);
    expect(r1).toEqual({ superseded: true });
    expect(r2).toEqual({ superseded: true });
    expect(r3).toBe("third-result");
    expect(ran).toEqual(["third"]);
  });

  it("does not supersede plain (non-latest) tasks", async () => {
    const q = create_job_queue({ max_concurrency: 1 });
    const ran = [];
    const first = q.run(async () => {
      ran.push("first");
      await tick(20);
      return "a";
    });
    const second = q.run(async () => {
      ran.push("second");
      return "b";
    });
    const [r1, r2] = await Promise.all([first, second]);
    expect(r1).toBe("a");
    expect(r2).toBe("b");
    expect(ran).toEqual(["first", "second"]);
  });

  it("isolates a failing worker: its promise rejects but the queue keeps draining", async () => {
    const q = create_job_queue({ max_concurrency: 1 });
    const boom = q.run(async () => {
      throw new Error("forge outage");
    });
    await expect(boom).rejects.toThrow("forge outage");
    const ok = await q.run(async () => "still-alive");
    expect(ok).toBe("still-alive");
    expect(q.is_busy()).toBe(false);
  });

  it("clear() cancels queued tasks with { cleared: true } and lets running workers finish", async () => {
    const q = create_job_queue({ max_concurrency: 1 });
    const running = q.run(async () => {
      await tick(20);
      return "finished";
    });
    const queued = q.run(async () => "never-runs");
    q.clear();
    expect(await queued).toEqual({ cleared: true });
    expect(await running).toBe("finished");
    expect(q.is_busy()).toBe(false);
  });

  it("accepts new tasks after clear()", async () => {
    const q = create_job_queue();
    q.clear();
    expect(await q.run(async () => "fresh")).toBe("fresh");
  });
});
