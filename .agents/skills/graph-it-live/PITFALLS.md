# Graph-It-Live Known Pitfalls & Failure Parables

> **Tier 2 Empirical Scar Tissue**: Read this ledger before running dependency scans, multi-file refactors, dead-code sweeps, or PR reviews with `graph-it-live`.

---

## Failure Parables

### `[PF-001]` Unnecessary `graph-it scan` Pre-Indexing (Occurrences: 2)

- **Trigger**: Preparing to analyze a codebase or re-checking after editing files.
- **Wrong Behavior (Root Cause)**: Running `graph-it scan` before analysis or after edits, triggering redundant full-workspace scans.
- **Correct Behavior (Prevention Rule)**: Every `graph-it` command restores `.graph-it/cache/` and re-analyzes changed files on demand. Use `--reindex` only when cached results look corrupt or stale.

---

### `[PF-002]` Treating `query_call_graph` Callers as Complete Reference Proof (Occurrences: 3)

- **Trigger**: Checking whether an exported symbol is safe to delete or rename.
- **Wrong Behavior (Root Cause)**: Running `query_call_graph` (`direction: callers`) alone and treating 0 callers as "unused". `query_call_graph` misses re-exports, dynamic references, and type-only `USES` references.
- **Correct Behavior (Prevention Rule)**: Confirm symbol safety with `get_impact_analysis` (including type-only references) and `find_referencing_files` / `path-in`, and manually inspect barrel (`index.ts` / `index.js`) re-exports.

---

### `[PF-003]` Planning or Reviewing on Truncated or Out-of-Root Results (Occurrences: 2)

- **Trigger**: Receiving `truncated=true`, `isPartial=true`, non-empty `limitations`, or `Warning: N imports resolve outside the workspace root`.
- **Wrong Behavior (Root Cause)**: Treating a partial or package-scoped result as complete workspace proof, missing sibling-package consumers in a monorepo or truncated dependents.
- **Correct Behavior (Prevention Rule)**: Pass `-w <repoRoot>` (CLI) or `graphitlive_set_workspace` at the repository root. When `truncated=true`, rerun with `--token-budget 16000` and page with `--cursor` before planning or concluding. Never mark a review complete when `isPartial` is `true` or `limitations` is non-empty without reporting the partial scope and listing the manual check that closes each gap.

---

### `[PF-004]` Mapping CLI Flags Blindly to MCP Tool Schemas (Occurrences: 2)

- **Trigger**: Falling back from `graph-it` CLI to `graphitlive_*` MCP tools.
- **Wrong Behavior (Root Cause)**: Passing CLI-only flags (`--format toon`, `--token-budget`) to MCP tools whose JSON schema does not advertise them, causing schema validation errors.
- **Correct Behavior (Prevention Rule)**: Always read the MCP tool's JSON schema before calling `call_mcp_tool`. Pass `response_format` only when the schema advertises it, and use the exact parameter names (`filePath`, `symbolName`, `targetPath`).

---

### `[PF-005]` Bare `@alias` Barrels Require `tsconfig.json` with `baseUrl` for Full Graph Resolution (Occurrences: 1)

- **Trigger**: Running `graph-it check-architecture`, `scan_dead_code`, or `trace` in RPGlitch where cross-folder imports use bare Vite barrel aliases (`@data`, `@utils`, `@state`, `@engine`, `@media`, `@simulation`, `@definitions`, `@primitives`, `@ui`).
- **Wrong Behavior (Root Cause)**: `graph-it-live v1.25.3` does not resolve bare `@alias` imports from `jsconfig.json` alone — it treats them as `:::external`, causing `check-architecture` to skip cross-rank `@alias` edges (`interGroupEdges=0`) and `scan_dead_code` to flag `src/*/index.js` barrels as unreferenced.
- **Correct Behavior (Prevention Rule)**: Keep root `tsconfig.json` (with `"baseUrl": "."` and bare barrel `paths` matching `vite.config.js`) in sync. If `architecture --folder src` ever drops to `interGroupEdges=0` or `scan_dead_code` flags `src/*/index.js`, check `tsconfig.json` before trusting dead-code or layer-check results.

---

### `[PF-006]` Svelte Template & `export *` Barrel False Positives in `scan_dead_code` (Occurrences: 1)

- **Trigger**: `graph-it tool scan_dead_code` or `get_impact_analysis` reporting a symbol as unused when it is imported into a `.svelte` component through an `@alias` `export *` barrel (`src/*/index.js`) and invoked in the Svelte HTML template (`onclick={...}`, `use:action`, `in:transition`, `prop={fn}`).
- **Wrong Behavior (Root Cause)**: `graph-it-live v1.25.3` resolves `@alias` file edges in `.svelte` files, but `scan_dead_code` and `get_impact_analysis` do not trace Svelte HTML template expressions or `export *` barrel bindings for `.svelte` consumers, producing high-confidence false positives (e.g. `open_picker`, `auto_resize`, `overlay_in`, `extract_card_from_png`).
- **Correct Behavior (Prevention Rule)**: Before deleting any candidate from `scan_dead_code`, strip comments (`//`, `/* ... */`, `<!-- ... -->`) and search `src/**/*.{js,svelte}` (excluding the defining file) for `\b<symbol>\b`. Also check hits inside the defining file to distinguish truly dead code (`1` hit) from internal-only exports (`2+` hits).
