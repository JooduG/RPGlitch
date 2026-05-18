import fs from "fs";
import yaml from "js-yaml";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const designPath = path.resolve(__dirname, "../DESIGN.md");

const content = fs.readFileSync(designPath, "utf8");

const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
if (!match) {
  console.error("Failed to parse DESIGN.md frontmatter");
  process.exit(1);
}

const frontmatterText = match[1];
const markdownBody = match[2];

const parsed = yaml.load(frontmatterText);

const newYaml = {
  name: parsed.name,
  version: parsed.version,
  colors: {
    ...(parsed.foundations?.colors || {}),
    ...(parsed.semantics?.colors || {}),
  },
  typography: {
    ...(parsed.foundations?.typography || {}),
    ...(parsed.semantics?.typography || {}),
  },
  rounded: {
    ...(parsed.foundations?.rounded || {}),
    ...(parsed.semantics?.rounded || {}),
  },
  spacing: {
    ...(parsed.foundations?.spacing || {}),
    ...(parsed.semantics?.spacing || {}),
    ...(parsed.foundations?.grid || {}),
    ...(parsed.semantics?.grid || {}),
  },
  components: {
    ...(parsed.foundations?.breakpoints || {}),
    ...(parsed.foundations?.kinetic || {}),
    ...(parsed.foundations?.opacity || {}),
    ...(parsed.semantics?.borders || {}),
    ...(parsed.semantics?.depth || {}),
    ...(parsed.semantics?.effects || {}),
    ...(parsed.semantics?.elevation || {}),
    ...(parsed.semantics?.filters || {}),
    ...(parsed.semantics?.kinetic || {}),
    ...(parsed.semantics?.layout || {}),
    ...(parsed.organisms?.components || {}),
  },
};

// Remove static spacing-X definitions (spacing-4, etc.) but keep the calc() ones or whatever we just wrote?
// Wait, the user said "Remove all static spacing-X definitions". They are currently things like `spacing-4: calc(var(--spacing-unit) * 4)`. Does the user want them removed completely? "I'm thinking about removing "--spacing-x" and just do "calc(var(--spacing-unit) * x)" instead.. the list gets so like long and weird when we need --spacing-1 to --spacing-40.. what do you think?"
// Yes, they want to delete `spacing-1` through `spacing-60`.

for (const key of Object.keys(newYaml.spacing)) {
  if (/^spacing-\d+$/.test(key) && key !== "spacing-0") {
    delete newYaml.spacing[key];
  }
}

// Convert any leftover `var(--spacing-X)` in the yaml values to `calc(var(--spacing-unit) * X)`
/**
 *
 */
function traverseAndReplace(obj) {
  for (const key in obj) {
    if (typeof obj[key] === "string") {
      obj[key] = obj[key].replace(
        /var\(--spacing-(\d+)\)/g,
        (match, p1) => `calc(var(--spacing-unit) * ${p1})`,
      );
      // Also map the legacy semantic spacing ones to the 3 tiers
      const spacingMapping = {
        "var(--gap-tight)": "var(--gap-tight)",
        "var(--gap-loose)": "var(--gap-standard)",
        "var(--padding-tight)": "var(--padding-tight)",
        "var(--padding-loose)": "var(--padding-standard)",
        "var(--margin-tight)": "var(--margin-tight)",
        "var(--margin-standard)": "var(--margin-standard)",
      };
      for (const [oldT, newT] of Object.entries(spacingMapping)) {
        if (obj[key].includes(oldT)) {
          obj[key] = obj[key].replace(
            new RegExp(oldT.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g"),
            newT,
          );
        }
      }
    } else if (typeof obj[key] === "object") {
      traverseAndReplace(obj[key]);
    }
  }
}

traverseAndReplace(newYaml);

const newFrontmatterText = yaml.dump(newYaml, { lineWidth: -1 });

const newFileContent = `---\n${newFrontmatterText}---\n${markdownBody}`;

fs.writeFileSync(designPath, newFileContent, "utf8");

console.log("Successfully flattened DESIGN.md");
