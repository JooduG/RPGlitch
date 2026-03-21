import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const SKILL_ROOT = path.join(".agent", "skills")
const TEMPLATE_PATH = path.join(__dirname, "../templates/SKILL.md")
const ALLOWED_FOLDERS = ["knowledge", "scripts", "templates", "docs", "tests", "examples"]

const toKebabCase = (str) =>
    str
        .match(/[A-Z]{2,}(?=[A-Z][a-z]+[0-9]*|\b)|[A-Z]?[a-z]+[0-9]*|[A-Z]|[0-9]+/g)
        .map((x) => x.toLowerCase())
        .join("-")
const titleCase = (str) => str.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())

function createSkill(name, description = "New agentic skill.") {
    const slug = toKebabCase(name)
    const targetDir = path.join(SKILL_ROOT, slug)

    if (fs.existsSync(targetDir)) return console.error(`❌ FAIL: Skill '${slug}' already exists.`)
    if (!fs.existsSync(TEMPLATE_PATH)) return console.error(`❌ CRITICAL: Template missing at ${TEMPLATE_PATH}`)

    let content = fs
        .readFileSync(TEMPLATE_PATH, "utf8")
        .replace(/\[skill-slug\]/g, slug)
        .replace(/\[Skill Title\]/g, titleCase(slug))
        .replace(/\[Description\]/g, description)

    fs.mkdirSync(targetDir, { recursive: true })
    fs.writeFileSync(path.join(targetDir, "SKILL.md"), content)

    console.log(`✅ PASS: Skill '${slug}' instantiated at ${targetDir}`)
}

function verifySkill(name) {
    const targetDir = path.join(SKILL_ROOT, name)
    const skillFile = path.join(targetDir, "SKILL.md")
    const issues = []

    if (name !== toKebabCase(name)) issues.push(`Naming: '${name}' should be '${toKebabCase(name)}'`)
    if (!fs.existsSync(skillFile)) issues.push("Missing SKILL.md")
    else {
        const content = fs.readFileSync(skillFile, "utf8")
        if (!content.includes("description:")) issues.push("Metadata: Missing 'description'")
    }

    if (fs.existsSync(targetDir)) {
        fs.readdirSync(targetDir, { withFileTypes: true }).forEach((item) => {
            if (item.isDirectory()) {
                if (!ALLOWED_FOLDERS.includes(item.name)) {
                    issues.push(`Architecture: Illegal folder '${item.name}/'`)
                }
            } else if (item.isFile() && item.name !== "SKILL.md") {
                issues.push(`Architecture: Illegal file '${item.name}' (Move to scripts/ or docs/)`)
            }
        })
    }
    return { valid: issues.length === 0, issues }
}

function auditAll() {
    console.log("🔍 Auditing Intelligence Structure...")
    const skills = fs
        .readdirSync(SKILL_ROOT, { withFileTypes: true })
        .filter((d) => d.isDirectory() && !d.name.startsWith("_"))
        .map((d) => d.name)

    let validCount = 0
    skills.forEach((name) => {
        const { valid, issues } = verifySkill(name)
        const color = valid ? "\x1b[32m" : "\x1b[31m"
        console.log(`${name.padEnd(30)} | ${color}${valid ? "PASS" : "FAIL"}\x1b[0m | ${issues.join(", ")}`)
        if (valid) validCount++
    })

    console.log(`\nAudit Complete: ${validCount}/${skills.length} compliant.`)
    if (validCount < skills.length) process.exit(1)
}

const [, , command, ...args] = process.argv
if (command === "create") createSkill(args[0], args[1])
else if (command === "audit") auditAll()
else console.log("Usage: node scaffold-skill.js [create|audit] [name] [description]")
