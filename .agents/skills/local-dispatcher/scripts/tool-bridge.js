import { spawnSync } from "child_process";
import os from "os";
import path from "path";
import fs from "fs";

// Tool mappings relative to home directory
const TOOL_PATHS = {
  summarize: ".gemini/config/skills/master-dispatcher/scripts/summarize.js",
  knowledge: ".gemini/config/skills/developer-database/scripts/developer-database.js",
  "ingest-web": ".gemini/config/skills/developer-database/scripts/ingest-web.js",
  "sync-backlog": ".gemini/config/skills/legislative/scripts/sync-backlog.js",
  "forge-skill": ".gemini/config/skills/legislative/scripts/forge-skill.js",
};

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error("Usage: node tool-bridge.js <tool-name> [args...]");
  process.exit(1);
}

const toolName = args[0];
const toolArgs = args.slice(1);

const relativePath = TOOL_PATHS[toolName];
if (!relativePath) {
  console.error(`Unknown tool name: "${toolName}"`);
  process.exit(1);
}

const homeDir = process.env.TEST_HOME_DIR || os.homedir();
const absolutePath = path.join(homeDir, relativePath);

if (fs.existsSync(absolutePath)) {
  // If the global tool exists, run it transparently
  const result = spawnSync("node", [absolutePath, ...toolArgs], { stdio: "inherit", shell: true });
  process.exit(result.status ?? 0);
} else {
  // If the global tool does not exist (e.g. in CI or on another machine)
  console.log(`[Tool-Bridge] Global tool "${toolName}" not found at "${absolutePath}". Using local fallback.`);

  if (toolName === "summarize") {
    // Filter out flags (e.g. --mode=sequential or --mode=parallel)
    const commands = toolArgs.filter((arg) => !arg.startsWith("--"));

    if (commands.length === 0) {
      console.log("[Tool-Bridge] No sub-commands passed to summarize. Exiting.");
      process.exit(0);
    }

    console.log(`[Tool-Bridge] Sequentially running local commands: ${commands.join(", ")}`);

    for (const cmd of commands) {
      console.log(`\n>> [Tool-Bridge] Executing: npm run ${cmd}`);
      // Use npm.cmd on Windows if shell: false, but shell: true resolves it automatically
      const result = spawnSync("npm", ["run", cmd], { stdio: "inherit", shell: true });

      if (result.status !== 0) {
        console.error(`\n[Tool-Bridge] Command "npm run ${cmd}" failed with code ${result.status}. Aborting execution.`);
        process.exit(result.status ?? 1);
      }
    }

    console.log("\n[Tool-Bridge] All sequential commands completed successfully.");
    process.exit(0);
  } else {
    // Other developer-only global tools are skipped in CI
    console.log(`[Tool-Bridge] Script "${toolName}" is developer-only and not required for CI builds. Skipping.`);
    process.exit(0);
  }
}
