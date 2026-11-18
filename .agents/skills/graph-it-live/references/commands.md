# Graph-It-Live CLI Command Reference

Read on demand from the `graph-it-live` skill. Options below were checked against `graph-it --help` and `graph-it <command> --help`. Confirm with that help when the installed version differs.

## Workspace Root

Imports that resolve outside the workspace root are skipped. Without `--workspace`, the CLI uses the nearest directory upward containing `package.json` (or `jsconfig.json`). Outside any project it exits with code `3`. `graph-it -w <dir>` forces the root and creates `.graph-it/` (index + cache) there.

Global flags: `--reindex` discards the cached index and rebuilds it; `--no-cache` neither reads nor writes the cache (also `GRAPH_IT_NO_CACHE=1`).

## Bounded Graph Context

```bash
graph-it context "how does turn execution reach storage" --mode search --scope 'src/**' --depth 2 --detail compact --token-budget 2000 --format toon
graph-it context --mode impact --seeds 'src/engine/turns.js#handle' --relations CALLS --depth 3 --detail compact --token-budget 4000 --format toon
graph-it context --from 'src/engine/turns.js#handle' --to 'db' --mode path --detail compact --format toon
```

- `--mode`: `search|neighbors|path|impact|refactor|overview`.
- `--seeds` (repeatable) and `--from`/`--to` take `file#symbol` or `symbol`.
- `--relations` (repeatable, e.g. `CALLS`, `IMPORTS`), `--scope <glob>`, `--depth 1-5`, `--max-nodes 1-500`, `--token-budget 500-16000`, `--directed`, `--detail compact|standard|full`.
- `truncated=true` returns `nextCursor` and `omitted` counts. See "Budgets and Complete Results" below.

### Budgets and Complete Results

Every CLI call costs a turn and an index load, so size the budget to answer in one call:

1. Pick the budget for the task: about `2000` to locate code, `4000–8000` for impact or refactor, `16000` at most.
2. On `truncated=true`, stop if the seeds and top-ranked nodes already answer the question.
3. Otherwise narrow the request (`--scope`, `--seeds`, `--relations`, `--depth`).
4. When every result is needed (importers before a refactor, all callers before a deletion), rerun once with `--token-budget 16000`; page with `--cursor <nextCursor>` only if that is still truncated. Pages do not repeat nodes.
5. `--mode search` ranks the whole graph; never page it to the end.

`query_call_graph --tokenBudget=0` returns every caller in one call; with a budget, pass `nextOffset` as `--offset`. `get_impact_analysis` has no budget and returns the whole result.

`graph-it query "<question>"` (`--depth`, `--token-budget`, `--format text|json|toon`) answers in natural language using `ANTHROPIC_API_KEY` or `OPENAI_API_KEY` when set, falling back to keyword heuristics with a stderr warning. Treat its answer as a hypothesis and confirm with deterministic commands.

## Files and Symbols

```bash
graph-it summary --format toon                  # workspace overview
graph-it summary src/engine/turns.js --format toon       # per-file codemap: exports, internals, dependencies, dependents, call flow, cycles
graph-it explain src/engine/turns.js --format toon       # intra-file call hierarchy: entry points, call tree, internal cycles
graph-it trace src/main.js#mount --format toon           # call chain from <file>#<symbol>, relative or absolute path
graph-it path src/main.js --format toon                  # transitive imports from an entry file (--communities path|louvain)
graph-it path-in src/engine/turns.js --format toon       # who imports this file
graph-it check-dependencies src/engine/turns.js --format toon   # incoming and outgoing dependencies
graph-it cycles src/engine/turns.js --format toon        # confirmed dependency cycles for a file
graph-it check src/engine/turns.js --format toon         # unused exports of one file
```

## `graph-it tool <name>`

`graph-it tool <name>` invokes an analysis tool directly; `graph-it tool <name> --help` lists its parameters. Pass `--<param>=<value>` or `--<param> <value>`; arrays and objects are JSON; `--args '<json>'` passes the whole object. Path parameters accept absolute or workspace-relative paths. Available tools:

`graph_context`, `analyze_dependencies`, `crawl_dependency_graph`, `find_referencing_files`, `verify_dependency_usage`, `resolve_module_path`, `get_index_status`, `invalidate_files`, `rebuild_index`, `get_symbol_graph`, `find_unused_symbols`, `trace_function_execution`, `analyze_breaking_changes`, `get_impact_analysis`, `generate_codemap`, `query_call_graph`, `scan_dead_code`, `explore_architecture`, `check_architecture`.

