import { execSync } from "child_process";
import fs from "fs";
import path from "path";

/**
 * 🎨 orchestration: SUMMARIZE WRAPPER
 * ---------------------------------
 * Sequential execution of npm scripts for grouped tasks.
 * Usage: node summarize.js <script1> <script2> ...
 */

const args = process.argv.slice(2).filter((arg) => !arg.startsWith("--"));
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
log(`🎨  ORCHESTRATION: SUMMARIZE [ ${args.join(" | ")} ]`);
log("================================================================================\n");

for (const arg of args) {
  log(`🚀 Executing: npm run ${arg}...`);
  try {
    // Capture output to both console and file
    // We use "pipe" to capture output, but we also want it to be "live" if possible.
    // However, execSync with "inherit" is easier for live, but harder to capture.
    // Let's use { stdio: ["inherit", "pipe", "inherit"] } or just capture after.
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
