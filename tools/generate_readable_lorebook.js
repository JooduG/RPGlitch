import fs from "fs";
import path from "path";

const lorebookPath = path.resolve("ANEX_Lorebook.json");
const outputPath = path.resolve("ANEX_Lorebook_Readable.md");

try {
  const rawData = fs.readFileSync(lorebookPath, "utf8");
  const lorebook = JSON.parse(rawData);

  let output = `# ANEX Lorebook Readable View\n\n`;
  output += `> **Note:** This file is generated for readability. Edits here will NOT affect the JSON file.\n\n`;

  if (lorebook.prompts && Array.isArray(lorebook.prompts)) {
    lorebook.prompts.forEach((entry) => {
      output += `## ${entry.name || "Untitled Entry"}\n\n`;

      // Handle content
      if (entry.content) {
        // Remove the start/end quotes if it's just a string dump, but here we just print the raw string content with newlines
        output += `${entry.content}\n\n`;
      } else {
        output += `*(No Content)*\n\n`;
      }

      output += `---\n\n`;
    });
  } else {
    output += `No 'prompts' array found in the JSON file.`;
  }

  fs.writeFileSync(outputPath, output);
  console.log(`Successfully generated ${outputPath}`);
} catch (error) {
  console.error("Error processing lorebook:", error);
  process.exit(1);
}
