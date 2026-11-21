# RPGlitch System Constitution

Extends global `GEMINI.md` with RPGlitch's invariant laws, live 6-Rank architecture, Svelte 5 state ownership, and Epistemic Wall contracts. For full subsystem specs, see [README.md](./README.md), [DESIGN.md](./DESIGN.md), [SECURITY.md](./SECURITY.md), and [ROADMAP.md](./ROADMAP.md).

---

## Operational Mandates (`P1`–`P7`)

- **P1 — User Agency**: **Never speak, act, or think on behalf of the biological User.** Keep all non-user entities strictly third-person limited.
- **P2 — Internal Consistency**: Narrative echo must mirror persisted state across turns and reloads.
- **P3 — Narrative Momentum**: Favor sensory bridges, distinct entity voices, meaningful interactions, and minimalist UI restraint.
- **P4 — Zero Backwards Compatibility (Pre-Beta Purity)**: **Never write backwards-compatible fallbacks, legacy aliases, deprecated wrappers, or schema shims.** Update all downstream consumers cleanly and delete dead code immediately.
- **P5 — Honest Literals & Scoped Scales**: Keep non-prose quotas and hardware limits as honest literals; restrict semantic scales to their domain and ensure every exported `src/config.js` constant has an active consumer.
- **P6 — Audit Scope Disambiguation**: Distinguish commitments agreed in the active session from parked backlog/proposals in [ROADMAP.md](./ROADMAP.md) or [.agents/skills/architect-blueprint/](./.agents/skills/architect-blueprint/SKILL.md).
- **P7 — Root-Fix First**: Inspect and repair shared primitives (`ProfilePicture.svelte`, `TextField.svelte`, `@data`, `@media`, `@utils`, or `{@render ...}` snippets) rather than patching symptom workarounds in parent callers.

---

## Stack, Persistence & Documentation Topology

- **Framework**: Svelte 5 (**Runes-only**) built with Vite 8 (`vite-plugin-singlefile`) into a single Perchance bundle (`<= 4.00 MB`).
  - **Forbidden**: `export let`, `$:`, `writable()`, `readable()`, `<slot />`, `createEventDispatcher`.
  - **Mandatory**: `$state()`, `$derived()`, `$effect()`, `{@render ...}` snippets, `SvelteSet`. Never read application state from DOM elements; sanitize untrusted HTML via `DOMPurify` (`SANITIZE_NAMED_PROPS: true`).
- **Persistence**: Dexie.js (`"rpglitch"`, schema `version(2)`) exclusively; `localStorage` is forbidden.
  - Keep Dexie locked at `db.version(2)`. Multi-table boot seeding and `premade_key` backfills must execute inside a single `db.transaction("rw", ...)` in [src/data/db.js](./src/data/db.js).
- **Audio Protocol**: Initialize `AudioContext` strictly on direct user gesture and call `Audio.destroy()` on unmount / `pagehide`. Master audio state boots silent in memory (`is_muted = true`).
- **Documentation Topology (Anti-Docs-Folder Law)**: Never create a top-level `docs/` directory or loose design drafts in the root. System specs belong in [README.md](./README.md) (plus package `README.md` contracts), visual tokens in [DESIGN.md](./DESIGN.md), security in [SECURITY.md](./SECURITY.md), active sprint deltas in [ROADMAP.md](./ROADMAP.md), release pulses in [CHANGELOG.md](./CHANGELOG.md), and parked feature proposals in [.agents/skills/architect-blueprint/references/](./.agents/skills/architect-blueprint/SKILL.md).

---

## Live 6-Rank Layer Hierarchy & Import Laws

Enforced by [graphit.architecture.json](./graphit.architecture.json) (`npm run audit:layers`):

- **Rank Topology (Strictly Downward)**:
  1. `src/main.js`, `src/App.svelte` (Shell)
  2. `src/ui/*` (`@ui`) & `src/ui/primitives/**` (`@primitives`, restricted to `@config`, `@utils`, `@media`) (Rank 5)
  3. `src/engine/` (`@engine`: `chrono.svelte.js`, `lifecycle.js`, `runner.js`, `transport.js`) (Rank 4)
  4. `src/state/` (`@state`: `session.svelte.js`, `execution.svelte.js`, `interface.svelte.js`) (Rank 3)
  5. `src/data/` (`@data`) & `src/media/` (`@media`) — mutually isolated peer leaves (Rank 2)
  6. `src/simulation/` (`@simulation`: `brackets.js`, `dynamics.js`, `history.js`, `llm-output.js`, `prompts.js`, `retrieval.js`) (Rank 1)
  7. `src/definitions/` (`@definitions`) & `src/utils/` (`@utils`) (Rank 0) -> `src/config.js` (`@config`, zero-dependency leaf)
