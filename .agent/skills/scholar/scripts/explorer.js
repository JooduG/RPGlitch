#!/usr/bin/env node
import { ingestScholar, searchScholar } from "./researcher.js"

/**
 * 📚 Scholar CLI
 * Usage:
 *   node .agent/skills/scholar/scripts/explorer.js search "How do I..."
 *   node .agent/skills/scholar/scripts/explorer.js ingest --path .agent/rules --namespace knowledge-base.meta
 *   node .agent/skills/scholar/scripts/explorer.js auto "Trigger check message"
 */

const IS_JSON = process.argv.includes("--json")

const robotLog = (...args) => {
    if (IS_JSON) {
        console.error(...args)
    } else {
        console.log(...args)
    }
}

const COMMANDS = {
    search: async (query) => {
        robotLog(`🔍 Searching the Knowledge Library for: "${query}"...`)
        const matches = await searchScholar({ query })

        if (IS_JSON) {
            console.log(JSON.stringify({ 
                query,
                count: matches.length,
                results: matches.map(m => ({
                    score: m.score,
                    source: m.metadata.source,
                    content: m.metadata.content
                }))
            }))
            return
        }

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

        robotLog(`📑 Scholar: Ingesting into ${namespace}...`)
        try {
            const stats = await ingestScholar({ paths, namespace })
            if (IS_JSON) {
                console.log(JSON.stringify({ status: "success", namespace, stats }))
            } else {
                console.log("✨ Ingestion complete.")
            }
        } catch (e) {
            if (IS_JSON) {
                console.log(JSON.stringify({ error: e.message }))
            } else {
                console.error("❌ Ingestion failed:", e.message)
            }
            process.exit(1)
        }
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
            if (IS_JSON) console.log(JSON.stringify({ triggered: false }))
            else robotLog("⏩ No trigger detected. Skipping Scholar retrieval.")
            return
        }

        robotLog("⚡ Trigger detected! Firing auto-retrieval...")
        const matches = await searchScholar({ query: message })

        if (IS_JSON) {
            console.log(JSON.stringify({ 
                triggered: true, 
                results: matches.map(m => ({ source: m.metadata.source, content: m.metadata.content })) 
            }))
        } else {
            let output = "[SCHOLAR NOTIFICATION: Context Injected]\n"
            matches.forEach((m) => {
                output += `\n[Source: ${m.metadata.source}]\n${m.metadata.content.slice(0, 500)}...\n`
            })
            console.log(output)
        }
    },
}

async function main() {
    // Filter out --json from args
    const filteredArgs = process.argv.slice(2).filter(a => a !== "--json")
    const cmd = filteredArgs[0]
    const arg = filteredArgs.slice(1).join(" ")

    if (!COMMANDS[cmd]) {
        const errorMsg = "Unknown command. Available: search, ingest, auto"
        if (IS_JSON) {
            console.log(JSON.stringify({ error: errorMsg }))
        } else {
            console.error(`❌ ${errorMsg}`)
        }
        process.exit(1)
    }

    await COMMANDS[cmd](arg)
}

main().catch((err) => {
    console.error("❌ Scholar CLI Error:", err.message)
    process.exit(1)
})
