# Dead Code & Ghost File Sweep

Read on demand from `graph-it-live` when scanning for orphan symbols or unreferenced files to build a ranked deletion plan.

## Step 1 — Baseline

For unfamiliar or multi-section areas, take a unit-level baseline first:

```bash
graph-it architecture --level units --format toon
```

## Step 2 — Run the Scan

List unreferenced whole files first (lowest-effort deletions), then scan symbol exports:

```bash
graph-it tool scan_dead_code --unreferencedFiles=true --verbose=true --format toon
graph-it check src --unreferencedFiles --format markdown   # human-readable table
graph-it tool scan_dead_code --scopePath=/abs/src --maxFiles=500 --format toon
graph-it tool scan_dead_code --minConfidence=low --format toon
```

For a single file:

```bash
graph-it check src/utils/format.js --format toon
```

### Confidence Levels

| Confidence | Reasons | Plan Action |
| --- | --- | --- |
| `high` | `importers-use-other-exports` | Deletion candidate; confirm in Step 3 |
| `medium` | `test-only-use`, `dynamic-import-in-workspace`, `named-in-own-file`, `convention:generated` | Review; never delete without Step 3 evidence |
| `low` | `no-importer` | Often a script or entry point; review only |
| `low` / `medium` | `cascade` (only dead files and tests import it; `via` lists dead importers) | Delete after or together with files in `via` |

Excluded automatically (`--verbose=true` lists reasons): declared `package.json` entry points, Svelte component default exports, test files (`*.test.js`), Vite bundler entries (`import.meta.glob`, HTML entries), tool configs (`vite.config.*`), and files ignored by `.gitignore`. Delete unreferenced barrels (`index.js`) first, then rescan. Methods and nested functions are not scanned.

## Step 3 — Confirm Candidates (Avoid False Positives)

Static analysis misses dynamic dispatch (`obj[methodName]()`) and dynamic imports. Confirm each candidate with both incoming-reference and impact checks:

```bash
graph-it tool get_impact_analysis --filePath=/abs/src/engine/runner.js --symbolName=run_turn --format toon
graph-it tool find_referencing_files --targetPath=/abs/src/engine/runner.js --format toon
```

- **Zero `query_call_graph` callers alone** → unconfirmed; never delete on call-site count alone.
- **Incoming references found** → retain or classify as `test-only`.
- **Missing/partial check** → mark `Unconfirmed`; do not recommend deletion.
- **No incoming references confirmed** → candidate for manual safety review.

## Step 4 — Risk Classification

| Risk Level                    | Criteria                                                        | Action                                |
| ----------------------------- | --------------------------------------------------------------- | ------------------------------------- |
| **Candidate for safe review** | No incoming references; not a public API or entry point         | Review manually before deletion       |
| **Possible ghost file**       | No incoming file references and not an entry point              | Review contents and script/config use |
| **Unconfirmed**               | Only call sites checked, or partial/unsupported analysis        | Do not recommend deletion             |
| **Review first**              | Exported from a barrel (`index.js`)                             | Check barrel consumers                |
| **Do not delete**             | Dynamic dispatch (`eval`, string lookup)                        | Flag only                             |
| **Test-only**                 | Only called from tests (`test-only-use`)                        | Evaluate if intentional               |
| **Test-only file**            | `unreferencedFiles` at `medium`; only `testImporters` import it | Delete with its test files            |

## Deletion Plan Report Template

```markdown
## Dead Code Scan Report

**Scanned**: `<N>` files | **Candidates found**: `<M>` symbols + `<K>` ghost files

### Possible Ghost Files (confirmation required)

| File                         | Last modified | Reason                                                               |
| ---------------------------- | ------------- | -------------------------------------------------------------------- |
| `src/utils/legacy-helper.js` | YYYY-MM-DD    | No incoming file references; entry-point and script checks completed |

### Symbol Candidates — Manual Review

| Symbol             | File                  | Kind     | Reference evidence                   |
| ------------------ | --------------------- | -------- | ------------------------------------ |
| `formatLegacyText` | `src/utils/format.js` | function | 0 incoming refs; 0 impact dependents |

### Orphan Symbols — Review First

| Symbol         | File                 | Risk          | Note                   |
| -------------- | -------------------- | ------------- | ---------------------- |
| `createReport` | `src/utils/index.js` | Barrel export | Check barrel consumers |

### Test-Only Symbols

| Symbol            | File                 | Test callers |
| ----------------- | -------------------- | ------------ |
| `mockEngineState` | `src/engine/mock.js` | 3 test files |

### Recommended Deletion Order

1. Complete any missing incoming-reference checks; keep unconfirmed items out of deletion batches.
2. Delete confirmed ghost files and test-only files with their test suites.
3. Remove unused exports (along with their JSDoc comments and newly orphaned imports).
4. Run `npm run verify` and tests after each small commit batch.
```
