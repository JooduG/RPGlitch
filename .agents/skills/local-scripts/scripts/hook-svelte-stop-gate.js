/**
 * -------------------------------------------------------------------------------------------------
 * Antigravity Lifecycle Hook: Svelte Autofixer Stop Gate
 * -------------------------------------------------------------------------------------------------
 * Invoked when the agent attempts to conclude its turn. Inspects the transcript:
 * if any `.svelte` file was modified or created during this session and `svelte-autofixer`
 * has not been invoked afterwards, it blocks the stop and forces execution of the tool.
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
  const payload = read_stdin_payload();
  const transcript_path = payload?.transcriptPath || "";

  if (!transcript_path || !fs.existsSync(transcript_path)) {
    process.stdout.write(JSON.stringify({ decision: "stop" }) + "\n");
    return;
  }

  let modified_svelte = false;
  let ran_autofixer = false;

  try {
    const raw_transcript = fs.readFileSync(transcript_path, "utf-8");
    const lines = raw_transcript.trim().split("\n");

    // Scan backwards from most recent actions in this invocation
    for (let i = lines.length - 1; i >= 0; i--) {
      const line = lines[i];
      if (!line) continue;

      try {
        const step = JSON.parse(line);

        // Stop scanning if we hit a past user input turn boundary
        if (step.type === "USER_INPUT") {
          break;
        }

        const stringified = JSON.stringify(step);

        if (stringified.includes("svelte-autofixer")) {
          ran_autofixer = true;
        }

        if (
          /\.svelte["']/.test(stringified) &&
          (step.tool_calls?.some(
            (tc) => tc.name === "write_to_file" || tc.name === "replace_file_content" || tc.name === "multi_replace_file_content",
          ) ||
            step.content?.includes("write_to_file") ||
            step.content?.includes("replace_file_content"))
        ) {
          modified_svelte = true;
        }
      } catch {
        // Continue processing other lines
      }
    }
  } catch {
    // If reading transcript fails, allow stop
  }

  // If Svelte code was touched but autofixer was never invoked in this turn:
  if (modified_svelte && !ran_autofixer) {
    const response = {
      decision: "continue",
      reason:
        "Svelte component code was modified or created, but `svelte-autofixer` was not executed. You must call `call_mcp_tool` with ServerName: 'svelte' and ToolName: 'svelte-autofixer' on the modified Svelte file to verify and fix any component issues before concluding.",
    };
    process.stdout.write(JSON.stringify(response) + "\n");
    return;
  }

  // Allow stop
  process.stdout.write(JSON.stringify({ decision: "stop" }) + "\n");
}

run();

/**
 * CHANGELOG
 * -------------------------------------------------------------------------------------------------
 * 2026-09-04: Initial creation of Stop gate enforcing svelte-autofixer usage.
 */
