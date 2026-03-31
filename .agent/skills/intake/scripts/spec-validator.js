/**
 * CONCEPT Validator
 * Enforces the border control policy. 
 * Ensures the Discovery Journal contains all mandatory architectural markers before downstream execution.
 */

const fs = require("fs");
const path = require("path");

const MANDATORY_SECTIONS = [
  "# 📓 Discovery Journal:",
  "## 🎯 The Core Intent",
  "## ⚙️ The Physics (Mechanics)",
  "## 🗺️ Data Topography",
  "## ⚠️ Failure States & 🚫 The Fence (Out of Scope)"
];

function validate(filePath) {
  if (!fs.existsSync(filePath)) {
    console.error(`[FATAL] File missing at checkpoint: ${filePath}`);
    process.exit(1);
  }

  const content = fs.readFileSync(filePath, "utf8");
  const missing = MANDATORY_SECTIONS.filter((section) => !content.includes(section));

  if (missing.length > 0) {
    console.error(`[QUARANTINE ENFORCED] Missing structural physics in ${path.basename(filePath)}:`);
    missing.forEach((m) => console.error(`   - ${m}`));
    console.error("\n#TODO-AI: Reject payload. Return to user for semantic handshake.");
    process.exit(1);
  }

  console.log(`[CLEARANCE GRANTED] ${path.basename(filePath)} has entered the canon. Routing to orchestrator...`);
}

const target = process.argv[2];
if (!target) {
  console.log("Usage: node validator.js <path-to-spec.md>");
  process.exit(0);
}

validate(target);
