# Graph-It-Live Known Pitfalls & Failure Parables

> **Tier 2 Empirical Scar Tissue**: Read this ledger before running dependency scans, multi-file refactors, dead-code sweeps, or PR reviews with `graph-it-live`. Reference these entries by ID (`[PF-00x]`) from workflow docs instead of duplicating them.

---

## Tool Mechanics

### `[PF-001]` Unnecessary `graph-it scan` Pre-Indexing (Occurrences: 2)

- **Trigger**: Preparing to analyze a codebase or re-checking after editing files.
- **Wrong Behavior (Root Cause)**: Running `graph-it scan` before analysis or after edits, triggering redundant scans.
- **Correct Behavior (Prevention Rule)**: Every `graph-it` command restores `.graph-it/cache/` and re-analyzes changed files automatically. Reserve `scan` for CI cache warm-ups or printing index status, and use `--reindex` only when cached output looks stale or corrupt.

---

### `[PF-002]` Treating `query_call_graph` Callers as Complete Reference Proof (Occurrences: 3)

- **Trigger**: Checking whether an exported symbol is safe to delete or rename.
- **Wrong Behavior (Root Cause)**: Running `query_call_graph` (`direction: callers`) alone and treating 0 callers as unused. `query_call_graph` misses barrel re-exports, dynamic references, and type-only `USES` edges unless `--includeTypeOnly=true` is passed.
- **Correct Behavior (Prevention Rule)**: Confirm symbol safety with `get_impact_analysis` and `find_referencing_files` / `path-in`, and manually inspect barrel (`index.js`) re-exports.

---

### `[PF-003]` Planning or Reviewing on Truncated, Partial, or Out-of-Root Results (Occurrences: 2)

- **Trigger**: Receiving `truncated=true`, `isPartial=true`, non-empty `limitations`, or `Warning: N imports resolve outside the workspace root`.
- **Wrong Behavior (Root Cause)**: Treating a partial or package-scoped result as complete workspace proof, missing sibling consumers or truncated dependents.
- **Correct Behavior (Prevention Rule)**: Run from the repo root or pass `-w <repoRoot>` (CLI) / `graphitlive_set_workspace` (MCP). When `truncated=true`, rerun once with `--token-budget 16000` and page with `--cursor` before planning. Never mark a review complete when `isPartial=true` or `limitations` is non-empty without reporting the partial scope and listing the manual check that closes each gap.

---

### `[PF-004]` Mapping CLI Flags or Relative Paths Blindly to MCP Tool Schemas (Occurrences: 2)

- **Trigger**: Switching between `graph-it` CLI and direct `graphitlive_*` MCP server tool calls.
- **Wrong Behavior (Root Cause)**: Passing CLI-only flags (`--format toon`, `--token-budget`) or unverified parameter names to MCP tools whose JSON schema does not advertise them, or assuming MCP server calls resolve relative paths the way `graph-it tool` does.
- **Correct Behavior (Prevention Rule)**: Read the MCP tool JSON schema before calling it directly. Pass `response_format` only when advertised, use exact camelCase parameter names (`filePath`, `symbolName`, `targetPath`), and pass absolute paths to direct MCP calls (`graph-it tool` resolves workspace-relative paths automatically via `resolveToolFilePaths`).

---

### `[PF-008]` Flag Casing Split & Stdout Update Banner in JSON Pipes (Occurrences: 1)

- **Trigger**: Constructing CLI commands from memory or piping `graph-it ... --format json` straight into `JSON.parse` / `jq`.
- **Wrong Behavior (Root Cause)**: Most CLI flags use kebab-case (`--token-budget`, `--max-files`), yet three CLI flags use camelCase (`architecture --maxFiles`, `check --minConfidence`, `check --unreferencedFiles`), `graph-it tool` parameters use camelCase (`--tokenBudget`), and `explore_architecture` uses snake_case (`--response_format`). Additionally, `graph-it` can print an `Update available: vX.Y.Z` line before JSON output on stdout, breaking naive parsers.
- **Correct Behavior (Prevention Rule)**: Check [glossary.md](./references/glossary.md) for exact casing before invoking flags. When parsing `--format json` in scripts, slice from the first `{` or `[` before calling `JSON.parse`.

---

### `[PF-009]` `spawnSync npx.cmd EINVAL` in Node.js Scripts on Windows (Occurrences: 1)

- **Trigger**: Calling `graph-it` from a Node.js automation script (`scan-dead-code.js`, `audit.js`) via `execFileSync("npx.cmd", ...)` on Windows.
- **Wrong Behavior (Root Cause)**: Spawning `.cmd`/`.bat` shims directly with `execFileSync` without a shell throws `Error: spawnSync npx.cmd EINVAL` in modern Node.js (CVE-2024-27980).
- **Correct Behavior (Prevention Rule)**: Resolve `node_modules/@magic5644/graph-it-live/dist/graph-it.js` from the workspace root and invoke it directly with `execFileSync(process.execPath, [graph_it_bin, ...], ...)`.

---

## RPGlitch Stack

### `[PF-005]` Bare `@alias` Barrels Require Root `tsconfig.json` with `baseUrl` (Occurrences: 1)

