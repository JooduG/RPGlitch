import { describe, it, expect, vi, beforeEach } from "vitest";
import { create_live_stream_fn, get_transport, reset_transport } from "./transport.js";

describe("src/engine/transport.js - Engine Transport Unit Tests", () => {
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
});
