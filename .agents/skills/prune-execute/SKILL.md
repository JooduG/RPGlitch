---
name: prune-execute
description: >-
  Executes an approved in-place simplification and pruning checklist after a `prune-expose` audit—deleting dead state, inlining `< 3`-caller wrappers, and merging redundant sibling fragments. Use when applying user-approved cleanup, flattening, or pruning items. Do NOT use for unapproved read-only audits (`prune-expose`), ground-up module re-imagining or primitive redesigns (`refactor`), or prose cleanup (`deslop`).
---

# Prune Execute (Approved Pruning Cutover)

Execute strictly the user-approved `prune-expose` items in verifiable vertical slices (`<= 5` files per slice for structural changes; mechanical caller updates for a single approved rename or inline may land in one atomic pass so the build never breaks mid-slice) while preserving the Load-Bearing Core Contract.

## Execution Rules

- **Lifecycle Hook Pre-Flight:** Invoke `mcp-sequentialthinking-tools` (`sequentialthinking_tools`) before editing high-risk spine files (`src/engine/*`, `src/data/*`) or multi-file slices. Preserve top header + `CHANGELOG` footer blocks on new `src/` files (`file-architecture-gate`).
- **Layer & Barrel Purity:** Obey `graphit.architecture.json`: use `@alias` barrels cross-folder, relative `./file.js` in-folder (no self-barrels; no `src/definitions/index.js`), and update `index.js` re-exports + barrel unit-test mocks cleanly (`P4`).
- **Rule of Three Inlining:** Inline `< 3`-caller wrappers unless they enforce a Rank/Epistemic boundary or atomically mutate `2+` coupled fields (never emit comma-operator expressions or replace `@state` store setters with `Object.assign`).
- **Fail Fast Internally:** Strip redundant internal checks only after confirming entry-boundary validation; retain explicit rejection/abort handling on async queues, Dexie writes, and background consolidation (`is_abort_error`).
- **Drop incidental behavior:** Do not preserve incidental behavior outside the approved Load-Bearing Core Contract.
- **Semantic Consolidation:** Rename merged symbols using full domain words (`snake_case` / `question_snake` / `SCREAMING_SNAKE`, zero lazy abbreviations) and clean up duplicate spreads, ternaries, or dead imports left behind.
- **Lifecycle & Test Hygiene:** Keep `$effect` / listener / timer / `Audio` teardowns intact. Reset **every** stateful field in `reset_*` test helpers and update partial test mocks when removing optional chaining.

## Mandatory Pre-Completion Gate

Execute all four checks (using PowerShell `; if ($?) { ... }` chaining—never `&&`):

1. **Self-review `git diff`:** Inspect every hunk for duplicate spreads, redundant branches, or awkward inlined expressions.
2. **Exhaustive symbol sweep:** Search `src/`, `.agents/`, and `*.md` for every deleted/renamed symbol (narrowing subdirectories if capped at 50 matches) plus `npm run audit:dead-code`.
3. **Contract & Pulse sync:** Update affected `src/*/README.md` (and root `README.md`) contracts when files/exports change; update `CHANGELOG.md` / `ROADMAP.md` when `src/` changes `>= 25` lines (`planning-handoff-gate`).
4. **Full CI & bundle gate:** Run `npm run verify; if ($?) { npm run build }` (and `npm run svelte:check` if `.svelte` files changed) and report exact outputs.

End your response with `[skill: prune-execute]`.
