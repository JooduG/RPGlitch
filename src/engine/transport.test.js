import { describe, it, expect } from "vitest";
import { create_transport } from "./transport.js";

describe("src/engine/transport.js — Streaming Transport Gateway & DI Boundary", () => {
  it("streams response and triggers onChunk callback", async () => {
    const chunks = [];
    const custom_stream = async (prompt, { onChunk }) => {
      onChunk("Part 1 ");
      onChunk("Part 2");
      return "Part 1 Part 2";
    };

    const transport = create_transport({ stream_fn: custom_stream });
    const result = await transport.stream("Test prompt", {
      onChunk: (chunk) => chunks.push(chunk),
    });

    expect(result).toBe("Part 1 Part 2");
    expect(chunks).toEqual(["Part 1 ", "Part 2"]);
  });

  it("enforces single-concurrency queue execution", async () => {
    let running = 0;
    let max_simultaneous = 0;

    const slow_stream = async () => {
      running++;
      max_simultaneous = Math.max(max_simultaneous, running);
      await new Promise((r) => setTimeout(r, 20));
      running--;
      return "Done";
    };

    const transport = create_transport({ stream_fn: slow_stream, max_concurrency: 1 });

    const p1 = transport.stream("Prompt 1");
    const p2 = transport.stream("Prompt 2");

    await Promise.all([p1, p2]);

    expect(max_simultaneous).toBe(1);
    expect(transport.is_busy()).toBe(false);
  });
});
