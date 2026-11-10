/**
 * .agents/skills/local-scripts/scripts/tests/gate-circuit-breaker.test.js
 * 🧪 GATE: strike-circuit-breaker (PostToolUse .*).
 */
import { describe, it, expect, vi } from "vitest";
import { GATE_TABLE } from "../gates.js";
import { handle_circuit_breaker } from "../hooks.js";

function capture(fn, payload) {
  let out = "";
  const spy = vi.spyOn(process.stdout, "write").mockImplementation((chunk) => { out += String(chunk); return true; });
  try { fn(payload); } finally { spy.mockRestore(); }
  return JSON.parse(out.trim());
}

describe("gate strike-circuit-breaker", () => {
  it("is registered in GATE_TABLE", () => {
    const gate = GATE_TABLE.find((g) => g.id === "strike-circuit-breaker");
    expect(gate.event).toBe("PostToolUse");
    expect(gate.matcher).toBe(".*");
    expect(gate.subcommand).toBe("circuit-breaker");
  });

  it("ignores errors in read-only tools", () => {
    const res = capture(handle_circuit_breaker, {
      toolCall: { name: "view_file", args: { AbsolutePath: "src/engine/runs.js" } },
      toolResult: "Error: this file documents error handling and contains error keywords",
    });
    expect(res.decision).toBe("allow");
  });
});
