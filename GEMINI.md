# RPGlitch Specification & Simulation Engine Rules

This document serves as the sovereign technical blueprint for **RPGlitch**. It defines simulation physics, Svelte 5 state management, layer boundaries, and memory paradigms, extending the constitutional laws in global `GEMINI.md`.

---

## ⚔️ Sovereign Identity & Core Engine Laws

> **The Unified Persona**: I am the Sovereign Engine of RPGlitch. I orchestrate the convergence of state and story, enforcing Svelte 5 purity and Design laws to ensure high-fidelity immersion. The User is the Protagonist; I am the Physics.

### Operational Mandates

- **P1: User Agency**: **Never speak, act, or think on behalf of the User**. Maintain strict third-person limited integrity for non-user entities at all times.
- **P2: Internal Consistency**: Maintain continuity of memory across turns. The "Echo" must mirror the "State".
- **P3: Narrative Momentum**:
  - **Cinematic Pacing**: Use sensory bridges and end responses with unresolved tension or meaningful choices.
  - **Meaningful Interactions**: Favor intuitive actions over explicit controls (e.g., clicking a slot triggers character selection).
  - **Minimalist Restraint**: Only display tools relevant to the active narrative moment.
  - **Prose Style**: Deliver high-fidelity immersion with distinct entity voices dictated by entity profiles.
- **P4: Zero Backwards Compatibility (Pre-Beta Purity)**: **Never write backwards-compatible fallbacks, legacy aliases, deprecated wrappers, or schema shims**. Refactor all downstream consumers and prune dead code immediately.
- **P5: Honest Literals & Scoped Scales**: Avoid forcing hardware constants, intake policies, or system quotas into artificial shared scales. Restrict semantic tier enums (e.g., `PROSE`, `IDENT`) strictly to their specific text domains, keeping non-prose limits as honest literals. Ensure every exported config constant has an active consumer.
- **P6: Audit Scope Disambiguation**: When evaluating "what's left behind" or "pending agreements", explicitly distinguish between commitments concluded within the active chat log versus historical technical debt or parked features in `ROADMAP.md` and `scribbles.md`.
- **P7: Root-Fix First (No Symptom Patching)**: Before patching a caller or consumer (`Profile.svelte`, `RelationalGraph.svelte`, etc.), inspect whether the shared primitive or helper (`ProfilePicture.svelte`, `TextField.svelte`, `@data`, `@media`, `@utils`) is the actual root cause. Fix the underlying primitive—or expose a clean Svelte 5 `{@render ...}` snippet extension point—rather than duplicating component shells or layering caller workarounds.

---

## ⚡ The Simulation Physics Engine

### 1. The Simulation Heartbeat (Rounds, Shots & Sub-Processes)

- **The Round (Macro-State)**: Increments strictly when the user submits a new message payload. Concludes only upon user submission in Turn 3.
- **Turn 1: Director Turn (Quick Shot)**: Fast staging inference (`phase = "generating"`, `director_thinking = true`). Evaluates rules, updates numerical dynamics, delegates actor (`AI`, `FRACTAL`, or `NPC`), conditionally schedules image beats (`trigger_image`), and delivers Director's Note. Emits `DYNAMICS_DELTA` telemetry. Pre-pass evaluates deterministic somatic physics synchronously before LLM invocation.
- **Turn 2: Actor Turn (Narrative Shot)**: Storyteller pass (`speaker_thinking = true`). Streams in-character dialogue, inner `<think>` cognition, and sensory prose. Dispatches visual synthesis via Perchance Image Plugin if scheduled.
- **Turn 3: User Turn (Head Shot)**: Biological protagonist deliberation (`phase = "idle"`). User authors message. Sub-process consolidates one entity round-robin in background (`director_background_queue`), computing 384-d embeddings, enforcing `PAST_VECTOR_CAP = 20`, appending change diffs to `mutation_ledger`, and emitting `MEMORY_FORMATION` / `VECTOR_RESOLUTION` telemetry cards.

---

### 2. Narrative Hierarchy & AI Protocols

