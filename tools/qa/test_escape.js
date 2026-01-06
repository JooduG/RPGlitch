import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../");
const LIBS_DIR = path.join(REPO_ROOT, "libs");

const escapeScript = (str) =>
  str
    .replace(/<\/script/gi, "\\x3C/script")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");

async function testLib(file) {
  const filePath = path.join(LIBS_DIR, file);
  console.log(`Checking ${file}...`);
  const content = await fs.readFile(filePath, "utf8");

  // Check for problematic chars
  const hasScriptTag = /<\s*\/\s*script/i.test(content);
  const hasIncompleteTag = /<\s*\/\s*s/i.test(content);
  const hasAnyClosing = /<\//.test(content);
  const hasLS = /\u2028/.test(content);
  const hasPS = /\u2029/.test(content);

  console.log(`  Contains < / script : ${hasScriptTag}`);
  console.log(`  Contains < / s      : ${hasIncompleteTag}`);
  console.log(`  Contains </         : ${hasAnyClosing}`);
  console.log(`  Contains U+2028: ${hasLS}`);
  console.log(`  Contains U+2029: ${hasPS}`);

  const escaped = escapeScript(content);
  const stillHasScriptTag = /<\/script/i.test(escaped);
  const stillHasLS = /\u2028/.test(escaped);
  const stillHasPS = /\u2029/.test(escaped);

  console.log(`  [ESCAPED] Contains </script>: ${stillHasScriptTag}`);
  console.log(`  [ESCAPED] Contains U+2028: ${stillHasLS}`);
  console.log(`  [ESCAPED] Contains U+2029: ${stillHasPS}`);

  // Verify hex escape presence
  if (hasScriptTag && !stillHasScriptTag) {
    console.log("  Verified: </script> was replaced.");
  }
}

async function run() {
  await testLib("purify.min.js");
  await testLib("dexie.min.js");
  await testLib("_hyperscript.min.js");
  await testLib("cash.min.js");
}

run();
