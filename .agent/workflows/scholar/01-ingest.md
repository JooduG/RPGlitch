# 📥 Scholar: Ingestion Workflow

> **Goal:** Anchor new project context, rules, or external documentation into the Pinecone Lorebook.

## 1. Preparation

Before ingesting, identify the **Namespace**:

- `knowledge-base.meta`: Standards, Rules, and Core Philosophy.
- `knowledge-base.external`: External library documentation (Svelte, Dexie, etc.).
- `knowledge-base.src`: Project-specific source code logic.

## 2. Execution

// turbo

1. **Trigger Ingestion**:
   Run the CLI tool for the target directory:

    ```bash
    node tools/scholar/cli.js ingest --path [dir/file] --namespace [ns]
    ```

2. **Default Sync (Recommended)**:
   To sync the core agent configuration:

    ```bash
    node tools/scholar/cli.js ingest
    ```

## 3. Verification

1. **Test Search**:
   Verify the info exists by searching for a unique keyword:

    ```bash
    node tools/scholar/cli.js search "keyword"
    ```

## 📋 Best Practices

- **Exclude Noise**: Ensure `.gitignore` is up to date to avoid ingesting `node_modules`.
- **Atomic namespaces**: Keep high-level rules in `.meta` to prioritize them in searches.
- **Narrative Chunking**: The Scholar uses semantic chunking based on Markdown headers (`#`). Keep docs well-structured for better RAG.
