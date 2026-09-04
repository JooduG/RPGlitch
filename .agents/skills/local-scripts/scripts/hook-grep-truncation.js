/**
 * -------------------------------------------------------------------------------------------------
 * Antigravity Lifecycle Hook: Exhaustive Search Truncation Circuit Breaker
 * -------------------------------------------------------------------------------------------------
 * PostToolUse hook executed after grep_search.
 * Inspects search response for truncation warnings or maximum cap (50 matches).
 * Enforces GEMINI.md Phase 4.4:
 *   "Any tool output containing truncation warnings represents an immediate Hard Stop.
 *    Continue searching recursively with targeted subdirectory filters until 100% of hits are audited."
 * -------------------------------------------------------------------------------------------------
 */

import fs from "fs";

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
 * Main hook execution.
 */
function run() {
  const payload = read_stdin_payload();
  const tool_name = payload?.toolCall?.name || payload?.tool_name || "";
  const tool_result = payload?.toolResult || payload?.result || "";

  if (tool_name !== "grep_search") {
    process.stdout.write(JSON.stringify({ decision: "allow" }) + "\n");
    return;
  }

  const result_text = typeof tool_result === "string" ? tool_result : JSON.stringify(tool_result);

  // Check for ripgrep 50 result cap or explicit truncation warnings
  const is_capped_at_fifty = result_text.includes("Total results are capped at 50 matches");
  const has_truncation_warning =
    /more results not shown/i.test(result_text) || /truncated/i.test(result_text) || /results are capped/i.test(result_text);

  if (is_capped_at_fifty || has_truncation_warning) {
    const message = [
      "⚠️ [CONSTITUTIONAL CIRCUIT BREAKER: Exhaustive Search Truncation Detected]",
      "Grep search results were capped or truncated (GEMINI.md Phase 4.4).",
      "MANDATE: You must NOT proceed on incomplete assumptions.",
      "Execute targeted recursive searches using subdirectory filters ('Includes') until 100% of matches are audited.",
    ].join("\n");

    process.stdout.write(
      JSON.stringify({
        decision: "allow",
        feedback: message,
      }) + "\n",
    );
    return;
  }

  process.stdout.write(JSON.stringify({ decision: "allow" }) + "\n");
}

run();

/**
 * CHANGELOG
 * -------------------------------------------------------------------------------------------------
 * 2026-09-04: Initial creation of Exhaustive Search Truncation Breaker (GEMINI.md 4.4).
 */
