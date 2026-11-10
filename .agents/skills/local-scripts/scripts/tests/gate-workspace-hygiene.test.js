/**
 * .agents/skills/local-scripts/scripts/tests/gate-workspace-hygiene.test.js
 * 🧪 GATE: workspace-hygiene-gate (Stop).
 */
import { describe, it, expect, vi } from "vitest";
import { GATE_TABLE } from "../gates.js";
import { handle_stop_hygiene } from "../hooks.js";

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

describe("gate workspace-hygiene-gate", () => {
  it("is registered in GATE_TABLE", () => {
    const gate = GATE_TABLE.find((g) => g.id === "workspace-hygiene-gate");
    expect(gate.event).toBe("Stop");
    expect(gate.subcommand).toBe("stop-hygiene");
  });

  it("answers stop or continue with a reason on continue", () => {
    const res = capture(handle_stop_hygiene, { workspacePaths: [process.cwd()] });
    expect(["stop", "continue"]).toContain(res.decision);
    expect(res.decision === "stop" || typeof res.reason === "string").toBe(true);
  });
});
