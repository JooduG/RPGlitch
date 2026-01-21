import { Pinecone } from "@pinecone-database/pinecone"
import crypto from "crypto"
import "dotenv/config"
import fs from "fs/promises"
import ignore from "ignore"
import path from "path"

// Load .gitignore
let gitignoreFilter = null
async function loadGitignore(root) {
    try {
        const gitignorePath = path.join(root, ".gitignore")
        const gitignoreContent = await fs.readFile(gitignorePath, "utf-8")
        gitignoreFilter = ignore().add(gitignoreContent)
        console.log("✅ Loaded .gitignore filters")
    } catch (e) {
        console.warn("⚠️  No .gitignore found, skipping filter")
    }
}

// Configuration
const INDEX_NAME = "lorebook-hybrid"
const BATCH_SIZE = 50

// Get arguments from CLI
const TARGET_NAMESPACE = process.argv.includes("--namespace")
    ? process.argv[process.argv.indexOf("--namespace") + 1]
    : "knowledge-base.meta"

const TARGET_PATHS = process.argv.includes("--path")
    ? [process.argv[process.argv.indexOf("--path") + 1]]
    : [
          "AGENTS.md",
          "GEMINI.md",
          "README.md",
          ".agent/rules",
          ".agent/skills",
          ".agent/workflows",
          "tools",
          "types.d.ts",
          "vite.config.js",
          "package.json",
      ]

async function main() {
    // Debug: Check what keys exist
    const keys = Object.keys(process.env).filter((k) =>
        k.toUpperCase().includes("PINECONE")
    )
    console.log("DEBUG: Found Pinecone-related env vars:", keys)

    if (!process.env.PINECONE_API_KEY) {
        console.error("❌ Missing PINECONE_API_KEY in .env")
        process.exit(1)
    }

    console.log(`🌲 Initializing Pinecone (Index: ${INDEX_NAME})...`)
    const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY })
    const index = pc.index(INDEX_NAME)

    // Load .gitignore filters
    await loadGitignore(process.cwd())

    console.log(
        `📂 Scanning paths: ${TARGET_PATHS.join(", ")} | Namespace: ${TARGET_NAMESPACE}`
    )
    const files = await findMarkdownFiles(process.cwd())
    console.log(`📄 Found ${files.length} markdown files.`)

    const chunks = []
    for (const file of files) {
        const fileChunks = await processFile(file)
        chunks.push(...fileChunks)
    }

    console.log(
        `🧩 Generated ${chunks.length} chunks. Generating embeddings and upserting...`
    )

    // Batch Process
    for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
        const batch = chunks.slice(i, i + BATCH_SIZE)
        const texts = batch.map((c) => c.metadata.content)

        try {
            // Explicitly generate embeddings
            const embeddings = await pc.inference.embed(
                "multilingual-e5-large",
                texts,
                { inputType: "passage" }
            )

            // Debug Log
            if (i === 0)
                console.log(
                    "DEBUG Embedding Response:",
                    JSON.stringify(embeddings, null, 2).slice(0, 500) + "..."
                )

            // Merge embeddings into records
            // Check if embeddings is array or has .data
            const embeddingList = Array.isArray(embeddings)
                ? embeddings
                : embeddings.data || []

            const vectors = batch.map((record, idx) => ({
                ...record,
                values: embeddingList[idx]?.values,
            }))

            await index.namespace(TARGET_NAMESPACE).upsert(vectors)
            process.stdout.write(
                `\r✅ Processed ${Math.min(i + BATCH_SIZE, chunks.length)}/${chunks.length} records...`
            )
        } catch (err) {
            console.error(`\n❌ Error processing batch ${i}:`, err.message)
        }
    }

    console.log("\n✨ Ingestion Complete.")
}

async function findMarkdownFiles(root) {
    const results = []

    // We strictly filter for the allowed paths relative to root
    for (const scanPath of TARGET_PATHS) {
        const absolutePath = path.resolve(root, scanPath)
        try {
            const stat = await fs.stat(absolutePath)
            if (stat.isFile()) {
                // Accept .md, .js, .ts, .json files
                if (/\.(md|js|ts|json)$/i.test(scanPath)) {
                    results.push(absolutePath)
                }
            } else if (stat.isDirectory()) {
                const gathered = await recursiveWalk(absolutePath)
                results.push(...gathered)
            }
        } catch (e) {
            console.warn(`⚠️  Cannot access path: ${scanPath}`)
        }
    }
    return results
}

async function recursiveWalk(dir) {
    const files = []
    const items = await fs.readdir(dir)
    for (const item of items) {
        const fullPath = path.join(dir, item)
        const relativePath = path.relative(process.cwd(), fullPath)

        // Skip if gitignored
        if (gitignoreFilter && gitignoreFilter.ignores(relativePath)) {
            continue
        }

        const stat = await fs.stat(fullPath)
        if (stat.isDirectory()) {
            files.push(...(await recursiveWalk(fullPath)))
        } else if (/\.(md|js|ts|json)$/i.test(item)) {
            files.push(fullPath)
        }
    }
    return files
}

async function processFile(filePath) {
    const raw = await fs.readFile(filePath, "utf-8")
    const relativePath = path.relative(process.cwd(), filePath)
    const ext = path.extname(filePath)

    let sections = []

    if (ext === ".md") {
        // Splitting by Header
        sections = raw.split(/^#+\s/gm).filter((s) => s.trim().length > 10)
    } else {
        // Splitting by JSDoc or All-Caps Comments (Architectural markers)
        // This targets: /** ..., // ===, // TITLE
        sections = raw
            .split(/\n(?=\/\*\*|\/\/\s[A-Z]{3,})/)
            .filter((s) => s.trim().length > 20)
    }

    if (sections.length === 0) sections = [raw] // Fallback to whole file

    return sections.map((text, i) => {
        const content = text.trim()
        const id = crypto
            .createHash("sha256")
            .update(relativePath + content)
            .digest("hex")

        return {
            id,
            values: [],
            metadata: {
                content: content,
                source: relativePath,
                type: ext === ".md" ? "documentation" : "source",
                chunk_index: i,
                indexedAt: new Date().toISOString(),
            },
        }
    })
}

main().catch(console.error)
