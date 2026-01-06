const fs = require("fs");
const path = require("path");
// Note: Requires 'htmlhint' to be installed or available in the environment.
// If 'htmlhint' is missing from package.json dependencies, please install it: npm install --save-dev htmlhint
const HTMLHint = require("htmlhint").HTMLHint;

const SEARCH_DIR = "src";
let errorCount = 0;

function lintFile(filePath) {
  const content = fs.readFileSync(filePath, "utf8");
  const messages = HTMLHint.verify(content);

  if (messages.length > 0) {
    console.log(`Issues found in ${filePath}:`);
    messages.forEach((msg) => {
      const type = msg.type === "error" ? "[ERROR]" : "[WARNING]";
      console.log(
        `${type} Line ${msg.line}, Col ${msg.col}: ${msg.message} (${msg.rule.id})`,
      );
      if (msg.type === "error") {
        errorCount++;
      }
    });
  }
}

function walkDir(dir) {
  if (!fs.existsSync(dir)) {
    console.error(`Directory not found: ${dir}`);
    process.exit(1);
  }
  const files = fs.readdirSync(dir);

  files.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      walkDir(filePath);
    } else if (file.endsWith(".html")) {
      lintFile(filePath);
    }
  });
}

console.log(`Starting HTMLHint scan in "${SEARCH_DIR}"...`);
walkDir(SEARCH_DIR);

if (errorCount > 0) {
  console.error(`HTMLHint Failed! Found ${errorCount} errors.`);
  process.exit(1);
} else {
  console.log("HTMLHint Passed.");
  process.exit(0);
}