- **Precedence**: User Agency (P1) > Physical & Temporal Truth > Plot & Sensory Momentum > Style & Delivery.
- **Directives**: No narrator voice, never control user persona, describe presence (not absence), keep internal mechanics invisible in output.
- **Speaking Styles & Prose Detox**: `casual` (default), `lyrical`, `primal`, `clinical` (`src/data/definitions/speaking-styles.js`). Resolved via: Entity > Preset > `"casual"`. Pass generated prose through `detox_prose(text, resolved_style)`.

---

### 3. Temporal Engine & Entity Architecture

- **Quad-Partitioned Entity Schema**:
  - **Eternal**: Baseline physical features and core essence.
  - **Present**: Immediate physical condition via Pseudo-JSON `[KEY: VALUE]`. Direct overwrites replace cleanly; `[KEY: none]` / `[KEY: cleared]` deletes key; natural descriptive states (`[MOOD: normal]`, `[CHEST: bare]`) are preserved. Multi-bracket `INVENTORY`/`STASH` aggregate. Undress stashes into `INVENTORY`; redress reads back.
  - **Past (Memories)**: Durable facts (`[KEY: fact]`) indexed by semantic embeddings. `usr_` prefixed memories are origin-protected (`is_origin`), immune to eviction, and receive a 1.5x relevance multiplier. `ai_` session memories cap at 20 (`PAST_VECTOR_CAP = 20`). Max 200 total vectors, <= 220 chars each.
  - **Future (Standing Agenda)**: Active trajectory and standing agenda rewritten wholesale by Memory Forge each cycle.
- **Event-Sourced Mutation Ledger**: State mutations record change-only diffs (`round`, `seq`, `writer`, `decider`, `old_value`, `new_value`, `visibility`, `weight`) to `mutation_ledger` for deterministic replay.
- **Dual Filter Engine**:
  - _Visual Prompt Filter_: `INVENTORY`, `STASH`, and `| hide` flags are stripped from diffusion prompts (`build_aesthetic_map`).
  - _Epistemic Prompt Filter_: Brackets flagged `| hide` belonging to others are stripped across the Epistemic Wall in `render_character()` to prevent AI telepathy.

---

## 🏛️ System Architecture & State Sovereignty

### 1. Stack & Constraints

- **Framework**: Svelte 5 (Runes-only) via Vite 8 (`vite-plugin-singlefile`). Local-First PWA for Perchance iframe.
- **Persistence**: Dexie.js (IndexedDB) exclusively. `localStorage` is forbidden.
- **Atomic Seeding & Schema Lock**: Keep Dexie at `db.version(2)` (no schema bumps for new indexes). Multi-table boot seeding and idempotency/backfill checks (such as `premade_key`) must run inside a single `db.transaction("rw", ...)` rather than relying on per-tab in-memory flags or separate non-transactional writes.
- **Audio Protocol**: Initialize AudioContext strictly on direct user gesture. Suspend/close when unmounting.
- **Documentation Topology (Anti-Docs-Folder Law)**: Never create a top-level `docs/` folder or loose design drafts in the root. Technical blueprints belong in root `README.md` (the sovereign Hay Blueprint replacing legacy `ARCHITECTURE.md`), active sprints and roadmap horizons belong in `ROADMAP.md` and `nuclear-plan.md`, domain research and proposals belong in `.agents/skills/<domain>/references/`, and interactive implementation runbooks belong in agent brain artifacts (`<brain>/<name>.md`).

### 2. Svelte 5 Sovereignty & Security

- **Forbidden**: `export let`, `$:`, `writable()`, `readable()`, `<slot />`, `createEventDispatcher`.
- **Mandatory**: Svelte 5 Runes exclusively (`$state()`, `$derived()`, `$effect()`, `{@render snippet}`).
- **State Ownership**: Never read state from DOM elements. Single source of truth in Svelte Runes.
- **Sanitization**: Pass untrusted inputs through DOMPurify before `{@html ...}` rendering.

### 3. Layer Boundaries & Import Hierarchy

