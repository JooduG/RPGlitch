/**
 * CONCEPT Validator
 * Ensures that a spec file contains all mandatory intake sections.
 */
const fs = require("fs");
const path = require("path");

const MANDATORY_SECTIONS = [
  "# CONCEPT:",
  "## 🎯 Elevator Pitch",
  "## ⚙️ Core Mechanics",
  "## 🗺️ Data Topography",
  "## ⚠️ Failure States",
  "## 🚫 Out of Scope",
];

function validate(filePath) {
  if (!fs.existsSync(filePath)) {
    console.error(`❌ File not found: ${filePath}`);
    process.exit(1);
  }

  const content = fs.readFileSync(filePath, "utf8");
  const missing = MANDATORY_SECTIONS.filter((section) => !content.includes(section));

  if (missing.length > 0) {
    console.error(`❌ Missing mandatory sections in ${path.basename(filePath)}:`);
    missing.forEach((m) => console.error(`   - ${m}`));
    process.exit(1);
  }

  console.log(`✅ ${path.basename(filePath)} is valid for the intake.`);
}

const target = process.argv[2];
if (!target) {
  console.log("Usage: node spec-validator.js <path-to-spec.md>");
  process.exit(0);
}

validate(target);
