#!/usr/bin/env node
import { ingestScholar } from "./memory_engine.js"

const IS_JSON = process.argv.includes("--json")

const robotLog = (...args) => {
    if (IS_JSON) console.error(...args)
    else console.log(...args)
}

async function main() {
    const pathIdx = process.argv.indexOf("--path")
    const nsIdx = process.argv.indexOf("--namespace")
    const syncIdx = process.argv.indexOf("--sync")

    if (syncIdx !== -1) {
        // Sync mode - default all
        robotLog(`📑 Scholar: System Refresh (Syncing default paths)...`)
        try {
            await ingestScholar({
                paths: ["src/data"],
                namespace: "knowledge-base.src",
            })
            // Add other default paths here if needed
            if (IS_JSON) console.log(JSON.stringify({ status: "success" }))
            return
        } catch (e) {
            console.error("❌ Sync Failed:", e.message)
            process.exit(1)
        }
    }

    const paths = pathIdx !== -1 ? [process.argv[pathIdx + 1]] : ["src/data"]
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
}

main().catch(console.error)
