import { validateLine } from "./token-integrity.js";
import fs from "fs";

// Standalone debug logic wrapped for modularity
if (process.argv[1] && process.argv[1].endsWith("debug-auditor.js")) {
  const filePath = "src/ui/atoms/Slider.svelte";
  const content = fs.readFileSync(filePath, "utf-8");
  const lines = content.split("\n");

  lines.forEach((line, i) => {
    if (line.includes("var(--")) {
      const invalidToken = validateLine(line);
      if (invalidToken) {
        console.log(`Line ${i + 1}: Invalid token found: ${invalidToken}`);
        console.log(`  Code: ${line.trim()}`);
      }
    }
  });
}
