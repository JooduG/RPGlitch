#!/usr/bin/env node

const fs = require("fs")
const path = require("path")

const skillsDir = path.join(".agent", "skills")

function auditDocs() {
    console.log(`🔍 Auditing ${skillsDir}...`)
    const issues = []

    if (!fs.existsSync(skillsDir)) {
        console.error("❌ Skills directory not found.")
        process.exit(1)
    }

    const skillFolders = fs
        .readdirSync(skillsDir, { withFileTypes: true })
        .filter((dirent) => dirent.isDirectory())

    for (const folder of skillFolders) {
        const skillPath = path.join(skillsDir, folder.name)
        const skillFile = path.join(skillPath, "SKILL.md")

        // Check 1: Ghost Files
        if (!fs.existsSync(skillFile)) {
            issues.push(`👻 Ghost File: ${folder.name} is missing 'SKILL.md'`)
            continue
        }

        // Check 2: Frontmatter Analysis
        try {
            const content = fs.readFileSync(skillFile, "utf8")

            if (!content.trim().startsWith("---")) {
                issues.push(
                    `⚠️  Format: ${folder.name}/SKILL.md missing Frontmatter`
                )
            }

            if (!content.includes("description:")) {
                issues.push(
                    `⚠️  Metadata: ${folder.name}/SKILL.md missing 'description'`
                )
            }
        } catch (e) {
            issues.push(`❌ Error reading ${folder.name}: ${e.message}`)
        }
    }

    if (issues.length > 0) {
        console.log("\n🚨 Audit Issues Found:")
        issues.forEach((issue) => console.log(issue))
        process.exit(1)
    } else {
        console.log("\n✨ All systems nominal. Intelligence Structure valid.")
        process.exit(0)
    }
}

auditDocs()
