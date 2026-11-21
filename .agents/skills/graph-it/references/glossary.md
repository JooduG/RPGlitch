# Graph-It-Live Command, Tool & Flag Glossary

Verified against `graph-it v1.25.3+` (npm CLI `v1.25.3`, VS Code extension `v1.25.6+`). Confirm with `--help` if the installed version differs.

## Runtime Rules & Conventions

- **Workspace root**: Auto-detected upward from the nearest project marker (`package.json`, `tsconfig.json`, `jsconfig.json`, or other supported language manifests). Exits with code `3` outside a project. Imports resolving outside the root are skipped. Pass `-w <dir>` to override the root and store `.graph-it/` (index + cache) there.
- **Ignore files**: Skips root `.gitignore` entries, `tests/fixtures/`, and `out-*/` by default. Add a root `.graphitignore` (gitignore syntax with `!` negation) to customize scope.
- **On-demand indexing**: Every analysis command restores `.graph-it/cache/` and re-analyzes changed files automatically. `scan` is optional (CI cache warm-up or status). Pass `--reindex` to force a full rebuild (`[PF-001]`).
- **Path arguments**: Top-level CLI commands and `graph-it tool <name>` resolve workspace-relative or absolute paths automatically. Direct `graphitlive_*` MCP server calls expect absolute paths (`[PF-004]`).
- **Flag casing**: CLI flags use kebab-case (`--token-budget`, `--max-files`), with three camelCase exceptions: `architecture --maxFiles`, `check --minConfidence`, and `check --unreferencedFiles`. `graph-it tool` parameters use camelCase (`--filePath`, `--tokenBudget`), except `explore_architecture` uses `--response_format` (`[PF-008]`). Unknown flags/parameters and missing targets exit `1` (CLI) or return a parameter/target error (MCP).
- **Stdout banner caveat**: When a newer npm version exists, `graph-it` may print an `Update available: ...` line before structured output. Scripts parsing `--format json` should slice from the first `{` or `[` (`[PF-008]`).
- **Agent format default**: Pass `--format toon` for compact agent output.

## Exit Codes

| Code | Constant              | Meaning                                                                                                                    |
| ---- | --------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `0`  | `SUCCESS`             | Command completed cleanly.                                                                                                 |
| `1`  | `GENERAL_ERROR`       | Usage error, unknown option, missing target, runtime failure, or new unaccepted `error` violation in `check-architecture`. |
| `2`  | `AMBIGUOUS_SYMBOL`    | Symbol reference matched multiple declarations.                                                                            |
| `3`  | `WORKSPACE_NOT_FOUND` | No workspace marker found at or above the working directory.                                                               |
| `4`  | `UNSUPPORTED_FORMAT`  | Format/command combination is unsupported.                                                                                 |
| `5`  | `SECURITY_VIOLATION`  | Target or output path resolves outside the workspace root.                                                                 |

## Global Flags & Format Matrix

Global options work before or after any command name.

| Global Flag         | Alias | Effect                                                           |
| ------------------- | ----- | ---------------------------------------------------------------- |
| `--workspace <dir>` | `-w`  | Override workspace root directory.                               |
| `--format <fmt>`    | `-f`  | Select output format (see Format Matrix below).                  |
| `--reindex`         |       | Discard cached index and rebuild from scratch.                   |
| `--no-cache`        |       | Neither read nor write index cache (env: `GRAPH_IT_NO_CACHE=1`). |
| `--help`            | `-h`  | Show help for CLI, a command, or `graph-it tool <name>`.         |
| `--version`         | `-v`  | Show installed CLI version.                                      |

### Format Matrix

| Format | Supported Commands & Notes |
| --- | --- |
| `text`, `json`, `toon` | General CLI commands (`text` is default; `query` supports only `text\|json\|toon`; `stats` supports `text\|json\|markdown`; `wiki` supports `markdown\|json\|toon` with `markdown` default; `init` supports `text\|markdown\|json\|toon`). |
| `markdown` | General CLI commands (`context` and `query` reject `markdown` or `mermaid` with exit code `4`). |
| `mermaid` | `trace`, `path`, `path-in`, `architecture --groups` (other commands reject unsupported formats with exit code `4`). |
| `html` | `export` (required; only supported format), `diagram` (default unless `--output` ends in `.svg`). |
| `svg`, `diagram-spec` | `diagram` only. |
| `csv` | `architecture --matrix` only. |
| `sarif` | `check-architecture`, `review-pr` (lists new `graphit.architecture.json` violations on importing lines). |

