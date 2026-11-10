/**
 * .agents/skills/local-scripts/scripts/proxy.js
 * 🔌 GLOBAL TOOL PROXY — developer-tool fan-out with local CI fallbacks.
 *
 * Split from bridges.js (see deepwiki-bridge.js for the DeepWiki SSE bridge).
 * Usage:
 *   node proxy.js summarize --mode=parallel <cmd...>
 *   node proxy.js <knowledge|ingest-web|sync-backlog|forge-skill|audit-svelte|svelte-autofix|forge-svelte> [args...]
 */

import { spawnSync, spawn } from "child_process";
import os from "os";
import path from "path";
import fs from "fs";

export const GLOBAL_TOOL_PATHS = Object.freeze({
  summarize: ".gemini/config/skills/planning/scripts/summarize.js",
  knowledge: ".gemini/config/plugins/developer-database-plugin/scripts/developer-database.js",
  "ingest-web": ".gemini/config/plugins/developer-database-plugin/scripts/ingest-web.js",
  "sync-backlog": ".gemini/config/skills/planning/scripts/sync-backlog.js",
  "forge-skill": ".gemini/config/skills/skill-writing/scripts/forge-skill.js",
  "svelte-autofix": ".gemini/config/skills/svelte/scripts/svelte-autofix.js",
  "audit-svelte": ".gemini/config/skills/svelte/scripts/audit-svelte.js",
  "forge-svelte": ".gemini/config/skills/svelte/scripts/forge-svelte.js",
});

/**
 * Proxies a global developer tool or runs the local npm fallback.
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
      console.log(`[Proxy] Global tool "${tool_name}" not found at "${absolute_tool_path}". Using local fallback.`);
      process.env.TOOL_BRIDGE_FALLBACK_NOTICED = "1";
    }

    if (tool_name === "summarize") {
      const is_parallel_mode = tool_arguments.includes("--mode=parallel");
      const target_commands = tool_arguments.filter((argument) => !argument.startsWith("--"));

      if (target_commands.length === 0) {
        console.log("[Proxy] No sub-commands passed to summarize. Exiting.");
        process.exit(0);
      }

      if (is_parallel_mode) {
        console.log(`[Proxy] Concurrently running local commands in parallel: ${target_commands.join(", ")}`);
        const execution_promises = target_commands.map((command_name) => {
          return new Promise((resolve, reject) => {
            console.log(`>> [Proxy] Spawning (parallel): npm run ${command_name}`);
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
          console.log("\n[Proxy] All parallel commands completed successfully.");
          process.exit(0);
        } catch (execution_error) {
          console.error(`\n[Proxy] ${execution_error.message}. Aborting execution.`);
          process.exit(1);
        }
      } else {
        console.log(`[Proxy] Sequentially running local commands: ${target_commands.join(", ")}`);
        for (const command_name of target_commands) {
          console.log(`\n>> [Proxy] Executing: npm run ${command_name}`);
          const execution_result = spawnSync("npm run " + command_name, { stdio: "inherit", shell: true });
          if (execution_result.status !== 0) {
            console.error(`\n[Proxy] Command "npm run ${command_name}" failed with code ${execution_result.status}. Aborting execution.`);
            process.exit(execution_result.status ?? 1);
          }
        }
        console.log("\n[Proxy] All sequential commands completed successfully.");
        process.exit(0);
      }
    } else {
      console.log(`[Proxy] Tool "${tool_name}" is developer-only and not required for CI builds. Skipping.`);
      process.exit(0);
    }
  }
}

const command_line_arguments = process.argv.slice(2);

if (command_line_arguments.length === 0) {
  console.error("Usage: node proxy.js <summarize | knowledge | ingest-web | sync-backlog | forge-skill | audit-svelte | svelte-autofix | forge-svelte> [args...]");
  process.exit(1);
}

await proxy_global_tool(command_line_arguments[0], command_line_arguments.slice(1));

/**
 * CHANGELOG
 * -------------------------------------------------------------------------------------------------
 * 2026-11-10: Split from bridges.js — global-tool proxy half. DeepWiki SSE bridge now lives in
 *   deepwiki-bridge.js. bridges.js is a deprecated re-export shim (removed next pass).
 */
