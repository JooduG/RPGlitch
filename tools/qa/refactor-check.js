/**
 * RPGlitch Refactor Verification Script (ESM Version)
 * Checks for "Two-Panel Law" violations and decouple leakage.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Recreate __dirname for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const RED = "\x1b[31m";
const GREEN = "\x1b[32m";
const RESET = "\x1b[0m";

function checkFile(filePath, checks) {
  // Ensure file exists before reading
  if (!fs.existsSync(filePath)) {
    console.log(
      RED + `❌ CRITICAL: File not found -> ${path.basename(filePath)}` + RESET,
    );
    return false;
  }

  const content = fs.readFileSync(filePath, "utf8");
  const fileName = path.basename(filePath);
  let errors = [];

  console.log(`Scanning ${fileName}...`);

  checks.forEach((check) => {
    if (check.forbidden && content.includes(check.pattern)) {
      errors.push(`❌ FOUND FORBIDDEN: "${check.pattern}" (${check.reason})`);
    }
    if (check.required && !content.includes(check.pattern)) {
      errors.push(`❌ MISSING REQUIRED: "${check.pattern}" (${check.reason})`);
    }
  });

  if (errors.length > 0) {
    errors.forEach((e) => console.log(RED + "  " + e + RESET));
    return false;
  } else {
    console.log(GREEN + "  ✅ Clean." + RESET);
    return true;
  }
}

// --- CONFIGURATION ---

// Navigate up from /tools/qa/ to project root, then to apps/rpglitch
const BASE_DIR = path.join(__dirname, "../../apps/rpglitch");

const JS_DIR = path.join(BASE_DIR, "js");
const SCSS_DIR = path.join(BASE_DIR, "scss");

const CHECKS = {
  // 1. The Engine must be pure
  "engine/director.js": [
    {
      pattern: "document.querySelector",
      forbidden: true,
      reason: "Engine should not touch DOM",
    },
    {
      pattern: "window.confirm",
      forbidden: true,
      reason: "Engine should not block UI",
    },
    {
      pattern: "window.alert",
      forbidden: true,
      reason: "Engine should not block UI",
    },
    {
      pattern: "../ui/orchestrator.js",
      forbidden: true,
      reason: "Engine should not import UI Controller",
    },
    {
      pattern: "dispatchEvent",
      required: true,
      reason: "Engine must emit events",
    },
  ],
  // 2. The View should not use inline styles
  "ui/components/chat/feed.js": [
    {
      pattern: "el.style.setProperty",
      forbidden: true,
      reason: "Use CSS classes, not inline styles",
    },
    { pattern: "z-index", forbidden: true, reason: "Styling leakage detected" },
    {
      pattern: ".concluded-controls",
      required: true,
      reason: "Must reference new CSS class",
    },
  ],
  // 3. The Orchestrator must handle the logic
  "ui/orchestrator.js": [
    {
      pattern: "handleConcludeStory",
      required: true,
      reason: "Must handle confirmation flow",
    },
    {
      pattern: 'import("../engine/director.js")',
      required: true,
      reason: "Must import Engine dynamically",
    },
  ],
  // 4. The CSS must exist
  "components/_chat.scss": [
    {
      pattern: ".concluded-controls",
      required: true,
      reason: "Missing Concluded Controls class",
    },
  ],
  "layout/_mobile-mode.scss": [
    {
      pattern: ".theme-smartphone",
      required: true,
      reason: "Mobile mode missing",
    },
  ],
};

// --- EXECUTION ---

console.log("🔍 Starting RPGlitch Refactor Audit...");
console.log(`📂 Target: ${BASE_DIR}`);
console.log("---------------------------------------------------");

let passed = true;

try {
  // Check JS
  if (
    !checkFile(
      path.join(JS_DIR, "engine/director.js"),
      CHECKS["engine/director.js"],
    )
  )
    passed = false;
  if (
    !checkFile(
      path.join(JS_DIR, "ui/components/chat/feed.js"),
      CHECKS["ui/components/chat/feed.js"],
    )
  )
    passed = false;
  if (
    !checkFile(
      path.join(JS_DIR, "ui/orchestrator.js"),
      CHECKS["ui/orchestrator.js"],
    )
  )
    passed = false;

  // Check SCSS
  if (
    !checkFile(
      path.join(SCSS_DIR, "components/_chat.scss"),
      CHECKS["components/_chat.scss"],
    )
  )
    passed = false;
  if (
    !checkFile(
      path.join(SCSS_DIR, "layout/_mobile-mode.scss"),
      CHECKS["layout/_mobile-mode.scss"],
    )
  )
    passed = false;
} catch (e) {
  console.error(RED + "CRITICAL ERROR: Script crashed." + RESET);
  console.error(e);
  passed = false;
}

console.log("---------------------------------------------------");
if (passed) {
  console.log(GREEN + "🚀 PRE-FLIGHT CHECK PASSED. SYSTEM READY." + RESET);
} else {
  console.log(RED + "⚠️  ISSUES DETECTED. DO NOT SHIP." + RESET);
  process.exit(1);
}
