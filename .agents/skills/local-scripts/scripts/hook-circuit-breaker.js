/**
 * -------------------------------------------------------------------------------------------------
 * Antigravity Lifecycle Hook: 3-Strike Self-Audit Circuit Breaker
 * -------------------------------------------------------------------------------------------------
 * PostToolUse hook monitoring consecutive tool failures.
 * Enforces GEMINI.md Phase 5.2:
 *   "Trigger an immediate Self-Audit via waldzell-metacognitive-monitoring IF:
 *    - You encounter 3 consecutive skill verification failures.
 *    - You encounter 3 consecutive Definition of Done failures.
 *    - You execute 3+ tool calls without measurable progress."
 * Stores state in tmp/.tool-failures.json.
 * -------------------------------------------------------------------------------------------------
 */

import fs from "fs";
import path from "path";

const STATE_FILE = path.resolve("tmp/.tool-failures.json");

/**
 * Reads JSON payload from stdin synchronously.
 *
 * @returns {object} Parsed stdin payload.
 */
function read_stdin_payload() {
  try {
    const raw_input = fs.readFileSync(0, "utf-8");
    if (!raw_input || !raw_input.trim()) return {};
    return JSON.parse(raw_input);
  } catch {
    return {};
  }
}

/**
 * Reads current consecutive error count from state file.
 *
 * @returns {number} Consecutive error count.
 */
function get_consecutive_failure_count() {
  try {
    if (!fs.existsSync(STATE_FILE)) return 0;
    const data = JSON.parse(fs.readFileSync(STATE_FILE, "utf-8"));
    return typeof data.consecutive_failures === "number" ? data.consecutive_failures : 0;
  } catch {
    return 0;
  }
}

/**
 * Persists updated consecutive error count to state file.
 *
 * @param {number} count - Consecutive error count.
 */
function persist_consecutive_failure_count(count) {
  try {
    const dir = path.dirname(STATE_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(STATE_FILE, JSON.stringify({ consecutive_failures: count, updated_at: new Date().toISOString() }));
  } catch {
    // Fail-safe: do not crash on filesystem issues
  }
}

/**
 * Main hook execution.
 */
function run() {
  const payload = read_stdin_payload();
  const tool_name = payload?.toolCall?.name || payload?.tool_name || "";
  const tool_result = payload?.toolResult || payload?.result || "";

  // If the tool is waldzell-metacognitive-monitoring, reset counter immediately
  if (tool_name === "call_mcp_tool" && payload?.toolCall?.args?.ServerName === "waldzell-metacognitive-monitoring") {
    persist_consecutive_failure_count(0);
    process.stdout.write(JSON.stringify({ decision: "allow" }) + "\n");
    return;
  }

  const result_text = typeof tool_result === "string" ? tool_result : JSON.stringify(tool_result);

  // Detect explicit errors in tool output
  const has_error =
    /error|failed|exception|rejection|command failed/i.test(result_text) && !result_text.includes("0 errors") && !result_text.includes("errors: 0");

  let count = get_consecutive_failure_count();

  if (has_error) {
    count += 1;
    persist_consecutive_failure_count(count);

    if (count >= 3) {
      const message = [
        "🛑 [CIRCUIT BREAKER TRIGGERED: 3 Consecutive Tool Failures]",
        "In accordance with GEMINI.md Phase 5.2:",
        "You have encountered 3 consecutive tool/verification failures without progress.",
        "MANDATORY ACTION: You must invoke call_mcp_tool with ServerName: 'waldzell-metacognitive-monitoring'",
        "to perform a metacognitive audit of assumptions, biases, and approaches before attempting more edits.",
      ].join("\n");

      process.stdout.write(
        JSON.stringify({
          decision: "allow",
          feedback: message,
        }) + "\n",
      );
      return;
    }
  } else {
    // Reset counter on successful execution
    if (count > 0) {
      persist_consecutive_failure_count(0);
    }
  }

  process.stdout.write(JSON.stringify({ decision: "allow" }) + "\n");
}

run();

/**
 * CHANGELOG
 * -------------------------------------------------------------------------------------------------
 * 2026-09-04: Initial creation of 3-Strike Self-Audit Circuit Breaker (GEMINI.md Phase 5.2).
 */
