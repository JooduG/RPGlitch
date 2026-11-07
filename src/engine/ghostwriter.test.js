import { describe, it, expect, vi, beforeEach } from "vitest";
import { execute_ghostwriter } from "./ghostwriter.js";
import { llm_service } from "@platform";
import { register_state_accessors } from "../utils/bridges.js";

describe("execute_ghostwriter", () => {
  beforeEach(() => {
    register_state_accessors({
      runtime: {
        story_id: "story-ghost-1",
        round: 1,
        active_ai: { name: "Lyra", type: "character" },
        active_user: { name: "Protagonist", type: "character" },
        active_fractal: { name: "The Citadel", type: "fractal" },
      },
      session_driver: {
        load_log: vi.fn().mockResolvedValue([{ role: "model", text: "The rain lashes against the glass.", character_name: "Lyra" }]),
      },
    });
  });

  it("suppresses think blocks during streaming and strips cognition on final result", async () => {
    const tokens_received = [];
    const full_replace_flags = [];

    vi.spyOn(llm_service, "generate").mockImplementation(async (payload, options) => {
      // Simulate streaming with <think>...</think>
      const stream_chunks = ["<think>", "Formulating ", "the response...", "</think>", "I reach for ", "the hilt of my sword."];

      for (const chunk of stream_chunks) {
        options?.onToken?.(chunk);
      }

      return "<think>Formulating the response...</think>I reach for the hilt of my sword.";
    });

    const result = await execute_ghostwriter("", null, (chunk, is_full_replace) => {
      tokens_received.push(chunk);
      full_replace_flags.push(is_full_replace);
    });

    expect(result).toBe("I reach for the hilt of my sword.");
    // Tokens inside <think> should not be emitted individually
    expect(tokens_received).not.toContain("Formulating ");
    expect(tokens_received).not.toContain("the response...");
    // After </think>, prose tokens are emitted
    expect(tokens_received.join("")).toContain("I reach for the hilt of my sword.");
  });
});
