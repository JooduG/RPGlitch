# 📖 RPGlitch Sovereign Glossary & System Lexicon

This document serves as the authoritative, centralized encyclopedia of definitions, core physics, taxonomies, and architectural standards across **RPGlitch**.

---

## ⚡ 1. Simulation Physics & Temporal Continuum

### The Simulation Heartbeat

The overarching execution cycle of the engine—a complete sequence of cause and effect bridging human agency and AI physics:

```text
[User Action] ➔ [Director & Physics Simulation] ➔ [Storyteller Generation] ➔ [Persistence & UI Release]
```

### Round (Macro-State)

The **Round** (`runtime.round: 1, 2, 3...`) is the global progression clock of the simulation. It increments strictly when the human player submits a new action. A round concludes only when all internal actor turns, physics evaluations, and background persistence tasks for that payload finish executing.

### Turn (Micro-State)

A **Turn** is an individual entity's execution slice within a single round. Turns execute sequentially:

1. **System / Director Turn**: Physics calculation, state mutations, and somatic keyword selection.
2. **Storyteller Turn**: Active prose generation by the delegated entity (`AI_CHARACTER`, `FRACTAL`, or `NPC`).
3. **User Persona Turn**: UI composer released, waiting for human action.

### Simulation Lock (STASIS)

The UI lock state (`simulation_state.phase === "locked"`) active while the engine processes state mutations and synthesizes turns. During stasis, user input is temporarily disabled to preserve causality.

### Story

The fundamental narrative session defined by the sovereign triad of:

- **1 Fractal (The World / Setting)**
- **2 Characters (The User Persona + Primary AI Companion)**

### Story Quest / Horizon

The overarching macro-objective and thematic trajectory of the story, defined in the Fractal's consolidated prose standing agenda (`fractal.future`).

### Epilogue / "The End"

The climactic story conclusion state triggered when the overarching quest reaches victory resolution (`CONCLUDED`) or tragic failure (`COLLAPSED`), rendering the dedicated conclusion deck (`Epilogue.svelte`).

---

## 🏛️ 2. Entity Architecture & Relational Mesh

### Entity

The fundamental simulation unit in IndexedDB—either a `character` or a `fractal`.

### User Persona

The human-controlled character entity (`runtime.active_user`). Strictly protected by **P1: User Agency** (the engine must never speak, act, or think on behalf of the user).

### AI Character (Companion / Antagonist)

The primary agent-controlled character entity (`runtime.active_ai`) co-starring in the active scene.

### Fractal

The environmental, atmospheric, or metaphysical world entity (`runtime.active_fractal`). Owns world dynamics, sensory rules, ambient audio themes, and the overarching story quest.

### The 4 Entity Fragments

The four-quadrant state architecture defining every entity:

- **Eternal**: Baseline physical anatomy and core essence.
- **Present**: Immediate physical conditions (governed by pseudo-JSON brackets `[KEY: VALUE]`) and active emotional processing states.
- **Past (Memories)**: Semantic vector array of episodic memories and historical anchors retrieved via vector RAG.
- **Future (Standing Agenda)**: Single consolidated prose field representing immediate trajectory, impending intent, and active goals (rewritten by the Memory Forge).

### The Entity Taxonomy (Binary Model & Rolling Back Shot)

> ✅ **SUPERSEDED (2026-08-24, Track 2 Back Shot Rolling Worker).** The legacy `role_tier` promotion system was purged in favor of a clean, binary model:
> 1. **Prose Extras**: Ephemeral background characters mentioned on-the-fly in narrative prose (no DB record).
> 2. **First-Class Entities**: Once minted via Genesis (`next_action: "GENESIS"`), every character is a full entity with an identity card, signature color, and persistent memory.
>
> All first-class entities receive continuous, equal memory deepening via the single-entity round-robin **Back Shot** worker ($\text{AI} \rightarrow \text{User} \rightarrow \text{Fractal} \rightarrow \text{NPC}_n$).

### Universal Relational Graph

> ✅ **IMPLEMENTED (2026-08-16, track-npc-expansion).** `relationships: string[]` is a normalized entity field (≤40 vectors, 240 chars each), and the `<RELATIONAL_MESH>` prompt block renders it for the trio and every world NPC.

Plain-text directed relationship vectors (`"[Source] → [Target]: [Relational dynamic]"`) that unify interpersonal dynamics, world affiliations, and faction standings without rigid foreign keys:

