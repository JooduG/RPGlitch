/**
 * .agents/skills/local-scripts/scripts/tests/gate-sequential-thinking.test.js
 * 🧪 GATE: sequential-thinking-gate (PreToolUse file edits).
 */
import { describe, it, expect, vi } from "vitest";
import { GATE_TABLE, is_high_risk_file } from "../gates.js";
import { handle_sequential_thinking_gate } from "../hooks.js";

function capture(fn, payload) {
  let out = "";
  const spy = vi.spyOn(process.stdout, "write").mockImplementation((chunk) => {
    out += String(chunk);
    return true;
  });
  try {
    fn(payload);
  } finally {
    spy.mockRestore();
  }
  return JSON.parse(out.trim());
}

describe("gate sequential-thinking-gate", () => {
  it("is registered in GATE_TABLE", () => {
    const gate = GATE_TABLE.find((g) => g.id === "sequential-thinking-gate");
    expect(gate.event).toBe("PreToolUse");
    expect(gate.subcommand).toBe("sequential-thinking-gate");
  });

  it("flags the rank-2 turn-pipeline + persistence spine as high risk", () => {
    expect(is_high_risk_file("src/engine/runs.js")).toBe(true);
    expect(is_high_risk_file("src/engine/prompts.js")).toBe(true);
    expect(is_high_risk_file("src/data/db.js")).toBe(true);
    expect(is_high_risk_file("src/ui/ChatBubble.svelte")).toBe(false);
  });

  it("no longer references eradicated intelligence/state paths", () => {
    expect(is_high_risk_file("src/intelligence/prompts.js")).toBe(false);
    expect(is_high_risk_file("src/state/chrono.svelte.js")).toBe(false);
    expect(is_high_risk_file("src/data/repository.js")).toBe(false);
  });

  it("allows non-src edits without friction", () => {
    const res = capture(handle_sequential_thinking_gate, {
      toolCall: { name: "write_to_file", args: { TargetFile: "docs/notes.md" } },
      workspacePaths: [process.cwd()],
    });
    expect(res.decision).toBe("allow");
  });
});
