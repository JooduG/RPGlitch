# 🚀 Implementation Blueprint — `track-npc-expansion-2026-08-14`

> **Track Goal**: Build the complete NPC & World Living Ecosystem for RPGlitch, turning static single-companion roleplay into a dynamic multi-character world:
>
> 1. **Multi-NPC Roster & Scene Presence**: Support multiple active secondary NPCs alongside the primary AI companion.
> 2. **Structured Relationships List**: Flat prose relationship graph (`Aiko → Ren: secretly dating, grew closer this week`) + injected `<CURRENT_STORY_STATE>` prompt block.
> 3. **The Naivety Prior & Credulity Model**: Calibrate how readily NPCs accept incoming player claims and social persuasion based on their `openness` dynamic axis.
> 4. **Epistemic Horizon & Information Vectors**: Enforce strict boundary physics where NPCs only know what they have personally witnessed or received through tangible information vectors.
> 5. **NPC Independence Directive**: Prompt architecture establishing that NPCs have independent routines, goals, and off-screen lives ("The player is one person in this world, not its center").
> 6. **Multi-Voice Kokoro TTS Scenes**: Dynamic Kokoro voice switching mid-narration when dialogue transitions between the narrator, NPCs, and player.

---

## 🎯 Goal & Specifications

### 1. Multi-NPC Roster & Scene Presence

- Expand story session state to track a roster of active and background NPCs in the active Fractal/Setting.
- Allow the Director to pull secondary characters into scenes dynamically or swap in-focus characters.

#### Three-Tier NPC Roster Architecture

To populate rich living worlds without exploding token budgets, secondary characters are managed across three operational tiers:

```text
[WORLD ROSTER] ──> Tier 1: Background (Function-Only, Zero Memory Overhead)
               ──> Tier 2: Recurring  (Plot Memory, Relationship Anchors)
               ──> Tier 3: Major      (Full Unified Memory, Autonomous Agenda)
```

```xml
<NPC_ECOLOGY Authority="L3_HIGH">
  <!-- Tier 1: Background NPCs -->
  <TIER level="1" name="BACKGROUND">
    - Role: Incidental world presence (bartender, merchant, sentry, passerby).
    - Scope: Functional dialogue and immediate sensory reaction only. Zero persistent memory overhead.
  </TIER>

  <!-- Tier 2: Recurring NPCs -->
  <TIER level="2" name="RECURRING">
    - Role: Secondary characters, faction contacts, known acquaintances.
    - Scope: Retains plot history and direct relationship state (`relationships: string[]`).
  </TIER>

  <!-- Tier 3: Major NPCs / Companions -->
  <TIER level="3" name="MAJOR">
    - Role: Primary story co-protagonists and key antagonists.
    - Scope: Full Unified Memory (Episodic, Emotional, Procedural) and dynamic psychological state vectors.
  </TIER>
</NPC_ECOLOGY>
```

### 2. Structured Relationships List

- **Storage**: Maintain a lightweight per-entity prose list of active relationships (`relationships: string[]`, e.g. `"Ren → Mia: deeply distrustful after the break-in"`).
- **Prompt Injection**: Injected as `<CURRENT_STORY_STATE>` block into Director and Character prompts, providing grounded relational memory.

### 3. The Naivety Prior & Credulity Model

To model believable social friction and prevent NPCs from acting as gullible yes-men:

- **Baseline Credulity (`openness` axis)**: High `openness` represents baseline trust and receptivity; low `openness` represents hardened skepticism.
- **Evidence Triggers & Accumulation**: When a player makes promises, excuses, or assertions ("I swear", "it wasn't me"), skeptical NPCs treat assertions with suspicion unless backed by consistent actions over time. Naive NPCs update beliefs more rapidly on single claims.

### 4. Epistemic Horizon & Information Vectors

To eliminate omniscient NPC slop and maintain hard world physics:

- **No Mind-Reading / Null Data**: Unspoken player motives, secrets, or behind-the-scenes actions remain inaccessible **Null Data** to NPCs until physically voiced or demonstrated.
- **Information Vectors**: Facts must travel via a tangible medium (direct line of sight, hearing a conversation, intercepting a message, or hearing town gossip). If no vector connected the event to the NPC, the information does not exist for them.

### 5. NPC Independence & Off-Screen Trajectories

- Embed sovereign prompt law across Narrator and Director systems:
  > "NPCs are fully independent people with their own routines, loyalties, and off-screen agendas. They do not wait idly for the protagonist. The world advances in their absence."
- Secondary NPCs can form or alter relationships with each other independently of the player's presence.

```xml
<ECOLOGICAL_MESH Authority="L3_HIGH">
  <RULE name="PROTAGONIST_SYNDROME_FILTER">
    1. NPCs are sovereign individuals with independent routines, loyalties, debts, and off-screen agendas.
    2. The world does NOT pause when the player departs. Time advances, relationships evolve, and events occur in the background.
    3. NPCs will disagree, withhold information, pursue self-interest, and reject the player's demands when their internal logic dictates.
  </RULE>
</ECOLOGICAL_MESH>
```

### 6. Multi-Voice Kokoro TTS Dialogue Switching

- During turn narration, split transcript across speakers (Narrator, Character A, Character B).
- Switch Kokoro voice URIs (`af_heart`, `am_adam`, `bm_george`, etc.) dynamically between dialogue segments during audio stream generation.

---

## 🏗️ Technical Design

### 1. Data Schema (`src/data/normalizer.js` & `src/data/schema.js`)

- Add `relationships: string[]` to entity schema with length caps and defaults.
- Support secondary NPC references in session models.

### 2. Prompt Engineering (`src/intelligence/prompts.js`)

- Inject `<CURRENT_STORY_STATE>` (relationships and active NPC statuses).
- Add the **NPC Independence Directive**, **Naivety Prior / Credulity Guidelines**, and **Epistemic Information Vector Boundaries** to Director and Narrator prompts.

### 3. Audio Voice Switching (`src/media/audio.svelte.js`)

- `split_speech_by_speaker(text, entity_roster)`: Maps dialogue quotes and attributions to specific Kokoro voice URIs, enqueuing voice-swapped audio buffers seamlessly.

---

## 📋 Task Checklist

- [ ] **Phase 1 (RED — Unit Tests)**:
  - [ ] Relationships normalization and formatting tests (`src/data/normalizer.test.js`).
  - [ ] Speaker segmentation and multi-voice dispatch tests (`src/media/audio.test.js`).
  - [ ] NPC independence, naivety prior, and epistemic vector prompt assembly assertions (`src/intelligence/prompts.test.js`).

- [ ] **Phase 2 (GREEN — Core Logic)**:
  - [ ] Implement `relationships` field in schema & normalizer.
  - [ ] Implement multi-voice segmentation in `src/media/audio.svelte.js`.
  - [ ] Update Director and Narrator prompts with NPC independence, naivety credulity, and `<CURRENT_STORY_STATE>` blocks in `src/intelligence/prompts.js`.

- [ ] **Phase 3 (UI & Interactive Expression)**:
  - [ ] Render secondary NPC cards in Storyboard / side asides.

- [ ] **Phase 4 (VERIFY)**:
  - [ ] Run `npm run verify` (`test:unit`, `test:design`, `lint`, `svelte-check`).
  - [ ] Simulate multi-character dialogue and test TTS voice switching across speakers.

- [ ] **Phase 5 (HANDOFF & DEPLOY)**:
  - [ ] Run `npm run build` for single-file bundle verification.
  - [ ] Update `tasks/PRESENT.md` and archive blueprint.
