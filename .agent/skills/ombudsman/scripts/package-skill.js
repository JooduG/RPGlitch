import { execSync } from "child_process";
import path from "path";
import fs from "fs";

const SKILL_ROOT = path.join(".agent", "skills");

function packageSkill(name, outputDir = ".") {
  const skillPath = path.join(SKILL_ROOT, name);
  const normalizedOutputDir = path.resolve(outputDir);
  const targetZip = path.join(normalizedOutputDir, `${name}.skill`);

  if (!fs.existsSync(skillPath)) {
    console.error(`❌ Error: Skill folder not found at ${skillPath}`);
    process.exit(1);
  }

  console.log(`📦 Packaging skill: ${name}...`);

  try {
    // Audit first
    console.log("🔍 Running pre-package audit...");
    execSync(`node .agent/skills/ombudsman/scripts/scaffold-skill.js audit`, { stdio: "inherit" });

    // PowerShell Compress-Archive
    const psCommand = `powershell -Command "Compress-Archive -Path '${skillPath}\\*' -DestinationPath '${targetZip}' -Force"`;
    execSync(psCommand, { stdio: "inherit" });

    console.log(`\n✅ Successfully packaged skill to: ${targetZip}`);
  } catch (err) {
    console.error(`❌ Error creating .skill file: ${err.message}`);
    process.exit(1);
  }
}

const [, , name, output] = process.argv;
if (!name) {
  console.log("Usage: node package-skill.js <skill-name> [output-directory]");
  process.exit(1);
}

packageSkill(name, output);
