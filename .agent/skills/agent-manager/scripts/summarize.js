import { execSync } from "child_process";

const ROOT_DIR = process.cwd();

/**
 * 🏗️ AGENT-MANAGER: SESSION SUMMARY
 * ---------------------------------
 * Synthesizes the results of multiple audit and lint steps into a single recap.
 */

function run(label, command) {
  try {
    execSync(command, { stdio: "inherit", cwd: ROOT_DIR });
    return { script: label, success: true };
  } catch (error) {
    return { script: label, success: false };
  }
}

const args = process.argv.slice(2);
const results = [];

if (args.length === 0) {
  console.log("Usage: node summarize.js <script1> <script2> ...");
  process.exit(1);
}

console.log("\n================================================================================");
console.log("🏗️  THE AGENT-MANAGER: SESSION SUMMARY");
console.log("================================================================================\n");

args.forEach((arg) => {
  const result = run(arg.toUpperCase(), `npm run ${arg}`);
  results.push(result);
});

console.log("\n------------------------------------------");
console.log("📊 --- PROJECT RECAP ---");
console.log("------------------------------------------");

results.forEach(({ script, success }) => {
  const icon = success ? "✅" : "❌";
  const status = success ? "PASS" : "FAIL";
  console.log(`${icon} [${script}]: ${status}`);
});

console.log("------------------------------------------\n");

const allSuccess = results.every((r) => r.success);
process.exit(allSuccess ? 0 : 1);
