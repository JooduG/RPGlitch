/**
 * .agents/skills/local-scripts/scripts/bridges.js
 * 🌉 UNIFIED EXTERNAL ENVIRONMENT & TOOL BRIDGE
 *
 * Provides a unified proxy bridge between the local repository, global developer
 * tooling in ~/.gemini/config/, and external MCP endpoints:
 *   1. DeepWiki MCP Stdio-to-HTTP Bridge (`deepwiki`):
 *      Listens on stdin for JSON-RPC messages and streams requests/responses
 *      to/from the DeepWiki MCP SSE endpoint (https://mcp.deepwiki.com/mcp).
 *   2. Global Tool Proxies (`summarize`, `knowledge`, `ingest-web`, `sync-backlog`, `forge-skill`):
 *      Checks if specialized developer tools exist globally. If present, spawns them.
 *      If missing (e.g. CI environments), executes local npm fallbacks or gracefully skips.
 *
 * Usage:
 *   node bridges.js deepwiki                       # Starts DeepWiki MCP SSE streaming bridge
 *   node bridges.js summarize --mode=parallel ...  # Proxies global summarize or runs local parallel fallback
 *   node bridges.js <tool-name> [arguments...]     # Proxies global tool
 */

import { spawnSync, spawn } from "child_process";
import os from "os";
import path from "path";
import fs from "fs";
import readline from "readline";

// =================================================================================================
// 1. TOOL PATH MAPPINGS & REGISTRY
// =================================================================================================

const GLOBAL_TOOL_PATHS = Object.freeze({
  summarize: ".gemini/config/skills/planning/scripts/summarize.js",
  knowledge: ".gemini/config/skills/developer-database/scripts/developer-database.js",
  "ingest-web": ".gemini/config/skills/developer-database/scripts/ingest-web.js",
  "sync-backlog": ".gemini/config/skills/planning/scripts/sync-backlog.js",
  "forge-skill": ".gemini/config/skills/skill-writing/scripts/forge-skill.js",
});

// =================================================================================================
// 2. DEEPWIKI MCP STREAMING BRIDGE ENGINE
// =================================================================================================

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

// =================================================================================================
// 3. GLOBAL TOOL PROXY & FALLBACK ENGINE
// =================================================================================================

/**
 * Handles proxying of global developer tools or running local npm fallbacks.
 *
 * @param {string} tool_name Target tool name.
 * @param {string[]} tool_arguments Additional CLI arguments.
 */
export async function proxy_global_tool(tool_name, tool_arguments) {
  const relative_path = GLOBAL_TOOL_PATHS[tool_name];
  if (!relative_path) {
    console.error(`Unknown tool name: "${tool_name}"`);
    process.exit(1);
  }

  const home_directory = process.env.TEST_HOME_DIR || os.homedir();
  const absolute_tool_path = path.join(home_directory, relative_path);

  if (fs.existsSync(absolute_tool_path)) {
    const process_result = spawnSync("node", [absolute_tool_path, ...tool_arguments], { stdio: "inherit" });
    process.exit(process_result.status ?? 0);
  } else {
    const already_noticed = process.env.TOOL_BRIDGE_FALLBACK_NOTICED === "1";
    if (!already_noticed) {
      console.log(`[Bridges] Global tool "${tool_name}" not found at "${absolute_tool_path}". Using local fallback.`);
      process.env.TOOL_BRIDGE_FALLBACK_NOTICED = "1";
    }

    if (tool_name === "summarize") {
      const is_parallel_mode = tool_arguments.includes("--mode=parallel");
      const target_commands = tool_arguments.filter((argument) => !argument.startsWith("--"));

      if (target_commands.length === 0) {
        console.log("[Bridges] No sub-commands passed to summarize. Exiting.");
        process.exit(0);
      }

      if (is_parallel_mode) {
        console.log(`[Bridges] Concurrently running local commands in parallel: ${target_commands.join(", ")}`);
        const execution_promises = target_commands.map((command_name) => {
          return new Promise((resolve, reject) => {
            console.log(`>> [Bridges] Spawning (parallel): npm run ${command_name}`);
            const child_process = spawn("npm run " + command_name, { stdio: "inherit", shell: true });
            child_process.on("error", (spawn_error) => reject(new Error(`Failed to spawn "npm run ${command_name}": ${spawn_error.message}`)));
            child_process.on("close", (exit_code) => {
              if (exit_code === 0) resolve();
              else reject(new Error(`Command "npm run ${command_name}" failed with code ${exit_code}`));
            });
          });
        });

        try {
          await Promise.all(execution_promises);
          console.log("\n[Bridges] All parallel commands completed successfully.");
          process.exit(0);
        } catch (execution_error) {
          console.error(`\n[Bridges] ${execution_error.message}. Aborting execution.`);
          process.exit(1);
        }
      } else {
        console.log(`[Bridges] Sequentially running local commands: ${target_commands.join(", ")}`);
        for (const command_name of target_commands) {
          console.log(`\n>> [Bridges] Executing: npm run ${command_name}`);
          const execution_result = spawnSync("npm run " + command_name, { stdio: "inherit", shell: true });
          if (execution_result.status !== 0) {
            console.error(`\n[Bridges] Command "npm run ${command_name}" failed with code ${execution_result.status}. Aborting execution.`);
            process.exit(execution_result.status ?? 1);
          }
        }
        console.log("\n[Bridges] All sequential commands completed successfully.");
        process.exit(0);
      }
    } else {
      console.log(`[Bridges] Tool "${tool_name}" is developer-only and not required for CI builds. Skipping.`);
      process.exit(0);
    }
  }
}

// =================================================================================================
// 4. CLI DISPATCHER
// =================================================================================================

const command_line_arguments = process.argv.slice(2);

if (command_line_arguments.length === 0) {
  console.error("Usage: node bridges.js <deepwiki | summarize | knowledge | ingest-web | sync-backlog | forge-skill> [args...]");
  process.exit(1);
}

const requested_operation = command_line_arguments[0];
const operation_arguments = command_line_arguments.slice(1);

if (requested_operation === "deepwiki" || requested_operation === "deepwiki-bridge") {
  start_deepwiki_bridge();
} else {
  await proxy_global_tool(requested_operation, operation_arguments);
}

/**
 * CHANGELOG
 * -------------------------------------------------------------------------------------------------
 * 2026-09-05: Consolidated tool-bridge.js and deepwiki-bridge.cjs into unified bridges.js with zero-abbreviation nomenclature.
 */
