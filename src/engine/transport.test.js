import { beforeEach, describe, expect, it, vi } from "vitest";
import { execution } from "@state";
import { create_live_stream_fn, get_mock_message, get_transport, is_abort_error, reset_transport } from "./transport.js";

describe("src/engine/transport.js", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("is_abort_error", () => {
    it("detects AbortError by name, message, or aborted signal", () => {
      const abort_err = new Error("interrupted");
      abort_err.name = "AbortError";
      expect(is_abort_error(abort_err)).toBe(true);
      expect(is_abort_error(new Error("Request aborted by user"))).toBe(true);

      const controller = new AbortController();
      controller.abort();
      expect(is_abort_error(new Error("other"), controller.signal)).toBe(true);
      expect(is_abort_error(new Error("network timeout"), null)).toBe(false);
    });
  });

  describe("create_live_stream_fn streaming, prompt format & deduplication", () => {
    it("accepts both string and function prompt parameters", async () => {
      const original_gen = window.generate_text;
      const received_instructions = [];

      window.generate_text = vi.fn(async (params) => {
        const inst = typeof params.instruction === "function" ? params.instruction() : params.instruction;
        received_instructions.push(inst);
        return `Resolved: ${inst}`;
      });

      try {
        const stream_fn = create_live_stream_fn();
        const res_str = await stream_fn("Hello world");
        expect(res_str).toBe("Resolved: Hello world");

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
        onToken("chunk1");
        onChunk("chunk1");
        onToken("chunk2");
        onChunk("chunk2");
        return Promise.resolve("chunk1chunk2");
      });

      try {
        const stream_fn = create_live_stream_fn();
        const res = await stream_fn("test", { onChunk: (c) => chunks_emitted.push(c) });

        expect(chunks_emitted).toEqual(["chunk1", "chunk2"]);
        expect(res).toBe("chunk1chunk2");
      } finally {
        window.generate_text = original_gen;
      }
    });
  });

  describe("shared gate-backed stream adapter", () => {
    it("returns singleton transport instance and resets cleanly", () => {
      reset_transport();
      const t1 = get_transport();
      const t2 = get_transport();
      expect(t1).toBe(t2);

      reset_transport();
      const t3 = get_transport();
      expect(t3).not.toBe(t1);
    });

    it("preempts background job when foreground job arrives", async () => {
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
        const background_promise = transport.stream("background-job-1", { priority: "background" });

        await new Promise((r) => setTimeout(r, 10));
        const foreground_promise = transport.stream("foreground-job-1", { priority: "foreground" });

        await expect(background_promise).rejects.toThrow();
        const foreground_result = await foreground_promise;
        expect(foreground_result).toContain("foreground-job-1");
      } finally {
        window.generate_text = original_gen;
        reset_transport();
      }
    });
  });

  describe("abort handling & .stop() wiring", () => {
    it("throws AbortError when stream is aborted", async () => {
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
        await new Promise((r) => setTimeout(r, 5));
        controller.abort();
        expect(stop_called).toBe(true);
        await expect(pending).rejects.toThrow();
      } finally {
        window.generate_text = original_gen;
      }
    });
  });

  describe("mock runner single delivery + stream teardown", () => {
    it("delivers each mock chunk once (onChunk preferred) and returns the mock message", async () => {
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
