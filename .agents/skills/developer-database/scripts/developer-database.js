#!/usr/bin/env node

/**
 * @file config/skills/developer-database/scripts/developer-database.js
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * 🔮 DEVELOPER DATABASE ENGINE — The Sovereign Memory & Relational Module
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * PURPOSE
 * Orchestrates the project's "Living Memory" (Pinecone Vector DB) and "Cold Storage"
 * (Supabase Relational DB) for developer-only telemetry and trace tracking.
 *
 * RESPONSIBILITIES
 * - Logic       : Semantic search (Vector) and decision archival (Relational).
 * - Persistence : Unified storage boundary for agentic memory.
 * - Integration : Acts as both an MCP Server and a standalone CLI.
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import "dotenv/config";
import ignore from "ignore";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import url from "node:url";

/**
 * Sovereign Developer Database Engine
 */
export class DeveloperDatabaseEngine {
  // --- PRIVATE CONFIG (#) ---
  #pinecone_config = {
    index_name: "knowledge-library",
    api_key: process.env.PINECONE_API_KEY,
    batch_size: 50,
    cached_host: null,
  };

  #supabase_config = {
    url: process.env.SUPABASE_URL,
    key: process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY,
  };

  /**
   * Initializes the engine.
   * Allows injecting configuration keys for advanced modular testability.
   *
   * @param {object} [config] Optional override configuration
   * @param {string} [config.pineconeKey] Pinecone API Key
   * @param {string} [config.supabaseUrl] Supabase Rest URL
   * @param {string} [config.supabaseKey] Supabase Anon/Service Key
   */
  constructor(config = {}) {
    if (config.pineconeKey) this.#pinecone_config.api_key = config.pineconeKey;
    if (config.supabaseUrl) this.#supabase_config.url = config.supabaseUrl;
    if (config.supabaseKey) this.#supabase_config.key = config.supabaseKey;
  }

  // --- CORE NETWORKING UTILITIES ---

  /**
   * Performs a request to the Pinecone API.
   * Abstracts header generation and robust error handling.
   *
   * @param {string} endpoint API endpoint path (e.g. '/query') or absolute URL
   * @param {object} [options] Fetch options
   * @returns {Promise<any>} Parsed response data
   */
  async #pinecone_request(endpoint, options = {}) {
    const host = await this.#get_pinecone_host();
    const isAbsolute = endpoint.startsWith("http");
    const targetUrl = isAbsolute ? endpoint : `https://${host}${endpoint}`;

    const headers = {
      "Api-Key": this.#pinecone_config.api_key || "",
      "Content-Type": "application/json",
      ...options.headers,
    };

    if (!isAbsolute && endpoint.includes("/embed")) {
      headers["X-Pinecone-API-Version"] = "2024-07";
    }

    const res = await fetch(targetUrl, { ...options, headers });
    if (!res.ok) {
      throw new Error(`Pinecone Request Failed [${res.status}]: ${await res.text()}`);
    }
    return res.json();
  }

  /**
   * Performs a request to the Supabase API.
   *
   * @param {string} endpoint API endpoint path (e.g. '/rest/v1/...')
   * @param {object} [options] Fetch options
   * @returns {Promise<any>} Parsed response data or raw response if requested
   */
  async #supabase_request(endpoint, options = {}) {
    const targetUrl = `${this.#supabase_config.url}${endpoint}`;
    const headers = {
      apikey: this.#supabase_config.key || "",
      Authorization: `Bearer ${this.#supabase_config.key}`,
      "Content-Type": "application/json",
      ...options.headers,
    };

    const res = await fetch(targetUrl, { ...options, headers });
    if (!res.ok) {
      throw new Error(`Supabase Request Failed [${res.status}]: ${await res.text()}`);
    }

    if (options.headers?.Prefer?.includes("return=minimal")) {
      return { success: true };
    }
    return res.json();
  }

  // --- CORE ENGINE: PINECONE (VECTOR) ---

  /**
   * Resolves the primary Pinecone index host.
   *
   * @returns {Promise<string>} Target index host domain
   */
  async #get_pinecone_host() {
    if (this.#pinecone_config.cached_host) return this.#pinecone_config.cached_host;

    console.error("📡 Fetching Pinecone index host...");
    const res = await fetch("https://api.pinecone.io/indexes", {
      headers: { "Api-Key": this.#pinecone_config.api_key || "" },
    });

    if (!res.ok) {
      throw new Error(`Failed to list Pinecone indexes: ${res.statusText}`);
    }

    const data = /** @type {any} */ (await res.json());
    const index = data.indexes?.find(
      (/** @type {any} */ i) => i.name === this.#pinecone_config.index_name,
    );

    if (!index) throw new Error(`Pinecone Index '${this.#pinecone_config.index_name}' not found`);
    this.#pinecone_config.cached_host = index.host;
    return this.#pinecone_config.cached_host;
  }

  /**
   * Queries vector namespaces semantically.
   *
   * @param {object} params
   * @param {string} params.query Semantically queried string
   * @param {string[]} [params.namespaces] Namespaces to look up
   * @param {number} [params.top_k] Number of returned items
   */
  async query_knowledge_base({
    query,
    namespaces = ["knowledge-base.meta", "knowledge-base.external", "knowledge-base.src"],
    top_k = 5,
  }) {
    // 1. Generate Query Embedding
    const embed_data = await this.#pinecone_request("https://api.pinecone.io/embed", {
      method: "POST",
      body: JSON.stringify({
        model: "multilingual-e5-large",
        parameters: { input_type: "query", truncate: "END" },
        inputs: [{ text: query }],
      }),
    });

    if (!embed_data.data?.[0]) throw new Error("Embedding failed");
    const vector = embed_data.data[0].values;

    // 2. Parallel Namespace Query
    const query_promises = namespaces.map(async (ns) => {
      try {
        const data = await this.#pinecone_request("/query", {
          method: "POST",
          body: JSON.stringify({ namespace: ns, vector, topK: top_k, includeMetadata: true }),
        });
        return { ns, matches: data.matches || [] };
      } catch (err) {
        const error = /** @type {Error} */ (err);
        console.warn(`⚠️ Namespace ${ns} query failed: ${error.message}`);
        return { ns, matches: [] };
      }
    });

    const results = await Promise.all(query_promises);

    // 3. Flatten and Sort
    return results
      .filter((res) => res?.matches)
      .flatMap((res) => res.matches.map((/** @type {any} */ m) => ({ ...m, namespace: res.ns })))
      .sort((a, b) => b.score - a.score)
      .slice(0, top_k * 2);
  }

  /**
   * Filters and normalizes relative directory path checking.
   *
   * @param {string} relPath Path relative to root
   * @param {any} gitignoreFilter Active .gitignore filter instance
   * @returns {boolean} True if the path should be ignored
   */
  #should_ignore(relPath, gitignoreFilter) {
    const normalized = relPath.replace(/\\/g, "/");
    return (
      gitignoreFilter.ignores(normalized) ||
      normalized.includes(".git/") ||
      normalized.includes("node_modules/")
    );
  }

  /**
   * Segments file text into structural chunks based on file type.
   *
   * @param {string} content File body contents
   * @param {string} ext Extension of file
   * @returns {string[]} Formatted segments
   */
  #chunk_content(content, ext) {
    const isMarkdown = ext.toLowerCase() === ".md";
    const segments = isMarkdown
      ? content.split(/^#+\s/gm).filter((s) => s.trim().length > 20)
      : content.split(/\n(?=\/\*\*|\/\/\s[A-Z]{3,})/).filter((s) => s.trim().length > 30);

    return segments.length === 0 && content.trim().length > 0 ? [content] : segments;
  }

  /**
   * Ingests files/directories into the vector database.
   *
   * @param {object} params
   * @param {string[]} params.paths Target paths to index
   * @param {string} [params.namespace] Target namespace
   * @param {string} [params.root] Workspace root directory
   */
  async write_knowledge_base({ paths, namespace = "knowledge-base.meta", root = process.cwd() }) {
    let gitignore_filter = ignore();
    try {
      const git_content = await fs.readFile(path.join(root, ".gitignore"), "utf-8");
      gitignore_filter.add(git_content);
    } catch {
      /* No .gitignore found */
    }

    const files = [];
    const walk = async (/** @type {string} */ dir) => {
      const items = await fs.readdir(dir);
      for (const item of items) {
        const full_path = path.join(dir, item);
        const rel_path = path.relative(root, full_path);

        if (this.#should_ignore(rel_path, gitignore_filter)) continue;

        const stat = await fs.stat(full_path);
        if (stat.isDirectory()) {
          await walk(full_path);
        } else if (/\.(md|txt|json|js|ts|svelte)$/i.test(item)) {
          files.push(full_path);
        }
      }
    };

    for (const p of paths) {
      const abs = path.resolve(root, p.trim());
      try {
        const stat = await fs.stat(abs);
        if (stat.isDirectory()) await walk(abs);
        else files.push(abs);
      } catch {
        console.warn(`⚠️ Skipping invalid path: ${p}`);
      }
    }

    console.error(`📑 Processing ${files.length} files for namespace: ${namespace}`);

    /** @type {any[]} */
    const all_chunks = [];
    for (const file of files) {
      const content = await fs.readFile(file, "utf-8");
      const rel_path = path.relative(root, file).replace(/\\/g, "/");

      // 1. Delete existing vectors for this file to ensure clean overwrite
      await this.#pinecone_request("/vectors/delete", {
        method: "POST",
        body: JSON.stringify({ namespace, filter: { source: { $eq: rel_path } } }),
      });

      // 2. Fragment file content and map metadata chunks
      const segments = this.#chunk_content(content, path.extname(file));
      segments.forEach((seg, i) => {
        const id = crypto
          .createHash("sha256")
          .update(namespace + rel_path + i)
          .digest("hex");
        all_chunks.push({
          id,
          metadata: {
            content: seg.trim(),
            source: rel_path,
            chunk_index: i,
            indexed_at: new Date().toISOString(),
          },
        });
      });
    }

    // 3. Batch Upload Chunks
    for (let i = 0; i < all_chunks.length; i += this.#pinecone_config.batch_size) {
      const batch = all_chunks.slice(i, i + this.#pinecone_config.batch_size);
      const texts = batch.map((c) => c.metadata.content);

      const embed_data = await this.#pinecone_request("https://api.pinecone.io/embed", {
        method: "POST",
        body: JSON.stringify({
          model: "multilingual-e5-large",
          parameters: { input_type: "passage", truncate: "END" },
          inputs: texts.map((t) => ({ text: t })),
        }),
      });

      if (!embed_data.data) throw new Error(`Embedding failed: ${JSON.stringify(embed_data)}`);

      const vectors = batch.map((record, idx) => ({
        id: record.id,
        values: embed_data.data[idx].values,
        metadata: record.metadata,
      }));

      await this.#pinecone_request("/vectors/upsert", {
        method: "POST",
        body: JSON.stringify({ namespace, vectors }),
      });

      process.stderr.write(
        `\r✅ Uploaded chunk ${Math.min(i + this.#pinecone_config.batch_size, all_chunks.length)}/${all_chunks.length}`,
      );
    }
    process.stderr.write("\n✨ Ingestion complete.\n");
  }

  /**
   * Shows stats for the active index namespaces.
   */
  async describe_index_stats() {
    return this.#pinecone_request("/describe_index_stats", { method: "POST" });
  }

  // --- CORE ENGINE: SUPABASE (COLD STORAGE) ---

  /**
   * Archives a development trace/log into Supabase Relational Cold Storage.
   *
   * @param {object} params
   * @param {string} params.session_id Session identifier
   * @param {string} params.task_slug Task identifier
   * @param {string} params.content Narrative log content
   * @param {object} [params.metadata] Supplementary metadata object
   */
  async archive_log({ session_id, task_slug, content, metadata = {} }) {
    return this.#supabase_request("/rest/v1/development_logs", {
      method: "POST",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify({
        session_id,
        task_slug,
        content,
        metadata,
        created_at: new Date().toISOString(),
      }),
    });
  }

  /**
   * Queries relational development logs.
   *
   * @param {object} params
   * @param {string} [params.task_slug] Optional filter key
   * @param {number} [params.limit] Max items returned
   */
  async query_logs({ task_slug, limit = 10 }) {
    let endpoint = `/rest/v1/development_logs?select=*&order=created_at.desc&limit=${limit}`;
    if (task_slug) endpoint += `&task_slug=eq.${task_slug}`;
    return this.#supabase_request(endpoint, { method: "GET" });
  }

  // --- MCP SERVER INTEGRATION ---

  /**
   * Starts the Model Context Protocol stdio server.
   */
  async create_mcp_server() {
    const server = new Server(
      { name: "developer-database", version: "3.3.0" },
      { capabilities: { tools: {} } },
    );

    server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: "read_knowledge_base",
          description: "Search technical KB via Pinecone vector databases.",
          inputSchema: {
            type: "object",
            properties: { query: { type: "string" } },
            required: ["query"],
          },
        },
        {
          name: "write_knowledge_base",
          description: "Ingest local directory files recursively into vector namespace.",
          inputSchema: {
            type: "object",
            properties: {
              paths: { type: "array", items: { type: "string" } },
              namespace: {
                type: "string",
                enum: ["knowledge-base.meta", "knowledge-base.external", "knowledge-base.src"],
              },
            },
            required: ["paths", "namespace"],
          },
        },
        {
          name: "describe_knowledge_base",
          description: "Retrieve vector database index allocation stats.",
          inputSchema: { type: "object", properties: {} },
        },
        {
          name: "archive_log_entry",
          description: "Archive trace narrative or mission log into relational cold storage.",
          inputSchema: {
            type: "object",
            properties: {
              session_id: { type: "string" },
              task_slug: { type: "string" },
              content: { type: "string" },
              metadata: { type: "object" },
            },
            required: ["session_id", "task_slug", "content"],
          },
        },
        {
          name: "query_cold_storage",
          description: "Query and retrieve development logs from cold storage.",
          inputSchema: {
            type: "object",
            properties: { task_slug: { type: "string" }, limit: { type: "number" } },
          },
        },
      ],
    }));

    server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      try {
        switch (name) {
          case "read_knowledge_base": {
            const matches = await this.query_knowledge_base(/** @type {any} */ (args));
            const text = matches
              .map(
                (m) =>
                  `[Source: ${m.metadata.source}] (Score: ${(m.score * 100).toFixed(0)}%)\n${m.metadata.content}`,
              )
              .join("\n\n---\n\n");
            return { content: [{ type: "text", text: text || "No documentation found." }] };
          }
          case "write_knowledge_base":
            await this.write_knowledge_base(/** @type {any} */ (args));
            return { content: [{ type: "text", text: "Vector DB updated." }] };
          case "describe_knowledge_base":
            return {
              content: [
                { type: "text", text: JSON.stringify(await this.describe_index_stats(), null, 2) },
              ],
            };
          case "archive_log_entry":
            await this.archive_log(/** @type {any} */ (args));
            return { content: [{ type: "text", text: "Log archived." }] };
          case "query_cold_storage": {
            const logs = /** @type {any[]} */ (await this.query_logs(/** @type {any} */ (args)));
            const text = logs
              .map((l) => `[${l.created_at}] ${l.task_slug}: ${l.content}`)
              .join("\n---\n");
            return { content: [{ type: "text", text: text || "No logs found." }] };
          }
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (err) {
        const error = /** @type {Error} */ (err);
        return { content: [{ type: "text", text: `Error: ${error.message}` }], isError: true };
      }
    });

    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("🟢 Developer Database MCP Server v3.3.0 running on stdio");
  }

  // --- CLI BOOTSTRAP ---

  /**
   * Standalone CLI Entry Point
   *
   * @param {string[]} args CommandLine arguments
   */
  static async bootstrap(args) {
    const engine = new DeveloperDatabaseEngine();
    if (args.length === 0) {
      return await engine.create_mcp_server();
    }

    const command = args[0];
    console.error(`🔮 Developer Database CLI: Executing ${command}...`);
    switch (command) {
      case "upsert":
        await engine.write_knowledge_base({
          paths: [".agents/rules", ".agents/skills", "src/core"],
          namespace: "knowledge-base.meta",
        });
        break;
      case "select": {
        const query = args[1] || "";
        const results = await engine.query_knowledge_base({ query });
        console.log(JSON.stringify(results, null, 2));
        break;
      }
      case "archive": {
        const content = await fs.readFile(args[1], "utf-8");
        await engine.archive_log({
          session_id: "manual-cli-archive",
          task_slug: "historical-cleanup",
          content,
        });
        break;
      }
      default:
        console.error(`❌ Unknown command: ${command}`);
        process.exit(1);
    }
  }
}

if (import.meta.url === url.pathToFileURL(process.argv[1]).href) {
  DeveloperDatabaseEngine.bootstrap(process.argv.slice(2)).catch((err) => {
    console.error("Fatal Error:", err);
    process.exit(1);
  });
}

export const developerDatabase = new DeveloperDatabaseEngine();