- `src/ui/` (Presentation) → `src/state/` (Reactive Controllers) → `src/intelligence/` (Inference) → `src/data/` (Persistence) → `src/platform/` & `src/media/`.
- Downward imports allowed. Upward imports strictly forbidden (`src/state/` cannot import `src/ui/`, lower levels cannot import state or UI).
- **Cross-Folder Barrel Mandate**: Use module alias barrels (`@data`, `@engine`, `@media`, `@primitives`, `@ui`, `@utils`) for **all** cross-folder imports; use relative `./file.js` paths strictly for in-folder imports. When switching a consumer to a barrel import, ensure the symbol is re-exported by the barrel's `index.js` and update any unit test `vi.spyOn` / `vi.mock` targets to match the barrel rather than an internal file.
  - **No Self-Barrel Imports**: Never import `@<own-folder>` from inside `src/<folder>/` (e.g. `@ui` inside `src/ui/`, `@primitives` inside `src/ui/primitives/`), as it creates circular barrel dependencies.
  - **Alias Config Sync**: Keep `tsconfig.json` (`"baseUrl": "."`, `"noEmit": true`, and bare barrel `paths`) in sync with `vite.config.js` and `jsconfig.json` so `graph-it-live` resolves cross-folder `@alias` edges while `svelte-check` stays emission-free.
- **Prompt Sovereign Mandate (Single Source of Truth for Prompts)**:
  - All prompt compilation envelopes (`<SYSTEM>`, `<TASK>`, `<AXIOMATIC_CONSTITUTION>`, `<PROTOCOLS>`, Purpose Cores) MUST live exclusively in `src/engine/prompts.js`.
  - Never copy-paste or assemble prompt XML templates in `src/media/`, `src/storage/`, `src/data/`, or `src/utils/`.
  - **Zero Downward LLM Leaks**: Lower layers (`storage`, `media`, `utils`, `data`) must remain pure, synchronous engines/persistence. They must NEVER import `llm_service` or initiate LLM generation jobs. All prompt assembly and inference orchestration must flow downward from `src/engine/` (`turns.js`, `bridge.js`).
- **Relational Syntax Law**: Entity relations use value-referenced `@TARGET_ID` tokens inside semantic brackets (`[KEY: ... @TARGET_ID ... | flags]`) and are filtered across the Epistemic Wall via `format_tagged_fields` (`see_hidden`, `is_counterpart`).
- **Premade vs. Database Sovereignty**: Static premade catalogs (`ALL_PREMADES`, `PREMADE_*`, `ORION_NOVA_GLITCH_STORY`, `get_premade_*`, `has_premade_entity`) may **only** be imported by `src/data/db.js` (boot seeding) and `src/definitions/` (enforced by `premades.test.js`). Runtime code (`ui`, `state`, `engine`, `simulation`) must read entities exclusively from IndexedDB/runtime state without premade fallbacks, and `seed_premades()` must never overwrite existing DB fields (e.g., `pov`) on subsequent boots.

### 4. State Ownership Matrix

- **Active Entities, Dynamics & Chronology** (`active_user`, `active_ai`, `active_fractal`, `ai_dynamics`, `fractal_dynamics`, `round`, `story_id`, `feed`): `session.svelte.js` (`session`). Assign nullable dynamics via store setters (`session.ai_dynamics = { ... }`) rather than `Object.assign`.
- **Execution Phase, Streaming & Watchdog** (`phase`, `role`, `loading`, `stream`, `recover`): `execution.svelte.js` (`execution`).
- **UI Flow, Settings & Storyboard Staging** (`view`, `profile_open`, `settings`, `selected_*`): `interface.svelte.js` (`app`). Image preview/picker state lives in `src/ui/ImagePreview.svelte.js`.
- **Audio Context**: `src/media/`.

---

## 🎨 Aesthetics & Visual Protocols

- **Visual Spec**: `./DESIGN.md` governs all visual tokens and animations. Run `npm run sync` after edits.
- **Transitions**: Never mix `view-transition-name` with Svelte transition directives (`transition:`, `in:`, `out:`).
- **Modals**: Left-aligned header & description; right-aligned footer action buttons.
