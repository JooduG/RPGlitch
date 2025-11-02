#!/usr/bin/env node

import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, "..", "..");
const MCP_JSON_PATH = path.join(REPO_ROOT, "mcp.json");

console.log("🔄 Syncing MCP servers to Claude Code...\n");

// Read mcp.json
const mcpConfig = JSON.parse(fs.readFileSync(MCP_JSON_PATH, "utf8"));
const servers = mcpConfig.mcpServers || {};

if (Object.keys(servers).length === 0) {
  console.log("⚠️  No MCP servers found in mcp.json");
  process.exit(0);
}

let successCount = 0;
let failCount = 0;

for (const [name, config] of Object.entries(servers)) {
  try {
    console.log(`Adding ${name}...`);

    // Convert config to JSON string for add-json command
    const jsonString = JSON.stringify(config);

    // Execute claude mcp add-json command
    const command = `claude mcp add-json "${name}" ${JSON.stringify(jsonString)}`;
    execSync(command, { stdio: "inherit" });

    successCount++;
  } catch (error) {
    console.error(`❌ Failed to add ${name}:`, error.message);
    failCount++;
  }
}

console.log(`\n✅ Complete: ${successCount} added, ${failCount} failed`);

if (failCount === 0) {
  console.log("\n🎉 All MCP servers have been added to Claude Code!");
  console.log("   Restart Claude Code to see the changes.");
} else {
  console.log("\n⚠️  Some servers failed to add. You may need to add them manually.");
}
