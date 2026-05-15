import { execSync } from "child_process";
import fs from "fs";
import path from "path";

/**
 * 🎨 orchestration: SUMMARIZE WRAPPER
 * ---------------------------------
 * Sequential execution of npm scripts for grouped tasks.
 * Usage: node summarize.js <script1> <script2> ...
 */

/**
 * Runs a group of npm scripts sequentially.
 * @param {string[]} scriptNames - The names of the npm scripts to run.
 */
export const runGroup = (scriptNames) => {
  const outputDir = path.join(process.cwd(), "tmp");
  const outputFile = path.join(outputDir, "audit_output.txt");

  // Ensure tmp directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Clear existing log
  fs.writeFileSync(outputFile, "");

  const log = (msg) => {
    console.log(msg);
    fs.appendFileSync(outputFile, msg + "\n");
  };

  const logError = (msg) => {
    console.error(msg);
    fs.appendFileSync(outputFile, "ERROR: " + msg + "\n");
  };

  log("\n================================================================================");
  log(`🎨  ORCHESTRATION: SUMMARIZE [ ${scriptNames.join(" | ")} ]`);
  log("================================================================================\n");

  for (const arg of scriptNames) {
    log(`🚀 Executing: npm run ${arg}...`);
    try {
      const output = execSync(`npm run ${arg}`, { encoding: "utf8" });
      log(output);
      log(`✅ ${arg} complete.\n`);
    } catch (err) {
      if (err.stdout) log(err.stdout);
      if (err.stderr) logError(err.stderr);
      logError(`❌ ${arg} failed. Halting summary execution.`);
      process.exit(1);
    }
  }

  log("================================================================================\n");
};

// Main entry check
if (process.argv[1] && process.argv[1].endsWith("summarize.js")) {
  const scripts = process.argv.slice(2).filter((arg) => !arg.startsWith("--"));
  runGroup(scripts);
}