```bash
graph-it tool analyze_dependencies --filePath=/abs/src/engine/turns.js --format toon
graph-it tool find_referencing_files --targetPath=/abs/src/engine/turns.js --format toon
graph-it tool verify_dependency_usage --sourceFile=/abs/src/state/runtime.svelte.js --targetFile=/abs/src/engine/turns.js --format toon
graph-it tool generate_codemap --filePath=/abs/src/engine/turns.js --format toon
graph-it tool query_call_graph --filePath=/abs/src/engine/turns.js --symbolName=fn --direction=callers --depth=1 --tokenBudget=2000 --format toon
graph-it tool get_impact_analysis --filePath=/abs/src/engine/turns.js --symbolName=fn --includeTransitive=true --maxDepth=3 --format toon
graph-it tool find_unused_symbols --filePath=/abs/src/engine/turns.js --format toon
graph-it tool scan_dead_code --scopePath=/abs/src --maxFiles=500 --format toon
graph-it tool analyze_breaking_changes --args '{"filePath":"/abs/src/engine/turns.js","symbolName":"fn","oldContent":"...","newContent":"..."}' --format toon
```

- `query_call_graph`: `--direction callers|callees|both` (default `both`), `--depth 1-10` (default `2`), `--includeTypeOnly=true` adds type-only `USES` edges, `--tokenBudget` (default `4000`, `0` = no limit) with `--offset <nextOffset>` paging. A bare name shared by several symbols returns `reason=ambiguous` with candidates; pick one with `--symbolId` or `--startLine`. Call sites are not all symbol references.
- `get_impact_analysis`: `--includeTransitive` (default `false`), `--maxDepth 1-20` (default `3`).
- `scan_dead_code` is workspace-wide (or `--scopePath`); `find_unused_symbols` is per-file; `graph-it check` takes a file, a folder, or nothing. All take `--minConfidence high|medium|low` (default `high`); `byConfidence` counts the rest. Manifest-declared exports (`package.json`) and Svelte component default exports are excluded; `--verbose` (`--verbose=true` for `scan_dead_code`) lists them as `excluded` with their `reason`.

## Architecture

```bash
graph-it architecture --level units --format toon              # top-level folders, layers, unit edges, cycles
graph-it architecture --groups --format toon                   # folder groups, groupEdges, totals
graph-it architecture --folder "(root)/src" --format toon      # one level below a unit or folder key
graph-it architecture --level units --matrix --format toon     # dependency structure matrix (--format csv for spreadsheet)
graph-it architecture --maxFiles 300 --format toon             # cap analyzed files
```

Step-by-step exploration: `graph-it tool explore_architecture` (summary), then `--group=<key>` (files and boundary), then `--from=<key> --to=<key>` (file pairs, paged by `--limit`/`--offset`). It returns TOON by default (`--response_format=toon|markdown|json`).

When `graphit.architecture.json` declares rules, `graph-it check-architecture --format toon` checks every static import. It exits 1 on an `error` violation absent from `graphit.architecture.baseline.json`. Key flags: `--update-baseline` accepts current violations; `--verbose` lists accepted ones; `--config`/`--baseline` select alternate files; `--format sarif` outputs code-scanning results.

If no rules file exists yet, `graph-it init` generates `graphit.architecture.json` from current imports (`allowOnly` per unit and `noCycles` for acyclic units) and prints a summary, dead files by unit, cycles, quick wins, hubs, and guard snippets. Use `--dry-run` to preview, `--output <dir>` to write `report.md` / SVGs / `index.html`, and `--focus <folder>` to limit output to a target and its direct neighbors. Existing configs or baselines are never overwritten without confirmation (pass `--yes` in non-interactive environments).

## Diagrams for Humans

```bash
graph-it diagram --format svg --rules --output tmp/architecture.svg
graph-it diagram --format diagram-spec --output -
```

`graph-it diagram` writes a static, script-free SVG or HTML file of the units, one folder (`--folder <key>` or a `[dir]` argument), or their matrix (`--view matrix`); `--theme light|dark` for SVG. `--rules` draws violations in red; `--baseline` draws accepted violations separately. `--output -` prints to stdout.

For a custom-styled diagram, pass the `diagram-spec` JSON (with `--rules`, `--folder <key>`) to a diagramming workflow. Runtime flows from `graph-it trace` are static analysis, not observed execution.

Mermaid for humans: `graph-it trace <file>#<symbol> --format mermaid`, `graph-it path <file> --format mermaid`, `graph-it architecture --groups --format mermaid`.

## Other Commands

```bash
graph-it wiki --output tmp/wiki --top 15     # markdown wiki from the call graph (--scope, --exclude, --force)
graph-it export src/engine --format html --output tmp/engine.html   # standalone HTML graph
graph-it stats                                # token stats (cl100k_base estimate)
```

## Review a Diff

`graph-it review-pr --base <ref>` indexes automatically (no `scan` first). Without `--head`, it compares the base with the working tree (staged and unstaged); `--head <ref>` compares two committed refs. Options: `--depth 1-10`, `--max-files` (default `200`), `--format toon|json|markdown|sarif`.

Read `risk`, `score`, `limitations`, and `isPartial` before any merge recommendation. `isPartial: true` means file, parser, or depth limits cut the result. An unchanged signature does **not** prove a behavioral change is safe. Follow the PR review and GitHub Actions gate references listed in `SKILL.md` for the full workflow.
