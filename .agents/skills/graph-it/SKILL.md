---
name: graph-it
description: >-
  Analyze JavaScript and Svelte 5 dependencies, call graphs, blast radius, dead code, PR diffs, and architecture using the graph-it CLI and graphitlive_* MCP tools. Use when answering "what calls this", "what breaks if I change X", scanning for unused exports or ghost files, mapping multi-file refactors, reviewing Git diffs, or touring the codebase. Do NOT use for ground-up architectural rebuilds or P4 purges without graph queries; use refactor instead.
---

# Graph-It

Dependency, call-graph, impact, dead-code, PR-review, and architecture analysis via `graph-it` CLI (`v1.25.3+`) and `graphitlive_*` MCP tools.

## 1. Top Invariants & Tool Routing

1. **Read Scar Tissue First**: Review [PITFALLS.md](./PITFALLS.md) before running scans, refactors, or PR reviews.
2. **CLI + MCP Discovery**: Prefer `graph-it` CLI; run `graph-it --version` and `graph-it tool --list` once per session if inventory is needed. Fall back to `graphitlive_*` MCP tools using their exact advertised schemas (`[PF-004]`).
3. **Output Format**: Pass `--format toon` for agent-read CLI output (`--detail compact --token-budget 2000..16000` on `context`). Use `json` for scripts, and `markdown` or `mermaid` for human-facing reports.
4. **Workspace Root**: Run from the repository root (`package.json`) so `.graph-it/` indexes the full workspace. If stderr warns that imports resolve outside the root, pass `-w <repoRoot>` (or `graphitlive_set_workspace`).
5. **On-Demand Indexing**: Every command restores `.graph-it/cache/` and re-analyzes changed files automatically. Never run `graph-it scan` before analysis or after edits (`[PF-001]`).

### RPGlitch Environment Profile

- **Stack**: JavaScript, Svelte 5, Node.js scripts (Vite 8, Vitest).
- **Alias Resolution**: Root `tsconfig.json` (`baseUrl` + `paths` matching `vite.config.js`) is required so bare `@alias` barrels resolve inside the graph (`[PF-005]`).
- **Architecture Gate**: Root `graphit.architecture.json` enforces the 12-rule disjoint 6-Rank DAG (`config` -> `rank0` -> `rank1` -> `rank2` isolated `@data`/`@media` -> `rank3` -> `rank4` -> `rank5-primitives`/`rank5-ui` -> `shell`) plus `no-test-suite-imports` (`[PF-010]`).
- **Dead-Code Wrapper**: Prefer `npm run audit:dead-code` for RPGlitch sweeps; it filters Svelte HTML template and `export *` barrel false positives (`[PF-006]`).
- **Repo Verification & P4 Policy**: Run `npm run verify` after edits. Remove replaced symbols cleanly with zero backwards-compatibility shims unless an external package boundary requires one.

| Task | First Step | Reference |
| --- | --- | --- |
| Known file or symbol (read/edit one place) | Read bounded line range directly (no graph call) | None |
| Command, tool, flag, or REPL lookup | Check syntax, defaults, exit codes, and tool params | [glossary.md](./references/glossary.md) |
| Locate code, explore architecture, diagrams, tour | `graph-it context "<question>" --mode search --detail compact --token-budget 2000 --format toon` | [explore-and-architecture.md](./references/explore-and-architecture.md) |
| Callers, importers, blast radius | `graph-it path-in`, `tool query_call_graph`, `tool get_impact_analysis` | [glossary.md](./references/glossary.md) |
| Layer-boundary architecture gate | `graph-it check-architecture --format toon` | [glossary.md](./references/glossary.md) |
| Multi-file refactor or PR / Git diff review | `graph-it context --mode refactor --depth 4` or `graph-it review-pr --base origin/main --format toon` | [change-safety.md](./references/change-safety.md) |
| Dead-code & ghost-file sweep | `npm run audit:dead-code` or `graph-it check src --unreferencedFiles` | [dead-code.md](./references/dead-code.md) |
| GitHub Actions CI gate setup & upkeep | Review `.github/workflows/ci.yml` `graph-review` job | [github-actions-gate.md](./references/github-actions-gate.md) |

## 2. One-Hop Reference Map

- [glossary.md](./references/glossary.md): All 25 CLI commands, 19 `graph-it tool` subcommands, global/shared flags, exit codes, MCP mappings, and human REPL shortcuts.
- [explore-and-architecture.md](./references/explore-and-architecture.md): `context` token-budget strategy, progressive architecture exploration, diagram/Mermaid output, cycle checks, and codebase tour template.
- [change-safety.md](./references/change-safety.md): Shared impact/barrel/completeness contract, three-phase multi-file refactor protocol, and PR/diff risk review workflow.
- [dead-code.md](./references/dead-code.md): Ghost-file and unused-symbol audit workflow, confidence tiers, Svelte verification steps, and deletion plan template.
- [github-actions-gate.md](./references/github-actions-gate.md): RPGlitch `ci.yml` `graph-it-review-gate` reference, SHA-pinning, Dependabot maintenance, and SARIF code scanning.

## 3. Core CLI Commands

```bash
graph-it context "<question>" --mode search --scope 'src/**' --detail compact --token-budget 2000 --format toon
graph-it path-in src/engine/runner.js --format toon
graph-it tool query_call_graph --filePath=src/engine/runner.js --symbolName=run_turn --direction=callers --depth=1 --format toon
graph-it tool get_impact_analysis --filePath=src/engine/runner.js --symbolName=run_turn --includeTransitive=true --format toon
graph-it check-architecture --format toon
graph-it review-pr --base origin/main --format toon
```

## 4. Bright-Line Rules

- **Never** guess a CLI flag, flag casing, or MCP parameter; check [glossary.md](./references/glossary.md) or `graph-it tool <name> --help` (`[PF-004]`, `[PF-008]`).
- **Never** treat `query_call_graph` callers alone as proof a symbol is unused, or treat static evidence as proof of runtime behavior (`[PF-002]`).
- **Never** plan on `truncated=true` results, or mark a review complete when `isPartial=true` or `limitations` is non-empty without reporting the partial scope and the manual check that closes each gap (`[PF-003]`).
