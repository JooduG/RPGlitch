# Dead Code & Ghost File Sweep

Read on demand from `graph-it-live` when auditing for unreferenced files, orphan exports, or internal-only exports to produce a ranked deletion plan.

## Step 1: Baseline & Sweep

Take a quick unit baseline if working in an unfamiliar area (`graph-it architecture --level units --format toon`). For RPGlitch symbol sweeps, prefer the repo wrapper first:

```bash
npm run audit:dead-code
```

It runs `graph-it tool scan_dead_code --format json` and filters Svelte HTML template / `export *` barrel false positives (`[PF-006]`) using comment-stripped source checks across `src/**/*.{js,svelte}`, splitting findings into **Truly Unreferenced** vs. **Internal-Only Exports**.

For unreferenced whole files (lowest-effort deletions first), lower-confidence sweeps, or single-file checks:

```bash
# Unreferenced whole files (defaults --minConfidence to low; emits cascade/via and exclusive tests)
graph-it check src --unreferencedFiles --verbose --format toon
graph-it check src --unreferencedFiles --format markdown

# Symbol scans at lower confidence or scoped to one file/folder
graph-it check src/utils/format.js --format toon
graph-it check src --minConfidence low --format toon
```

### Confidence Tiers & Exclusions

| Mode / Confidence | Reasons | Action |
| --- | --- | --- |
| Exports `high` (default) | Imported file, no use of the export found (`importers-use-other-exports`) | Primary deletion candidate; confirm in Step 2 |
| Exports `medium` | `test-only-use`, computed/dynamic import, decorator, name repeated in own file, or test file | Review; never delete without Step 2 evidence |
| Exports `low` | `no-importer` (entry point, script, or config) | Review only |
| `--unreferencedFiles` `low` (default) | `no-importer`: no production file imports the file | Ghost-file candidate; verify entry/script use |
| `--unreferencedFiles` `medium` | `test-only-use`: only test files import it | Candidate to delete together with its exclusive tests |
| `--unreferencedFiles` `cascade` | Imported only by dead files and tests (`via` lists dead importers) | Delete after or together with files in `via` |

Auto-excluded items (printed under `excluded` with `reason` when `--verbose` is passed): manifest entry points (`package.json`), framework default exports and routes, `import.meta.glob` targets, files named by path in CI/Makefile/scripts, test files (`*.test.js`), `.d.ts`, `*.config.*`, and `.gitignore`/`.graphitignore` entries. Unlisted lower-confidence items are counted in `byConfidence`. Delete unreferenced barrels (`index.js`) first, then rescan. Methods and nested functions are not scanned.

## Step 2: Confirm Candidates (Eliminate False Positives)

Static analysis misses dynamic dispatch (`obj[key]()`), string lookups, and Svelte HTML template expressions behind `export *` barrels (`[PF-006]`). Also note one limit of `npm run audit:dead-code`: comment stripping does not strip string literals, so a dead symbol name appearing inside a UI string or log message can look active.

Confirm each high-value candidate with both graph checks and source inspection:

```bash
graph-it tool get_impact_analysis --filePath=src/engine/runner.js --symbolName=run_turn --format toon
graph-it path-in src/engine/runner.js --format toon
```

Decision rules:

- **Zero `query_call_graph` callers alone**: unconfirmed; never delete on call-site count alone (`[PF-002]`).
- **Hit in `.svelte` template or `.js` code (outside comments)**: active (false positive); retain.
- **2+ code hits inside defining file, 0 outside**: internal-only export; safe to remove the `export` keyword.
- **1 code hit inside defining file (declaration only), 0 outside**: truly unreferenced deletion candidate.
- **Missing or partial analysis**: mark `Unconfirmed`; keep out of deletion batches.

## Step 3: Risk Classification

| Risk Level                | Criteria                                               | Action                                          |
| ------------------------- | ------------------------------------------------------ | ----------------------------------------------- |
| Candidate for safe review | 0 incoming refs; not a public API or entry point       | Review manually before deletion                 |
| Possible ghost file       | Unreferenced file, not an entry point or script target | Review contents and delete with exclusive tests |
| Cascade dead file         | Only imported by confirmed dead files (`via`)          | Delete after or alongside `via` files           |
| Internal-only export      | Used locally in defining file only (2+ local hits)     | Drop `export` keyword                           |
| Review first (barrel)     | Re-exported from `index.js`                            | Inspect barrel consumers via `path-in`          |
| Test-only                 | Only imported/called by `*.test.js`                    | Decide whether test coverage is obsolete        |
| Unconfirmed               | Only call sites checked or partial scan                | Do not recommend deletion                       |
| Do not delete             | Dynamic dispatch (`eval`, bracket lookup)              | Flag only                                       |

### Deletion Plan Report Template

```markdown
## Dead Code Scan Report

**Scanned**: `<N>` files | **Candidates**: `<M>` symbols + `<K>` ghost files

### Possible Ghost Files (Confirmation Required)

| File                         | Last Modified | Reason / Exclusive Tests                                          |
| ---------------------------- | ------------- | ----------------------------------------------------------------- |
| `src/utils/legacy-helper.js` | YYYY-MM-DD    | `no-importer`; exclusive tests: `src/utils/legacy-helper.test.js` |

### Truly Unreferenced Symbols

| Symbol             | File                  | Kind     | Reference Evidence                                  |
| ------------------ | --------------------- | -------- | --------------------------------------------------- |
| `formatLegacyText` | `src/utils/format.js` | function | 0 incoming refs; 0 impact dependents; 0 Svelte hits |

### Internal-Only Exports (Drop `export`)

| Symbol             | File                   | Local Hits |
| ------------------ | ---------------------- | ---------- |
| `buildInternalMap` | `src/engine/runner.js` | 3          |

### Barrel & Test-Only Items (Review First)

| Symbol / File     | Location             | Category      | Note                    |
| ----------------- | -------------------- | ------------- | ----------------------- |
| `createReport`    | `src/utils/index.js` | Barrel export | Verify barrel consumers |
| `mockEngineState` | `src/engine/mock.js` | Test-only     | 3 test files            |

### Recommended Deletion Order

1. Complete any missing incoming-reference checks; exclude `Unconfirmed` items.
2. Delete confirmed ghost files, cascade files, and their exclusive test suites.
3. Drop `export` on internal-only exports and remove truly unreferenced symbols (plus JSDoc and newly orphaned imports).
4. Run `npm run verify` after each small batch.
```
