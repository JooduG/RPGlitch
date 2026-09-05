# RPGlitch / gemini — Identified Areas of Improvement

Analysis of RPGlitch head `35ac7094` (2026-09-05) and the global `JooduG/gemini` config head `e482c770`, against the previous RPGlitch main `6895ab14`.

Scope: `.agents/` hook system, GEMINI.md / skills docs, `.github/workflows/ci.yml`, and the gemini global workflow/skill config. The `src/` delta was verified small and safe (only `interface.svelte.js` + `audio.svelte.js` behaviorally changed — `DatabaseClosedError` guard — plus test-noise cleanup); the deployed vault in `index.html` matches this build.

---

## A. RPGlitch hooks system (`.agents/hooks.json` + `.agents/skills/local-scripts/scripts/hooks.js`)

### A1. Circuit-breaker false positives (`.agents/hooks.json` → `circuit-breaker`)

**Problem:** the breaker's matcher is `.*` (fires on every tool result) and the `has_error` regex is `/error|failed|exception|rejection|command failed/i`, excluding only the strings `"0 errors"` / `"errors: 0"`. Any tool call that _reads code containing the word "error"_ — e.g. grepping for `error` handlers, reading `src/platform/security.js` — is classified as a failure. Three consecutive such "failures" force an unrequested `waldzell-metacognitive-monitoring` session.
**Fix:** key detection off real failure signals (non-zero exit codes, actual tool-level errors), not the presence of the substring "error" in content. Read-targeted tools should never trip the breaker.

### A2. `sequential-thinking-gate` can hard-lock a turn

**Problem:** any multi-file edit in a single turn — or a _second_ edit to the same `src/` file — is **denied** until `sequentialthinking_tools` is called. If the `mcp-sequentialthinking-tools` MCP server isn't installed in the environment, the agent is blocked with no graceful fallback. Denying (rather than `ask`/`feedback`) is aggressive for a per-edit gate.
**Fix:** fall back to `feedback`/`ask` when the MCP is unavailable; consider `ask` instead of hard `deny` for the "second edit to same file" case.

### A3. Performance: O(transcript) scans on every tool call

**Problem:** both the thinking-gate and the circuit-breaker parse the _entire_ JSON-lines transcript on every `PreToolUse`/`PostToolUse`. Cost grows linearly with session length.
**Fix:** slice the transcript (e.g. only the tail) or scan on `Stop`/milestones instead of every tool invocation.

### A4. `STATE_FILE` path bug (`hooks.js`)

**Problem:** `path.resolve("tmp/.tool-failures.json")` resolves against the CWD, which is `.agents/`, so the state file actually lands in `.agents/tmp/` — not the documented `tmp/`. It's self-consistent and gitignored (`**/tmp/**`) so there's no pollution, but it contradicts the SKILL.md's stated location.
**Fix:** resolve from the workspace root (`payload.workspacePaths?.[0] ?? "."` + `tmp/...`) or use an explicit repo-root resolver.

### A5. `file-architecture-gate` only intercepts `write_to_file`

**Problem:** `replace_file_content` and `multi_replace_file_content` bypass the header/changelog law — precisely the tools the thinking-gate _does_ target. Inconsistent coverage.
**Fix:** add both matchers to the gate.

### A6. `waldzell-router` always emits overwrite; assumes MCP servers exist

**Problem:** the overwrite decision uses a reference-inequality check (`inner_args !== tool_args.Arguments`) which is effectively always true, so the router always routes to the _overwrite_ branch. It also assumes ~8 MCP servers are installed; a missing server feeds the circuit-breaker.
**Fix:** deep-equality compare the arguments; document the required server set (or probe for it) instead of assuming.

### A7. Hook-count drift

**Problem:** docs disagree — `config/global_workflows/00-startup.md` says "9/9 passing" while `local-scripts/SKILL.md` says "10 Antigravity lifecycle hooks".
**Fix:** reconcile and verify against `test:hooks`.