---

## CLI Commands

### Context & Query

| Command | Purpose | Command Flags | Shared Flags |
| --- | --- | --- | --- |
| `graph-it context [question]` | Retrieve a token-bounded unified graph subgraph. | `--mode search\|neighbors\|path\|impact\|refactor\|overview`, `--seeds <ep>` (repeatable), `--relations <rel>` (repeatable, e.g. `CALLS`, `IMPORTS`), `--max-nodes 1-500`, `--directed`, `--detail compact\|standard\|full` (default `standard`), `--cursor <token>` | `--depth`, `--from`, `--to`, `--scope`, `--token-budget` |
| `graph-it query "<question>"` | Answer a codebase question in natural language. | None | `--depth`, `--token-budget` |

**Contracts:**

- **`context` endpoints & paging**: `--seeds`, `--from`, and `--to` accept `file#symbol` or `symbol` (`--from`/`--to` apply to `--mode path`). When `truncated=true`, output includes `nextCursor` and `omitted` counts; pass `--cursor <nextCursor>` for non-overlapping pages. Never page `--mode search` to the end.
- **`query` fallback**: Uses `ANTHROPIC_API_KEY` (`claude-haiku-4-5`) or `OPENAI_API_KEY` (+ `OPENAI_BASE_URL`, `OPENAI_MODEL`) when set; otherwise falls back to keyword heuristics with a stderr warning. Verify answers with deterministic commands.

### Files, Dependencies & Call Chains

| Command | Purpose | Command Flags | Shared Flags |
| --- | --- | --- | --- |
| `graph-it summary [file]` | No arg: workspace overview. With `<file>`: per-file codemap (exports, internals, deps, dependents, call flow, cycles). | None | Global only |
| `graph-it explain <file>` | Analyze intra-file call hierarchy: entry points, call tree, internal cycles. | None | Global only |
| `graph-it trace <file>#<symbol>` | Trace static call chain outward from a symbol. | None | Global only |
| `graph-it path <file>` | Crawl transitive outgoing imports reachable from an entry file (`cycleKinds` reports cycle kinds). | None | `--communities` |
| `graph-it path-in <file>` | List every file importing `<file>`. | None | Global only |
| `graph-it check-dependencies <file>` | List incoming and outgoing dependencies for `<file>`. | None | Global only |
| `graph-it cycles <file>` | List confirmed file-level dependency cycles passing through `<file>` (`cycleKinds` tags `runtime` vs. `type-only`; `typeOnlyCycleCount`). | None | Global only |

**Contracts:**

- **`trace`** is static call analysis, not observed runtime execution.
- **`cycles`** filters only cycles passing directly through `<file>`; use `check-architecture` or `architecture` for whole-repo cycle checks (`[PF-007]`).

### Dead Code & Diff Review

| Command | Purpose | Command Flags | Shared Flags |
| --- | --- | --- | --- |
| `graph-it check [target]` | Find unused exported symbols or unreferenced files in a file, folder, or workspace (default). | `--minConfidence high\|medium\|low`, `--unreferencedFiles` | `--verbose` |
| `graph-it review-pr` | Analyze impact, signature breaks, cycles, and architecture rule delta for a Git diff. | `--base <ref>` (required), `--head <ref>`, `--max-files <n>` (default `200`) | `--depth` |

**Contracts:**

- **`check` defaults & exclusions**: `--minConfidence` defaults to `high` for unused exports and flips to `low` when `--unreferencedFiles` is set (workspace/folder scan only). Unlisted items are counted in `byConfidence`. Auto-excluded entries (manifest entry points, framework defaults/routes, `import.meta.glob` targets, files named by path in CI/Makefile/scripts, test files, `.d.ts`, `*.config.*`, git-ignored files) appear under `excluded` with `reason` when `--verbose` is passed. `--unreferencedFiles` also reports `cascade` (`via` dead importers) and exclusive `tests`.
- **`review-pr` scope**: Indexes automatically. Omitting `--head` compares `--base` against the working tree (staged and unstaged); passing `--head` compares two committed refs (untracked files excluded). Always check `risk`, `score`, `limitations`, and `isPartial` (`[PF-003]`). An unchanged signature does not prove behavioral safety.

