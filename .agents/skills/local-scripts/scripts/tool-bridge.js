import { spawnSync, spawn } from "child_process";
import os from "os";
import path from "path";
import fs from "fs";

// npm is a .cmd batch shim on Windows, which can only be launched via a shell.
// Use shell:true WITH A SINGLE STRING command (never an args array): that is
// the only form that both launches reliably cross-platform and avoids Node's
// DEP0190 "args with shell" deprecation.

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
  const result = spawnSync("node", [absolutePath, ...toolArgs], { stdio: "inherit" });
  process.exit(result.status ?? 0);
} else {
  // If the global tool does not exist (e.g. in CI or on another machine),
  // print the fallback notice only once per process tree: child npm invocations
  // spawned below inherit TOOL_BRIDGE_FALLBACK_NOTICED, so nested
  // summarize:sequential / summarize:parallel chains don't repeat it.
  const alreadyNoticed = process.env.TOOL_BRIDGE_FALLBACK_NOTICED === "1";
  if (!alreadyNoticed) {
    console.log(`[Tool-Bridge] Global tool "${toolName}" not found at "${absolutePath}". Using local fallback.`);
    process.env.TOOL_BRIDGE_FALLBACK_NOTICED = "1";
  }

  if (toolName === "summarize") {
    const isParallel = toolArgs.includes("--mode=parallel");
    const commands = toolArgs.filter((arg) => !arg.startsWith("--"));

    if (commands.length === 0) {
      console.log("[Tool-Bridge] No sub-commands passed to summarize. Exiting.");
      process.exit(0);
    }

    if (isParallel) {
      console.log(`[Tool-Bridge] Concurrently running local commands in parallel: ${commands.join(", ")}`);
      const promises = commands.map((cmd) => {
        return new Promise((resolve, reject) => {
          console.log(`>> [Tool-Bridge] Spawning (parallel): npm run ${cmd}`);
          const child = spawn("npm run " + cmd, { stdio: "inherit", shell: true });
          child.on("error", (err) => reject(new Error(`Failed to spawn "npm run ${cmd}": ${err.message}`)));
          child.on("close", (code) => {
            if (code === 0) resolve();
            else reject(new Error(`Command "npm run ${cmd}" failed with code ${code}`));
          });
        });
      });

      try {
        await Promise.all(promises);
        console.log("\n[Tool-Bridge] All parallel commands completed successfully.");
        process.exit(0);
      } catch (err) {
        console.error(`\n[Tool-Bridge] ${err.message}. Aborting execution.`);
        process.exit(1);
      }
    } else {
      console.log(`[Tool-Bridge] Sequentially running local commands: ${commands.join(", ")}`);

      for (const cmd of commands) {
        console.log(`\n>> [Tool-Bridge] Executing: npm run ${cmd}`);
        const result = spawnSync("npm run " + cmd, { stdio: "inherit", shell: true });

        if (result.status !== 0) {
          console.error(`\n[Tool-Bridge] Command "npm run ${cmd}" failed with code ${result.status}. Aborting execution.`);
          process.exit(result.status ?? 1);
        }
      }

      console.log("\n[Tool-Bridge] All sequential commands completed successfully.");
      process.exit(0);
    }
  } else {
    // Other developer-only global tools are skipped in CI
    console.log(`[Tool-Bridge] Script "${toolName}" is developer-only and not required for CI builds. Skipping.`);
    process.exit(0);
  }
}
