import "dotenv/config";
import fs from "fs/promises";
import ignore from "ignore";
import path from "path";
import crypto from "crypto";

/**
 * 📚 Librarian Core: Lore & Memory Engine (Sovereign Fetch Edition)
 * -------------------------------------------------------------------------
 * Bypasses SDK bugs by using raw fetch for all Pinecone operations.
 * -------------------------------------------------------------------------
 */

const INDEX_NAME = "knowledge-library";
const BATCH_SIZE = 50;
const API_KEY = process.env.PINECONE_API_KEY;

let cachedHost = null;

/**
 * 📡 Get Index Host
 */
async function getHost() {
  if (cachedHost) return cachedHost;

  console.error("📡 Fetching Pinecone index host...");
  const response = await fetch("https://api.pinecone.io/indexes", {
    headers: { "Api-Key": API_KEY },
  });
  const data = await response.json();
  const index = data.indexes.find((i) => i.name === INDEX_NAME);

  if (!index) throw new Error(`Index ${INDEX_NAME} not found`);
  cachedHost = index.host;
  return cachedHost;
}

/**
 * 🔍 Query the Knowledge Base (Semantic Search)
 */
export async function queryKnowledgeBase({
  query,
  namespaces = ["knowledge-base.meta", "knowledge-base.external", "knowledge-base.src"],
  topK = 5,
}) {
  const host = await getHost();

  // 1. Generate Query Embedding
  const embedRes = await fetch("https://api.pinecone.io/embed", {
    method: "POST",
    headers: {
      "Api-Key": API_KEY,
      "Content-Type": "application/json",
      "X-Pinecone-API-Version": "2024-07",
    },
    body: JSON.stringify({
      model: "multilingual-e5-large",
      parameters: { input_type: "query", truncate: "END" },
      inputs: [{ text: query }],
    }),
  });
  const embedData = await embedRes.json();
  if (!embedData.data || !embedData.data[0]) throw new Error("Embedding failed");
  const vector = embedData.data[0].values;

  // 2. Parallel Namespace Query
  const queryPromises = namespaces.map(async (ns) => {
    try {
      const res = await fetch(`https://${host}/query`, {
        method: "POST",
        headers: { "Api-Key": API_KEY, "Content-Type": "application/json" },
        body: JSON.stringify({
          namespace: ns,
          vector,
          topK,
          includeMetadata: true,
        }),
      });
      const data = await res.json();
      return { ns, matches: data.matches || [] };
    } catch (err) {
      console.warn(`⚠️ Namespace ${ns} query failed: ${err.message}`);
      return { ns, matches: [] };
    }
  });

  const results = await Promise.all(queryPromises);

  // 3. Flatten and Sort
  return results
    .filter((res) => res && res.matches)
    .flatMap((res) => res.matches.map((m) => ({ ...m, namespace: res.ns })))
    .sort((a, b) => b.score - a.score)
    .slice(0, topK * 2);
}

/**
 * 📥 Write to Knowledge Base (Ingestion with Prune-on-Write)
 */
