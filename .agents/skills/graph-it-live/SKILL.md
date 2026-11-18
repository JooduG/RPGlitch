---
name: graph-it-live
description: >-
  Analyze JavaScript and Svelte 5 dependencies, call graphs, blast radius, dead code, PR diffs, and architecture using the graph-it CLI and graphitlive_* MCP tools. Use when answering "what calls this", "what breaks if I change X", scanning for unused exports or ghost files, mapping multi-file refactors, reviewing Git diffs, or touring the codebase. Do NOT use for ground-up architectural rebuilds or P4 purges without graph queries — use refactor instead.
---

# Graph-It-Live

Dependency, call-graph, impact, dead-code, PR-review, and architecture analysis for RPGlitch (JavaScript, Svelte 5, Node.js scripts) via `graph-it` CLI and `graphitlive_*` MCP tools.

## 1. Top Invariants & Tool Routing

1. **Read Scar Tissue First**: Review [PITFALLS.md](./PITFALLS.md) before running scans, refactors, or PR reviews.
2. **CLI + MCP Discovery**: Prefer `graph-it` CLI (`v1.25.3+` installed); run `graph-it --version` and `graph-it tool --list` once per session if inventory is needed. Fall back to `graphitlive_*` MCP tools using their exact advertised schemas.
3. **Output Format**: Pass `--format toon` for agent-read CLI output (`--detail compact --token-budget 2000..16000` on `context`). Use `json` only for scripts, and `markdown` or `mermaid` only for human-facing reports.
4. **Workspace Root**: Run from the repository root (`package.json`) so `.graph-it/` indexes the full workspace. If stderr warns that imports resolve outside the root, pass `-w <repoRoot>` (or `graphitlive_set_workspace`).
5. **No Pre-Scan**: Every command indexes on demand and re-analyzes changed files automatically. Never run `graph-it scan` before analysis or after edits.

| Task | First Step | Workflow Reference |
| --- | --- | --- |
| Known file or symbol (read/edit one place) | Read bounded line range directly (no graph call) | — |
| Locate code by concept | `graph-it context "<question>" --mode search --detail compact --token-budget 2000 --format toon` | [commands.md](./references/commands.md) |
| Callers, importers, blast radius | `graph-it path-in`, `tool query_call_graph`, `tool get_impact_analysis` | [commands.md](./references/commands.md) |
| Layer-boundary architecture gate | `graph-it check-architecture --format toon` (`graphit.architecture.json`) | [commands.md](./references/commands.md) |
| Dead-code & ghost-file sweep | `tool scan_dead_code` + per-file confirmation | [dead-code.md](./references/dead-code.md) |
| Multi-file refactor (map -> edit -> verify) | `graph-it context --mode refactor --depth 4` | [refactor.md](./references/refactor.md) |
| PR / Git diff risk review | `graph-it review-pr --base origin/main --format toon` | [pr-review.md](./references/pr-review.md) |
| Codebase onboarding tour | `graph-it architecture`, `explain`, `tool generate_codemap`, `trace` | [onboarding.md](./references/onboarding.md) |

## 2. One-Hop Reference Map

- [commands.md](./references/commands.md): CLI flags, `context` modes, `tool` parameters, architecture checks, and `diagram`.
- [dead-code.md](./references/dead-code.md): Ranked dead-code and ghost-file deletion plan workflow and report template.
- [refactor.md](./references/refactor.md): Three-phase graph-mapped refactor protocol (`map -> edit -> verify`). Pair with global `refactor` for P4 ground-up rebuilds.
- [pr-review.md](./references/pr-review.md): Local diff and PR risk review workflow.
- [github-actions-gate.md](./references/github-actions-gate.md): SHA-pinned `graph-it-review-gate` CI workflow setup.
- [onboarding.md](./references/onboarding.md): Structured codebase tour (entry points, business logic, complexity, Mermaid trace) and report template.

## 3. Core CLI Commands

```bash
graph-it path-in src/engine/turns.js --format toon
graph-it context "<question>" --mode search --detail compact --token-budget 2000 --format toon
graph-it context --mode impact --seeds 'src/engine/turns.js#fn' --depth 3 --detail compact --token-budget 4000 --format toon
graph-it summary src/engine/turns.js --format toon
graph-it tool query_call_graph --filePath=/abs/src/engine/turns.js --symbolName=fn --direction=callers --depth=1 --format toon
graph-it tool get_impact_analysis --filePath=/abs/src/engine/turns.js --symbolName=fn --includeTransitive=true --format toon
graph-it trace src/main.js#mount --format toon
graph-it architecture --level units --format toon
graph-it cycles src/engine/turns.js --format toon
graph-it check src/engine/turns.js --format toon
graph-it review-pr --base origin/main --format toon
```

## 4. Bright-Line Rules

- **Never** guess a CLI flag or MCP parameter; check `graph-it tool <name> --help` or the MCP tool schema.
- **Never** treat `query_call_graph` callers alone as proof a symbol is unused, or treat static evidence as proof of runtime behavior.
- **Never** plan on `truncated=true` results, or mark a review complete when `isPartial=true` or `limitations` is non-empty without reporting the partial scope and the manual check that closes each gap.
