import { Pinecone } from "@pinecone-database/pinecone";
import crypto from "crypto";
import "dotenv/config";
import fs from "fs/promises";
import ignore from "ignore";
import path from "path";
/**
 * 🧠 Memory Core: Research & Ingestion Engine
 * -------------------------------------------------------------------------
 * Handles Vector I/O, Embedding Generation, Pruning, and File Parsing.
 * -------------------------------------------------------------------------
 */
const INDEX_NAME = "knowledge-library";
const BATCH_SIZE = 50;
// Shared Pinecone instance
let pc = null;
function getPC() {
  if (!pc) {
    if (!process.env.PINECONE_API_KEY) {
      throw new Error("❌ Memory Error: Missing PINECONE_API_KEY in .env");
    }
    pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
  }
  return pc;
}
/**
 * 🔍 Search across namespaces
 */
export async function searchScholar({
  query,
  namespaces = ["knowledge-base.meta", "knowledge-base.external", "knowledge-base.src"],
  topK = 5,
}) {
  const pc = getPC();
  const index = pc.index(INDEX_NAME);
  // 1. Generate Query Embedding
  const embedding = await pc.inference.embed("multilingual-e5-large", [query], {
    inputType: "query",
  });
  // 2. Parallel Namespace Query
  const queryPromises = namespaces.map((ns) =>
    index
      .namespace(ns)
      .query({
        vector: embedding.data[0].values,
        topK,
        includeMetadata: true,
      })
      .then((res) => ({ ns, matches: res.matches || [] }))
      .catch((err) => {
        console.warn(`⚠️  Namespace ${ns} search failed:`, err.message);
        return { ns, matches: [] };
      }),
  );
  const results = await Promise.all(queryPromises);
  // 3. Flatten and Sort
  return results
    .flatMap((res) => res.matches.map((m) => ({ ...m, namespace: res.ns })))
    .sort((a, b) => b.score - a.score)
    .slice(0, topK * 2);
}
/**
 * 📥 Ingest files into Pinecone with Prune-on-Write
 */
export async function ingestScholar({
  paths,
  namespace = "knowledge-base.meta",
  root = process.cwd(),
}) {
  const pc = getPC();
  const index = pc.index(INDEX_NAME);
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
      const relPath = path.relative(root, fullPath);
      if (
        gitignoreFilter.ignores(relPath) ||
        relPath.includes(".git/") ||
        relPath.includes("node_modules/")
      )
        continue;
      const stat = await fs.stat(fullPath);
      if (stat.isDirectory()) {
        await walk(fullPath);
      } else if (/\.(md|txt|json|js|ts|svelte)$/i.test(item)) {
        files.push(fullPath);
      }
    }
  }
  for (const p of paths) {
    const abs = path.resolve(root, p);
    try {
      const stat = await fs.stat(abs);
      if (stat.isDirectory()) await walk(abs);
      else files.push(abs);
    } catch (e) {
      console.warn(`⚠️  Skipping invalid path: ${p}`);
    }
  }
  console.log(`📑 Processing ${files.length} files for namespace: ${namespace}`);
  // 3. Prune & Chunk
  const allChunks = [];
  console.log(`🧹 Pruning existing vectors for ${files.length} files...`);
  for (const file of files) {
    const content = await fs.readFile(file, "utf-8");
    const relPath = path.relative(root, file);
    // A. Prune Ghosts (Delete existing vectors for this specific file)
    try {
      await index.namespace(namespace).deleteMany({
        source: { $eq: relPath },
      });
    } catch (err) {
      // Ignore "not found" or "no filter support" errors silently
    }
    const ext = path.extname(file);
    let segments = [];
    // Smart Splitting
    if (ext === ".md") {
      segments = content.split(/^#+\s/gm).filter((s) => s.trim().length > 20);
    } else {
      // Code splitting by comment blocks or large gaps
      segments = content.split(/\n(?=\/\*\*|\/\/\s[A-Z]{3,})/).filter((s) => s.trim().length > 30);
    }
    if (segments.length === 0 && content.trim().length > 0) segments = [content];
    segments.forEach((seg, i) => {
      const clean = seg.trim();
      const id = crypto
        .createHash("sha256")
        .update(namespace + relPath + i)
        .digest("hex");
      allChunks.push({
        id,
        metadata: {
          content: clean,
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
      const embeddings = await pc.inference.embed("multilingual-e5-large", texts, {
        inputType: "passage",
      });
      const data = embeddings.data || embeddings;
      const vectors = batch.map((record, idx) => ({
        id: record.id,
        values: data[idx].values,
        metadata: record.metadata,
      }));
      await index.namespace(namespace).upsert(vectors);
      process.stdout.write(
        `\r✅ Uploaded chunk ${Math.min(i + BATCH_SIZE, allChunks.length)}/${allChunks.length}`,
      );
    } catch (err) {
      console.error(`\n❌ Batch failed: ${err.message}`);
    }
  }
  console.log(`\n✨ Ingestion complete.`);
}

export const ServerEngine = {
  searchScholar,
  ingestScholar,
};
