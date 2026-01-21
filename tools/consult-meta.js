import { Pinecone } from "@pinecone-database/pinecone"
import "dotenv/config"

const INDEX_NAME = "lorebook-hybrid"
const DEFAULT_NAMESPACE = "knowledge-base.meta"

async function main() {
    const queryText = process.argv[2]
    const NAMESPACE = process.argv[3] || DEFAULT_NAMESPACE

    if (!queryText) {
        console.error(
            '❌ Usage: node tools/consult-meta.js "Your question here" [namespace]'
        )
        process.exit(1)
    }

    if (!process.env.PINECONE_API_KEY) {
        console.error("❌ Missing PINECONE_API_KEY in .env")
        process.exit(1)
    }

    const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY })
    const index = pc.index(INDEX_NAME)

    console.log(`🔍 Searching "${NAMESPACE}" for: "${queryText}"...`)

    try {
        // Pinecone Inference Query
        // We use the searchRecords-style invocation or standard query with inputs
        // Note: For integrated inference, we typically use the `search` method if available
        // OR we use the `query` method with specific parameters.
        // If the Node SDK version is new enough, it might abstract this.
        // Assuming we need to generate embeddings if the index doesn't do it on prompt.
        // BUT, `create-index-for-model` implies the index DOES it.
        // Let's try passing `inputs` to query, which is a common pattern for "integrated" indexes.

        // However, the standard Node SDK `query` expectation is `vector` or `id`.
        // If using Serverless Inference, we might need `pc.inference.embed`.
        // Let's TRY to let Pinecone handle it by passing text if supported,
        // otherwise we might see an error.

        // Attempt 1: Using Pinecone's inference helper explicitly if available?
        // Actually, let's look at how the MCP tool likely does it.
        // It likely calls `pc.inference.embed` then `index.query`.

        // To be safe and ensure this script WORKS for the user immediately:
        // We will generate the embedding using the inference API first.

        const embedding = await pc.inference.embed(
            "multilingual-e5-large", // The model we used for the index
            [queryText],
            { inputType: "query" }
        )

        const results = await index.namespace(NAMESPACE).query({
            vector: embedding.data[0].values,
            topK: 3,
            includeMetadata: true,
        })

        console.log(`\nFound ${results.matches.length} matches:\n`)

        results.matches.forEach((match, i) => {
            console.log(`--- [${i + 1}] Score: ${match.score.toFixed(3)} ---`)
            console.log(`Source: ${match.metadata.source}`)
            // Show snippet
            const content = match.metadata.content || ""
            const snippet = content.slice(0, 300).replace(/\n/g, " ")
            console.log(`Content: ${snippet}...\n`)
        })
    } catch (err) {
        console.error("❌ Error during search:", err.message)
        console.error("Detail:", err)
    }
}

main().catch(console.error)
