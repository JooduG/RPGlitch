import { execSync } from "child_process";
import path from "path";

const ROOT_DIR = process.cwd();
const SCRIPTS_DIR = path.join(ROOT_DIR, ".agent/skills/snitch/scripts");

console.log("\n================================================================================");
console.log("🕵️  THE SNITCH: SYSTEM AUDIT INITIATED");
console.log("================================================================================\n");

function run(label, command, ignoreError = false) {
  console.log(`\n▶️  [${label}] Running: ${command}`);
  try {
    execSync(command, { stdio: "inherit", cwd: ROOT_DIR });
    console.log(`✅ [${label}] Passed.`);
  } catch (e) {
    if (!ignoreError) {
      console.error(`\n❌ [${label}] FAILED.`);
      process.exit(1);
    }
    console.warn(`\n⚠️  [${label}] Warnings issued.`);
  }
}

// 1. Security & Compliance Scan
run("SECURITY-SCAN", `node ${path.join(SCRIPTS_DIR, "security-scan.js")}`);

// 2. Janitor & Backlog Update (Ignore errors as it's non-critical)
run("JANITOR", `node ${path.join(SCRIPTS_DIR, "janitor.js")}`, true);

// 3. Unit Tests (Vitest)
console.log("\n▶️  [TESTS] Running: npm run test:unit");
try {
  // Use npm run test:unit which triggers vitest
  // We pass --run to ensure it terminates
  execSync("npm run test:unit -- --run", { stdio: "inherit", cwd: ROOT_DIR });
  console.log("✅ [TESTS] All tests passed.");
} catch (e) {
  console.error("❌ [TESTS] SOME TESTS FAILED.");
  process.exit(1);
}

// 4. Intelligence Structure Scan (Ombudsman)
run("STRUCTURAL-AUDIT", `node .agent/skills/ombudsman/scripts/structural-audit.js`);

console.log("\n================================================================================");
console.log("🏁 AUDIT COMPLETE: System is Resonating at 100% Purity.");
console.log("================================================================================\n");