- **Trigger**: Running `check-architecture`, `scan_dead_code`, or `trace` in RPGlitch where cross-folder imports use bare Vite barrel aliases (`@config`, `@data`, `@utils`, `@state`, `@engine`, `@media`, `@simulation`, `@definitions`, `@primitives`, `@ui`).
- **Wrong Behavior (Root Cause)**: `graph-it-live v1.25.3` does not resolve bare `@alias` imports from `jsconfig.json` without `baseUrl`, marking them `:::external`. This drops cross-rank edges (`interGroupEdges=0`) and flags `src/*/index.js` barrels as unreferenced.
- **Correct Behavior (Prevention Rule)**: Keep root `tsconfig.json` (`"baseUrl": "."`, `"allowJs": true`, `"noEmit": true`, and `paths` matching `vite.config.js`) in sync. If `architecture --folder src` ever drops to `interGroupEdges=0` or `scan_dead_code` flags `src/*/index.js`, check `tsconfig.json` before trusting results.

---

### `[PF-006]` Svelte Template & `export *` Barrel False Positives in `scan_dead_code` (Occurrences: 1)

- **Trigger**: `scan_dead_code` or `get_impact_analysis` flagging a symbol imported into a `.svelte` component through an `@alias` `export *` barrel (`src/*/index.js`) and used only in the Svelte HTML template (`onclick={...}`, `use:action`, `in:transition`, `prop={fn}`).
- **Wrong Behavior (Root Cause)**: Upstream `graph-it-live` tracks Vue 3 templates fully while keeping Svelte template usage analysis conservative, producing high-confidence false positives on template-bound symbols (such as `open_picker`, `auto_resize`, `overlay_in`, `extract_card_from_png`).
- **Correct Behavior (Prevention Rule)**: Run `npm run audit:dead-code` (which strips comments and checks `src/**/*.{js,svelte}`), and confirm remaining candidates manually before deleting (see [dead-code.md](./references/dead-code.md)).

---

### `[PF-007]` Treating Single-File `graph-it cycles <file>` as Workspace Cycle Proof (Occurrences: 1)

- **Trigger**: Verifying that RPGlitch has zero circular dependencies across `src/*/index.js` barrels or `.svelte.js` stores.
- **Wrong Behavior (Root Cause)**: Running `graph-it cycles <file>` on one file and trusting `cycleCount=0`. `cycles` crawls from that entry file and reports only import cycles that pass directly through that exact `<file>`, missing cycles elsewhere in the folder or cycles hidden by unresolved aliases.
- **Correct Behavior (Prevention Rule)**: Enforce `./` relative imports for in-folder siblings (never `@<own-folder>`). Verify workspace cycles with `graph-it check-architecture` (`no-rank-folder-cycles`), `graph-it architecture --level units --matrix --format toon`, or a Strongly Connected Components (Tarjan SCC) pass over `graph-it architecture --communities louvain --format json` edges.

---

### `[PF-010]` `graphit.architecture.json` Disjoint Globs, `node-ignore` Trailing Slashes, and `v1.25.3` / `v1.25.6` `roles` Split (Occurrences: 1)

- **Trigger**: Authoring or updating `graphit.architecture.json` while running both the `v1.25.3` npm CLI and `v1.25.5+` VS Code extension.
- **Wrong Behavior (Root Cause)**:
  1. Combining trailing-slash directory rules (`"src/*/"`) with `"!*.test.js"` — `node-ignore` ignores file negations inside an already-matched parent directory, causing overlap warnings with `"test-suites"` in `v1.25.5+`.
  2. Using `"roles"` keys like `"(root)"` or `"src"` (warns in `v1.25.5+`) or `"test"` role values (fails Zod validation in `v1.25.3` CLI).
- **Correct Behavior (Prevention Rule)**: Keep declared `elements` strictly disjoint using `["src/<folder>/**", "!*.test.js"]` (and `["src/ui/*", "!src/ui/primitives", "!*.test.js"]` for `rank5-ui`), omit redundant umbrella elements when `allowOnly` rank rules already form an acyclic DAG, and key `"roles"` by declared element names with `v1.25.3`-compatible values (e.g., `"tooling": "tooling"`).

---

### `[PF-011]` VS Code Symbol Graph (`explain`) Call Cycles Mislabeled as `"Circular dependency (N files)"` (Occurrences: 1)

- **Trigger**: Opening a file's Symbol / Call Graph in the VS Code `graph-it-live` extension and seeing red dashed edges with `Circular dependency (N files in analyzed graph)` (e.g., `pump` -> `preempt_active` -> `release_slot` -> `pump` in `src/utils/async.js`).
- **Wrong Behavior (Root Cause)**: Treating the red legend as a file-level circular `import` and refactoring benign async queue/timer callbacks (Promise `.then` or `setTimeout` drain loops) to silence the graph. The Symbol Graph renders intra-file `explain` call edges and mislabels the cycle node count as `"files"`.
- **Correct Behavior (Prevention Rule)**: Verify actual import cycles with `npx graph-it cycles <file>`, `npx graph-it check-architecture`, or a Tarjan SCC pass over `npx graph-it architecture --format json`. Only refactor `explain` `cycleNodes` when they represent unintended synchronous recursion.

---

### `[PF-012]` `npm run audit:dead-code` Masking Test-Only Exports as Live Usage (Occurrences: 1)

- **Trigger**: Running `npm run audit:dead-code` (`scan-dead-code.js`) before a P4 dead-code purge.
- **Wrong Behavior (Root Cause)**: Assuming every symbol not listed by `audit:dead-code` has production callers. `scan-dead-code.js` scans all `.js` and `.svelte` files under `src/`, including `*.test.js`, so exports used solely by unit tests are filtered out as live references.
- **Correct Behavior (Prevention Rule)**: For P4 dead-code sweeps, inspect `npx graph-it check <scope> --minConfidence low --format toon` (`reasons: [test-only-use]`) or filter out `*.test.js` when verifying production callers.
