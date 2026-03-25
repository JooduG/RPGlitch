import { execSync } from "child_process";
import path from "path";

const ROOT_DIR = process.cwd();
const SCRIPTS_DIR = path.join(ROOT_DIR, ".agent/skills/warden/scripts");

console.log("\n================================================================================");
console.log("🛡️  THE WARDEN: SYSTEM AUDIT INITIATED");
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

// 1. Unified Modular Audit (The Reflex)
run("MODULAR-AUDIT", `node ${path.join(SCRIPTS_DIR, "audit-engine.js")}`);

// 2. Unit Tests (Vitest)
console.log("\n▶️  [TESTS] Running: npm run test:unit");
try {
  execSync("npm run test:unit -- --run", { stdio: "inherit", cwd: ROOT_DIR });
  console.log("✅ [TESTS] All tests passed.");
} catch (e) {
  console.error("❌ [TESTS] SOME TESTS FAILED.");
  process.exit(1);
}

console.log("\n================================================================================");
console.log("🏁 AUDIT COMPLETE: System is Resonating at 100% Purity.");
console.log("================================================================================\n");
