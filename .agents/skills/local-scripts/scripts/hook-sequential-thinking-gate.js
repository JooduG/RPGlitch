/**
 * -------------------------------------------------------------------------------------------------
 * Antigravity Lifecycle Hook: Sequential Thinking Think-Before-Edit Gate (PreToolUse)
 * -------------------------------------------------------------------------------------------------
 * Enforces GEMINI.md Cognitive Law:
 * Triggers `sequentialthinking_tools` under two high-friction conditions:
 *   1. Multi-File Changes: Attempting to modify a 2nd (or more) distinct file in `src/`.
 *   2. Thrashing Loop: Returning to modify the same file for a 2nd or 3rd consecutive time.
 * Single-file isolated edits pass through without added latency or token cost.
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
 * Normalizes absolute or relative paths to relative workspace path.
 *
 * @param {string} file_path Target file path.
 * @returns {string} Normalized relative path.
 */
function to_relative_path(file_path) {
  const cwd = process.cwd().replace(/\\/g, "/");
  const normalized = file_path.replace(/\\/g, "/");
  if (normalized.startsWith(cwd + "/")) {
    return normalized.slice(cwd.length + 1);
  }
  return normalized;
}

/**
 * Main hook execution.
 */
function run() {
  const payload = read_stdin_payload();
  const tool_call = payload?.toolCall || {};
  const tool_args = tool_call.args || {};
  const target_file = tool_args.TargetFile || "";

  if (!target_file) {
    process.stdout.write(JSON.stringify({ decision: "allow" }) + "\n");
    return;
  }

  const relative_target = to_relative_path(target_file);

  // Only source files and tests trigger this gate (ignore scribbles, logs, tmp)
  if (!relative_target.startsWith("src/") && !relative_target.startsWith(".agents/skills/")) {
    process.stdout.write(JSON.stringify({ decision: "allow" }) + "\n");
    return;
  }

  const transcript_path = payload?.transcriptPath || "";
  if (!transcript_path || !fs.existsSync(transcript_path)) {
    process.stdout.write(JSON.stringify({ decision: "allow" }) + "\n");
    return;
  }

  let has_thought_recorded = false;
  const files_edited_in_turn = new Set();
  let consecutive_edits_on_target = 0;

  try {
    const raw_transcript = fs.readFileSync(transcript_path, "utf-8");
    const lines = raw_transcript.trim().split("\n");

    // Scan backwards from recent actions in this turn
    for (let i = lines.length - 1; i >= 0; i--) {
      const line = lines[i];
      if (!line) continue;

      try {
        const step = JSON.parse(line);
        if (step.type === "USER_INPUT") break;

        const step_str = JSON.stringify(step);
        if (step_str.includes("sequentialthinking_tools")) {
          has_thought_recorded = true;
        }

        // Inspect tool calls for file edits
        const tool_calls = step.tool_calls || [];
        for (const tc of tool_calls) {
          if (tc.name === "replace_file_content" || tc.name === "write_to_file" || tc.name === "multi_replace_file_content") {
            const edited_path = to_relative_path(tc.args?.TargetFile || "");
            if (edited_path) {
              files_edited_in_turn.add(edited_path);
              if (edited_path === relative_target) {
                consecutive_edits_on_target++;
              }
            }
          }
        }
      } catch {
        // Continue on parse error
      }
    }
  } catch {
    // If transcript inspection fails, allow through
  }

  // Already ran sequential thinking during this session/turn
  if (has_thought_recorded) {
    process.stdout.write(JSON.stringify({ decision: "allow" }) + "\n");
    return;
  }

  // Condition 1: Multi-File Edit (already edited another file and now editing this one)
  const is_multi_file_attempt = files_edited_in_turn.size > 0 && !files_edited_in_turn.has(relative_target);

  // Condition 2: Thrashing / Repeating Edit (returning to modify the same file 2nd or 3rd time)
  const is_consecutive_thrashing = consecutive_edits_on_target >= 1;

  if (is_multi_file_attempt) {
    const other_files = Array.from(files_edited_in_turn).join(", ");
    const response = {
      decision: "deny",
      reason: `Multi-File Cognitive Gate: You previously modified (${other_files}) and are now modifying "${relative_target}". Cross-file changes require structured reasoning. Run \`call_mcp_tool\` for \`mcp-sequentialthinking-tools\` (\`sequentialthinking_tools\`) to record your step plan before editing multiple files.`,
    };
    process.stdout.write(JSON.stringify(response) + "\n");
    return;
  }

  if (is_consecutive_thrashing) {
    const response = {
      decision: "deny",
      reason: `Thrashing Prevention Gate: You are editing "${relative_target}" for the ${consecutive_edits_on_target + 1}th time in this turn. Repeated edits to the same file indicate unexpected complications or a loop. Run \`call_mcp_tool\` for \`mcp-sequentialthinking-tools\` (\`sequentialthinking_tools\`) to step back, re-evaluate assumptions, and state your plan before editing again.`,
    };
    process.stdout.write(JSON.stringify(response) + "\n");
    return;
  }

  // Single-file first attempt: zero extra latency, allowed directly
  process.stdout.write(JSON.stringify({ decision: "allow" }) + "\n");
}

run();

/**
 * CHANGELOG
 * -------------------------------------------------------------------------------------------------
 * 2026-09-04: Updated to Multi-File trigger + Thrashing (consecutive edits on same file) trigger.
 * 2026-09-04: Initial creation of PreToolUse sequential thinking gate.
 */
