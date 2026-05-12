import { validateLine } from "../.agents/skills/css/scripts/token-integrity.js";
import fs from "fs";

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
