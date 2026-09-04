/**
 * -------------------------------------------------------------------------------------------------
 * Antigravity Lifecycle Hook: Universal File Architecture Enforcer
 * -------------------------------------------------------------------------------------------------
 * PreToolUse hook on write_to_file for source files in src/.
 * Enforces GEMINI.md System Standards § 3:
 *   All significant source files (.js, .svelte, .ts) MUST follow this structural formatting protocol:
 *   1. Instructional Header Block at the absolute top explaining purpose, dependencies, rules.
 *   2. Organized Body.
 *   3. Changelog Footer at the absolute bottom.
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
  const args = payload?.toolCall?.args || {};

  if (tool_name !== "write_to_file") {
    process.stdout.write(JSON.stringify({ decision: "allow" }) + "\n");
    return;
  }

  const target_file = (args.TargetFile || "").replace(/\\/g, "/");
  const code_content = args.CodeContent || "";

  // Only validate source files inside src/ (excluding json/css/assets)
  const is_src_source_file =
    target_file.includes("/src/") && (target_file.endsWith(".js") || target_file.endsWith(".svelte") || target_file.endsWith(".ts"));

  if (!is_src_source_file) {
    process.stdout.write(JSON.stringify({ decision: "allow" }) + "\n");
    return;
  }

  const trimmed_code = code_content.trim();

  // 1. Check for top instructional header block
  const has_top_header = trimmed_code.startsWith("/**") || trimmed_code.startsWith("<!--") || trimmed_code.startsWith("/*");

  // 2. Check for CHANGELOG footer block
  const has_changelog = trimmed_code.includes("CHANGELOG") || trimmed_code.includes("Changelog") || trimmed_code.includes("changelog");

  if (!has_top_header || !has_changelog) {
    const missing = [];
    if (!has_top_header) missing.push("Instructional Header Block (/** ... */ or <!-- ... --> at line 1)");
    if (!has_changelog) missing.push("Changelog Footer Block (/** CHANGELOG ... */ at bottom)");

    const reason = [
      `🛑 Blocked by Universal File Architecture Gate (GEMINI.md System Standards § 3):`,
      `Target file "${target_file}" is missing required structural elements:`,
      ...missing.map((item) => ` - ${item}`),
      `Please add the required blocks to CodeContent before creating the file.`,
    ].join("\n");

    process.stdout.write(
      JSON.stringify({
        decision: "deny",
        reason,
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
 * 2026-09-04: Initial creation of Universal File Architecture Enforcer hook (GEMINI.md System Standards § 3).
 */
