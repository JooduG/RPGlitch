# Suggestion: Reply Model Overlays, Presets Shelf & Feature Catalog (MoeChat Inspiration)

> **Status:** Backlog Proposal & Conceptual Reference  
> **Domain:** Prompt Pipeline, Narrative Styles, Memory Tiering & Product Documentation  
> **Scope:** `src/data/definitions/narrative-styles.js`, `src/intelligence/prompts.js`, `README.md` / `FEATURES.md`  

---

## 1. Executive Summary

This reference captures key design principles from MoeChat's architecture (`tmp/SPEC-models.md` and `tmp/FEATURES.md`) adapted for RPGlitch's simulation physics and Svelte 5 engine.

Rather than adopting MoeChat's rigid length dials or character chat structures directly, this proposal explores:
1. **Model Overlays as Lens Presets ("The Presets Shelf")**: A declarative shelf of prompt pipeline overlays that can cross-reference and augment our existing [`narrative-styles.js`](file:///c:/Users/johng/source/repos/RPGlitch/src/data/definitions/narrative-styles.js).
2. **Dynamic Memory Tiering / Recall Ranks**: Decoupling memory write depth (which remains invariant to prevent story amnesia) from situational recall depth based on active narrative tension.
3. **RPGlitch Product Tour ("FEATURES.md")**: Creating a consumer-facing, plain-language showcase document of RPGlitch's simulation mechanics, Somatic Physics, Epistemic Wall, and Story Triad.

---

## 2. Part A: The Presets Shelf & Prompt Pipeline Overlays

### Core Philosophy from `SPEC-models.md`
> "A model is a package, not a length. It owns voice (its prompt overlay) + shape (its native structure) + memory rank + size ceiling."

In RPGlitch, our Director pass (Shot 1) and Storyteller pass (Shot 2) already handle length dynamically via `BEAT_BUDGET` and `MOMENTUM`. However, we can adapt the concept of **Overlays** and **Preset Shelves** to enrich [`narrative-styles.js`](file:///c:/Users/johng/source/repos/RPGlitch/src/data/definitions/narrative-styles.js):

### 1. Cross-Referencing Narrative Styles with Structural Lenses
Currently, `narrative-styles.js` defines author presets (`cormac_mccarthy`, `william_gibson`, `gothic`, `lovecraft`) with `rhythm`, `sensory`, `internal_ratio`, and `motifs`. We can expand this with modular **Structural Lenses** selectable from a UI "Shelf":

| Lens / Overlay | Focus / Shape | Narrative Style Cross-Reference | Memory Rank / Recall Depth |
| :--- | :--- | :--- | :--- |
| **Micro-Beat / Kinetic** | Quick exchange, immediate physical friction, sensory brevity. | Pairs with `hemingway` or hardboiled thriller styles. | Lean (Focus on immediate 2 turns + hot present items). |
| **Close-Third Introspective** | Deep internal `<think>` cognition, delayed reactions, somatic anchoring. | Pairs with `cormac_mccarthy` or `gothic`. | Deep (Balanced 8-turn recall + relational bonds). |
| **Chamber Drama / Atmospheric** | Held scenes, high subtext, conversational standoff, room micro-physics. | Pairs with `murakami` or psychological noir. | Maximal (Full 16-turn continuum + settled facts). |
| **Epistemic Chronicle** | Broad environmental decay, fractal narration, third-person panoramic. | Pairs with `lovecraft` or cosmic sci-fi. | Macro (Emphasizes fractal world memories & chapter arcs). |

### 2. Separation of Memory Writing vs. Memory Recall
- **Invariant Memory Formation**: The background Memory Forge (`director_background_queue`) must always record state diffs to `mutation_ledger` and 384-d vectors at full fidelity regardless of overlay.
- **Selective Recall Filtering**: The overlay merely modulates prompt injection budgets (`PAST_VECTOR_CAP`, relevance multiplier threshold) based on the scene's required cognitive bandwidth.

---

## 3. Part B: Future "RPGlitch Features & Tour" Specification

Inspired by `tmp/FEATURES.md`, we propose authoring a dedicated, plain-language feature catalog for RPGlitch (`FEATURES.md` or a comprehensive section in `README.md`):

### Proposed Sections for `FEATURES.md`
1. **The Sovereign Engine & The Story Triad**:
   - The Triad of agency: User (Biological Protagonist), AI Companion (Character Subjectivity), and Fractal (World Physics & Entropy).
   - Strict P1 Sovereignty: The engine never speaks, thinks, or acts on behalf of the player.
2. **The 3-Turn Heartbeat (Shot & Sub-Process)**:
   - *Turn 1 (Director Quick Shot)*: Physics arbitration, dynamic sliders (Chaos, Intensity, Openness, Affinity, Velocity, Entropy), actor routing, and visual beat scheduling.
   - *Turn 2 (Storyteller Narrative Shot)*: High-fidelity prose streaming behind the Epistemic Wall, zero meta-disclaimers, detoxified prose.
   - *Turn 3 (User Head Shot & Background Forge)*: Zero-latency biological deliberation while background sub-processes forge 384-d semantic embeddings and prune vector memory.
3. **The Epistemic Wall & Anti-Telepathy**:
   - Absolute partitioning of private sheet attributes (`| hide`, unvoiced thoughts, concealed inventory items) across characters.
4. **Somatic Physics & Quad-Partitioned Memory**:
   - Quad Schema: Eternal (core essence), Present (active clothes/items), Past (vectorized episodic memory), and Future (standing agenda).
   - Reversible dressing/undressing mechanics (`INVENTORY` vs `STASH`), clothing damage, and spatial resistance.
5. **Aesthetic Synthesis & Visual Diffusion**:
   - Automatic visual prompt compilation from Director beats via the Perchance Image Plugin, respecting visual filter rules and camera framing.

---

## 4. Architectural Boundaries & Next Steps

- This proposal is non-binding and preserved for future roadmap planning.
- When prioritized for execution, specific slices (e.g., lens overlays or the `FEATURES.md` tour) will be scheduled into `ROADMAP.md` as active sprint tracks.
