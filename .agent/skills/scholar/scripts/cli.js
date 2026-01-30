#!/usr/bin/env node
import { ingestScholar, searchScholar } from "./core.js"

/**
 * 📚 Scholar CLI
 * Usage:
 *   node .agent/skills/scholar/scripts/cli.js search "How do I..."
 *   node .agent/skills/scholar/scripts/cli.js ingest --path .agent/rules --namespace knowledge-base.meta
 *   node .agent/skills/scholar/scripts/cli.js auto "Trigger check message"
 */

const COMMANDS = {
    search: async (query) => {
        console.log(`🔍 Searching the Antigravity Nexus for: "${query}"...`)
        const matches = await searchScholar({ query })

        if (matches.length === 0) {
            console.log("❌ No relevant context found.")
            return
        }

        matches.forEach((m, i) => {
            console.log(
                `--- [${i + 1}] Score: ${(m.score * 100).toFixed(1)}% ---`
            )
            console.log(`Source: ${m.metadata.source}`)
            console.log(
                `Content: ${m.metadata.content.slice(0, 300).replace(/\n/g, " ")}...\n`
            )
        })
    },

    ingest: async () => {
        const pathIdx = process.argv.indexOf("--path")
        const nsIdx = process.argv.indexOf("--namespace")

        const paths =
            pathIdx !== -1
                ? [process.argv[pathIdx + 1]]
                : ["AGENTS.md", "GEMINI.md", ".agent"]
        const namespace =
            nsIdx !== -1 ? process.argv[nsIdx + 1] : "knowledge-base.meta"

        await ingestScholar({ paths, namespace })
    },

    auto: async (message) => {
        // Simple trigger check like legacy auto-retrieve.js
        const triggers = [
            "how",
            "explain",
            "what is",
            "rune",
            "architecture",
            "pillar",
        ]
        const hasTrigger = triggers.some((t) =>
            message.toLowerCase().includes(t)
        )

        if (!hasTrigger) {
            console.log("⏩ No trigger detected. Skipping Scholar retrieval.")
            return
        }

        console.log("⚡ Trigger detected! Firing auto-retrieval...")
        const matches = await searchScholar({ query: message })

        let output = "[SCHOLAR NOTIFICATION: Context Injected]\n"
        matches.forEach((m) => {
            output += `\n[Source: ${m.metadata.source}]\n${m.metadata.content.slice(0, 500)}...\n`
        })
        console.log(output)
    },
}

async function main() {
    const cmd = process.argv[2]
    const arg = process.argv.slice(3).join(" ")

    if (!COMMANDS[cmd]) {
        console.error("❌ Unknown command. Available: search, ingest, auto")
        process.exit(1)
    }

    await COMMANDS[cmd](arg)
}

main().catch((err) => {
    console.error("❌ Scholar CLI Error:", err.message)
    process.exit(1)
})
