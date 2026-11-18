# PR & Git Diff Risk Review

Read on demand from `graph-it-live` when reviewing a pull request, inspecting a local diff, or assessing merge risk. For setting up the GitHub Actions CI gate, use the `github-actions-gate.md` reference listed in `SKILL.md`.

## 1. Analyze the Diff

Fetch the base ref first. `review-pr` indexes changed files automatically:

```bash
graph-it review-pr --base origin/main --format toon
graph-it review-pr --base origin/main --head feature/my-change --depth 3 --max-files 200 --format toon
```

- `--base` is required. Omit `--head` to review the uncommitted working tree (staged + unstaged).
- With `--head <ref>`, both sides are committed refs and untracked files are excluded.
- `--depth` limits transitive dependent traversal (`1–10`); `--max-files` caps changed files (default `200`).
- RPGlitch's root `graphit.architecture.json` (which mirrors `local-scripts/scripts/rules/layers.js`) adds an `architecture` section to `review-pr` (`verdict`, `newViolations`, `resolvedViolations`, `unitCycles`, `configChange`). Any `newErrors > 0` blocks merge; any `configChange` weakening a rule or accepting new baseline violations must be justified.

## 2. Interpret Evidence

| Risk       | Meaning                                       | Action                                                      |
| ---------- | --------------------------------------------- | ----------------------------------------------------------- |
| `low`      | No high-scoring static concern                | Review behavior and tests normally                          |
| `medium`   | Inspect changed symbols and direct dependents | Request targeted validation for unresolved impact           |
| `high`     | Breaking or broad-impact evidence             | Block until compatibility, callers, and tests are addressed |
| `critical` | Highest static risk                           | Block; require explicit mitigation and verification         |

Never mark a review complete when `isPartial` is `true` or `limitations` is non-empty (unsupported file types, binaries/symlinks/`>2 MiB`, parser errors, file limits, or depth caps) without reporting the partial scope and listing the manual check that closes each gap.

## 3. Inspect Transitive Impact for High-Risk Findings

Read changed hunks and flagged files directly (bounded), and inspect transitive impact for high-risk symbols:

```bash
graph-it tool get_impact_analysis --filePath=/abs/src/engine/runner.js --symbolName=run_turn --format toon
graph-it tool query_call_graph --filePath=/abs/src/engine/runner.js --symbolName=run_turn --direction=callers --depth=1 --format toon
graph-it tool query_call_graph --filePath=/abs/src/engine/runner.js --symbolName=run_turn --depth=3 --format toon
graph-it tool generate_codemap --filePath=/abs/src/engine/runner.js --format toon
```

Inspect the test candidates reported by `review-pr`. Missing test candidates mean manual test selection is required.

## 4. Required Output Structure

1. **Verdict**: `approve`, `approve with follow-ups`, or `changes requested` (state whether analysis was partial).
2. **Blocking findings**: risk, file/symbol, command evidence, requested fix.
3. **Non-blocking findings**: risk, evidence, follow-up.
4. **Test assessment**: existing candidates, missing coverage, required checks.
5. **Limitations**: each limitation and the manual check that closes it.
