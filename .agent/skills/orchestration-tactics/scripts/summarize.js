import { spawn } from "child_process";

const ROOT_DIR = process.cwd();

/**
 * 🧠 METHODOLOGY: SESSION SUMMARY (ENHANCED)
 * ------------------------------
 * Synthesizes the results of multiple audit and lint steps into a single recap.
 * Captures and aggregates failures at the end for better visibility.
 * Also collects and warns about technical [DEBT] for visibility even on pass.
 */

async function run(label, command) {
  return new Promise((resolve) => {
    const child = spawn(command, {
      cwd: ROOT_DIR,
      shell: true,
      env: { ...process.env, FORCE_COLOR: "1" },
    });

    let output = "";

    child.stdout.on("data", (data) => {
      const str = data.toString();
      process.stdout.write(str);
      output += str;
    });

    child.stderr.on("data", (data) => {
      const str = data.toString();
      process.stderr.write(str);
      output += str;
    });

    child.on("close", (code) => {
      resolve({ script: label, success: code === 0, output });
    });
  });
}

const args = process.argv.slice(2);
if (args.length === 0) {
  console.log("Usage: node summarize.js <script1> <script2> ...");
  process.exit(1);
}

console.log("\n================================================================================");
console.log("🧠  THE METHODOLOGY: SESSION SUMMARY");
console.log("================================================================================\n");

const results = [];
for (const arg of args) {
  const result = await run(arg.toUpperCase(), `npm run ${arg}`);
  results.push(result);
}

console.log("\n------------------------------------------");
console.log("📊 --- PROJECT RECAP ---");
console.log("------------------------------------------");

results.forEach(({ script, success }) => {
  const icon = success ? "✅" : "❌";
  const status = success ? "PASS" : "FAIL";
  console.log(`${icon} [${script}]: ${status}`);
});

const failures = results.filter((r) => !r.success);
if (failures.length > 0) {
  console.log("------------------------------------------");
  console.log("❌ DETAILED FAILURES:");
  console.log("------------------------------------------");
  failures.forEach(({ script, output }) => {
    console.log(`\n[${script}] Error Log:`);
    console.log("------------------------------------------");
    console.log(output.trim());
    console.log("------------------------------------------");
  });
}

// New: Collect and show debt/warnings even if scripts passed
const debtSummary = [];
results.forEach((r) => {
  const lines = r.output
    .split("\n")
    .filter(
      (l) =>
        l.includes("[DEBT]") ||
        l.includes("WARNING:") ||
        (l.toLowerCase().includes("error") && !l.includes("0 error")),
    );
  if (lines.length > 0) {
    const uniqueLines = [...new Set(lines.map((l) => l.trim()))];
    debtSummary.push({ script: r.script, lines: uniqueLines });
  }
});

if (debtSummary.length > 0) {
  console.log("------------------------------------------");
  console.log("⚠️  TECHNICAL DEBT & WARNINGS:");
  console.log("------------------------------------------");
  debtSummary.forEach(({ script, lines }) => {
    console.log(`\n[${script}]:`);
    lines.forEach((line) => console.log(`  ${line}`));
  });
}

if (failures.length === 0 && debtSummary.length === 0) {
  console.log("\n✅ ALL CHECKS PASSED (PERFECT SCORE)");
} else if (failures.length === 0) {
  console.log("\n✅ ALL CHECKS PASSED (WITH REMAINING DEBT)");
} else {
  console.log("\n❌ SOME CHECKS FAILED");
}

console.log("------------------------------------------\n");

const allSuccess = results.every((r) => r.success);
process.exit(allSuccess ? 0 : 1);
