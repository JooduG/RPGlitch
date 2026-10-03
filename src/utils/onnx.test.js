/**
 * ============================================================================
 * src/utils/onnx.test.js
 * 🧪 TESTS FOR ONNX MUTEX & ORT WASM RUNTIME CONCURRENCY
 * ============================================================================
 *
 * Verifies OnnxMutex sequential execution, queue length dynamics, error
 * resilience, and strict mutual exclusion (active concurrency <= 1) between
 * Kokoro-82M TTS synthesis and semantic embeddings.
 *
 * RULES FOR MODIFICATION:
 *   - Universal File Architecture compliance (Header block & Changelog footer).
 *   - Use artificial tick delays to simulate async WASM inference workloads.
 * ============================================================================
 */

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

  it("enforces strict mutual exclusion between interleaved TTS synthesis and vector embeddings", async () => {
    const mutex = new OnnxMutex();
    let active_concurrency = 0;
    let max_concurrency_observed = 0;
    const execution_log = [];

    // Simulate Kokoro TTS synthesis job
    const run_tts_synthesis = async (id, duration_ms) => {
      return mutex.run(async () => {
        active_concurrency++;
        max_concurrency_observed = Math.max(max_concurrency_observed, active_concurrency);
        execution_log.push(`start_tts_${id}`);
        await tick(duration_ms);
        execution_log.push(`end_tts_${id}`);
        active_concurrency--;
        return `audio_buffer_${id}`;
      });
    };

    // Simulate 384-d semantic embedding extraction job
    const run_vector_embedding = async (id, duration_ms) => {
      return mutex.run(async () => {
        active_concurrency++;
        max_concurrency_observed = Math.max(max_concurrency_observed, active_concurrency);
        execution_log.push(`start_embed_${id}`);
        await tick(duration_ms);
        execution_log.push(`end_embed_${id}`);
        active_concurrency--;
        return [0.12, 0.45, -0.23];
      });
    };

    // Interleave 6 concurrent requests simultaneously
    const jobs = [
      run_tts_synthesis(1, 25),
      run_vector_embedding(1, 15),
      run_tts_synthesis(2, 20),
      run_vector_embedding(2, 10),
      run_tts_synthesis(3, 15),
      run_vector_embedding(3, 10),
    ];

    const results = await Promise.all(jobs);

    // Verify all tasks succeeded
    expect(results[0]).toBe("audio_buffer_1");
    expect(results[1]).toEqual([0.12, 0.45, -0.23]);
    expect(results[2]).toBe("audio_buffer_2");
    expect(results[3]).toEqual([0.12, 0.45, -0.23]);
    expect(results[4]).toBe("audio_buffer_3");
    expect(results[5]).toEqual([0.12, 0.45, -0.23]);

    // Concurrency must NEVER exceed 1 at any point on the shared WASM heap
    expect(max_concurrency_observed).toBe(1);
    expect(active_concurrency).toBe(0);
    expect(mutex.is_busy()).toBe(false);

    // Verify tasks ran strictly end-to-end without overlapping
    for (let i = 0; i < execution_log.length; i += 2) {
      expect(execution_log[i].startsWith("start_")).toBe(true);
      expect(execution_log[i + 1].startsWith("end_")).toBe(true);
      expect(execution_log[i].slice(6)).toBe(execution_log[i + 1].slice(4));
    }
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

/**
 * CHANGELOG
 * ----------------------------------------------------------------------------
 * 2026-10-03: Added header block, changelog footer, and TTS/embedding mutex concurrency stress test (Item 1.4).
 */
