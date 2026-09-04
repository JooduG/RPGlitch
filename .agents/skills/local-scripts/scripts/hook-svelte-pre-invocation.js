/**
 * -------------------------------------------------------------------------------------------------
 * Antigravity Lifecycle Hook: Svelte Autofixer Prompt Injector (PreInvocation)
 * -------------------------------------------------------------------------------------------------
 * Detects if the current turn involves Svelte development or modifications, and injects
 * an ephemeral reminder ensuring the agent runs `svelte-autofixer` before concluding.
 * Receives JSON on stdin and writes injectSteps JSON to stdout.
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

  let mentions_svelte = false;

  // Check recent transcript entries if available
  if (transcript_path && fs.existsSync(transcript_path)) {
    try {
      const content = fs.readFileSync(transcript_path, "utf-8");
      const lines = content.trim().split("\n");
      const recent_lines = lines.slice(-20).join("\n");
      if (/\.svelte\b|svelte-autofixer/i.test(recent_lines)) {
        mentions_svelte = true;
      }
    } catch {
      // Fallback
    }
  }

  if (mentions_svelte) {
    const response = {
      injectSteps: [
        {
          ephemeralMessage:
            "Mandatory Protocol: When creating or modifying Svelte code, you MUST execute `call_mcp_tool` with ServerName: 'svelte' and ToolName: 'svelte-autofixer' before concluding your turn.",
        },
      ],
    };
    process.stdout.write(JSON.stringify(response) + "\n");
    return;
  }

  // No injection needed
  process.stdout.write(JSON.stringify({ injectSteps: [] }) + "\n");
}

run();

/**
 * CHANGELOG
 * -------------------------------------------------------------------------------------------------
 * 2026-09-04: Initial creation of PreInvocation svelte-autofixer reminder hook.
 */
