import { Pinecone } from "@pinecone-database/pinecone"
import crypto from "crypto"
import "dotenv/config"
import fs from "fs/promises"
import path from "path"

const INDEX_NAME = "knowledge-library"
const BATCH_SIZE = 50
let pc = null

function getPC() {
    if (!pc) {
        if (!process.env.PINECONE_API_KEY) throw new Error("❌ Scholar Error: Missing PINECONE_API_KEY")
        pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY })
    }
    return pc
}

export async function searchScholar({ query, namespaces = ["knowledge-base.meta", "knowledge-base.src"], topK = 5 }) {
    const pc = getPC()
    const index = pc.index(INDEX_NAME)
    const embedding = await pc.inference.embed("multilingual-e5-large", [query], { inputType: "query" })

    const queryPromises = namespaces.map((ns) =>
        index
            .namespace(ns)
            .query({
                vector: embedding.data[0].values,
                topK,
                includeMetadata: true,
            })
            .then((res) => ({ ns, matches: res.matches || [] }))
            .catch(() => ({ ns, matches: [] }))
    )

    const results = await Promise.all(queryPromises)
    return results
        .flatMap((res) => res.matches.map((m) => ({ ...m, namespace: res.ns })))
        .sort((a, b) => b.score - a.score)
        .slice(0, topK * 2)
}

export async function ingestScholar({ paths, namespace = "knowledge-base.meta", root = process.cwd() }) {
    const pc = getPC()
    const index = pc.index(INDEX_NAME)
    const files = []

    // Simple recursive walker
    async function walk(dir) {
        const items = await fs.readdir(dir)
        for (const item of items) {
            const fullPath = path.join(dir, item)
            const stat = await fs.stat(fullPath)
            if (stat.isDirectory() && !item.startsWith(".") && item !== "node_modules") await walk(fullPath)
            else if (/\.(md|txt|json|js|ts|svelte)$/i.test(item)) files.push(fullPath)
        }
    }

    for (const p of paths) await walk(path.resolve(root, p))
    console.log(`📑 Processing ${files.length} files for ${namespace}`)

    const allChunks = []
    for (const file of files) {
        const content = await fs.readFile(file, "utf-8")
        const relPath = path.relative(root, file)
        const segments = content.split(/^#+\s/gm).filter((s) => s.trim().length > 20) // Simple MD splitter

        segments.forEach((seg, i) => {
            const id = crypto
                .createHash("sha256")
                .update(namespace + relPath + i)
                .digest("hex")
            allChunks.push({
                id,
                values: [], // Embeddings generated in batch below
                metadata: {
                    content: seg.trim(),
                    source: relPath,
                    chunk_index: i,
                },
            })
        })
    }

    // Batch Embed & Upload
    for (let i = 0; i < allChunks.length; i += BATCH_SIZE) {
        const batch = allChunks.slice(i, i + BATCH_SIZE)
        const texts = batch.map((c) => c.metadata.content)
        const embeddings = await pc.inference.embed("multilingual-e5-large", texts, { inputType: "passage" })
        const vectors = batch.map((r, idx) => ({
            ...r,
            values: embeddings.data[idx].values,
        }))
        await index.namespace(namespace).upsert(vectors)
    }
    console.log(`✨ Ingested ${allChunks.length} chunks.`)
}
