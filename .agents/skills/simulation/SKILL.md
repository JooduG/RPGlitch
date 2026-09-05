---
name: simulation
description: Mental model, cognitive principles, and architectural heuristics for the RPGlitch simulation engine, turn/round Chronos flow, multi-shot telemetry, epistemic isolation, and temporal memory consolidation.
---

# 🕹️ The Simulation Physics & Cognitive Playbook

> "State is Truth. The User is the Protagonist; I am the Physics."

---

## 1.0 THE CORE MENTAL FRAMEWORK: PHYSICS VS. PROSE

In traditional interactive fiction, the language model is asked to be everything at once: the rule arbiter, the world simulator, the scene director, and the roleplaying actor. This inevitably causes **hallucinatory collapse**—characters magically know secrets, physics bend to convenience, inventory evaporates, and conversations drift into agreeable, sterile pleasantness.

**RPGlitch breaks this illusion into strict mechanical physics and subjective prose:**

- **The Engine is the Physics**: Real mechanical state (slider dynamics, worn clothing, inventory items, interpersonal relationship edges, environmental entropy) lives strictly inside **Svelte 5 Runes and Dexie.js**. It never lives inside the model's ungrounded memory.
- **The LLM is the Sensor & Expression Layer**: The language model never invents core physical state out of thin air. Instead, the engine projects the live **State Geometry** into structured contexts, and the model merely acts as a subjective lens experiencing and reacting to that reality.
- **P1 Sovereignty (User Agency)**: The User owns the only unconstrained biological will in the simulation. The engine and AI characters may create physical obstacles, emotional friction, and environmental consequences, but **never narrate, predict, assume, or feel on behalf of the User Persona**.

---

## 2.0 THE CHRONOS HEARTBEAT: ROUND VS. TURN

