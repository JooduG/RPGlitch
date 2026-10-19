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
- **Audio Protocol**: Initialize AudioContext strictly on direct user gesture. Suspend/close when unmounting.

### 2. Svelte 5 Sovereignty & Security

- **Forbidden**: `export let`, `$:`, `writable()`, `readable()`, `<slot />`, `createEventDispatcher`.
- **Mandatory**: Svelte 5 Runes exclusively (`$state()`, `$derived()`, `$effect()`, `{@render snippet}`).
- **State Ownership**: Never read state from DOM elements. Single source of truth in Svelte Runes.
- **Sanitization**: Pass untrusted inputs through DOMPurify before `{@html ...}` rendering.

### 3. Layer Boundaries & Import Hierarchy

- `src/ui/` (Presentation) → `src/state/` (Reactive Controllers) → `src/intelligence/` (Inference) → `src/data/` (Persistence) → `src/platform/` & `src/media/`.
- Downward imports allowed. Upward imports strictly forbidden (`src/state/` cannot import `src/ui/`, lower levels cannot import state or UI).
- **Prompt Catalog Grammar Law**: Every prompt catalog atom across `src/intelligence/modules/` must be a frozen object `{ tag, body, attrs?, inline? }` compiled exclusively via `render_atom_xml` from `@utils`. Naked strings in prompt catalogs are prohibited.
- **Relational Invariant**: Entity relations (`[@TARGET: ...]`) ALWAYS emit child `<RELATION target="...">` tags and are strictly immune to XML attribute compaction in `render_profile_field_block`.

### 4. State Ownership Matrix

- **Active Entities & Chronology** (`user`, `ai`, `fractal`, `round`, `story_id`): `runtime.svelte.js`.
- **Simulation Phase** (`idle`, `generating`, `locked`): `status.svelte.js`.
- **UI Flow & Modals** (`view`, `profile_open`): `interface.svelte.js`.
- **Audio Context**: `src/media/`.

---

## 🎨 Aesthetics & Visual Protocols

- **Visual Spec**: `./DESIGN.md` governs all visual tokens and animations. Run `npm run sync` after edits.
- **Transitions**: Never mix `view-transition-name` with Svelte transition directives (`transition:`, `in:`, `out:`).
- **Modals**: Left-aligned header & description; right-aligned footer action buttons.
