/**
 * -------------------------------------------------------------------------------------------------
 * Automated Lifecycle Hook Verification Suite
 * -------------------------------------------------------------------------------------------------
 * Runs end-to-end stdin/stdout contract tests across all active Antigravity lifecycle
 * hooks configured in .agents/hooks.json.
 * -------------------------------------------------------------------------------------------------
 */

import fs from "fs";
import path from "path";
import { spawnSync } from "child_process";

const TEST_CASES = [
  {
    name: "hook-guard-commands: Deny git reset --hard",
    file: "skills/local-scripts/scripts/hook-guard-commands.js",
    input: { toolCall: { name: "run_command", args: { CommandLine: "git reset --hard HEAD~1" } } },
    expectedDecision: "deny",
  },
  {
    name: "hook-guard-commands: Ask on git push --force",
    file: "skills/local-scripts/scripts/hook-guard-commands.js",
    input: { toolCall: { name: "run_command", args: { CommandLine: "git push --force origin main" } } },
    expectedDecision: "ask",
  },
  {
    name: "hook-guard-commands: Allow git status",
    file: "skills/local-scripts/scripts/hook-guard-commands.js",
    input: { toolCall: { name: "run_command", args: { CommandLine: "git status" } } },
    expectedDecision: "allow",
  },
  {
    name: "hook-file-architecture-gate: Deny missing header/changelog",
    file: "skills/local-scripts/scripts/hook-file-architecture-gate.js",
    input: {
      toolCall: {
        name: "write_to_file",
        args: {
          TargetFile: "c:/Users/johng/source/repos/RPGlitch/src/test-foo.js",
          CodeContent: "console.log(1);",
        },
      },
    },
    expectedDecision: "deny",
  },
  {
    name: "hook-file-architecture-gate: Allow complete header & changelog",
    file: "skills/local-scripts/scripts/hook-file-architecture-gate.js",
    input: {
      toolCall: {
        name: "write_to_file",
        args: {
          TargetFile: "c:/Users/johng/source/repos/RPGlitch/src/test-foo.js",
          CodeContent: "/**\n * Header\n */\nconsole.log(1);\n/** CHANGELOG */\n",
        },
      },
    },
    expectedDecision: "allow",
  },
  {
    name: "hook-stop-hygiene: Block on root .tmp file",
    file: "skills/local-scripts/scripts/hook-stop-hygiene.js",
    input: { executionNum: 1, workspacePaths: ["c:/Users/johng/source/repos/RPGlitch"] },
    mockFile: "test-transient.tmp",
    expectedDecision: "continue",
  },
  {
    name: "hook-waldzell-router: Rewrite clear-thought with decisionFramework",
    file: "skills/local-scripts/scripts/hook-waldzell-router.js",
    input: {
      toolCall: {
        name: "call_mcp_tool",
        args: {
          ServerName: "waldzell-clear-thought",
          ToolName: "clear_thought",
          Arguments: {
            operation: "decision_framework",
            parameters: { problem: "Architecture trade-offs" },
          },
        },
      },
    },
    expectedServer: "waldzell-decision-framework",
  },
  {
    name: "hook-waldzell-router: Enrich sequentialthinking with available_tools",
    file: "skills/local-scripts/scripts/hook-waldzell-router.js",
    input: {
      toolCall: {
        name: "call_mcp_tool",
        args: {
          ServerName: "mcp-sequentialthinking-tools",
          ToolName: "sequentialthinking_tools",
          Arguments: { thought: "Step 1" },
        },
      },
    },
    expectedHasTools: true,
  },
  {
    name: "hook-grep-truncation: Feedback on capped ripgrep search",
    file: "skills/local-scripts/scripts/hook-grep-truncation.js",
    input: {
      toolCall: { name: "grep_search", args: { Query: "import" } },
      toolResult: "Total results are capped at 50 matches",
    },
    expectedHasFeedback: true,
  },
];

/**
 * Runs the test suite.
 */
function run() {
  console.log("================================================================================");
  console.log("🪝  AUDIT: ANTIGRAVITY LIFECYCLE HOOKS CONTRACTS");
  console.log("================================================================================");

  let passed = 0;
  let failed = 0;

  for (const tc of TEST_CASES) {
    if (tc.mockFile) {
      fs.writeFileSync(tc.mockFile, "test-data");
    }

    const res = spawnSync("node", [tc.file], {
      cwd: path.resolve(".agents"),
      input: JSON.stringify(tc.input),
      encoding: "utf-8",
    });

    if (tc.mockFile && fs.existsSync(tc.mockFile)) {
      fs.unlinkSync(tc.mockFile);
    }

    let parsed_output;
    try {
      parsed_output = JSON.parse(res.stdout.trim());
    } catch (err) {
      console.error(`❌ ${tc.name}: Failed to parse stdout`, res.stdout, res.stderr, err);
      failed++;
      continue;
    }

    let ok = false;
    if (tc.expectedDecision) {
      ok = parsed_output.decision === tc.expectedDecision;
    } else if (tc.expectedServer) {
      ok = parsed_output.overwrite?.ServerName === tc.expectedServer;
    } else if (tc.expectedHasTools) {
      ok = Array.isArray(parsed_output.overwrite?.Arguments?.available_tools) && parsed_output.overwrite.Arguments.available_tools.length > 0;
    } else if (tc.expectedHasFeedback) {
      ok = typeof parsed_output.feedback === "string" && parsed_output.feedback.length > 0;
    }

    if (ok) {
      console.log(` ✅ PASSED  | ${tc.name}`);
      passed++;
    } else {
      console.error(` ❌ FAILED  | ${tc.name} => got: ${JSON.stringify(parsed_output)}`);
      failed++;
    }
  }

  console.log("--------------------------------------------------------------------------------");
  console.log(`📊 SUMMARY: ${passed} passed, ${failed} failed across ${TEST_CASES.length} test cases.`);
  console.log("--------------------------------------------------------------------------------");

  if (failed > 0) {
    process.exit(1);
  } else {
    console.log("✅ RESONANT: All hook contracts align. Proceeding.\n");
    process.exit(0);
  }
}

run();

/**
 * CHANGELOG
 * -------------------------------------------------------------------------------------------------
 * 2026-09-04: Created hooks.test.js conforming to test nomenclature standards and resolved unused variable error.
 */
