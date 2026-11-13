/**
 * .agents/skills/local-scripts/scripts/deepwiki-bridge.js
 * 🌉 DEEPWIKI MCP STDIO-TO-HTTP BRIDGE - archived, zero in-repo callers.
 *
 * Split from bridges.js. Streams JSON-RPC lines from stdin to the DeepWiki MCP
 * SSE endpoint (https://mcp.deepwiki.com/mcp) and prints data: payloads.
 *
 * STATUS: archived - no npm script, no skill, and no test invokes this bridge.
 * Kept as a standalone file (not deleted) in case an external workflow needs it.
 * If nothing references it next quarter, delete this file.
 *
 * Usage:
 *   node deepwiki-bridge.js   # reads JSON-RPC from stdin, writes responses to stdout
 */

import readline from "readline";

/**
 * Runs the DeepWiki stdio-to-HTTP Server-Sent Events (SSE) bridge.
 */
export function start_deepwiki_bridge() {
  const readline_interface = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false,
  });

  readline_interface.on("line", async (line_content) => {
    if (!line_content.trim()) return;
    try {
      const response = await fetch("https://mcp.deepwiki.com/mcp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json, text/event-stream",
        },
        body: line_content,
      });

      if (!response.ok) {
        const error_text = await response.text();
        console.error(`[DeepWiki Bridge Error] Server returned ${response.status}: ${error_text}`);
        try {
          const message_payload = JSON.parse(line_content);
          if (message_payload.id !== undefined) {
            process.stdout.write(
              JSON.stringify({
                jsonrpc: "2.0",
                id: message_payload.id,
                error: {
                  code: -32603,
                  message: `DeepWiki returned ${response.status}: ${error_text}`,
                },
              }) + "\n",
            );
          }
        } catch {
          // Ignore JSON parse errors for invalid input
        }
        return;
      }

      const response_body_text = await response.text();
      const event_lines = response_body_text.split("\n");
      for (const single_line of event_lines) {
        if (single_line.startsWith("data: ")) {
          const stream_data = single_line.slice(6).trim();
          process.stdout.write(stream_data + "\n");
        }
      }
    } catch (network_error) {
      console.error(`[DeepWiki Bridge Error] ${network_error.message}`);
      try {
        const message_payload = JSON.parse(line_content);
        if (message_payload.id !== undefined) {
          process.stdout.write(
            JSON.stringify({
              jsonrpc: "2.0",
              id: message_payload.id,
              error: {
                code: -32603,
                message: `Bridge error: ${network_error.message}`,
              },
            }) + "\n",
          );
        }
      } catch {
        // Ignore JSON parse errors for invalid input
      }
    }
  });
}

start_deepwiki_bridge();

/**
 * CHANGELOG
 * -------------------------------------------------------------------------------------------------
 * 2026-11-10: Split from bridges.js - DeepWiki half, archived (zero in-repo callers).
 */
