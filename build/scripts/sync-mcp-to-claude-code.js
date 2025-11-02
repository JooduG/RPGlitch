#!/usr/bin/env node

// DEPRECATED: This script has been merged into sync.js
// Use: npm run sync:mcp:claude instead

import { execSync } from "child_process";

console.log("⚠️  This script is deprecated. Redirecting to new sync command...\n");

try {
  execSync("node build/scripts/sync.js --mcp --claude", { stdio: "inherit" });
} catch (error) {
  console.error("❌ Sync failed:", error.message);
  process.exit(1);
}
