/**
 * .agents/skills/local-scripts/scripts/tests/gate-file-architecture.test.js
 * 🧪 GATE: file-architecture-gate (PreToolUse write_to_file).
 */
import { describe, it, expect, vi } from "vitest";
import { GATE_TABLE } from "../gates.js";
import { handle_file_architecture_gate } from "../hooks.js";

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

const ROOT = process.cwd().replace(/\\/g, "/");

describe("gate file-architecture-gate", () => {
  it("is registered in GATE_TABLE", () => {
    const gate = GATE_TABLE.find((g) => g.id === "file-architecture-gate");
    expect(gate.event).toBe("PreToolUse");
    expect(gate.subcommand).toBe("file-architecture-gate");
  });

  it("denies src files missing header/changelog", () => {
    const res = capture(handle_file_architecture_gate, {
      toolCall: { name: "write_to_file", args: { TargetFile: `${ROOT}/src/test-foo.js`, CodeContent: "console.log(1);" } },
    });
    expect(res.decision).toBe("deny");
  });

  it("allows src files with header + changelog", () => {
    const res = capture(handle_file_architecture_gate, {
      toolCall: {
        name: "write_to_file",
        args: { TargetFile: `${ROOT}/src/test-foo.js`, CodeContent: "/**\n * Header\n */\nconsole.log(1);\n/** CHANGELOG */\n" },
      },
    });
    expect(res.decision).toBe("allow");
  });

  it("allows replace_file_content (gate scopes to file creation only)", () => {
    const res = capture(handle_file_architecture_gate, {
      toolCall: { name: "replace_file_content", args: { TargetFile: `${ROOT}/src/engine/runs.js` } },
    });
    expect(res.decision).toBe("allow");
  });
});
