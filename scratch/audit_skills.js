import fs from "fs";
import path from "path";

const skillsDir = ".agents/skills";
const skills = fs
  .readdirSync(skillsDir)
  .filter((f) => fs.statSync(path.join(skillsDir, f)).isDirectory());

const results = [];

skills.forEach((skill) => {
  const skillFile = path.join(skillsDir, skill, "SKILL.md");
  if (!fs.existsSync(skillFile)) {
    results.push({ skill, status: "MISSING SKILL.MD" });
    return;
  }

  const content = fs.readFileSync(skillFile, "utf8");
  const lines = content.split("\n");

  const hasOpeningDash = lines[0].trim() === "---";
  const hasIdentityHeader = content.includes("## 1.0 IDENTITY");
  const hasPersonaYaml =
    content.includes("persona:") && content.includes("name:") && content.includes("directive:");

  if (hasOpeningDash && hasIdentityHeader && hasPersonaYaml) {
    results.push({ skill, status: "OK" });
  } else {
    const issues = [];
    if (!hasOpeningDash) issues.push("No opening ---");
    if (!hasIdentityHeader) issues.push("No ## 1.0 IDENTITY");
    if (!hasPersonaYaml) issues.push("No persona YAML");
    results.push({ skill, status: "ERROR", issues });
  }
});

console.table(results);
