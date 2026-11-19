# Change Safety: Multi-File Refactors & PR Diff Reviews

Read on demand from `graph-it-live` when planning multi-file refactors, changing exported signatures, moving/renaming symbols, fixing cross-module regressions, or reviewing a Git diff / PR. For ground-up architectural rebuilds and P4 purges without graph queries, pair with the global `refactor` skill.

## Shared Evidence Contract

Both refactors and diff reviews obey these five gates:

1. **Completeness Gate (`[PF-003]`)**: Never plan on `truncated=true` (rerun with `--token-budget 16000` and page via `--cursor`). Never mark a review or refactor complete when `isPartial=true` or `limitations` is non-empty without reporting the partial scope and the manual check closing each gap.
2. **Barrel & Reference Blind Spots (`[PF-002]`, `[PF-006]`)**: `get_impact_analysis`, `query_call_graph`, and `review-pr` do not traverse barrel re-exports (`src/*/index.js`) automatically, and Svelte HTML template usages are conservative. When `path-in` shows a barrel importer, inspect `graph-it path-in <barrel>` and verify actual symbol usage with `verify_dependency_usage` or a source search.
3. **Architecture Parity**: RPGlitch's root `graphit.architecture.json` enforces the 6-Rank DAG, `no-test-suite-imports`, and `no-rank-folder-cycles`. `review-pr` automatically appends an `architecture` delta (`verdict`, `newViolations`, `resolvedViolations`, `unitCycles`, `configChange`). Any `newErrors > 0` blocks merge; any `configChange` weakening a rule or adding baseline entries requires explicit justification.
4. **Signature Safety**: Treat any `breakingChanges` entry with severity `error` as a blocker even when top-level `risk` is `low`. Conversely, an unchanged signature never proves a behavioral change is safe.
5. **Repo Gate**: Run `npm run verify` (lint, audit, tests) after edits and report any check skipped or failed.

### `review-pr` Risk Matrix

| Risk       | Meaning                                               | Action                                                     |
| ---------- | ----------------------------------------------------- | ---------------------------------------------------------- |
| `low`      | No high-scoring static concern                        | Review behavior and tests normally                         |
| `medium`   | Changed symbols and direct dependents need inspection | Request targeted validation for unresolved impact          |
| `high`     | Breaking or broad-impact evidence                     | Block until compatibility, callers, and tests are resolved |
| `critical` | Highest static risk                                   | Block; require explicit mitigation and verification        |

---

## Workflow A: Multi-File Refactor (`Map -> Edit -> Verify`)

No edits before the plan; no completion claim before verification.

### Phase 1: Map (Read-Only)

Do not edit source, run formatters, or invoke package managers during Phase 1.

1. Run one bounded refactor query per target symbol (`--depth 4` reaches consumers behind barrels):

   ```bash
   graph-it context --mode refactor --seeds 'src/engine/runner.js#run_turn' --depth 4 --detail compact --token-budget 4000 --format toon
   ```

   If indexing fails or `fresh=false`, stop and report. If `truncated=true`, rerun at `--token-budget 16000` and page.

2. Query full transitive impact and callers for exported or high fan-in symbols:

   ```bash
   graph-it tool get_impact_analysis --filePath=src/engine/runner.js --symbolName=run_turn --includeTransitive=true --format toon
   graph-it tool query_call_graph --filePath=src/engine/runner.js --symbolName=run_turn --direction=callers --depth=2 --tokenBudget=0 --format toon
   ```

3. For file moves, deletions, or rank changes, record the pre-edit baseline:

   ```bash
   graph-it check-architecture --format toon
   graph-it cycles src/engine/runner.js --format toon
   ```

4. Identify covering tests (`*.test.js`). If none exist, plan a characterization test for Phase 2.
5. Present the sealed plan before editing: target files, impacted importers/callers/tests/exports, barrel checks, architecture baseline, tests to add/update, and explicit static-analysis gaps (dynamic dispatch, reflection, generated code, Svelte templates). If required evidence is missing, stop and report rather than substituting `rg`.

### Phase 2: Edit (Sealed Scope)

1. Write or update the characterization/failing test first when behavior changes or no test exists. Pure renames/moves keep existing tests and update imports.
2. Apply the primary change, then update every planned importer, caller, test, and export.
3. Touch only planned files (plus tests/generated metadata required to validate). If an unplanned impacted file surfaces, return to Phase 1 for that symbol and amend the plan.
4. Follow RPGlitch P4 Zero Backwards Compatibility: delete old symbols cleanly and update all downstream consumers in scope instead of leaving compatibility aliases or shims.

### Phase 3: Verify

Run in order; fix and rerun on any failure:

```bash
graph-it review-pr --base HEAD --format toon
graph-it check-architecture --format toon
npm run verify
```

Use `--base <branch>` when changes are already committed. `check-architecture` violations must not exceed the Phase 1 baseline; never weaken a rule to pass.

### Refactor Red Flags (Stop and Return to Phase 1)

- Assuming a rename is trivial or planning to fix imports after moving files.
- Treating `rg` or `query_call_graph` callers alone as complete importer proof.
- Editing first and running `graph-it` afterward to justify the diff.

---

## Workflow B: PR & Local Diff Risk Review

For GitHub Actions CI gate setup and upkeep, see [github-actions-gate.md](./github-actions-gate.md).

### 1. Analyze the Diff

Fetch the base ref first. `review-pr` indexes changed files automatically:

```bash
# Uncommitted working tree (staged + unstaged) vs. base
graph-it review-pr --base origin/main --format toon

# Two committed refs (untracked files excluded)
graph-it review-pr --base origin/main --head feature/my-change --depth 3 --max-files 200 --format toon
```

### 2. Inspect High-Risk Findings

Read changed hunks and flagged files directly (bounded), then inspect transitive impact for any high-risk symbol:

```bash
graph-it tool get_impact_analysis --filePath=src/engine/runner.js --symbolName=run_turn --includeTransitive=true --format toon
graph-it tool query_call_graph --filePath=src/engine/runner.js --symbolName=run_turn --direction=callers --depth=1 --tokenBudget=0 --format toon
graph-it summary src/engine/runner.js --format toon
```

Check the test candidates returned by `review-pr`. Missing test candidates mean manual test selection is required.

### 3. Required Review Output Structure

- **Verdict**: approve, approve with follow-ups, or changes requested (state whether analysis was partial).
- **Blocking findings**: risk level, file/symbol, command evidence, requested fix.
- **Non-blocking findings**: risk level, evidence, follow-up.
- **Test assessment**: existing candidates, missing coverage, required checks.
- **Limitations**: every reported limitation and the manual check that closes it.
