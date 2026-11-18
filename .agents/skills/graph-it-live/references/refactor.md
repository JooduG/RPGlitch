# Graph-Mapped Multi-File Refactor

Read on demand from `graph-it-live` when refactoring multiple files, changing exported signatures, moving/renaming symbols, or fixing cross-module regressions. For ground-up architectural rebuilds and P4 Zero Backwards-Compatibility purges, pair with the global `refactor` skill.

Three phases: **Map (read-only) → Edit (sealed scope) → Verify**. No edits before the plan; no "done" before verification.

## Phase 1: Map (Read-Only)

Do not edit source, run formatters/codemods, or invoke package managers.

1. Run one bounded refactor query per target symbol (`--depth 4` catches consumers behind barrels/re-exports):

```bash
graph-it context --mode refactor --seeds 'src/engine/turns.js#symbol' --depth 4 --detail compact --token-budget 4000 --format toon
```

If `truncated=true`, rerun once with `--token-budget 16000` and page with `--cursor <nextCursor>` if still truncated. Never plan on a truncated list. If indexing fails or `fresh=false`, stop and report.

2. Query transitive impact and callers for exported or high fan-in symbols:

```bash
graph-it tool get_impact_analysis --filePath=/abs/src/engine/turns.js --symbolName=symbol --includeTransitive=true --format toon
graph-it tool query_call_graph --filePath=/abs/src/engine/turns.js --symbolName=symbol --direction=callers --depth=2 --format toon
```

3. For moves, deletions, or layer changes, record the baseline against RPGlitch's root `graphit.architecture.json` (which mirrors `local-scripts/scripts/rules/layers.js`) before editing:

```bash
graph-it cycles <file> --format toon
graph-it check-architecture --format toon
```

4. Identify covering tests from step 1 (`tests/`, `*.test.*`, `*.spec.*`). If none exist, plan to write a characterization test in Phase 2.

### Evidence Rules

- **Barrels**: `get_impact_analysis`, `query_call_graph`, and `review-pr` do not traverse barrel re-exports automatically. If an importer only re-exports (`path-in` lists `export`), run `graph-it path-in <barrel>` and inspect each consumer.
- **Usage vs. import**: Callers do not prove all importers; importing a file does not prove symbol usage. Use `verify_dependency_usage` when a file imports a module but may not use the symbol.
- **Gaps**: Report dynamic dispatch, reflection, generated code, type-only references, public API surfaces, unsupported languages, or `isPartial`/`truncated`. If required evidence is missing, stop and report; do not substitute `rg`.

Present the plan before editing: target files, impacted importers/callers/tests/exports, cycles, architecture baseline, tests to add/update, and gaps.

## Phase 2: Edit (Sealed Scope)

1. Write or update the characterization/failing test first when behavior changes or no test exists. Pure renames/moves keep existing tests and update their imports.
2. Apply the primary change, then update every planned importer, caller, test, and export.
3. Touch only planned files (plus tests/generated metadata required to validate). If a new impacted file surfaces mid-edit, return to Phase 1 for that symbol and amend the plan.
4. Do not leave compatibility aliases or shims behind (per RPGlitch P4 Zero Backwards Compatibility); update all downstream consumers in the planned scope unless an external published package boundary requires a deprecation window.

## Phase 3: Verify

Run in order; fix and rerun on any failure:

```bash
graph-it review-pr --base HEAD --format toon
graph-it check-architecture --format toon
```

- Treat any `breakingChanges` entry with severity `error` in `review-pr` as a blocker even if top-level `risk` is `low`. Use `--base <branch>` when changes are already committed.
- `check-architecture` violations must not exceed the Phase 1 baseline; never weaken a rule to pass.
- Run the project's formatter, typecheck, lint, and selected/new tests. Report any command that failed or was not run, and state what the tests do and do not cover.
- Never mark complete when `isPartial` is `true` or `limitations` is non-empty without listing the manual check that closes each gap.

## Red Flags (Stop and Return to Phase 1)

- _"It's only a rename"_ / _"references are obvious"_ / _"I'll fix imports after moving."_
- _"`rg` found them all"_ or _"callers prove every importer."_
- Editing first, then running `graph-it` afterward to justify the diff.
