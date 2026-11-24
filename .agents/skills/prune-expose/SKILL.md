---
name: prune-expose
description: >-
  Read-only complexity audit that exposes over-engineering, dead state, speculative abstractions, unnecessary indirection, and internal defensive boilerplate before pruning. Use when asked to expose bloat, flatten, simplify, or audit a file, module, or directory for pruning candidates. Do NOT use for editing code (`prune-execute`), ground-up architectural re-imagining (`refactor`), standalone dead-export/call-graph queries (`graph-it`), or spec-to-code drift checks (`egm-drift-report`).
---

# Prune Expose (Read-Only Complexity Audit)

**Hard lock: Do NOT edit, create, or delete any files.** Output only a structured complexity audit and consolidation proposal for user approval.

## Discovery & What to Hunt For

Separate production call counts from `*.test.js` calls using `npm run audit:dead-code`, `graph-it path-in`, and `.svelte` template / `@alias` barrel checks (never rely on AST call-graph counts alone):

1. **Pass-through wrappers (`< 3` production call sites):** Thin helpers or indirection that can be inlined cleanly without duplicating multi-line logic.
2. **Fragmented same-concern modules:** Co-changing sibling files within the **same Rank** that add hop count without isolating a contract.
3. **Speculative generality & dead state (`P4` / `P5`):** Zero-read flags, `src/config.js` exports without active consumers, single-implementation abstractions, duplicate caches/lists, and legacy shims.
4. **Internal defensive boilerplate:** Empty `try/catch`, silent `catch { return; }`, redundant internal null checks already guaranteed by entry boundaries, and unreachable fallbacks.

## RPGlitch Guardrails (Do NOT Flag as Incidental)

- **6-Rank DAG & Sovereign Splits:** Respect `graphit.architecture.json` (`npm run audit:layers`) and `@alias` barrels. Never propose merging across Rank boundaries or sovereign splits (`prompts.js` vs. stateless `steps.js` vs. stateful `turns.js`; `premades.js` vs. `entity-repository.js`; `@atoms` / `@molecules` / `@organisms`; the 3 `@state` rune stores).
- **Legitimate Host & Capability Guards:** Keep `window` / Perchance plugin resolution (`transport.js`, `capturePlugins`), Web Audio / Speech capability checks, and Node/Vitest environment guards.
- **Reverse Rule of Three & Atomic Mutations:** Keep helpers with `3+` production callers or helpers that atomically update `2+` coupled state/dynamics fields (e.g., store setters, `db.transaction` blocks).
- **Lifecycle & Test Hooks:** Check whether a `0`-caller symbol is a bootstrap/hydration guard, `$effect` / `Audio.destroy()` teardown, `.agents/skills/*/scripts/` consumer, or `reset_*` test-isolation hook.

## Output Format

1. Group findings under the 4 categories with clickable file links, line ranges, and **production vs. test call counts**.
2. Classify each item as **`LOAD-BEARING`** (contract, host boundary, or layer facade) or **`INCIDENTAL`** (safe to delete, inline, or merge).
3. Summarize the **Load-Bearing Core Contract** that must survive.
4. Propose concrete vertical slices (`<= 5` files per slice) and stop for user approval before invoking `prune-execute`.

End your response with `[skill: prune-expose]`.
