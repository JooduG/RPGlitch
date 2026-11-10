/**
 * .agents/skills/local-scripts/scripts/tests/gate-grep-truncation.test.js
 * 🧪 GATE: grep-truncation-breaker (PostToolUse grep_search).
 */
import { describe, it, expect, vi } from "vitest";
import { GATE_TABLE } from "../gates.js";
import { handle_grep_truncation } from "../hooks.js";

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

describe("gate grep-truncation-breaker", () => {
  it("is registered in GATE_TABLE", () => {
    const gate = GATE_TABLE.find((g) => g.id === "grep-truncation-breaker");
    expect(gate.event).toBe("PostToolUse");
    expect(gate.matcher).toBe("grep_search");
    expect(gate.subcommand).toBe("grep-truncation");
  });

  it("injects feedback on capped ripgrep search", () => {
    const res = capture(handle_grep_truncation, {
      toolCall: { name: "grep_search", args: { Query: "import" } },
      toolResult: "Total results are capped at 50 matches",
    });
    expect(res.decision).toBe("allow");
    expect(typeof res.feedback).toBe("string");
    expect(res.feedback.length).toBeGreaterThan(0);
  });

  it("passes through uncapped results silently", () => {
    const res = capture(handle_grep_truncation, {
      toolCall: { name: "grep_search", args: { Query: "import" } },
      toolResult: "3 matches",
    });
    expect(res.decision).toBe("allow");
    expect(res.feedback).toBeUndefined();
  });
});
