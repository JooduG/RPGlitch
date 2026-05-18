import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Directories to scan
const TARGET_DIRS = [
  path.resolve(__dirname, "../src"),
  path.resolve(__dirname, "../.agents"),
  path.resolve(__dirname, ".."), // includes DESIGN.md in the root
];

// Supported extensions
const EXTENSIONS = [".svelte", ".js", ".ts", ".css", ".md"];

/**
 *
 */
function getAllFiles(dirPath, arrayOfFiles) {
  const files = fs.readdirSync(dirPath);

  arrayOfFiles = arrayOfFiles || [];

  files.forEach((file) => {
    // Skip node_modules, dist, .git, etc.
    if (["node_modules", "dist", ".git", ".gemini", "tmp"].includes(file)) {
      return;
    }
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      arrayOfFiles = getAllFiles(fullPath, arrayOfFiles);
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
function migrateGrid() {
  console.log("Starting grid token migration...");
  let totalReplacements = 0;
  let modifiedFiles = 0;

  // We want to avoid scanning the migration script itself
  const thisScript = path.resolve(__filename);

  TARGET_DIRS.forEach((targetDir) => {
    const files = getAllFiles(targetDir);

    files.forEach((file) => {
      if (path.resolve(file) === thisScript) return;

      let content = fs.readFileSync(file, "utf-8");
      let fileModified = false;

      // 1. Convert var(--columns-X) to calc(var(--column-unit) * X)
      const columnsRegex = /var\(--columns-(\d+)\)/g;
      if (columnsRegex.test(content)) {
        const matches = content.match(columnsRegex).length;
        content = content.replace(columnsRegex, (match, p1) => `calc(var(--column-unit) * ${p1})`);
        totalReplacements += matches;
        fileModified = true;
        console.log(
          `Replaced ${matches} instances of var(--columns-X) with calc(var(--column-unit) * X) in ${path.relative(process.cwd(), file)}`,
        );
      }

      // 2. Convert var(--rows-Y) to calc(var(--row-unit) * Y)
      const rowsRegex = /var\(--rows-(\d+)\)/g;
      if (rowsRegex.test(content)) {
        const matches = content.match(rowsRegex).length;
        content = content.replace(rowsRegex, (match, p1) => `calc(var(--row-unit) * ${p1})`);
        totalReplacements += matches;
        fileModified = true;
        console.log(
          `Replaced ${matches} instances of var(--rows-Y) with calc(var(--row-unit) * Y) in ${path.relative(process.cwd(), file)}`,
        );
      }

      if (fileModified) {
        fs.writeFileSync(file, content, "utf-8");
        modifiedFiles++;
      }
    });
  });

  console.log(`\nGrid migration complete!`);
  console.log(`Modified ${modifiedFiles} files.`);
  console.log(`Made ${totalReplacements} total replacements.`);
}

migrateGrid();
