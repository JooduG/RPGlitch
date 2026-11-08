import { describe, it, expect } from "vitest";
import { extract_think_block } from "./parser.js";

describe("src/engine/parser.js — Pure Streaming Cognition Parser", () => {
  it("extracts and strips <think> block from streamed prose", () => {
    const raw = `<think>
1. Intent: Assess the room.
2. Subtext: Suspicion.
</think>
"Step back," Alice says quietly.`;

    const result = extract_think_block(raw);
    expect(result.think).toContain("1. Intent: Assess the room.");
    expect(result.prose).toBe('"Step back," Alice says quietly.');
  });

  it("handles unclosed <think> stream gracefully", () => {
    const stream = `<think>Still planning thoughts...`;
    const result = extract_think_block(stream);
    expect(result.think).toBe("Still planning thoughts...");
    expect(result.prose).toBe("");
  });
});