### Architecture, Diagrams & Exports

| Command | Purpose | Command Flags | Shared Flags |
| --- | --- | --- | --- |
| `graph-it init` | Generate `graphit.architecture.json` from current imports (`allowOnly` per unit, `noCycles` for acyclic units) plus dead-file, cycle, hub, matrix guide, and quick-win report. | `--dry-run`, `--yes`, `--focus <name>` | `--output` |
| `graph-it architecture` | Inspect workspace architecture graph, folder groups, unit edges (`--level units` draws declared `elements` from `graphit.architecture.json` when present), cycles, or DSM matrix. | `--level groups\|units`, `--groups`, `--matrix`, `--maxFiles <n>` | `--folder`, `--from`, `--to`, `--communities` |
| `graph-it check-architecture` | Validate static imports against `graphit.architecture.json`. | `--update-baseline` | `--config`, `--baseline`, `--verbose` |
| `graph-it diagram [dir]` | Write a static, script-free SVG, HTML, or `diagram-spec` JSON diagram (draws declared `elements` when present, capped at 60 units/groups). | `--view units\|folder\|matrix`, `--theme light\|dark` (SVG only), `--rules` | `--folder`, `--config`, `--baseline`, `--output` |
| `graph-it export [scope]` | Export dependency graph as standalone HTML (default `graph.html`). | Requires `--format html` | `--communities`, `--output` |
| `graph-it wiki` | Generate a navigable markdown wiki from the call graph (default dir `wiki`). | `--exclude <pattern>` (repeatable), `--top 1-50` (default `10`), `--force` | `--scope`, `--output` |

**Contracts:**

- **`init` overwrite guard**: Never overwrites an existing config or baseline without confirmation. Outside a terminal (agents, CI), it writes nothing to existing configs unless `--yes` is passed, while still printing the report. `--output <dir>` writes `report.md`, SVGs, and an interactive `index.html`.
- **`check-architecture` exit code**: Exits `1` on any `error` violation absent from the baseline. `--update-baseline` writes all current violations to the baseline and exits `0`; `--verbose` prints accepted violations (`text`/`markdown`).
- **`diagram` flag constraints**: Passing both `[dir]` and `--folder`, passing `--config` or `--baseline` without `--rules`, or passing `--theme` without `--format svg` exits with code `1`. Output files must stay inside the workspace (`-` writes to stdout).
- **`wiki` exclusions & safety**: Excludes `tests/`, `dist/`, and `*.test.ts` by default; passing `--exclude` replaces those defaults rather than appending. Refuses paths outside the workspace and never overwrites non-generated files without `--force`.

### Index, Setup & Utilities

| Command | Purpose | Command Flags |
| --- | --- | --- |
| `graph-it scan` | Optional: warm CI cache or print index status. Pair with `--reindex` for a clean rebuild. | Global only |
| `graph-it stats` | Show session and cumulative token stats (TOON vs. JSON `cl100k_base` estimate + LLM usage). Requires no workspace scan. | `--stats-dir <dir>` (default `~/.graph-it/stats`) |
| `graph-it serve` | Launch the MCP stdio server (exposes all 25 MCP tools). | Global only |
| `graph-it install` | Add `graph-it` binary to system `PATH` (VS Code opt-in convenience command). | Global only |
| `graph-it update` | Check npm for latest `@magic5644/graph-it-live` and run global npm update. | Global only |
| `graph-it` | Start the interactive REPL (TTY only; see Human Interactive Mode below). | Global only |

### RPGlitch Repo Wrappers

| Command | Purpose | Backing Script |
| --- | --- | --- |
| `npm run audit:dead-code` | Comment-stripped dead-code audit filtering Svelte template / `export *` barrel false positives (`[PF-006]`). | `.agents/skills/graph-it/scripts/scan-dead-code.js` |
| `npm run audit:layers` | Runs `graph-it check-architecture` against root `graphit.architecture.json`. | `package.json` / `audit.js` |

---

## Shared Flags

