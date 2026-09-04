/**
 * -------------------------------------------------------------------------------------------------
 * Antigravity Lifecycle Hook: Planning Handoff Gate (Stop Hook)
 * -------------------------------------------------------------------------------------------------
 * Enforces GEMINI.md Handoff Law: An operational session must not terminate after making
 * substantive changes to production code (`src/`) without updating `tasks/PRESENT.md`.
 * Receives JSON on stdin and writes decision JSON to stdout.
 * -------------------------------------------------------------------------------------------------
 */

import { execSync } from "child_process";
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

  try {
    // Check git status for modified, added, or untracked files
    const status_output = execSync("git status --porcelain", {
      encoding: "utf-8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();

    if (!status_output) {
      // Clean tree, nothing to enforce
      process.stdout.write(JSON.stringify({ decision: "stop" }) + "\n");
      return;
    }

    const changed_files = status_output.split("\n").map((line) => line.slice(3).trim().replace(/\\/g, "/"));

    // Substantive changes: any modifications under src/
    const has_substantive_source_changes = changed_files.some((file) => file.startsWith("src/") && /\.(js|ts|svelte|css)$/.test(file));

    // Handoff verification: tasks/PRESENT.md must be updated
    const has_handoff_recorded = changed_files.some((file) => file === "tasks/PRESENT.md");

    if (has_substantive_source_changes && !has_handoff_recorded) {
      const response = {
        decision: "continue",
        reason:
          "Planning Handoff Law: Substantive changes were made to `src/`, but `tasks/PRESENT.md` has not been updated. Record your session progress and updated Pulse/Roadmap in `tasks/PRESENT.md` before concluding.",
      };
      process.stdout.write(JSON.stringify(response) + "\n");
      return;
    }
  } catch {
    // If git command fails for any reason, allow stop gracefully
  }

  process.stdout.write(JSON.stringify({ decision: "stop" }) + "\n");
}

run();

/**
 * CHANGELOG
 * -------------------------------------------------------------------------------------------------
 * 2026-09-04: Initial creation of Stop hook enforcing Planning Handoff Law.
 */
