import { execSync } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

if (process.argv.includes("--help") || process.argv.includes("-h")) {
  console.log(`Usage: node .agents/skills/design/scripts/audit-google-design.js [--help]

Validates DESIGN.md YAML frontmatter using @google/design.md (npx designmd lint).
Exits 1 if broken-token schema errors > 0 or output cannot be parsed; schema warnings remain non-blocking (exit 0).`);
  process.exit(0);
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const designMd = path.resolve(__dirname, "../../../../DESIGN.md");
let has_errors;

try {
  const output = execSync(`npx designmd lint "${designMd}" --format json`, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });

  const result = JSON.parse(output);
  const { errors, infos } = result.summary;

  console.log("\n================================================================================");
  console.log("📐 AUDIT: DESIGN.md SPEC COMPLIANCE (@google/design.md)");
  console.log("================================================================================\n");

  const is_expected_rpglitch_warning = (f) =>
    (f.path === "colors" && f.message.includes("No 'primary' color defined")) || (f.path === "theme" && f.message.includes("not a recognized schema key"));

  const findings = result.findings ?? [];
  const errorFindings = findings.filter((f) => f.severity === "error");
  const warningFindings = findings.filter((f) => f.severity === "warning" && !is_expected_rpglitch_warning(f));
  const infoFindings = findings.filter((f) => f.severity === "info");

  if (errorFindings.length > 0) {
    console.log(`\x1b[31m[ERRORS]\x1b[0m ${errors} broken token reference(s):`);
    errorFindings.forEach((f) => console.log(`  ⛔ ${f.path}: ${f.message}`));
    console.log("");
  }
  if (warningFindings.length > 0) {
    console.log(`\x1b[33m[WARNINGS]\x1b[0m ${warningFindings.length} warning(s):`);
    warningFindings.forEach((f) => console.log(`  ⚠️  ${f.path}: ${f.message}`));
    console.log("");
  }
  if (infoFindings.length > 0) {
    console.log(`\x1b[36m[INFO]\x1b[0m ${infos} info(s):`);
    infoFindings.forEach((f) => console.log(`  ℹ️  ${f.path}: ${f.message}`));
    console.log("");
  }

  console.log(`📊 Summary - errors: ${errors} | warnings: ${warningFindings.length} | info: ${infos}`);
  has_errors = errors > 0;
  console.log(has_errors ? "\n\x1b[31m❌ SPEC GATE FAILED: Fix DESIGN.md errors above.\x1b[0m\n" : "\n\x1b[32m✅ SPEC SCAN COMPLETE.\x1b[0m\n");
} catch (err) {
  // Parse error output from designmd (it writes JSON to stdout even on failure)
  try {
    const result = JSON.parse(err.stdout ?? "{}");
    const { errors = 0, warnings = 0, infos = 0 } = result.summary ?? {};
    const errorFindings = (result.findings ?? []).filter((f) => f.severity === "error");
    const warningFindings = (result.findings ?? []).filter((f) => f.severity === "warning");
    const infoFindings = (result.findings ?? []).filter((f) => f.severity === "info");

    console.log("\n================================================================================");
    console.log("📐 AUDIT: DESIGN.md SPEC COMPLIANCE (@google/design.md)");
    console.log("================================================================================\n");

    if (errorFindings.length > 0) {
      console.log(`\x1b[31m[ERRORS]\x1b[0m ${errors} broken token reference(s):`);
      errorFindings.forEach((f) => console.log(`  ⛔ ${f.path}: ${f.message}`));
      console.log("");
    }
    if (warningFindings.length > 0) {
      console.log(`\x1b[33m[WARNINGS]\x1b[0m ${warnings} warning(s):`);
      warningFindings.forEach((f) => console.log(`  ⚠️  ${f.path}: ${f.message}`));
      console.log("");
    }
    if (infoFindings.length > 0) {
      console.log(`\x1b[36m[INFO]\x1b[0m ${infos} info(s):`);
      infoFindings.forEach((f) => console.log(`  ℹ️  ${f.path}: ${f.message}`));
      console.log("");
    }
    console.log(`\n📊 Summary - errors: ${errors} | warnings: ${warnings} | info: ${infos}`);
    has_errors = errors > 0;
    console.log(
      has_errors ? "\n\x1b[31m❌ SPEC GATE FAILED: Fix DESIGN.md errors above.\x1b[0m\n" : "\n\x1b[32m✅ SPEC SCAN COMPLETE (non-blocking warnings).\x1b[0m\n",
    );
  } catch {
    console.error("\x1b[31m❌ @google/design.md spec scan failed (unparseable output).\x1b[0m");
    has_errors = true;
  }
}

process.exit(has_errors ? 1 : 0);