| Flag | Commands | Per-Command Syntax & Behavior |
| --- | --- | --- |
| `--baseline [file]` | `check-architecture`, `diagram` | Accepted violations file (default `graphit.architecture.baseline.json`). On `diagram`, requires `--rules` and the file must exist. |
| `--communities <mode>` | `path`, `architecture`, `export` | Grouping mode: `path` (by folder, default) or `louvain` (by import structure). |
| `--config <file>` | `check-architecture`, `diagram` | Architecture rules file inside the workspace (default `graphit.architecture.json`). On `diagram`, requires `--rules`. |
| `--depth <n>` | `context`, `query`, `review-pr` | Traversal depth: `1-5` (`context`), `1-10` (`review-pr`). Also `1-10` on `tool query_call_graph`. |
| `--folder <key>` | `architecture`, `diagram` | Inspect or draw one level below a unit or folder key (path mode). |
| `--from <target>` | `context`, `architecture` | Start `file#symbol`/`symbol` (`context --mode path`), or source unit key (`architecture --level units`). Also group key on `tool explore_architecture`. |
| `--output <path>`, `-o` | `diagram`, `init`, `wiki`, `export` | Output file (`export`, `diagram`; `-` writes stdout on `diagram`) or directory (`init`, `wiki`). Must remain inside workspace for `diagram` and `wiki`. |
| `--scope <glob\|path>` | `context`, `wiki` | Workspace-relative glob (`context`) or relative directory path (`wiki`). |
| `--to <target>` | `context`, `architecture` | Destination `file#symbol`/`symbol` (`context --mode path`), or target unit key (`architecture --level units`). Also group key on `tool explore_architecture`. |
| `--token-budget <n>` | `context`, `query` | Cap on response tokens (`500-16000` on `context`). Use `--tokenBudget` on `tool query_call_graph`. |
| `--verbose` | `check`, `check-architecture` | Lists excluded symbols/files (`check`) or accepted baseline violations (`check-architecture`). Use `--verbose=true` on `tool scan_dead_code`. |

---

## MCP Tool Runner (`graph-it tool <name>`)

Invoke any of the 19 CLI-exposed MCP tools directly from the shell.

- **Discovery**: `graph-it tool --list` prints all 19 tools; `graph-it tool <name> --help` prints Zod-derived parameters and types.
- **Parameter syntax**: `--<param>=<value>` or `--<param> <value>` (boolean params may stand alone as `--flag`). Arrays and objects are JSON (`--filePaths='["a","b"]'`). `--args '<json>'` provides a base object; named `--<param>` flags merge in and override matching keys.
- **Silent indexing**: `graph-it tool` suppresses indexing progress lines on stderr for cleaner scripting.
- **Strict v1.25.5+ contracts**: Unknown parameters and missing targets fail with errors (`query_call_graph` errors on missing targets instead of returning `reason="not_found"`). `crawl_dependency_graph` uses `cycleKinds` (replacing `circularDependencyKinds`), and `query_natural_language` accepts only `response_format` (`outputFormat` removed).

### Tool-Only Capabilities (10 Tools Without Top-Level CLI Commands)

| Tool | Purpose | Parameters & Defaults |
| --- | --- | --- |
| `query_call_graph` | Multi-hop cross-file callers/callees from the SQLite call graph. | `--filePath`, `--symbolName`, `--direction callers\|callees\|both` (`both`), `--depth 1-10` (`2`), `--includeTypeOnly=true` (adds type-only `USES`), `--tokenBudget` (`4000`; `0` = unlimited), `--offset <n>`, `--symbolId`, `--startLine` |
| `get_impact_analysis` | Full direct and transitive impact of changing one symbol (unbounded; no token cap). | `--filePath`, `--symbolName`, `--includeTransitive` (`false`), `--maxDepth 1-20` (`3`) |
| `analyze_breaking_changes` | Compare old vs. new file content and report signature changes that break callers. | `--args '{"filePath":"...","symbolName":"...","oldContent":"...","newContent":"..."}'` |
| `explore_architecture` | Progressive architecture drill-down: summary -> group -> file pairs. | No args = summary; `--group=<key>` = files + boundary; `--from=<key> --to=<key>` = file pairs (`--limit`, `--offset`); `--response_format=toon\|markdown\|json` (`toon`) |
| `verify_dependency_usage` | Check whether `--sourceFile` actually uses any symbol from imported `--targetFile`. | `--sourceFile` (required), `--targetFile` (required) |
| `resolve_module_path` | Resolve one module specifier, as seen from a file, to a disk path. | `--fromFile` (required), `--moduleSpecifier` (required, e.g. `"@engine"`) |
| `get_symbol_graph` | List symbols a file exports and external symbols outside the file each depends on. | `--filePath` (required) |
| `get_index_status` | Report dependency index state (`outOfRootImports`, `reverseIndexStats`, `warmup`). | None |
| `invalidate_files` | Drop cached analysis for specific files (only for edits missed by the file watcher). | `--filePaths` (required, JSON array, max `10000`; use `rebuild_index` for whole workspace) |
| `rebuild_index` | Clear all cached analysis and re-index the whole workspace. | None |

