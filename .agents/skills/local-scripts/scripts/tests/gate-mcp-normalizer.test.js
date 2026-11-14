/**
 * .agents/skills/local-scripts/scripts/tests/gate-mcp-normalizer.test.js
 * 🧪 GATE: mcp-argument-normalizer (PreToolUse call_mcp_tool).
 */
import { describe, it, expect, vi } from "vitest";
import { GATE_TABLE } from "../gates.js";
import { handle_mcp_argument_normalizer } from "../hooks.js";

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

describe("gate mcp-argument-normalizer", () => {
  it("is registered in GATE_TABLE", () => {
    const gate = GATE_TABLE.find((g) => g.id === "mcp-argument-normalizer");
    expect(gate.event).toBe("PreToolUse");
    expect(gate.subcommand).toBe("mcp-argument-normalizer");
  });

  it("normalizes sequentialthinking camelCase arguments", () => {
    const res = capture(handle_mcp_argument_normalizer, {
      toolCall: {
        name: "call_mcp_tool",
        args: {
          ServerName: "mcp-sequentialthinking-tools",
          ToolName: "sequentialthinking_tools",
          Arguments: { thought: "Step 1", thoughtNumber: 1, totalThoughts: 5, nextThoughtNeeded: true },
        },
      },
    });
    const args = res.overwrite.Arguments;
    expect(args.thought_number).toBe(1);
    expect(args.total_thoughts).toBe(5);
    expect(args.next_thought_needed).toBe(true);
    expect(args.thoughtNumber).toBeUndefined();
  });

  it("enriches sequentialthinking with available_tools", () => {
    const res = capture(handle_mcp_argument_normalizer, {
      toolCall: {
        name: "call_mcp_tool",
        args: { ServerName: "mcp-sequentialthinking-tools", ToolName: "sequentialthinking_tools", Arguments: { thought: "Step 1" } },
      },
    });
    expect(Array.isArray(res.overwrite.Arguments.available_tools)).toBe(true);
    expect(res.overwrite.Arguments.available_tools.length).toBeGreaterThan(0);
  });
});
