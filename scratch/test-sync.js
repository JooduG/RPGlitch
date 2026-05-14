import fs from "fs";
import { execSync } from "child_process";

// Mock environment or just run the script
try {
  console.log("Running sync-tokens.js...");
  execSync("node .agents/skills/css/scripts/sync-tokens.js", { stdio: "inherit" });
  console.log("Sync complete. Checking output...");

  const css = fs.readFileSync("src/theme/design.css", "utf8");
  console.log("CSS Length:", css.length);
  // Check if some expected tokens are there
  if (css.includes("--background-gradient-1")) {
    console.log("✅ found foundations token");
  } else {
    console.log("❌ foundations token missing");
  }

  if (css.includes("--border-width-base")) {
    console.log("✅ found semantics token");
  } else {
    console.log("❌ semantics token missing");
  }
} catch (e) {
  console.error("Sync failed:", e.message);
}
