import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// This dictionary maps legacy/pruned tokens to their new, simplified tokens.
const TOKEN_MAPPING = {
  // --- Colors ---
  "--background-base": "--chalk",
  "--entity-color": "--signature-color",
  "--font-color-base": "--frisk",
  "--font-color-muted": "--frozen",
  "--danger-color": "--crimson-red",

  // --- Borders ---
  "--border-bottom": "--border-ghost",
  "--border-side": "--border-whisper",
  "--border-top": "--border-muted",

  // --- Spacing (Consolidate Semantic) ---
  "--gap-tight": "--gap-tight",
  "--gap-loose": "--gap-standard",
  "--gap-nano": "--spacing-pixel",
  "--gap-moderate": "--gap-standard",
  "--gap-section": "--gap-standard",
  "--profile-gap-section": "--gap-standard",
  "--padding-tight": "--padding-tight",
  "--padding-loose": "--padding-standard",
  "--padding-header": "--padding-standard",
  "--padding-action": "--padding-standard",
  "--padding-action-small": "--padding-tight",
  "--padding-section": "--padding-standard",
  "--padding-message": "--padding-standard",
  "--padding-message-side": "--padding-standard",
  "--padding-backdrop": "--padding-standard",
  "--padding-moderate": "--padding-standard",
  "--padding-nano": "--padding-tight",
  "--margin-tight": "--margin-tight",
  "--margin-standard": "--margin-standard",
  "--margin-loose": "--margin-loose",
  "--margin-message": "--margin-standard",
  "--margin-moderate": "--margin-standard",
  "--margin-nano": "--margin-tight",
  "--auto-resize-buffer": "--spacing-pixel",

  // --- Opacities ---
  "--opacity-base": "--opacity-muted",
  "--opacity-half": "--opacity-muted",
  "--opacity-heavy": "--opacity-muted",
  "--opacity-moderate": "--opacity-muted",
  "--opacity-substantial": "--opacity-muted",
  "--opacity-whisper": "--opacity-whisper",
  "--opacity-muted": "--opacity-muted",
  "--opacity-ghost": "--opacity-ghost",
  "--opacity-intense": "--opacity-solid",

  // --- Durations ---
  "--duration-reflex": "--duration-fast",
  "--duration-pulse": "--duration-ambient",
  "--duration-shimmer": "--duration-ambient",
  "--duration-tremor": "--duration-ambient",
  "--duration-atmospheric": "--duration-ambient",

  // --- Z-Indexes ---
  "--z-index-0": "--z-index-base",
  "--floor-z-index": "--z-index-base",
  "--z-index-10": "--z-index-surface",
  "--z-index-20": "--z-index-surface",
  "--surface-z-index": "--z-index-surface",
  "--surface-peak-z-index": "--z-index-surface",
  "--z-index-50": "--z-index-elevated",
  "--mid-z-index": "--z-index-elevated",
  "--z-index-100": "--z-index-overlay",
  "--z-index-200": "--z-index-overlay",
  "--z-index-210": "--z-index-overlay",
  "--overlay-z-index": "--z-index-overlay",
  "--overlay-peak-z-index": "--z-index-overlay",
  "--z-index-300": "--z-index-modal",
  "--modal-z-index": "--z-index-modal",
  "--z-index-1000": "--z-index-modal",
  "--toast-z-index": "--z-index-modal",
  "--z-index-max": "--z-index-modal",
  "--max-z-index": "--z-index-modal",
  "--deep-z-index": "--z-index-below",

  // --- Elevation/Blurs ---
  "--glass-sunken-blur": "--blur-whisper",
  "--glass-base-blur": "--blur-whisper",
  "--glass-elevated-blur": "--blur-mist",
  "--glass-peak-blur": "--blur-void",

  // --- Scale & Kinetic ---
  "--scale-tremor-high": "--scale-pulse",
  "--scale-tremor-low": "--scale-pulse",
  "--scale-tremor-mid": "--scale-pulse",
  "--scale-pulse-max": "--scale-pulse",
  "--scale-pulse-mid": "--scale-pulse",
  "--scale-zoom": "--scale-pulse",

  // --- Shadows ---
  "--shadow-focus": "--shadow-standard",
  "--shadow-heavy": "--shadow-standard",
  "--shadow-light": "--shadow-standard",

  // --- Typography ---
  "--font-weight-heavy": "--font-weight-bold",
  "--font-height-s": "--font-height-base",
  "--font-height-short": "--font-height-base",

  // --- Misc Aliases ---
  "--header-signature": "--signature-color",
  "--click-sink": "--scale-sink",
  "--click-dim": "--brightness-dim",
  "--hover-lift": "--scale-lift",
  "--hover-glow": "--brightness-glow",
  "--active-swatch-shadow": "--signature-glow",
  "--angle-right": "90deg",
  "--angle-roll": "360deg",
  "--angle-shimmy": "30deg",
  "--angle-skew": "-20deg",
  "--angle-spin": "90deg",
};

