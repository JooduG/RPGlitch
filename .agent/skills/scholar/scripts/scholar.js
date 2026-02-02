#!/usr/bin/env node
import { ingestScholar, searchScholar } from "./research_engine.js"

/**
 * 📚 Scholar CLI
 * -------------------------------------------------------------------------
 * The central interface for Memory and Research operations.
 * Usage:
 * node .agent/skills/scholar/scripts/scholar.js search "How do I..."
 * node .agent/skills/scholar/scripts/scholar.js ingest --path src/ --namespace knowledge-base.src
 * node .agent/skills/scholar/scripts/scholar.js organize --scope all
 * -------------------------------------------------------------------------
 */

const IS_JSON = process.argv.includes("--json")

const robotLog = (...args) => {
    if (IS_JSON) console.error(...args)
    else console.log(...args)
}

const COMMANDS = {
    /** 🔍 Search */
    search: async (query) => {
        robotLog(`🔍 Scholar: Searching Memory for "${query}"...`)
        try {
            const matches = await searchScholar({ query })

            if (IS_JSON) {
                console.log(
                    JSON.stringify({
                        query,
                        count: matches.length,
                        results: matches.map((m) => ({
                            score: m.score,
                            source: m.metadata.source,
                            content: m.metadata.content,
                        })),
                    })
                )
            } else {
                if (matches.length === 0)
                    console.log("❌ No relevant context found.")
                matches.forEach((m, i) => {
                    console.log(
                        `\n--- [${i + 1}] Score: ${(m.score * 100).toFixed(1)}% | Source: ${m.metadata.source} ---`
                    )
                    console.log(
                        m.metadata.content.slice(0, 300).replace(/\n/g, " ") +
                            "..."
                    )
                })
            }
        } catch (e) {
            if (IS_JSON) console.log(JSON.stringify({ error: e.message }))
            else console.error("❌ Search Error:", e.message)
            process.exit(1)
        }
    },

    /** 📥 Ingest */
    ingest: async () => {
        const pathIdx = process.argv.indexOf("--path")
        const nsIdx = process.argv.indexOf("--namespace")

        const paths =
            pathIdx !== -1 ? [process.argv[pathIdx + 1]] : ["src/data"]
        const namespace =
            nsIdx !== -1 ? process.argv[nsIdx + 1] : "knowledge-base.src"

        robotLog(`📑 Scholar: Ingesting into ${namespace}...`)
        try {
            await ingestScholar({ paths, namespace })
            if (IS_JSON) console.log(JSON.stringify({ status: "success" }))
        } catch (e) {
            if (IS_JSON) console.log(JSON.stringify({ error: e.message }))
            else console.error("❌ Ingestion Failed:", e.message)
            process.exit(1)
        }
    },

    /** 🧹 Organize (Merged from organize-library.js) */
    organize: async () => {
        const args = process.argv.slice(2)
        const scopeIndex = args.indexOf("--scope")
        const scope = scopeIndex !== -1 ? args[scopeIndex + 1] : "basics"

        robotLog(`📚 Scholar: Organizing Library (Scope: ${scope})...`)

        const audits = {
            warden: () =>
                robotLog("   - 🛡️  Auditing Warden Wing (Security)..."),
            gamemaster: () =>
                robotLog("   - 🕹️  Auditing Gamemaster Wing (Tasks)..."),
            scholar: () =>
                robotLog("   - 📚 Auditing Scholar Wing (Memory)..."),
            mesmer: () =>
                robotLog("   - 🎭 Auditing Mesmer Wing (Aesthetics)..."),
            artificer: () =>
                robotLog("   - 🛠️  Auditing Artificer Wing (Structure)..."),
            basics: () => robotLog("   - 🧹 Standard Hygiene Check..."),
        }

        if (scope === "all") {
            Object.keys(audits).forEach((k) => k !== "basics" && audits[k]())
        } else if (audits[scope]) {
            audits[scope]()
        } else {
            console.warn(`⚠️ Unknown scope. Running basics.`)
            audits.basics()
        }

        // Future: Add actual vector pruning logic here
        if (IS_JSON) console.log(JSON.stringify({ status: "success", scope }))
        else console.log("✅ Organization Complete.")
    },
}

async function main() {
    const filteredArgs = process.argv.slice(2).filter((a) => a !== "--json")
    const cmd = filteredArgs[0]
    const arg = filteredArgs.slice(1).join(" ")

    if (!COMMANDS[cmd]) {
        if (IS_JSON) console.log(JSON.stringify({ error: "Unknown command" }))
        else
            console.error(
                "❌ Unknown command. Available: search, ingest, organize"
            )
        process.exit(1)
    }
    await COMMANDS[cmd](arg)
}

main().catch(console.error)