export async function writeToKnowledgeBase({
  paths,
  namespace = "knowledge-base.meta",
  root = process.cwd(),
}) {
  const host = await getHost();

  // 1. Setup Gitignore Filters
  let gitignoreFilter = ignore();
  try {
    const gitContent = await fs.readFile(path.join(root, ".gitignore"), "utf-8");
    gitignoreFilter.add(gitContent);
  } catch {
    /* No .gitignore */
  }

  // 2. Scan Files
  const files = [];
  async function walk(dir) {
    const items = await fs.readdir(dir);
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const relPath = path.relative(root, fullPath).replace(/\\/g, "/");
      if (
        gitignoreFilter.ignores(relPath) ||
        relPath.includes(".git/") ||
        relPath.includes("node_modules/")
      )
        continue;

      const stat = await fs.stat(fullPath);
      if (stat.isDirectory()) await walk(fullPath);
      else if (/\.(md|txt|json|js|ts|svelte)$/i.test(item)) files.push(fullPath);
    }
  }

  for (const p of paths) {
    const abs = path.resolve(root, p.trim());
    try {
      const stat = await fs.stat(abs);
      if (stat.isDirectory()) await walk(abs);
      else files.push(abs);
    } catch (e) {
      console.warn(`⚠️ Skipping invalid path: ${p}`);
    }
  }

  console.log(`📑 Processing ${files.length} files for namespace: ${namespace}`);

  // 3. Prune & Chunk
  const allChunks = [];
  for (const file of files) {
    const content = await fs.readFile(file, "utf-8");
    const relPath = path.relative(root, file).replace(/\\/g, "/");

    // A. Prune Ghosts
    await fetch(`https://${host}/vectors/delete`, {
      method: "POST",
      headers: { "Api-Key": API_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({ namespace, filter: { source: { $eq: relPath } } }),
    });

    const ext = path.extname(file);
    let segments;
    if (ext === ".md") {
      segments = content.split(/^#+\s/gm).filter((s) => s.trim().length > 20);
    } else {
      segments = content.split(/\n(?=\/\*\*|\/\/\s[A-Z]{3,})/).filter((s) => s.trim().length > 30);
    }

    if (segments.length === 0 && content.trim().length > 0) segments = [content];

    segments.forEach((seg, i) => {
      const id = crypto
        .createHash("sha256")
        .update(namespace + relPath + i)
        .digest("hex");
      allChunks.push({
        id,
        metadata: {
          content: seg.trim(),
          source: relPath,
          chunk_index: i,
          indexedAt: new Date().toISOString(),
        },
      });
    });
  }

  // 4. Batch Embed & Upload
  for (let i = 0; i < allChunks.length; i += BATCH_SIZE) {
    const batch = allChunks.slice(i, i + BATCH_SIZE);
    const texts = batch.map((c) => c.metadata.content);

    try {
      // Embed
      const embedRes = await fetch("https://api.pinecone.io/embed", {
        method: "POST",
        headers: {
          "Api-Key": API_KEY,
          "Content-Type": "application/json",
          "X-Pinecone-API-Version": "2024-07",
        },
        body: JSON.stringify({
          model: "multilingual-e5-large",
          parameters: { input_type: "passage", truncate: "END" },
          inputs: texts.map((t) => ({ text: t })),
        }),
      });
      const embedData = await embedRes.json();
      if (!embedData.data) throw new Error(`Embedding failed: ${JSON.stringify(embedData)}`);

      // Upsert
      const vectors = batch.map((record, idx) => ({
        id: record.id,
        values: embedData.data[idx].values,
        metadata: record.metadata,
      }));

      await fetch(`https://${host}/vectors/upsert`, {
        method: "POST",
        headers: { "Api-Key": API_KEY, "Content-Type": "application/json" },
        body: JSON.stringify({ namespace, vectors }),
      });

      process.stdout.write(
        `\r✅ Uploaded chunk ${Math.min(i + BATCH_SIZE, allChunks.length)}/${allChunks.length}`,
      );
    } catch (err) {
      console.error(`\n❌ Batch failed at index ${i}: ${err.message}`);
    }
  }
  console.log(`\n✨ Ingestion complete.`);
}

/**
 * 📊 Describe Index Stats
 */
export async function describeIndexStats() {
  const host = await getHost();
  const response = await fetch(`https://${host}/describe_index_stats`, {
    method: "POST",
    headers: { "Api-Key": API_KEY, "Content-Type": "application/json" },
  });
  const stats = await response.json();

  const namespaces = stats.namespaces || {};
  const lines = [
    `Index: ${INDEX_NAME}`,
    `Dimensions: ${stats.dimension}`,
    `Total Vectors: ${stats.totalRecordCount}`,
    "",
  ];

  for (const [ns, info] of Object.entries(namespaces)) {
    lines.push(`  ${ns}: ${info.recordCount} vectors`);
  }

  return lines.join("\n");
}

export const PineconeEngine = {
  queryKnowledgeBase,
  writeToKnowledgeBase,
  describeIndexStats,
};
