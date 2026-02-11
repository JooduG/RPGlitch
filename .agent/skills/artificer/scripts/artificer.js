#!/usr/bin/env node
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

// -------------------------------------------------------------------------
// 🛠️ Artificer: Structure Scaffolder (Node.js Edition)
// -------------------------------------------------------------------------
// Generates the Svelte 5 Logic/HTML skeleton.
// Leaves styling blank for Mesmer.
// -------------------------------------------------------------------------

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const TEMPLATE_PATH = path.join(
    __dirname,
    "../templates/STRUCTURE.svelte.template"
)
const BASE_UI_PATH = path.join(process.cwd(), "src/ui")

// Helper: Convert PascalCase to kebab-case
const toKebabCase = (str) => {
    return str
        .replace(/([a-z])([A-Z])/g, "$1-$2")
        .replace(/[\s_]+/g, "-")
        .toLowerCase()
}

const commands = {
    scaffold: async (args) => {
        const [name, type = "atoms"] = args

        if (!name) {
            console.error("❌ Error: Component name is required.")
            console.log(
                "Usage: node artificer.js scaffold <PascalCaseName> [atoms|molecules|organisms|templates]"
            )
            process.exit(1)
        }

        const validTypes = ["atoms", "molecules", "organisms", "templates"]
        if (!validTypes.includes(type)) {
            console.error(
                `❌ Error: Invalid type "${type}". Must be one of: ${validTypes.join(", ")}`
            )
            process.exit(1)
        }

        const kebabName = toKebabCase(name)
        const targetDir = path.join(BASE_UI_PATH, type)
        const targetFile = path.join(targetDir, `${name}.svelte`)

        // Ensure directory exists
        if (!fs.existsSync(targetDir)) {
            fs.mkdirSync(targetDir, { recursive: true })
        }

        if (fs.existsSync(targetFile)) {
            console.warn(
                `⚠️  Warning: Component ${name} already exists at ${targetFile}`
            )
            process.exit(1)
        }

        // Load and Hydrate Template
        if (!fs.existsSync(TEMPLATE_PATH)) {
            console.error(`❌ Error: Template not found at ${TEMPLATE_PATH}`)
            process.exit(1)
        }

        let content = fs.readFileSync(TEMPLATE_PATH, "utf-8")
        content = content.replace(/{{name}}/g, name)
        content = content.replace(/{{kebab_name}}/g, kebabName)
        content = content.replace(/{{description}}/g, "A structural component.")

        // Write File
        fs.writeFileSync(targetFile, content, "utf-8")

        console.log(`✅ Artificer Constructed: ${targetFile}`)
        console.log(`   Action: Skeleton built. Summon Mesmer to style.`)
    },

    help: () => {
        console.log(`
🛠️ Artificer CLI

Commands:
  scaffold <Name> <Type>   Generate a new Svelte 5 component.
                           Type: atoms, molecules, organisms, templates
                           Example: node artificer.js scaffold Button atoms
`)
    },
}

const main = async () => {
    const args = process.argv.slice(2)
    const command = args[0]

    if (!command || !commands[command]) {
        commands.help()
        return
    }

    await commands[command](args.slice(1))
}

main()
