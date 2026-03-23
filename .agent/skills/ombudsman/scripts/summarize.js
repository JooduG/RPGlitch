/* 🔍 [SECTION: SCRIPT RECAP SUMMARY] --- */

import { spawnSync } from "child_process";

const args = process.argv.slice(2);
const results = [];

console.log("\n🚀 Starting Project Evaluation Sequence...\n");

for (const script of args) {
  process.stdout.write(`⏳ Running npm run ${script}...\n`);

  const result = spawnSync("npm", ["run", script], {
    stdio: "inherit",
    shell: true,
  });

  const success = result.status === 0;
  results.push({ script, success });

  if (success) {
    console.log(`\n✅ ${script} Passed.`);
  } else {
    console.log(`\n❌ ${script} Failed.`);
  }
  console.log("------------------------------------------");
}

console.log("\n📊 --- PROJECT RECAP ---");
console.log("------------------------");
results.forEach(({ script, success }) => {
  const icon = success ? "✅" : "❌";
  const status = success ? "PASS" : "FAIL";
  console.log(`${icon} [${status}] ${script}`);
});
console.log("------------------------\n");

const overallSuccess = results.every((r) => r.success);
if (!overallSuccess) {
  console.error("❌ Evaluation Sequence Failed. Review the logs above.");
  process.exit(1);
} else {
  console.log("✨ All Systems Operational.");
  process.exit(0);
}
