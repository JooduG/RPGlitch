import { describe, expect, it, beforeEach } from "vitest";
import { OnnxMutex, onnx_mutex, mark_ort_ready, wait_ort_ready, reset_ort_ready_for_testing } from "./onnx.js";

const tick = (ms = 5) => new Promise((r) => setTimeout(r, ms));

describe("OnnxMutex", () => {
  it("executes tasks sequentially in submission order", async () => {
    const mutex = new OnnxMutex();
    const sequence = [];

    const p1 = mutex.run(async () => {
      await tick(20);
      sequence.push("first");
      return 1;
    });

    const p2 = mutex.run(async () => {
      await tick(5);
      sequence.push("second");
      return 2;
    });

    const [r1, r2] = await Promise.all([p1, p2]);
    expect(r1).toBe(1);
    expect(r2).toBe(2);
    expect(sequence).toEqual(["first", "second"]);
  });

  it("reflects is_busy and queue_length state during execution", async () => {
    const mutex = new OnnxMutex();
    expect(mutex.is_busy()).toBe(false);

    const task1 = mutex.run(async () => {
      await tick(30);
      return "done1";
    });

    const task2 = mutex.run(async () => {
      await tick(10);
      return "done2";
    });

    expect(mutex.is_busy()).toBe(true);
    expect(mutex.queue_length).toBeGreaterThanOrEqual(0);

    await Promise.all([task1, task2]);
    expect(mutex.is_busy()).toBe(false);
  });

  it("isolates errors without stalling subsequent tasks", async () => {
    const mutex = new OnnxMutex();

    const failing_task = mutex.run(async () => {
      throw new Error("WASM out of memory");
    });

    const succeeding_task = mutex.run(async () => {
      return "recovered";
    });

    await expect(failing_task).rejects.toThrow("WASM out of memory");
    const result = await succeeding_task;
    expect(result).toBe("recovered");
  });

  it("provides functional global singleton onnx_mutex", async () => {
    const res = await onnx_mutex.run(async () => 99);
    expect(res).toBe(99);
  });
});

describe("ORT readiness handshake", () => {
  beforeEach(() => {
    reset_ort_ready_for_testing();
  });

  it("resolves wait_ort_ready when mark_ort_ready is signaled", async () => {
    let ready_resolved = false;
    const wait_promise = wait_ort_ready(5000).then(() => {
      ready_resolved = true;
    });

    expect(ready_resolved).toBe(false);
    mark_ort_ready();
    await wait_promise;
    expect(ready_resolved).toBe(true);
  });

  it("times out if mark_ort_ready is never called", async () => {
    const start = Date.now();
    await wait_ort_ready(30);
    const duration = Date.now() - start;
    expect(duration).toBeGreaterThanOrEqual(25);
  });
});