- **Entity ➔ World (Fractal Casting)**: `"Dr. Elias → Tartarus: Chief Medical Officer at Sector 4"` (automatically registers Elias into Tartarus's `<WORLD_CAST>`).
- **Entity ➔ Entity (Interpersonal)**: `"Elias → Benedict: Wary collaborator, suspects classified cybernetics"`.
- **World ➔ Entity (Faction Standing)**: `"Tartarus → Julien: Wanted by Sector Enforcers for high treason"`.

### Wanderer (`is_wanderer`)

> ✅ **IMPLEMENTED (2026-08-16, track-npc-expansion).** `is_wanderer: boolean` is normalized on every character entity (default false).

A character entity flagged `is_wanderer: true` that is not bound to a single Fractal and can appear across multiple compatible worlds.

### Stage Spotlight Model & Dynamics Stasis

> ✅ **IMPLEMENTED (2026-08-16, track-npc-expansion).** `runtime.in_scene_npc_ids` + `snapshot_in_scene_npc_ids` drive the Stage Spotlight; the Director moves NPCs on/off stage via `in_scene_change`, off-screen NPCs get no dynamics evaluation, and in-scene NPC memories get a 1.3x RAG salience boost. Note: NPC dynamics are currently frozen (never settled) in both states; only on-stage _speech delegation_ and memory salience are active.

- **On-Stage (`runtime.in_scene_npc_ids`)**: Entities physically in the room. The Director actively updates their dynamics and delegates speech turns.
- **Off-Screen (Stasis)**: Characters outside the scene freeze in stasis with zero token or computation overhead.

---

## 📊 3. Dynamics Physics Engine

### The 6 Dynamic Axes

The simulation continuously calculates 6 numerical state axes (0–100) reflecting real-time somatic, psychological, and environmental physics:

#### Character (Somatic & Psychological) Axes (4 Axes)

- **`chaos` (0–100)**: Internal emotional stability vs. radical unpredictability, cognitive volatility, and erratic impulse.
- **`intensity` (0–100)**: Internal arousal, adrenaline, dramatic stakes, and narrative urgency.
- **`openness` (0–100)**: Social credulity, gullibility vs. suspicion, defensive guardedness, and persuasion friction.
- **`affinity` (0–100)**: Interpersonal warmth, empathy, trust, and loyalty vs. cold hostility and estrangement.

#### Fractal (Environmental & World) Axes (2 Axes)

- **`velocity` (0–100)**: Environmental pacing, physical action tempo, kinetic speed, and scene momentum.
- **`entropy` (0–100)**: Structural reality degradation, environmental breakdown, cognitive noise, fatigue, and metaphysical distortion.

### Global Triggers & Signals (`<DYNAMICS_SIGNALS>`)

High-water mark thresholds across the 6 axes (e.g. `intensity > 75`, `chaos > 70`) that automatically fire behavioral directives injected into storyteller prompts via `<DYNAMICS_SIGNALS>`.

### Live Physics Deltas

Continuous micro-adjustments calculated by the Director during turn execution (e.g. `chaos: +5`, `openness: -10`), persisted automatically to IndexedDB to ensure physical continuity across browser reloads.

---

## 🎭 4. Intelligence, Directorial Physics & Protocols

### Director (Gamemaster)

The omniscient analytical engine that executes prior to narrative prose generation to evaluate player intent, calculate dynamics deltas, select somatic keywords, and delegate the active speaker.

### Active Trio Exclusion Filter

> ✅ **IMPLEMENTED (2026-08-16, track-npc-expansion).** `render_world_cast_xml` excludes the active trio (`active_user` / `active_ai` / `active_fractal` ids) from `<WORLD_CAST>` while `render_scene_roster_xml` still lists them on stage.

A code-level guarantee that strictly excludes the active Protagonist (`active_user`) and Companion (`active_ai`) from `<WORLD_CAST>`, ensuring the player is never treated as a secondary stranger entering the room.

### Entity Convergence Law

> ✅ **IMPLEMENTED (2026-08-16, track-npc-expansion).** `<ENTITY_CONVERGENCE_LAW>` is emitted into the Director system prompt alongside `<WORLD_CAST>`, instructing it to reuse existing cast members before minting new ones.

A directorial protocol instructing the AI to inspect `<WORLD_CAST>` before minting new entities, reusing existing doctors, guards, and merchants rather than hallucinating duplicate characters.

### Somatic Directives (`<SOMATIC_DIRECTIVES>`)

Directorial injection of involuntary physical tells (averted gaze, flushed neck, muscle tension) derived from the 12-archetype Somatic Registry (`somatic-triggers.js`) to enforce "Show, Don't Tell" principles.

### Masking vs. Somatic Leakage

The psychological tension where a character attempts verbal composure or deflection while involuntary physical body language betrays their internal stress, guilt, or fear.

### Decisive Turn Hooks

Turn endings land on one dominant hook — a decisive statement, a single action, a hovered beat, or a deliberate silence — and strictly forbid generic open-ended filler questions (_"What shall we do next?"_). The literal bracket labels (`[Statement]` / `[Action]` / `[Hover]` / `[Silence]`) were removed on 2026-08-16 in favour of this freeform guidance; the engine emits no structural bracket labels.

### Prop Provenance Law

User-introduced mundane, personal gear (a lighter, knife, rope, coins, tools, keys) is presumed to have been carried all along and is accepted without question. Plot-established items (quest relics, artifacts placed or lost elsewhere, objects in another's possession) can never be conjured into existence: such attempts are treated as in-character bluffs — met with dry humor, irony, or suspicion, and any item that enters the scene is a counterfeit, decoy, or joke, never the genuine article (added 2026-08-16).

### Pacing Calibration

A soft-guideline protocol instructing the storyteller to "roughly match the length and energy of the user's message" (terse line ➔ brief, weighted reply; long message ➔ may expand accordingly). Replaces rigid tier thresholds (2026-08-16).

### Epistemic Wall

The security barrier that strips User `[SECRET: ...]` and `[PLAN: ...]` tags from AI character context to prevent telepathy, while remaining fully visible to the omniscient Director.

### Null Data Principle

The physical law stating that off-screen events, hidden user thoughts, and uncommunicated facts are strictly inaccessible to in-world entities unless transmitted across a physical conduit (sight, sound, writing).

### Protocol Library (`PROTOCOL_LIBRARY`)

The immutable registry of system prompt directives:

- **`COGNITION.THINK_CHARACTER`**: Formats inner psychological deliberation inside `<think>` blocks.
- **`AGENCY.PRESENT_TENSE`**: Enforces strict third-person limited present-tense prose.
- **`POV.NARRATOR`**: Atmospheric environmental voice for Fractal turns.
- **`SCENE.PROLOGUE` / `SCENE.EPILOGUE`**: Standardized bookend scene construction laws.

---

## 🧬 5. Memory Forge, Embeddings & Vector RAG

### Semantic Embeddings Engine (`embeddings.svelte.js`)

Client-side ONNX WASM neural embedding model running in the browser with zero external API calls. Generates 384-dimensional vector embeddings for memories and scene context.

### Vector RAG Scoring

Memory retrieval algorithm scoring past vectors by composite relevance:
$$\text{Score} = \text{Cosine Similarity} \times \text{Weight} \times \text{Provenance Boost} \times \text{In-Scene Boost} \times \text{Recency Decay}$$

- **`usr_` Provenance Multiplier**: **1.5x boost** for user/lore authored canon memories.
- **In-Scene Spotlight Multiplier**: **1.3x boost** for characters currently present in the room — _not implemented_ (spec from the archived NPC Expansion track; `compute_relevance()` in `temporal.js` has no in-scene boost).

### Memory Provenance & Forge-Skip

- **`usr_` Prefix**: Pinned origin memories flagged `is_origin: true`, immune to Memory Forge eviction/compression.
- **`ai_` Prefix**: Rolling session memories capped at 20 vectors per entity (`PAST_VECTOR_CAP = 20`).
- **Bound Limits**: Hard ceiling of 200 total vectors per entity; maximum 220 characters per entry. Deduplication purges entries with > 60% word overlap or > 0.92 cosine similarity.

### Memory Forge Cycle

The background consolidation engine running every 4 rounds (R3, R7, R11, R15...) that compresses raw conversational history into dense past vectors and rewrites the entity's consolidated future standing agenda.

---

## 🧼 6. Detox Engine & Anti-Trope Architecture

### Detox Engine (`src/data/definitions/detox-rules.js`)

A deterministic, lightweight prose sanitization pipeline that cleans AI prose of overused clichés, melodrama crutches, and repetitive tropes using deterministic FNV-1a hashing.

### 4-Tier Allocations

To prevent repetitive vocabulary while preserving natural variety:

- **`plain`**: 3 allowed items per allocation tier.
- **`ornate`**: 2 allowed items per allocation tier.
- **`raw`**: 2 allowed items per allocation tier.
- **`clinical`**: 2 allowed items per allocation tier.

### Purged Clichés & Crutches

Strictly eliminates banned AI tropes:

- _"taste of copper"_, _"heart hammered against ribs"_, _"destruction as emotion"_ (wall punching).
- _"phantom itch/ache"_, _"hit like a physical blow"_, _"shadows lengthened"_, _"eyes darkened with something unreadable"_.
- _"metallic tang"_ (blood/sweat cliché; scrubbed to a raw iron taste, added 2026-08-16).

Detox is enforced **at write time** (2026-08-16): persisted story text, Director `state_append` mutations, and epilogue responses are all scrubbed before they enter the database.

---

## 🎨 7. Sensory, Optics, Styles & Acoustics

### Optics

Physical fragments, appearance tags, and visual descriptors optimized for geometric and texture fidelity in Perchance image generation.

### Visual Prompt Filter

The parameter exclusion rule that strictly strips non-visual keys (`INVENTORY`, `STASH`, `SECRET`, `PLAN`, `STATUS`) from image prompts to prevent prompt corruption.

### Narrative Styles Catalog (`src/data/definitions/narrative-styles.js`)

A curated catalog of 23 authorial prose motifs (e.g. GRRM, Gothic, Cyberpunk, Hemingway, Delany, Lovecraft, Noir). Governs sentence cadence, syntax density, and narrative perspective.

### Visual Styles Catalog (`src/data/definitions/visual-styles.js`)

A curated catalog of 20+ visual art direction presets (e.g. Oil Painting, Anime, Film Noir, Cyberpunk Neon, Watercolor) that inject artistic modifiers and medium tokens into Perchance T2I image prompts.

### Somatic & Thematic Keywords Pool (`<AVAILABLE_KEYWORDS>`)

The curated pool of physical and emotional tell triggers presented to the Director each turn, comprised of two distinct layers:

1. **Global Somatic Archetypes (Static)**: 12 universal trauma/somatic profiles (`shame`, `fear`, `vulnerability`, `betrayal`, `abandonment`, `emotional_neglect`, `defiance`, `stoic_pain`, `recklessness`, `desperation`, `guilt`, `paranoia`) defined in `src/data/definitions/triggers.js`, always available regardless of genre.
2. **Style-Specific Dynamic Keywords**: Thematic motifs dynamically exported from the currently active narrative style via `get_style_keywords()` (e.g. `gothic_dread`, `cyber_alienation`, `clinical_detachment`).

The Director selects 1–2 keywords per round to dynamically inject targeted `<SOMATIC_DIRECTIVES>` into the active speaker's prompt.

### Kokoro Neural TTS (`src/media/audio.svelte.js`)

Client-side ONNX neural text-to-speech engine running Kokoro-82M for real-time multi-voice speech synthesis.

### Voice Registers

Standardized acoustic voice models assigned to characters and environments (e.g. `af_heart`, `am_adam`, `bm_george`, `bf_emma`).

---

## 🖥️ 8. UI Architecture, Profile Wings & Layer Hierarchy

### The Profile Orchestrator (`Profile.svelte`)

The primary modal interface for inspecting and editing entities in view or edit mode. Displays the 4 fragments (Eternal, Present, Past, Future). (The planned Relationships list from the archived NPC Expansion track is not implemented.)

### The Profile Wings (Flank Drawers)

Interactive auxiliary drawers that slide open alongside the entity profile card:

- **Visual Wing (`VisualWing.svelte`)**: Custom image prompt constructor, visual style selector, seed lock, and portrait gallery history.
- **Audio Wing (`AudioWing.svelte`)**: Kokoro voice model selection, cadence rate slider, voice testing, and audio preferences.
- **Dev Wing (`DevWing.svelte`)**: Live dynamics physics sliders (`chaos`, `intensity`, `openness`, `affinity`), raw JSON data inspection, vector embedding logs, and telemetry.

### Unidirectional Layer Flow (Import Hierarchy)

Strict architectural law enforcing unidirectional downward imports across the 6 project layers:

```text
[src/ui] ➔ [src/state] ➔ [src/intelligence] ➔ [src/data] ➔ [src/platform]
```

- Lower layers **MUST NEVER** import from higher layers (e.g. `state` never imports from `ui`).

### Repository Directory Map

- **`src/ui/`**: Atomic Svelte 5 components (Message, Entity, Profile, Console, Storyboard).
- **`src/state/`**: Reactive Runes state stores (`app.svelte.js`, `runtime.svelte.js`, `status.svelte.js`, `log.svelte.js`) plus the ChronoEngine turn driver (`chrono.svelte.js`).
- **`src/intelligence/`**: AI Kernel, prompt compiler, vector embeddings, dynamics evaluator, temporal engine.
- **`src/data/`**: Persistence layer, IndexedDB (Dexie schemas), entity normalizers, definitions catalogs.
- **`src/media/`**: Audio synthesizer, design tokens, image prompt compiler, CSS styles.
- **`src/platform/`**: Perchance iframe bridge, DOMPurify security, HTTP transport.
- **`src/utils/`**: Pure helper utilities (job queue, crypto, text formatters, story export).