- **Cross-Folder Barrel Mandate**: Use module alias barrels (`@data`, `@engine`, `@media`, `@primitives`, `@simulation`, `@state`, `@ui`, `@utils`) for **all** cross-folder imports; use relative `./file.js` strictly inside the same folder (**no self-barrel `@<own-folder>` imports**). Keep `tsconfig.json` (`baseUrl` + `paths` matching `vite.config.js` and `jsconfig.json`) in sync so `graph-it` resolves all `@alias` edges. Re-export public symbols cleanly through `index.js` and target barrels in unit test mocks.
- **Prompt Sovereign & Zero Downward LLM Leaks**:
  - All XML prompt compilation envelopes (`<SYSTEM>`, `<AXIOMATIC_CONSTITUTION>`, `PURPOSE_CORES`) live exclusively in [src/simulation/prompts.js](./src/simulation/prompts.js).
  - Lower layers (`@data`, `@media`, `@simulation`, `@definitions`, `@utils`) must never initiate LLM jobs; all LLM queuing and single-flight preemption flow from `src/engine/transport.js` (`LLM_PRIORITY.FOREGROUND = 10`, `BACKGROUND = 1`).
- **Epistemic Wall & Relational Syntax Law**:
  - Entity relations use value-referenced `@TARGET_ID` tokens inside semantic brackets (`[KEY: ... @TARGET_ID ... | flags]`).
  - Filter **all** `physical` and `non_physical` bracketed state via `format_tagged_fields(..., { see_hidden, is_counterpart })` in [src/simulation/brackets.js](./src/simulation/brackets.js), and strip `INVENTORY`/`STASH` + `| hide` via `build_aesthetic_map()` in [src/simulation/prompts.js](./src/simulation/prompts.js).
- **Premade vs. Database Sovereignty**: Static premade catalogs (`ALL_PREMADES`, `PREMADE_*`, `ORION_NOVA_GLITCH_STORY`) may only be imported by [src/data/db.js](./src/data/db.js) and `src/definitions/` (enforced by `premades.test.js`). Runtime code reads entities strictly from IndexedDB / runtime state; `seed_premades()` never overwrites existing DB fields.

---

## State Ownership & Simulation Reference

- **Active Session, Cast & Feed**: `session` in [src/state/session.svelte.js](./src/state/session.svelte.js) (`active_user`, `active_ai`, `active_fractal`, `active_npcs`, `ai_dynamics`, `fractal_dynamics`, `round`, `feed`). Assign nullable dynamics via store setters rather than `Object.assign`.
- **Turn Execution & Streaming**: `execution` in [src/state/execution.svelte.js](./src/state/execution.svelte.js) (`phase`, `role`, `busy`, `loading`, `stream`, `recover`).
- **UI Navigation, Settings & Staging**: `app` in [src/state/interface.svelte.js](./src/state/interface.svelte.js) (`view`, `profile_open`, `settings`, `selected_*`); image lightbox state lives in [src/ui/ImagePreview.svelte.js](./src/ui/ImagePreview.svelte.js) (`image_preview`).
- **Audio Engine**: [src/media/audio.svelte.js](./src/media/audio.svelte.js) (`Audio`).
- **Simulation & Vector Caps**: Detailed 3-turn heartbeat, Speaking Styles (`casual`, `lyrical`, `primal`, `clinical` + `detox_prose`), and Quad-Partitioned Entity schemas (`eternal`, `present`, `past`, `future`) live in [README.md](./README.md) and [.agents/skills/simulation/SKILL.md](./.agents/skills/simulation/SKILL.md). Ephemeral 384-d retrieval cache enforces `EMBEDDING_SPECS.MAX_EPHEMERAL_VECTORS = 200` in [src/config.js](./src/config.js#L104); `usr_` memories carry `is_origin` (`1.5x` relevance multiplier).

---

## Aesthetics & Local Skill Routing

- **Visual Spec**: [DESIGN.md](./DESIGN.md) governs tokens and animations; run `npm run sync:css` after edits. Never mix `view-transition-name` with Svelte `transition:` / `in:` / `out:` directives; left-align modal headers and right-align footer buttons.
- **Local Skills**: [.agents/skills/simulation/SKILL.md](./.agents/skills/simulation/SKILL.md), [.agents/skills/design/SKILL.md](./.agents/skills/design/SKILL.md), [.agents/skills/motion/SKILL.md](./.agents/skills/motion/SKILL.md), [.agents/skills/audio/SKILL.md](./.agents/skills/audio/SKILL.md), [.agents/skills/graph-it/SKILL.md](./.agents/skills/graph-it/SKILL.md), [.agents/skills/housekeeping/SKILL.md](./.agents/skills/housekeeping/SKILL.md), [.agents/skills/architect-blueprint/SKILL.md](./.agents/skills/architect-blueprint/SKILL.md).
