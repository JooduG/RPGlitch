import { execSync } from "child_process";

/**
 * 🎨 orchestration: SUMMARIZE WRAPPER
 * ---------------------------------
 * Sequential execution of npm scripts for grouped tasks.
 * Usage: node summarize.js <script1> <script2> ...
 */

const args = process.argv.slice(2).filter((arg) => !arg.startsWith("--"));

console.log("\n================================================================================");
console.log(`🎨  ORCHESTRATION: SUMMARIZE [ ${args.join(" | ")} ]`);
console.log("================================================================================\n");

for (const arg of args) {
  console.log(`🚀 Executing: npm run ${arg}...`);
  try {
    execSync(`npm run ${arg}`, { stdio: "inherit" });
    console.log(`✅ ${arg} complete.\n`);
  } catch (err) {
    console.error(`❌ ${arg} failed. Halting summary execution.`);
    process.exit(1);
  }
}

console.log("================================================================================\n");
