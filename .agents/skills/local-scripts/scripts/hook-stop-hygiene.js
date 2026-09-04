/**
 * -------------------------------------------------------------------------------------------------
 * Antigravity Lifecycle Hook: Stop Workspace Hygiene Gate
 * -------------------------------------------------------------------------------------------------
 * Invoked when the agent attempts to stop. Verifies that no transient temporary
 * files or diagnostic logs were left behind in root or unauthorized directories.
 * Receives JSON on stdin and writes decision JSON to stdout.
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
  const _payload = read_stdin_payload();
  const root_directory = process.cwd();

  // Forbidden transient artifacts in root per GEMINI.md Workspace Hygiene
  const forbidden_root_patterns = [/\.tmp$/i, /\.log$/i, /^scratch_/i, /^test_out/i, /^temp_/i];

  const violations = [];

  try {
    const root_files = fs.readdirSync(root_directory);
    for (const file of root_files) {
      if (forbidden_root_patterns.some((pattern) => pattern.test(file))) {
        violations.push(file);
      }
    }
  } catch {
    // Graceful fallback if directory read fails
  }

  if (violations.length > 0) {
    const response = {
      decision: "continue",
      reason: `Workspace hygiene gate violation: Found transient files in repository root (${violations.join(", ")}). Move or clean them in tmp/ before terminating.`,
    };
    process.stdout.write(JSON.stringify(response) + "\n");
    return;
  }

  // Allow clean stop
  process.stdout.write(JSON.stringify({ decision: "stop" }) + "\n");
}

run();

/**
 * CHANGELOG
 * -------------------------------------------------------------------------------------------------
 * 2026-09-04: Initial creation of Stop workspace hygiene gate hook for RPGlitch.
 */
