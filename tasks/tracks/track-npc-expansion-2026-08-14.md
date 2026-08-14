# 🚀 Implementation Blueprint — `track-npc-expansion-2026-08-14`

> **Track Goal**: Build the complete NPC & Living World Ecosystem for RPGlitch, transitioning single-companion roleplay into an autonomous multi-agent social mesh:
>
> 1. **Multi-NPC Roster & Scene Presence**: Support multiple active secondary NPCs across a 3-tier memory hierarchy alongside the primary AI companion.
> 2. **Structured Relationships List**: Flat prose relationship graph (`Aiko → Ren: secretly dating, grew closer this week`) + injected `<CURRENT_STORY_STATE>` prompt block.
> 3. **The Naivety Prior & Credulity Model**: Calibrate how readily NPCs accept incoming player claims and social persuasion based on their `openness` dynamic axis.
> 4. **Epistemic Horizon & Information Vectors**: Enforce strict boundary physics where NPCs only know what they have personally witnessed or received through tangible information vectors.
> 5. **NPC Independence Directive & Protagonist Syndrome Filter**: Enforce sovereign prompt laws establishing that NPCs have independent routines, goals, and off-screen lives.
> 6. **Multi-Voice Kokoro TTS Scenes**: Dynamic Kokoro voice switching mid-narration when dialogue transitions between the narrator, NPCs, and player.

```text
               ┌────────────────────────────────────────────────────────┐
               │              World Roster & Memory Tiering             │
               └───────────┬────────────────┬───────────────────────────┘
                           │                │
             ┌─────────────▼──────┐  ┌──────▼──────────────────┐
             │ Epistemic Horizon  │  │ Social Credulity Engine │
             │ (Information Flow) │  │ (Openness & Friction)   │
             └─────────────┬──────┘  └──────┬──────────────────┘
                           │                │
               ┌───────────▼────────────────▼───────────────────────────┐
               │       Context Assembler (<CURRENT_STORY_STATE>)        │
               └────────────────────────────┬───────────────────────────┘
                                            │
               ┌────────────────────────────▼───────────────────────────┐
               │    Multi-Voice Kokoro Audio Dispatcher (TTS Stream)    │
               └────────────────────────────────────────────────────────┘
```

---

## 1. World Representation & Entity Tiers

To keep context windows lean and memory efficient on standard desktop hardware without sacrificing world depth, entities operate across three distinct operational tiers:

| Tier       | Classification | Memory & Context Overhead | Operational Scope                                                                                                           |
| :--------- | :------------- | :------------------------ | :-------------------------------------------------------------------------------------------------------------------------- |
| **Tier 1** | Background     | Zero persistent memory    | Incidental scene dressings (bartenders, sentries, merchants). Functional dialogue and immediate sensory reactions only.     |
| **Tier 2** | Recurring      | Light persistent memory   | Faction contacts, rivals, and acquaintances. Retains plot milestones and flat relational prose (`relationships: string[]`). |
| **Tier 3** | Major          | Full Unified Memory Model | Primary co-protagonists, key companions, core antagonists. Persistent episodic, emotional, and procedural states.           |

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
    - Scope: Retains plot history and direct relationship state (relationships: string[]).
  </TIER>

  <!-- Tier 3: Major NPCs / Companions -->
  <TIER level="3" name="MAJOR">
    - Role: Primary story co-protagonists and key antagonists.
    - Scope: Full Unified Memory (Episodic, Emotional, Procedural) and dynamic psychological state vectors.
  </TIER>
</NPC_ECOLOGY>
```

### Relational State Schema

Relationships are stored as dynamic, directed prose statements rather than heavyweight nested graph matrices. This keeps context injection compact and human-readable:

- **Data representation**: Array of plain strings attached to the entity (`relationships: string[]`).
- **Format syntax**: `"[Source] → [Target]: [Relational dynamic and recent history]"`.
- **Example**: `"Ren → Mia: deeply distrustful after the break-in"`.

---

## 2. Cognitive Physics & Social Dynamics

```xml
<ECOLOGICAL_MESH Authority="L3_HIGH">
  <RULE name="PROTAGONIST_SYNDROME_FILTER">
    1. NPCs are sovereign individuals with independent routines, loyalties, debts, and off-screen agendas.
    2. The world does NOT pause when the player departs. Time advances, relationships evolve, and events occur in the background.
    3. NPCs will disagree, withhold information, pursue self-interest, and reject the player's demands when their internal logic dictates.
  </RULE>
