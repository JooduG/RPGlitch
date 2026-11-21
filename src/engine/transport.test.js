import { describe, it, expect, vi, beforeEach } from "vitest";
import { create_live_stream_fn, get_transport, reset_transport, generate_text, enhance_text, get_mock_message } from "./transport.js";
import { execution } from "@state";

describe("src/engine/transport.js - Engine Transport Unit Tests (Phase 5: unified run_completion)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("Gap 1 & 2: create_live_stream_fn streaming, prompt format & deduplication", () => {
    it("accepts both string and function prompt parameters and passes them cleanly", async () => {
      const original_gen = window.generate_text;
      const received_instructions = [];

      window.generate_text = vi.fn(async (params) => {
        const inst = typeof params.instruction === "function" ? params.instruction() : params.instruction;
        received_instructions.push(inst);
        return `Resolved: ${inst}`;
      });

      try {
        const stream_fn = create_live_stream_fn();

        // Test string prompt
        const res_str = await stream_fn("Hello world");
        expect(res_str).toBe("Resolved: Hello world");

        // Test function prompt
        const res_fn = await stream_fn(() => "Function prompt");
        expect(res_fn).toBe("Resolved: Function prompt");

        expect(received_instructions).toEqual(["Hello world", "Function prompt"]);
      } finally {
        window.generate_text = original_gen;
      }
    });

    it("passes startWith and stopSequences down to the underlying generator", async () => {
      const original_gen = window.generate_text;
      let captured_params = null;

      window.generate_text = vi.fn(async (params) => {
        captured_params = params;
        return "Continuation text";
      });

      try {
        const stream_fn = create_live_stream_fn();
        await stream_fn("System prompt", { startWith: "<think>My thoughts</think>\nFirst line", stopSequences: ["\n\n"] });

        expect(captured_params.startWith).toBe("<think>My thoughts</think>\nFirst line");
        expect(captured_params.stopSequences).toEqual(["\n\n"]);
      } finally {
        window.generate_text = original_gen;
      }
    });

    it("prevents double-counting when both onToken and onChunk fire", async () => {
      const original_gen = window.generate_text;
      const chunks_emitted = [];

      window.generate_text = vi.fn(({ onToken, onChunk }) => {
        // Plugin firing both onToken and onChunk for the same data
        onToken("chunk1");
        onChunk("chunk1");
        onToken("chunk2");
        onChunk("chunk2");
        return Promise.resolve("chunk1chunk2");
      });

      try {
        const stream_fn = create_live_stream_fn();
        const res = await stream_fn("test", { onChunk: (c) => chunks_emitted.push(c) });

        // Chunks should only be delivered once, not twice
        expect(chunks_emitted).toEqual(["chunk1", "chunk2"]);
        expect(res).toBe("chunk1chunk2");
      } finally {
        window.generate_text = original_gen;
      }
    });
  });

  describe("B13: Shared Gate-Backed Stream Adapter", () => {
    it("returns singleton transport instance across multiple calls and resets cleanly", () => {
      reset_transport();
      const t1 = get_transport();
      const t2 = get_transport();
      expect(t1).toBe(t2);

      reset_transport();
      const t3 = get_transport();
      expect(t3).not.toBe(t1);
    });

    it("foreground preempts background job through the shared gate without killing other queued background work", async () => {
      reset_transport();
      const original_gen = window.generate_text;

      window.generate_text = vi.fn(({ instruction, signal }) => {
        const prompt = typeof instruction === "function" ? instruction() : instruction;
        if (prompt.includes("background-job")) {
          return new Promise((_, reject) => {
            if (signal) {
              signal.addEventListener("abort", () => {
                const err = new Error("Background preempted by foreground");
                err.name = "AbortError";
                reject(err);
              });
            }
          });
        }
        return Promise.resolve(`Foreground answer: ${prompt}`);
      });

      try {
        const transport = get_transport();

        // 1. Launch background job
        const background_promise = transport.stream("background-job-1", { priority: "background" });

        // Let background job occupy the single gate slot
        await new Promise((r) => setTimeout(r, 10));

        // 2. Launch foreground job
        const foreground_promise = transport.stream("foreground-job-1", { priority: "foreground" });

        // Background should be preempted by foreground
        await expect(background_promise).rejects.toThrow();

        const foreground_result = await foreground_promise;
        expect(foreground_result).toContain("foreground-job-1");
      } finally {
        window.generate_text = original_gen;
        reset_transport();
      }
    });
  });

  describe("Phase 5: abort contracts (throw_on_abort foreground vs silent background)", () => {
    it("foreground stream throws AbortError so chrono can roll back, background generate_text maps abort to empty string", async () => {
      const original_gen = window.generate_text;
      window.generate_text = vi.fn(({ signal }) => {
        return new Promise((_, reject) => {
          if (signal?.aborted) {
            const err = new Error("aborted");
            err.name = "AbortError";
            reject(err);
            return;
          }
          signal?.addEventListener("abort", () => {
            const err = new Error("Stream aborted by user.");
            err.name = "AbortError";
            reject(err);
          });
        });
      });

      try {
        const controller = new AbortController();
        const stream_fn = create_live_stream_fn();
        const pending = stream_fn("hello", { signal: controller.signal });
        controller.abort();
        await expect(pending).rejects.toThrow();

        const controller2 = new AbortController();
        const pending2 = generate_text({ prompt: "hello" }, { signal: controller2.signal });
        controller2.abort();
        await expect(pending2).resolves.toBe("");
      } finally {
        window.generate_text = original_gen;
      }
    });

    it("wires generation.stop() to the effective signal before the first await", async () => {
      const original_gen = window.generate_text;
      let stop_called = false;
      window.generate_text = vi.fn(({ signal }) => {
        const p = new Promise((_, reject) => {
          signal?.addEventListener("abort", () => {
            const err = new Error("Stream aborted by user.");
            err.name = "AbortError";
            reject(err);
          });
        });
        p.stop = () => {
          stop_called = true;
        };
        return p;
      });

      try {
        const controller = new AbortController();
        const stream_fn = create_live_stream_fn();
        const pending = stream_fn("hello", { signal: controller.signal });
        // Allow the engine call to be created and the listener to attach.
        await new Promise((r) => setTimeout(r, 5));
        controller.abort();
        expect(stop_called).toBe(true);
        // The abort rejects the engine promise, so the foreground stream throws.
        await expect(pending).rejects.toThrow();
      } finally {
        window.generate_text = original_gen;
      }
    });
  });

  describe("Phase 5: enhance_text normalization", () => {
    it("normalizes { text } result objects before sanitizing", async () => {
      const original_gen = window.generate_text;
      window.generate_text = vi.fn(async () => ({ text: "  Clean prose here.  " }));
      try {
        const out = await enhance_text({ prompt: "x" });
        expect(typeof out).toBe("string");
        expect(out).toContain("Clean prose here.");
      } finally {
        window.generate_text = original_gen;
      }
    });

    it("normalizes { generatedText } result objects before sanitizing", async () => {
      const original_gen = window.generate_text;
      window.generate_text = vi.fn(async () => ({ generatedText: "Second shape works." }));
      try {
        const out = await enhance_text({ prompt: "x" });
        expect(typeof out).toBe("string");
        expect(out).toContain("Second shape works.");
      } finally {
        window.generate_text = original_gen;
      }
    });

    it("passes non-string results through untouched", async () => {
      const original_gen = window.generate_text;
      const payload = { count: 3 };
      window.generate_text = vi.fn(async () => payload);
      try {
        const out = await enhance_text({ prompt: "x" });
        expect(out).toBe(payload);
      } finally {
        window.generate_text = original_gen;
      }
    });
  });

  describe("Phase 5: mock runner single delivery + stream teardown", () => {
    it("delivers each mock chunk exactly once (onChunk preferred) and returns the mock message", async () => {
      const saved_text = window.generate_text;
      const saved_text2 = window.generateText;
      delete window.generate_text;
      delete window.generateText;

      const on_chunk = vi.fn();
      const on_token = vi.fn();
      try {
        const stream_fn = create_live_stream_fn();
        const res = await stream_fn("anything", { onChunk: on_chunk, onToken: on_token, silent: true });
        expect(typeof res).toBe("string");
        expect(res).toContain("long quote");
        // Preferred path delivers via onChunk only — onToken never fires on the mock path.
        expect(on_token).not.toHaveBeenCalled();
        expect(on_chunk.mock.calls.length).toBeGreaterThan(3);
        expect(on_chunk.mock.calls.map((c) => c[0]).join("")).toBe(get_mock_message());
      } finally {
        if (saved_text !== undefined) window.generate_text = saved_text;
        if (saved_text2 !== undefined) window.generateText = saved_text2;
      }
    });

    it("ends the streaming store even when the mock is aborted mid-run", async () => {
      const saved_text = window.generate_text;
      const saved_text2 = window.generateText;
      delete window.generate_text;
      delete window.generateText;

      const end_spy = vi.spyOn(execution, "end_stream");
      try {
        const controller = new AbortController();
        controller.abort();
        const stream_fn = create_live_stream_fn();
        await expect(stream_fn("x", { signal: controller.signal, silent: false })).rejects.toThrow();
        expect(end_spy).toHaveBeenCalled();
      } finally {
        if (saved_text !== undefined) window.generate_text = saved_text;
        if (saved_text2 !== undefined) window.generateText = saved_text2;
      }
    });
  });
});
