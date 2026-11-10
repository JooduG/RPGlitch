/**
 * .agents/skills/local-scripts/scripts/tests/gate-command-guard.test.js
 * 🧪 GATE: destructive-command-guard (PreToolUse run_command).
 */
import { describe, it, expect, vi } from "vitest";
import { GATE_TABLE } from "../gates.js";
import { handle_command_guard } from "../hooks.js";

function capture(fn, payload) {
  let out = "";
  const spy = vi.spyOn(process.stdout, "write").mockImplementation((chunk) => { out += String(chunk); return true; });
  try { fn(payload); } finally { spy.mockRestore(); }
  return JSON.parse(out.trim());
}

describe("gate destructive-command-guard", () => {
  it("is registered in GATE_TABLE as PreToolUse run_command", () => {
    const gate = GATE_TABLE.find((g) => g.id === "destructive-command-guard");
    expect(gate.event).toBe("PreToolUse");
    expect(gate.matcher).toBe("run_command");
    expect(gate.subcommand).toBe("command-guard");
  });

  it("denies git reset --hard", () => {
    const res = capture(handle_command_guard, { toolCall: { name: "run_command", args: { CommandLine: "git reset --hard HEAD~1" } } });
    expect(res.decision).toBe("deny");
  });

  it("asks on git push --force", () => {
    const res = capture(handle_command_guard, { toolCall: { name: "run_command", args: { CommandLine: "git push --force origin main" } } });
    expect(res.decision).toBe("ask");
  });

  it("allows git status", () => {
    const res = capture(handle_command_guard, { toolCall: { name: "run_command", args: { CommandLine: "git status" } } });
    expect(res.decision).toBe("allow");
  });
});
