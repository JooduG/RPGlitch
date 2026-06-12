import { execSync } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const designMd = path.resolve(__dirname, "../../../../DESIGN.md");

try {
  const output = execSync(`npx designmd lint "${designMd}" --format json`, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });

  const result = JSON.parse(output);
  const { errors, warnings, infos } = result.summary;

  console.log("\n================================================================================");
  console.log("📐 AUDIT: DESIGN.md SPEC COMPLIANCE (@google/design.md)");
  console.log("================================================================================\n");

  const findings = result.findings ?? [];
  const errorFindings = findings.filter((f) => f.severity === "error");

  if (errorFindings.length > 0) {
    console.log(`\x1b[31m[ERRORS]\x1b[0m ${errors} broken token reference(s):`);
    errorFindings.forEach((f) => console.log(`  ⛔ ${f.path}: ${f.message}`));
    console.log("");
  }

  // Warnings are intentionally muted due to custom RPGlitch component schema

  console.log(`📊 Summary — errors: ${errors} | warnings: ${warnings} | info: ${infos}`);
  console.log("\n\x1b[32m✅ SPEC SCAN COMPLETE (non-blocking).\x1b[0m\n");
} catch (err) {
  // Parse error output from designmd (it writes JSON to stdout even on failure)
  try {
    const result = JSON.parse(err.stdout ?? "{}");
    const { errors = 0, warnings = 0, infos = 0 } = result.summary ?? {};
    const errorFindings = (result.findings ?? []).filter((f) => f.severity === "error");

    console.log("\n================================================================================");
    console.log("📐 AUDIT: DESIGN.md SPEC COMPLIANCE (@google/design.md)");
    console.log("================================================================================\n");

    if (errorFindings.length > 0) {
      console.log(`\x1b[31m[ERRORS]\x1b[0m ${errors} broken token reference(s):`);
      errorFindings.forEach((f) => console.log(`  ⛔ ${f.path}: ${f.message}`));
      console.log("");
    }

    // Warnings are intentionally muted due to custom RPGlitch component schema
    console.log(`\n📊 Summary — errors: ${errors} | warnings: ${warnings} | info: ${infos}`);
    console.log("\n\x1b[32m✅ SPEC SCAN COMPLETE (non-blocking).\x1b[0m\n");
  } catch {
    console.warn("\x1b[33m⚠️  @google/design.md spec scan skipped (parse error).\x1b[0m");
  }
}

// Always exit 0 — this is an informational audit, not a gate.
process.exit(0);