</ECOLOGICAL_MESH>
```

### A. The Epistemic Horizon & Information Propagation

To eliminate psychic NPC tendencies, the engine strictly bounds NPC knowledge:

- **Null Data Principle**: Unspoken player thoughts, off-screen events, and unshared plot points are strictly inaccessible **Null Data** to NPCs.
- **Vector Validation**: Knowledge must travel along physical conduits: direct sight, auditory range, physical correspondence, or rumor networks. If no physical vector connects an event to an NPC, the NPC acts with zero knowledge.

### B. Naivety Prior & Credulity Dynamic

NPCs do not treat player statements as absolute truth. Persuasion and claim acceptance are governed by the dynamic `openness` axis:

- **High Openness**: Lower baseline friction; more receptive to direct claims and rapid social updates.
- **Low Openness**: High friction; claims without corroborating physical evidence are met with suspicion.
- **Evidence Accumulation**: Skeptical entities require behavioral track records before updating their internal trust state.

### C. System Trade-Off Analysis

#### Prose-Based Relational Strings vs. Formal Graph Databases

- **For**: Extremely low token overhead, natively understood by LLM attention mechanisms, zero serialization latency.
- **Against**: Lacks native relational querying, pathfinding, or mathematical clustering across massive NPC populations.

#### Heuristic Openness Axis vs. Probabilistic Bayesian Updating

- **For**: Intuitive to prompt, rapid execution, eliminates runtime math overhead during inference.
- **Against**: Less mathematically deterministic across high turn-count dialogues.

---

## 3. Dynamic Multi-Voice Acoustic Pipeline

During turn generation, the monologue/dialogue transcript is parsed by speaker attribution to orchestrate smooth multi-character voice transitions:

```text
[Narrated Stream]
   │
   ├── "The rain hammered against the glass." (Narrator) ──> Kokoro: bm_george
   ├── "We can't stay here," Ren whispered.  (Ren)      ──> Kokoro: am_adam
   └── "I know," Mia sighed.                 (Mia)      ──> Kokoro: af_heart
```

- Parser divides the output text into speaker-tagged sequential chunks.
- Voice IDs (e.g., `af_heart`, `am_adam`, `bm_george`) are mapped dynamically against the active entity roster.
- Audio buffers are enqueued sequentially to prevent overlapping output or voice-switching latency spikes.

---

## 4. Implementation Playbook (Bite-Sized Checklist)

### Phase 1: Test-Driven Red Suite

- [ ] **Create unit tests for schema normalization** in `src/data/normalizer.test.js` covering relationship arrays and length limits.
- [ ] **Write parser unit tests** in `src/media/audio.test.js` validating speaker attribution segmentation and voice mapping.
- [ ] **Add prompt assembly tests** in `src/intelligence/prompts.test.js` ensuring `<CURRENT_STORY_STATE>`, credulity markers, and vector constraints render correctly.

### Phase 2: Core Logic & Prompt Construction

- [ ] **Add `relationships: string[]` field** with validation and defaults inside `src/data/schema.js` and `src/data/normalizer.js`.
- [ ] **Implement `split_speech_by_speaker(text, entity_roster)`** in `src/media/audio.svelte.js` to segment text by speaker and route voice URIs.
- [ ] **Inject the `<ECOLOGICAL_MESH>` directive** and `<CURRENT_STORY_STATE>` blocks inside `src/intelligence/prompts.js`.

### Phase 3: Interface & Scene Expression

- [ ] **Add secondary NPC visual cards** to the Storyboard/Aside UI components.
- [ ] **Wire up dynamic roster indicators** showing which secondary characters currently occupy the scene.

### Phase 4: Verification & Stress Testing

- [ ] **Execute test verification suite**:

  ```bash
  npm run verify
  ```

  _(Runs `test:unit`, `test:design`, `lint`, and `svelte-check`)_.

- [ ] **Run a multi-character interactive simulation** to verify voice-switching transitions and epistemic boundary containment in audio playback.

### Phase 5: Deployment & Archival

- [ ] **Execute the production bundle build**:

  ```bash
  npm run build
  ```

- [ ] **Update tracking documentation** in `tasks/PRESENT.md` and archive the blueprint.