**Contract:**

- **`query_call_graph` ambiguity & paging**: A bare `--symbolName` matching several symbols returns `reason=ambiguous` with candidates; rerun with `--symbolId` or `--startLine`. Use `--tokenBudget=0` for all callers in one call, or pass `nextOffset` to `--offset`. Call sites do not cover all non-call references (`[PF-002]`).

### Tools with CLI Equivalents (9 Tools)

Prefer the top-level CLI command by default; call these directly when scripting JSON payloads or needing tool-specific options.

| Tool | CLI Equivalent | Key Params / Notes |
| --- | --- | --- |
| `graph_context` | `graph-it context` | Same bounded subgraph engine (`--question`, `--mode`, `--scope`, `--args`). |
| `analyze_dependencies` | `graph-it check-dependencies` | `--filePath`. Import/export statements resolved to disk paths. |
| `crawl_dependency_graph` | `graph-it path` | `--entryFile`. Transitive dependency graph from one entry file. |
| `find_referencing_files` | `graph-it path-in` | `--targetPath`. Lists every file importing or referencing the target. |
| `generate_codemap` | `graph-it summary <file>` | `--filePath`. Exports, internals, dependencies, dependents, call flow in one call. |
| `trace_function_execution` | `graph-it trace` | Recursive outward call chain from one symbol. |
| `find_unused_symbols` | `graph-it check <file>` | `--filePath`, `--minConfidence high\|medium\|low` (`high`). |
| `scan_dead_code` | `graph-it check [dir]` | `--scopePath`, `--maxFiles`, `--minConfidence high\|medium\|low` (`high`), `--unreferencedFiles=true`, `--verbose=true`. |
| `check_architecture` | `graph-it check-architecture` | Validates workspace imports against `graphit.architecture.json`. |

### MCP-Server-Only & Removed Tool Names

The MCP server (`graph-it serve`) exposes 25 tools total. The 6 tools omitted from `graph-it tool` map directly to top-level CLI commands:

| MCP Tool (`graphitlive_*`)    | CLI Equivalent                   |
| ----------------------------- | -------------------------------- |
| `set_workspace`               | `--workspace <dir>` / `-w <dir>` |
| `review_pr`                   | `graph-it review-pr`             |
| `query_natural_language`      | `graph-it query`                 |
| `generate_wiki`               | `graph-it wiki`                  |
| `export_architecture_diagram` | `graph-it diagram`               |
| `get_session_stats`           | `graph-it stats`                 |

**Removed in v1.20.0** (calling them raises an error; use the replacement):

- `get_symbol_callers` / `get_symbol_dependents` -> `tool query_call_graph --direction=callers --depth=1`
- `parse_imports` -> `tool analyze_dependencies`
- `expand_node` -> `tool crawl_dependency_graph`
- `analyze_file_logic` -> `tool generate_codemap` or `graph-it explain`

---

## Human Interactive Mode (REPL & Visuals)

Run `graph-it` with no arguments in a terminal (TTY) to launch the interactive REPL.

| Key / Command               | Action                                                                                |
| --------------------------- | ------------------------------------------------------------------------------------- |
| `Esc` (on empty line)       | Move keyboard focus into the results pane.                                            |
| `j` / `k`                   | Move cursor down / up across result lines.                                            |
| `[` / `]`                   | Jump between result blocks.                                                           |
| `Space` / `z`               | Fold current result / fold or unfold all results.                                     |
| `Enter` (on file or symbol) | Open actions menu (`/explain`, `/check-dependencies`, `/trace`, Open in editor).      |
| `/mouse on`                 | Enable mouse wheel and click support (OSC 8 terminals also make file rows clickable). |

**Quick Visual Commands for Humans:**

```bash
graph-it init --output tmp/arch-report               # report.md + SVGs + interactive index.html
graph-it diagram --format svg --rules --output tmp/arch.svg
graph-it export src/engine --format html --output tmp/engine.html
graph-it trace src/main.js#app_bootstrap --format mermaid
```
