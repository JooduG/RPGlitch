/**
 * .agents/skills/local-scripts/scripts/tests/gate-planning-handoff.test.js
 * 🧪 GATE: planning-handoff-gate (Stop).
 *
 * NOTE: this gate reads `git status --porcelain`, so assertions stay
 * outcome-agnostic (stop|continue) — the contract pinned here is registration
 * + response shape, not tree state.
 */
import { describe, it, expect, vi } from "vitest";
import { GATE_TABLE } from "../gates.js";
import { handle_planning_handoff } from "../hooks.js";

function capture(fn, payload) {
  let out = "";
  const spy = vi.spyOn(process.stdout, "write").mockImplementation((chunk) => { out += String(chunk); return true; });
  try { fn(payload); } finally { spy.mockRestore(); }
  return JSON.parse(out.trim());
}

describe("gate planning-handoff-gate", () => {
  it("is registered in GATE_TABLE", () => {
    const gate = GATE_TABLE.find((g) => g.id === "planning-handoff-gate");
    expect(gate.event).toBe("Stop");
    expect(gate.subcommand).toBe("planning-handoff");
  });

  it("answers stop or continue with a reason on continue", () => {
    const res = capture(handle_planning_handoff, { workspacePaths: [process.cwd()] });
    expect(["stop", "continue"]).toContain(res.decision);
    expect(res.decision === "stop" || typeof res.reason === "string").toBe(true);
  });
});