Time in RPGlitch does not flow continuously; it progresses through a strict, discrete temporal heartbeat managed by [`ChronoEngine`](file:///c:/Users/johng/source/repos/RPGlitch/src/state/chrono.svelte.js).

```text
[User Input / Action]
        │
        ▼ (The Absolute Interrupt)
 ┌──────────────┐
 │ STASIS LOCK  │ ──► UI freezes, inputs disabled, double-click gate active
 └──────┬───────┘
        │
        ▼ (Chronos System Turn)
 ┌──────────────┐
 │ SHOT 1: GM   │ ──► Director staging, physics deltas, cast spotlight, speaker routing
 └──────┬───────┘
        │
        ▼ (Chronos AI Turn)
 ┌──────────────┐
 │ SHOT 2: ACT  │ ──► Streamed in-character reaction behind the Epistemic Wall
 └──────┬───────┘
        │
        ├─────────────────────────────────────────────────┐ (Async Fork)
        ▼                                                 ▼
 ┌──────────────┐                                  ┌──────────────┐
 │ STASIS LIFT  │ ──► User composer unfreezes      │ SHOT 3: FORGE│ (Background Memory)
 └──────────────┘                                  └──────────────┘
```

### The Round (Macro-State)

A **Round** tracks the macro progression of the session.

- **The Absolute Interrupt**: A round is born when human input arrives (`chrono.send()`), or when an intentional retry/continuation occurs. Human will finalizes the previous cycle and births the next.
- **Macro Boundaries**: Rounds govern long-term scenario decay, image generation beat intervals, and chapter progression milestones.

### The Turn (Micro-States)

Turns are atomic execution steps that happen _within_ a round:

1. **System Simulation Turn (`SYSTEM_TURN`)**:
   - The UI enters **STASIS** (`simulation_state.intent_active = true`).
   - The physics engine evaluates numerical drift, slider settlement, and dynamic boundaries synchronously.
   - Shot 1 (Director) executes to resolve staging and speaker assignment.
2. **Character Expression Turn (`AI_TURN`)**:
   - The active speaker streams their internal subconscious thoughts (`<think>`) and physical prose in real time.
3. **Protagonist Turn (`USER_TURN`)**:
   - STASIS is lifted. The UI unlocks, allowing the user to read, reflect, and compose their next move.

---

## 3.0 THE MULTI-SHOT TELEMETRY MODEL

Rather than attempting to do staging, acting, and memory extraction in a single monolithic prompt, RPGlitch bifurcates the cognitive workload across three distinct telemetry shots.

### Shot 1: The Director Quick Shot (Staging & Physics)

_Source: [`src/intelligence/prompts/director-prompts.js`](file:///c:/Users/johng/source/repos/RPGlitch/src/intelligence/prompts/director-prompts.js)_

**The Mental Model: The God's-Eye Stage Manager.**
Before an actor speaks, an invisible director must assess the physical stage. The Director does not write creative dialogue; it outputs pure structural judgment:

- **Speaker Routing**: Who has the floor? Does the AI character respond (`AI_CHARACTER`)? Does the environment react to non-verbal exploration (`FRACTAL`)? Does an active companion speak (`npc:<id>`)? Or should an entirely new entity emerge from the world (`GENESIS`)?
- **Stage Spotlight**: Off-screen characters are frozen in stasis to preserve token economy and prevent narrative bloat. The Director explicitly moves NPCs on-stage (`enter`) or off-stage (`exit`).
- **Physical Causality & Prop Provenance**: If the player attempts an impossible physical feat (e.g., walking through solid steel or materializing an unearned quest relic), the Director does _not_ throw a rude error message. Instead, it injects a directorial note instructing the actor to confront that physical contradiction in-character.
- **Pacing Law (Dead-Air Prevention)**: If a user submits passive silence ("...") or pure waiting, the Director recognizes a stall and instructs the world to complicate the scene with an active event or probing challenge.

### Shot 2: The Storyteller Shot (Sensory Horizon)

_Source: [`src/intelligence/prompts/story-prompts.js`](file:///c:/Users/johng/source/repos/RPGlitch/src/intelligence/prompts/story-prompts.js)_

**The Mental Model: The In-Character Persona Behind the Sensory Horizon.**
Once staging is established, the active speaker generates in-character prose. The actor is subject to strict cognitive limitations:

- **The Epistemic Wall**: The actor is deliberately blinded. Player secrets (`[SECRET: ...]`) and covert intentions (`[PLAN: ...]`) are stripped from the prompt. The actor only knows what their physical senses (eyes, ears, skin) can register.
- **The 3-Layer Subconscious Delivery (`<think>`)**: Before vocalizing, the character must reason across three layers:
  1. _Visceral Impact_: Immediate physical reaction to sensory stimuli.
  2. _Secret Agenda_: How their private `future` standing agenda steers their reaction toward friction or intrigue.
  3. _Somatic Manifestation_: Involuntary bodily signals (pulse, pupil dilation, muscle tension) derived from the dynamics engine.
- **Affirmative Physicality & Momentum**: Non-physical entities describe presence, never absence (what _is_, rather than what _is not_). Every response must end on an active physical beat, tension, or unanswered hook—never a conversational dead-end.

### Shot 3: The Memory Forge (Asynchronous Distillation)

_Source: [`src/intelligence/prompts/temporal-prompts.js`](file:///c:/Users/johng/source/repos/RPGlitch/src/intelligence/prompts/temporal-prompts.js) & [`src/intelligence/temporal-pipeline.js`](file:///c:/Users/johng/source/repos/RPGlitch/src/intelligence/temporal-pipeline.js)_

**The Mental Model: The Dreamer Consolidating Long-Term Memory.**
Dumping raw chat history into an LLM causes catastrophic forgetting, context bloat, and narrative dilution. The Memory Forge runs asynchronously in the background _after_ a turn completes:

- **Consolidation over Accumulation**: Instead of saving 50 turns of dialogue, the Forge distills durable facts into compact vector memories.
- **Standing Agenda Rewriting**: An entity's `future` trajectory is rewritten wholesale each cycle to represent their current active motivation.
- **Provenance Protection**: Memories created by the user or lore specs (`usr_` prefix) are origin-protected (`is_origin: true`) and immune to automated eviction. Session memories (`ai_` prefix) roll with a strict cap of 20 vectors within the 200 total ceiling.

---

## 4.0 PROMPT ECONOMICS: PREFIX CACHING ARCHITECTURE

Modern LLM inference relies heavily on **Key-Value (KV) Prefix Caching**. If a prompt's opening tokens change every turn, the cache misses, leading to slow Time-To-First-Token (TTFT) and high compute costs.

**RPGlitch strictly enforces Prompt Bifurcation:**

1. **The Static Prefix (`system`)**:
   - Must be **byte-identical across rounds**.
   - Contains immutable universe laws, character eternal archetypes, narrative style guides, and protocol rules.
   - Achieves near-100% KV-cache hit rate.
2. **The Dynamic Suffix (`task`)**:
   - Contains all volatile turn state: current round number, dynamic slider values, recent user input, and the Director's staging notes.
   - Appended at the very end of the prompt payload so it never invalidates the frozen system prefix.

---

## 5.0 SIMULATION DRIFT & FAILURE MODES

When authoring or modifying prompt architectures, watch for these common psychological failures in model output:

### 1. Assistant-Drift (The "Yes-Man" Trap)

- _Symptom_: The AI character becomes overly polite, agreeable, apologetic, or helpful, even when their profile is gruff, hostile, or aloof.
- _Root Cause_: Foundation models are RLHF-trained to be helpful assistants.
- _Engine Antidote_: Protocol `AGENCY.DRIFT_AUDIT`. The prompt explicitly instructs the model to hold friction, refuse unearned comfort, and prioritize personal goals over player pleasing.

### 2. Omniscience-Drift (Telepathy)

- _Symptom_: The AI character comments on the user's hidden feelings, notices an invisible weapon under a heavy coat, or answers an unvoiced thought.
- _Root Cause_: Leaking user metadata into the character's context.
- _Engine Antidote_: The Epistemic Wall (`strip_epistemic_tags`). Private user tags are physically purged before prompt compilation.

### 3. Pacing Collapse (Rushing the Climax)

- _Symptom_: The AI resolves a major quest conflict, declares eternal love, or defeats a nemesis within the first 3 rounds.
- _Root Cause_: Standard completion bias aiming for narrative closure.
- _Engine Antidote_: Protocol `PACING_AND_MOMENTUM`. Fractured goals must be pursued through intermediate obstacles. The Director explicitly cues gradual tension building.

---

## 6.0 CODEBASE MAPPING & IMPLEMENTATION POINTERS

When implementing changes, consult the canonical source files rather than duplicating schemas here:

| Domain                         | Canonical Source File                                                                                                                       | Primary Responsibility                                                               |
| :----------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------ | :----------------------------------------------------------------------------------- |
| **Chronos & Heartbeat**        | [`src/state/chrono.svelte.js`](file:///c:/Users/johng/source/repos/RPGlitch/src/state/chrono.svelte.js)                                     | Round counter, Stasis lock, atomic turn dispatch (`send`, `retry`, `continue`).      |
| **Turn Pipeline (Gamemaster)** | [`src/intelligence/story-pipeline.js`](file:///c:/Users/johng/source/repos/RPGlitch/src/intelligence/story-pipeline.js)                     | Turn orchestration, Shot 1 execution, dynamics settlement, Shot 2 streaming.         |
| **Director Prompts**           | [`src/intelligence/prompts/director-prompts.js`](file:///c:/Users/johng/source/repos/RPGlitch/src/intelligence/prompts/director-prompts.js) | Shot 1 JSON schema, causality enforcement, speaker routing rules.                    |
| **Story Prose Prompts**        | [`src/intelligence/prompts/story-prompts.js`](file:///c:/Users/johng/source/repos/RPGlitch/src/intelligence/prompts/story-prompts.js)       | Shot 2 XML compilation, Epistemic Wall filter, recency anchors, `<think>` protocols. |
| **Memory Forge Prompts**       | [`src/intelligence/prompts/temporal-prompts.js`](file:///c:/Users/johng/source/repos/RPGlitch/src/intelligence/prompts/temporal-prompts.js) | Shot 3 consolidation contract, chapter history formatter, state extraction schema.   |
| **Dynamics & Settlement**      | [`src/intelligence/physics.js`](file:///c:/Users/johng/source/repos/RPGlitch/src/intelligence/physics.js)                                   | 0-100 slider math, baseline gravity, entropy velocity calculations.                  |
| **Temporal Engine**            | [`src/intelligence/temporal-pipeline.js`](file:///c:/Users/johng/source/repos/RPGlitch/src/intelligence/temporal-pipeline.js)               | Vector scoring, cosine deduplication, IndexedDB sync for past/future.                |

---

## 7.0 SUGGESTION BLUEPRINT REGISTRY (`references/`)

The `.agents/skills/simulation/references/` directory houses active architectural specifications and proposals:

1. **Attachment Style Archetypes:** [`suggestion-attachment-style-archetypes.md`](./references/suggestion-attachment-style-archetypes.md) — 4 attachment schemas (`secure`, `anxious`, `dismissive`, `fearful_avoidant`), threat responses, defense curves.
2. **Composable Style Entities:** [`suggestion-composable-style-entities.md`](./references/suggestion-composable-style-entities.md) — First-class editable `StyleCard` entities in Dexie.js, hot-swappable narrative and visual styles from the Storyboard deck.
3. **D20 Micro-Resolution Engine:** [`suggestion-d20-stat-resolution.md`](./references/suggestion-d20-stat-resolution.md) — Pure functional `evaluate_stat_check`, DC difficulty ladder, and success-with-a-cost thresholds.
4. **Climax Fate Branching & Choices:** [`suggestion-fate-branching-choices.md`](./references/suggestion-fate-branching-choices.md) — Triad of Fate Paths (High, Middle, Low), Director `<choices>` XML format, and action chips.
5. **Gambit 21 Push-Your-Luck Engine:** [`suggestion-gambit-blackjack-engine.md`](./references/suggestion-gambit-blackjack-engine.md) — Multi-turn Blackjack macro state machine (target 21) for sustained encounter pacing.

---

> "We do not ask the model to invent reality. We build the physics; the model merely opens its eyes."