// Directories to scan
const TARGET_DIRS = [path.resolve(__dirname, "../src"), path.resolve(__dirname, "../.agents")];

// Specific files to scan (e.g., in root)
const TARGET_FILES = [path.resolve(__dirname, "../DESIGN.md")];

// Supported extensions
const EXTENSIONS = [".svelte", ".js", ".ts", ".css", ".md"];

/**
 *
 */
function getAllFiles(dirPath, arrayOfFiles) {
  const files = fs.readdirSync(dirPath);

  arrayOfFiles = arrayOfFiles || [];

  files.forEach((file) => {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      if (file !== "node_modules" && !file.startsWith(".")) {
        arrayOfFiles = getAllFiles(fullPath, arrayOfFiles);
      }
    } else {
      const ext = path.extname(file);
      if (EXTENSIONS.includes(ext)) {
        arrayOfFiles.push(fullPath);
      }
    }
  });

  return arrayOfFiles;
}

/**
 *
 */
function migrateTokens() {
  console.log("Starting token migration...");
  let totalReplacements = 0;
  let modifiedFiles = 0;

  const projectRoot = path.resolve(__dirname, "..");
  const allFiles = [...TARGET_FILES];
  TARGET_DIRS.forEach((targetDir) => {
    allFiles.push(...getAllFiles(targetDir));
  });

  allFiles.forEach((file) => {
    if (!fs.existsSync(file)) return;
    let content = fs.readFileSync(file, "utf-8");
    let fileModified = false;

    Object.entries(TOKEN_MAPPING).forEach(([oldToken, newToken]) => {
      // Escape the token for regex (though they mostly contain safe characters)
      const escapedOldToken = oldToken.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

      // Match the token ensuring it's surrounded by word boundaries or specific characters
      // Since CSS variables have hyphens, \b might not work perfectly, so we'll just global replace
      // but we need to ensure we don't partially match, e.g., --gap-loose-extra
      const regex = new RegExp(`(?<![\\w-])` + escapedOldToken + `(?![\\w-])`, "g");

      if (regex.test(content)) {
        const matches = content.match(regex).length;
        content = content.replace(regex, newToken);
        totalReplacements += matches;
        fileModified = true;
        console.log(
          `Replaced ${matches} instances of ${oldToken} with ${newToken} in ${path.relative(projectRoot, file)}`,
        );
      }
    });

    // Convert var(--spacing-X) to calc(var(--spacing-unit) * X)
    const spacingRegex = /var\(--spacing-(\d+)\)/g;
    if (spacingRegex.test(content)) {
      const matches = content.match(spacingRegex).length;
      content = content.replace(spacingRegex, (match, p1) => `calc(var(--spacing-unit) * ${p1})`);
      totalReplacements += matches;
      fileModified = true;
      console.log(
        `Replaced ${matches} instances of var(--spacing-X) with calc() in ${path.relative(projectRoot, file)}`,
      );
    }

    // Convert var(--columns-X) to calc(var(--column-unit) * X)
    const columnRegex = /var\(--columns-(\d+)\)/g;
    if (columnRegex.test(content)) {
      const matches = content.match(columnRegex).length;
      content = content.replace(columnRegex, (match, p1) => `calc(var(--column-unit) * ${p1})`);
      totalReplacements += matches;
      fileModified = true;
      console.log(
        `Replaced ${matches} instances of var(--columns-X) with calc() in ${path.relative(projectRoot, file)}`,
      );
    }

    // Convert var(--rows-X) to calc(var(--row-unit) * X)
    const rowRegex = /var\(--rows-(\d+)\)/g;
    if (rowRegex.test(content)) {
      const matches = content.match(rowRegex).length;
      content = content.replace(rowRegex, (match, p1) => `calc(var(--row-unit) * ${p1})`);
      totalReplacements += matches;
      fileModified = true;
      console.log(
        `Replaced ${matches} instances of var(--rows-X) with calc() in ${path.relative(projectRoot, file)}`,
      );
    }

    if (fileModified) {
      fs.writeFileSync(file, content, "utf-8");
      modifiedFiles++;
    }
  });

  console.log(`\nMigration complete!`);
  console.log(`Modified ${modifiedFiles} files.`);
  console.log(`Made ${totalReplacements} total replacements.`);
}

migrateTokens();