---

## B. RPGlitch misc / docs

### B1. Non-portable absolute paths

**Problem:** `file:///c:/Users/johng/...` paths are hardcoded in:

- `GEMINI.md` (Memory Protocol section → `C:\Users\johng\.gemini\config\skills\developer-database\SKILL.md`)
- `.agents/skills/simulation/SKILL.md` (codebase map → `file:///c:/Users/johng/source/repos/RPGlitch/...`)
- `.agents/skills/perchance-deployment/SKILL.md`

This contradicts `GEMINI.md`'s own "Always use relative paths" rule and breaks on any other machine.
**Fix:** relative links everywhere.

### B2. Stale reference: `tasks/FUTURE.md`

**Problem:** `GEMINI.md` still references `tasks/FUTURE.md`, which was renamed to `tasks/future/<track>.md`. The `archive` example also uses `C:\Users\johng\.gemini\...`.
**Fix:** point at the new `tasks/future/` layout; make the archive example repo-relative.

---

## C. gemini global repo (`JooduG/gemini`, head `e482c770`)

### C1. `00-startup.md` architecture map references 8 non-existent files

**Problem:** Phase-3 maps these files, none of which exist in RPGlitch: `src/state/app.svelte.js` (app state actually lives in `interface.svelte.js`), `intelligence/kernel.js`, `prompts.js`, `context.svelte.js`, `temporal.js`, `media/optics.js`, `sound.js`, `voice.js`. The real tree uses `director.js`, `story-pipeline.js`, `temporal-pipeline.js`, `physics.js`, `parser.js`, `audio.svelte.js`, `speech.js`.
**Fix:** sync the map to the actual tree, or — better — remove the project-specific map from the _global_ startup flow (see C2).

### C2. "Global" repo embeds RPGlitch specifics

**Problem:** the global config carries RPGlitch's layer hierarchy, state-ownership rules, and RPGlitch skills in its routing map. An agent using this config in _any other repo_ will try to enforce RPGlitch rules there.
**Fix:** keep the global config generic; project-specific architecture belongs in RPGlitch's own `GEMINI.md`.

### C3. `settings.json` security posture

**Problem:** `defaultApprovalMode: "auto_edit"`, `enablePermanentToolApproval: true`, `autoAddToPolicyByDefault: true`, `disableYoloMode: false`. The destructive-command guard hook exists _only_ in the RPGlitch repo, so any other repo running under this global config has auto-approve + YOLO with no guardrail.
**Fix:** set `disableYoloMode: true`; reconsider `auto_edit` / permanent-approval defaults; consider shipping a guard hook with the global config.

### C4. Turn-signal ceremony

**Problem:** every response is mandated to end with `> [Role] | [Skills] | [Workflows] | [MCPs] | [Status]` — high-noise ceremony that agents will skip anyway.
**Fix:** relax or soften the requirement.

### C5. Duplication risk with the release workflow

**Problem:** RPGlitch's `perchance-deployment` SKILL and the gemini `04-release` workflow overlap in responsibilities.
**Fix:** decide ownership explicitly — project deployment steps stay in the project skill, generic release hygiene stays global.

---

## D. What's working well (for context / balance)

- Hooks consolidation into one dispatcher is a clear improvement over the old scattered local scripts.
- The 3-tier destructive-command guard is well-scoped.
- Real CI (`verify` → `build` → `git diff --exit-code` drift check) is a significant upgrade.
- The context skill's research escalation (vector memory → Context7 → DeepWiki → Firecrawl) is sane.
- `perchance-plugin-text` reference is accurate (prefix caching, bigram tokenizer, 570-token image cost).
- The `00-startup → 04-release` workflow lifecycle is coherent.
- The `DatabaseClosedError` guard in `src/state/interface.svelte.js` / `src/media/audio.svelte.js` is correct and safe.
