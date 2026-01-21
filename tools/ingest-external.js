import { Pinecone } from "@pinecone-database/pinecone"
import crypto from "crypto"
import "dotenv/config"
import fs from "fs/promises"
import path from "path"

/**
 * Ingestion script for External Documentation
 * Indexes Svelte 5, Dexie, etc. into knowledge-base.external
 */

const INDEX_NAME = "lorebook-hybrid"
const NAMESPACE = "knowledge-base.external"
const BATCH_SIZE = 50

async function ingestExternalPack(filePath) {
    if (!process.env.PINECONE_API_KEY) {
        console.error("❌ Missing PINECONE_API_KEY")
        return
    }

    console.log(`🌲 Initializing Pinecone...`)
    const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY })
    const index = pc.index(INDEX_NAME)

    console.log(`📖 Reading pack: ${filePath}`)
    const content = await fs.readFile(filePath, "utf-8")
    const fileName = path.basename(filePath)

    // Chunking by headers
    const chunks = content
        .split(/\n(?=## )/)
        .map((c) => c.trim())
        .filter(Boolean)
    console.log(`🧩 Split into ${chunks.length} chunks.`)

    const records = []
    for (const chunk of chunks) {
        const id = crypto
            .createHash("sha256")
            .update(fileName + chunk)
            .digest("hex")

        console.log(
            `✨ Generating embedding for chunk: ${chunk.split("\n")[0]}...`
        )
        const embedding = await pc.inference.embed(
            "multilingual-e5-large",
            [chunk],
            { inputType: "passage" }
        )

        records.push({
            id,
            values: embedding.data[0].values,
            metadata: {
                content: chunk,
                source: `external/${fileName}`,
                layer: "external",
                indexedAt: new Date().toISOString(),
            },
        })
    }

    console.log(`🚀 Upserting ${records.length} records to ${NAMESPACE}...`)
    for (let i = 0; i < records.length; i += BATCH_SIZE) {
        const batch = records.slice(i, i + BATCH_SIZE)
        await index.namespace(NAMESPACE).upsert(batch)
        console.log(`✅ Upserted ${i + batch.length}/${records.length}`)
    }

    console.log("✨ External ingestion complete.")
}

// CLI usage
const target = process.argv[2]
if (target) {
    ingestExternalPack(target).catch(console.error)
} else {
    // Ingest all in knowledge/
    const knowledgeDir = path.join(process.cwd(), "knowledge")
    fs.readdir(knowledgeDir).then(async (files) => {
        for (const file of files) {
            if (file.endsWith(".md")) {
                await ingestExternalPack(path.join(knowledgeDir, file))
            }
        }
    })
}
