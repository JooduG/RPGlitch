import { Pinecone } from "@pinecone-database/pinecone"
import crypto from "crypto"
import "dotenv/config"
import fs from "fs/promises"
import ignore from "ignore"
import path from "path"

/**
 * 📚 Scholar Core
 * High-performance library for Pinecone RAG operations.
 * @see {@link ../knowledge/long-term-memory.md} for architectural details.
 */

const INDEX_NAME = "lorebook-hybrid"
const BATCH_SIZE = 50

// Shared Pinecone instance
let pc = null

function getPC() {
    if (!pc) {
        if (!process.env.PINECONE_API_KEY) {
            throw new Error("Missing PINECONE_API_KEY in .env")
        }
        pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY })
    }
    return pc
}

/**
 * 🔍 Search across namespaces
 */
export async function searchScholar({
    query,
    namespaces = [
        "knowledge-base.meta",
        "knowledge-base.external",
        "knowledge-base.src",
    ],
    topK = 3,
}) {
    const pc = getPC()
    const index = pc.index(INDEX_NAME)

    // Parallel embedding generation
    const embedding = await pc.inference.embed(
        "multilingual-e5-large",
        [query],
        { inputType: "query" }
    )

    // Parallel namespace querying
    const queryPromises = namespaces.map((ns) =>
        index
            .namespace(ns)
            .query({
                vector: embedding.data[0].values,
                topK,
                includeMetadata: true,
            })
            .catch((err) => {
                console.warn(`⚠️  Namespace ${ns} search failed:`, err.message)
                return { matches: [] }
            })
    )

    const results = await Promise.all(queryPromises)
    const allMatches = results
        .flatMap((res) => res.matches)
        .sort((a, b) => b.score - a.score)
        .slice(0, topK * 2)

    return allMatches
}

/**
 * 📥 Ingest files into Pinecone with automatic chunking
 */
export async function ingestScholar({
    paths,
    namespace = "knowledge-base.meta",
    root = process.cwd(),
}) {
    const pc = getPC()
    const index = pc.index(INDEX_NAME)

    // Load gitignore for filtering
    let gitignoreFilter = ignore()
    try {
        const gitContent = await fs.readFile(
            path.join(root, ".gitignore"),
            "utf-8"
        )
        gitignoreFilter.add(gitContent)
    } catch {
        /* ignore */
    }

    const files = []

    // Recursively find files
    async function walk(dir) {
        const items = await fs.readdir(dir)
        for (const item of items) {
            const fullPath = path.join(dir, item)
            const relPath = path.relative(root, fullPath)

            if (gitignoreFilter.ignores(relPath)) continue

            const stat = await fs.stat(fullPath)
            if (stat.isDirectory()) {
                await walk(fullPath)
            } else if (/\.(md|js|ts|json|svelte)$/i.test(item)) {
                files.push(fullPath)
            }
        }
    }

    for (const p of paths) {
        const abs = path.resolve(root, p)
        const stat = await fs.stat(abs)
        if (stat.isDirectory()) await walk(abs)
        else files.push(abs)
    }

    console.log(
        `📑 Processing ${files.length} files for namespace: ${namespace}`
    )

    const allChunks = []
    for (const file of files) {
        const content = await fs.readFile(file, "utf-8")
        const relPath = path.relative(root, file)
        const ext = path.extname(file)

        // Semantic Chunking
        let segments = []
        if (ext === ".md") {
            segments = content
                .split(/^#+\s/gm)
                .filter((s) => s.trim().length > 10)
        } else {
            segments = content
                .split(/\n(?=\/\*\*|\/\/\s[A-Z]{3,})/)
                .filter((s) => s.trim().length > 20)
        }
        if (segments.length === 0) segments = [content]

        segments.forEach((seg, i) => {
            const clean = seg.trim()
            const id = crypto
                .createHash("sha256")
                .update(relPath + clean)
                .digest("hex")
            allChunks.push({
                id,
                metadata: {
                    content: clean,
                    source: relPath,
                    chunk_index: i,
                    indexedAt: new Date().toISOString(),
                },
            })
        })
    }

    // Batched Embedding & Upsert
    for (let i = 0; i < allChunks.length; i += BATCH_SIZE) {
        const batch = allChunks.slice(i, i + BATCH_SIZE)
        const texts = batch.map((c) => c.metadata.content)

        const embeddings = await pc.inference.embed(
            "multilingual-e5-large",
            texts,
            { inputType: "passage" }
        )

        const embeddingList = Array.isArray(embeddings)
            ? embeddings
            : embeddings.data || []

        const vectors = batch.map((record, idx) => ({
            ...record,
            values: embeddingList[idx]?.values,
        }))

        await index.namespace(namespace).upsert(vectors)
        process.stdout.write(
            `\r✅ Progress: ${Math.min(i + BATCH_SIZE, allChunks.length)}/${allChunks.length} chunks.`
        )
    }
    console.log(`\n✨ Ingestion complete for ${namespace}`)
}
