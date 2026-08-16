# 🚀 Implementation Blueprint — `track-npc-expansion-2026-08-14`

> **Track Goal**: Build the complete NPC & Living World Ecosystem for RPGlitch, transitioning single-companion roleplay into an autonomous multi-agent social mesh:
>
> 1. **World Roster, 3-Tier Hierarchy & Stage Spotlight**: Support secondary NPCs across a 3-tier memory model (Background, Recurring, Major) scoped to Fractals/Worlds, with the Stage Spotlight model freezing off-screen entity dynamics in stasis to prevent token waste.
> 2. **Context Window Protection & The Compact Cast Index**: Represent off-screen world entities as ultra-compact 1-line signatures (~25 tokens each) backed by vector RAG pre-fetching and the Entity Convergence Law to prevent duplicate character hallucination.
> 3. **Flat Relational Mesh & Cognitive Physics**: Maintain lightweight directed relationship vectors (`"[Source] → [Target]: [Relational dynamic]"`) paired with the Naivety Prior / Credulity model (`openness` axis) and strict Epistemic Horizons (Null Data principle).
> 4. **Director NPC Delegation & In-Scene Memory Salience**: Enable the Director to delegate dialogue execution directly to any active in-scene NPC (`speaker: "npc:<id>"`) with a 1.3x vector RAG relevance boost for entities physically present in the room.
> 5. **Dynamic Multi-Voice Acoustic Pipeline**: Automatically segment streaming narrative text by dialogue speaker attribution to dispatch seamless multi-voice Kokoro-82M neural TTS playback.

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        LIVING WORLD & MULTI-NPC SOCIAL MESH PIPELINE                   │
│                                                                                        │
│  [World Cast / RAG] ──► [Director Scene Tracking] ──► [Prompt Assembly]                │
│   • 1-Line Signatures     • Stage Spotlight (In-Scene)  • <SCENE_ROSTER>               │
│   • Convergence Law       • Off-Screen Stasis (Frozen)  • <RELATIONAL_MESH>            │
│   • Genesis & Promotion   • Speaker Delegation          • <EPISTEMIC_HORIZON>          │
│                                                               │                        │
│                                                               ▼                        │
│  [Multi-Voice Kokoro TTS] ◄── [Speaker Segmentation] ◄── [Streaming Prose]             │
│   • Narrator (bm_george)        (Quotes & Tags)           (AI / NPC / Fractal)         │
│   • Companion (af_heart)                                                               │
│   • Secondary NPC (am_adam)                                                            │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 1. Entity Hierarchy & World Roster Architecture

To maintain lean context windows and zero-friction client-side performance, entities operate across three distinct operational tiers:

| Tier       | Classification | Memory & State Overhead | Operational Scope                                                                                                                                                |
| :--------- | :------------- | :---------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Tier 1** | **Background** | Zero persistent memory  | Incidental scene dressings (bartenders, sentries, merchants). Ephemeral in-stream text; no database row until promoted.                                          |
| **Tier 2** | **Recurring**  | Light persistent memory | Faction contacts, rivals, and acquaintances. Retains plot history, relationship graph, and active dynamics (`relationships: string[]`).                          |
| **Tier 3** | **Major**      | Full 4-Quadrant Memory  | Primary co-protagonists, companions, and core antagonists. Persistent episodic memories (`past`), dynamic axes (`dynamics`), and consolidated agenda (`future`). |

### 1.1 Universal Relational Graph & Data Schema (`src/data/normalizer.js`)

Instead of rigid foreign keys or fixed relationship categories, **plain-text directed relationship vectors (`"[Source] → [Target]: [Dynamic]"`)** unify interpersonal bonds, world affiliations, and faction standings:

- **Entity ➔ World (Fractal Casting)**: `"Elias → Tartarus: Chief Medical Officer at Sector 4"` automatically registers Elias into Tartarus's `<WORLD_CAST>`.
- **Entity ➔ Entity (Interpersonal Dynamic)**: `"Elias → Benedict: Wary collaborator, suspects classified augmentations"`.
- **World ➔ Entity (Faction Standing / Bounty)**: `"Tartarus → Julien: Wanted by Sector Enforcers for high treason"`.

```javascript
// Extended Character & Fractal Entity Schema
{
  id: "char_uuid",
  name: "Dr. Elias Tariq",
  type: "character",
  role_tier: 2, // 1 = Background, 2 = Recurring, 3 = Major
  is_wanderer: false, // If true, can appear across any compatible world
  relationships: [
    "Elias → Tartarus: Chief Medical Officer at Sector 4",
    "Elias → Benedict: Wary collaborator, suspects hidden cybernetics",
    "Elias → Julien: Protective of his fragile neurological condition"
  ],
  dynamics: {
    chaos: 35,
    intensity: 45,
    openness: 60, // Governs credulity & persuasion friction
    affinity: 50
  },
  eternal: { physical: "Silver-haired cyber-physician", non_physical: "Methodical, cynical" },
  present: { physical: "[COAT: lab trenchcoat]", non_physical: "Cautious" },
  past: [],
  future: "Secure clean medical supplies before the sector lockdown.",
  voice_register: "am_adam"
}
```

### 1.2 Dedicated Profile "Relationships" Section (`src/ui/profile/`)

At the bottom of the Profile modal (across Characters and Fractals):

- **View Mode**: Displays relational badges showing the target entity's name, role/dynamic, and target signature color.
- **Edit Mode**: An open-ended vector editor allowing players to freely add (`+ Add Relationship`), edit, or delete relationship strings.
- **Live Story Updates**: When significant relational shifts happen (betrayals, rescues, alliances), the Director mutates `relationships` dynamically in the turn pass.

### 1.3 The Stage Spotlight Model & Dynamics Stasis

NPCs do not linger on stage indefinitely; they enter and exit like theatrical actors:

```text
┌────────────────────────────────────────────────────────┐
│                   THE THEATRE STAGE                    │
│                                                        │
│   ON-STAGE (In-Scene)          BACKSTAGE (Off-Screen)  │
│   ┌──────────────────────┐     ┌─────────────────────┐ │
│   │ • Dr. Elias          │     │ • Captain Vane      │ │
│   │ • Benedict           │     │ • Fixer Kael        │ │
│   │ • Julien (Player)    │     └─────────────────────┘ │
│   └──────────────────────┘                             │
│      Active Dynamics &            FROZEN IN STASIS     │
│      Dialogue Streaming          Zero Token Overhead   │
└────────────────────────────────────────────────────────┘
```

- **In-Scene Presence**: `runtime.in_scene_npc_ids` (`SvelteSet<string>`) tracks entities physically in the room.
- **Dynamics Stasis**: The Director **only evaluates dynamics for entities in `in_scene_npc_ids`**. When the player leaves the clinic, Dr. Elias exits the stage (`"in_scene_change": { "exit": ["char_elias"] }`), and his dynamics freeze in stasis with zero token or computation overhead.

### 1.4 The Genesis Lifecycle & Promotion Ladder

```text
┌──────────────┐          Sustained Bond /          ┌──────────────┐          Major Alliance /      ┌──────────────┐
│    TIER 1    │ ─────────────────────────────────► │    TIER 2    │ ─────────────────────────────► │    TIER 3    │
│  Background  │   Director flags "promote": 2      │  Recurring   │   Director flags "promote": 3  │  Co-Star     │
└──────────────┘                                    └──────────────┘                                └──────────────┘
• Zero DB cost                                      • Dexie persistent                              • Full 4-Quadrant Memory
• Ephemeral text                                    • Relational strings                            • Pinned memory vectors
• Immediate sensory                                 • Dynamics (Openness/Affinity)                  • Swappable to Main Party
```

- **Emergence**: When the player engages with a new character, they begin as an ephemeral Tier 1 mention.
- **Promotion**: If the interaction becomes sustained or consequential (deals, promises, shared trauma), the Director flags `"promote": 2`, minting a persistent Dexie entity with baseline dynamics and relationship anchors.
- **Ascension to Tier 3**: If a recurring NPC joins the party full-time, they unlock full vector RAG memory and standing future agendas.

---

## 2. Cognitive Physics & Context Protection

### 2.1 The Compact Cast Index & Vector RAG Pre-Fetching

To prevent blowing up the context window with dozens of full profiles:

1. **Ultra-Compact Cast Signatures**: In the Director prompt, off-screen Fractal inhabitants are compressed into single-line signatures (~25 tokens each):

```xml
<WORLD_CAST>
- Dr. Elias Tariq (id: char_elias): Cybernetic physician at Lower Clinic [Clinic/Medical]
- Fixer Kael (id: char_kael): Black-market broker in Neon Alley [Trade/Underworld]
- Captain Vane (id: char_vane): Corrupt dockmaster at Sub-Level 4 [Docks/Security]
</WORLD_CAST>
```

2. **Semantic Vector RAG (Large Worlds)**: For worlds with 20+ NPCs, the engine pre-matches the player's input against the NPC registry using local ONNX embeddings (`embeddings.svelte.js`), injecting **only the top 2–3 relevant candidate signatures** into `<WORLD_CAST>`.

3. **Active Trio Exclusion Filter**: The active Protagonist (`runtime.active_user`) and Companion (`runtime.active_ai`) are **strictly excluded from `<WORLD_CAST>`**. If Julien has `"Julien → Ashenweald: Banished Prince"`, it is injected into `<RELATIONAL_MESH>` as world standing and political lore, ensuring the Protagonist is never mistakenly treated as a secondary stranger to be summoned into the room.

### 2.2 The Entity Convergence Law

To eliminate hallucinated duplicate characters (e.g. inventing a new doctor when Dr. Elias already exists):

```xml
<ENTITY_CONVERGENCE_LAW>
1. Always inspect <WORLD_CAST> before introducing any secondary character.
2. If an existing cast member matches the role or location (e.g. medical, black market, security), you MUST use that existing entity rather than inventing a duplicate.
3. Only introduce a new nameless character if no existing cast member is remotely applicable.
</ENTITY_CONVERGENCE_LAW>
```

### 2.3 The Epistemic Horizon & Null Data Principle

- **Null Data Principle**: Unspoken player thoughts, off-screen events, and secret inventory items across the epistemic wall are strictly inaccessible **Null Data**.
- **Information Vectors**: Knowledge travels strictly along physical conduits (direct sight, acoustic range, written correspondence).
- **Zero Telepathy**: If no physical conduit connects an event to an NPC, the NPC acts with zero knowledge.

### 2.4 The Naivety Prior & Credulity Model

Persuasion and claim acceptance are governed by the dynamic `openness` axis:

- **High Openness (>= 70)**: Receptive to plausible claims, rapid social rapport.
- **Moderate Openness (40–69)**: Balanced skepticism; requires logical consistency.
- **Low Openness (<= 39)**: High friction; demands physical proof, suspects deception.

---

## 3. Multi-Entity Prompt Compilation & Director Execution

```text
┌────────────────────────────────────────────────────────────────────────┐
│                        DIRECTOR EXECUTION DISPATCH                     │
│                                                                        │
│  Director Decision: "speaker": "npc:char_elias"                        │
│                           │                                            │
│                           ▼                                            │
│  Kernel: Loads Elias Entity + In-Scene Context + Somatic Directives    │
│                           │                                            │
│                           ▼                                            │
│  Prompt Engine: Compiles <NPC_PERSONA> + <SCENE_ROSTER> + Relational   │
│                           │                                            │
│                           ▼                                            │
│  Storyteller Engine: Streams Elias's In-Character Dialogue & Action    │
└────────────────────────────────────────────────────────────────────────┘
```

### 3.1 Prompt Assembly Blocks (`src/intelligence/prompts.js`)

```xml
<CURRENT_STORY_STATE>
  <SCENE_ROSTER>
    - Primary Companion: Lord Benedict Silvers (In-Scene)
    - Active NPC: Dr. Elias Tariq [Tier 2] (In-Scene, Openness: 60)
    - Off-Screen NPC: Captain Vane [Tier 2] (Docks, In Stasis)
  </SCENE_ROSTER>

  <RELATIONAL_MESH>
    - Elias → Benedict: wary collaborator, suspects hidden tech
    - Elias → Julien: protective of his medical condition
    - Benedict → Elias: values surgical skill, distrusts questions
  </RELATIONAL_MESH>

  <EPISTEMIC_RULES>
    1. Entities only perceive spoken dialogue, visible actions, and physical items in the room.
    2. Private player thoughts, unseen inventory, and off-screen events are NULL DATA.
  </EPISTEMIC_RULES>
</CURRENT_STORY_STATE>
```

### 3.2 In-Scene Vector Memory Salience

In `src/intelligence/temporal.js`, memory vectors belonging to entities currently flagged in `runtime.in_scene_npc_ids` receive an automatic **1.3x relevance multiplier** in `compute_relevance()`, guaranteeing sharp conversational recall for characters in the room.

---

## 4. Dynamic Multi-Voice Acoustic Pipeline (Kokoro TTS)

```text
[Streaming Transcript]
       │
       ├── "The rain hammered against the glass." ──► Narrator Voice (bm_george)
       ├── "We can't stay here," Benedict said.  ──► Companion Voice (af_heart)
       └── "The wound is septic," Elias snapped. ──► NPC Voice (am_adam)
```

### 4.1 Speaker Attribution Parser (`src/media/audio.svelte.js`)

- `split_speech_by_speaker(text, active_roster)`:
  - Scans for quoted dialogue clauses and trailing/leading attribution tags (`said Elias`, `Benedict whispered`).
  - Unquoted prose is mapped to the Fractal/World Narrator voice (`bm_george`).
  - Quoted dialogue is mapped to the corresponding entity's `voice_register`.
- **Sequential Audio Queue**: Enqueues generated audio buffers sequentially into Web Audio nodes, preventing voice overlap or latency spikes.

---

## 5. Implementation Roadmap (Phased TDD)

### Phase 1: Data Model & Schema Normalization (Red ➔ Green)

- [ ] **1.1 Schema Normalization**: Update `src/data/normalizer.js` to support `role_tier: 1 | 2 | 3`, `fractal_id`, `is_wanderer`, and `relationships: string[]` with tests in `src/data/normalizer.test.js`.
- [ ] **1.2 Story Schema Update**: Add `npc_ids: string[]` to story normalization and repository schemas in `src/data/repository.js`.
- [ ] **1.3 Roster State**: Add `in_scene_npc_ids` reactive set to `src/state/runtime.svelte.js`.

### Phase 2: Cognitive Physics & Prompt Compilation (Red ➔ Green)

- [ ] **2.1 Prompt Blocks**: Implement `<CURRENT_STORY_STATE>`, `<WORLD_CAST>`, `<SCENE_ROSTER>`, `<RELATIONAL_MESH>`, and `<ENTITY_CONVERGENCE_LAW>` in `src/intelligence/prompts.js`.
- [ ] **2.2 Prompt Unit Tests**: Write tests in `src/intelligence/prompts.test.js` validating relational graph rendering, compact cast index formatting, and epistemic rules.
- [ ] **2.3 In-Scene RAG Salience**: Apply 1.3x in-scene relevance multiplier in `src/intelligence/temporal.js` with tests in `src/intelligence/temporal.test.js`.

### Phase 3: Director NPC Dispatch & Execution (Red ➔ Green)

- [ ] **3.1 Dynamic Speaker Dispatch**: Update `gamemaster.execute_turn()` in `src/intelligence/kernel.js` to resolve `speaker: "npc:<id>"` and build dedicated NPC persona prompts.
- [ ] **3.2 Stage Spotlight Scene Tracking**: Wire Director JSON parsing to update `runtime.in_scene_npc_ids` on arrivals (`enter`) and exits (`exit`).
- [ ] **3.3 Genesis & Promotion Engine**: Implement `spawn_npc` and `promote` handling in `src/intelligence/kernel.js` to persist and promote dynamic entities to Dexie.
- [ ] **3.4 Kernel Tests**: Write unit tests in `src/intelligence/kernel.test.js` verifying NPC turn generation, badge resolution, and memory updates.

### Phase 4: Acoustic Multi-Voice Pipeline (Red ➔ Green)

- [ ] **4.1 Speaker Segmentation**: Implement `split_speech_by_speaker(text, active_roster)` in `src/media/audio.svelte.js`.
- [ ] **4.2 Parser Unit Tests**: Write unit tests in `src/media/audio.test.js` covering multi-character dialogue attribution and quote parsing.
- [ ] **4.3 Multi-Voice Queue**: Wire sequential voice dispatching in `Audio.speak()` to transition smoothly across narrator and character voices.

### Phase 5: UI & Scene Roster Presentation

- [ ] **5.1 In-Scene Badges**: Render secondary NPC presence badges in `Storymode.svelte` and `Feed.svelte`.
- [ ] **5.2 Entity Card Support**: Enable secondary NPC profile viewing in edit/read-only mode via `EntityCard.svelte` and `Profile.svelte`.

### Phase 6: System Verification & Release

- [ ] **6.1 Full Test Suite**: Run `npm run verify` (0 errors, 0 warnings across all test suites).
- [ ] **6.2 Singlefile Build**: Run `npm run deploy:prepare` to verify single-file production compilation.
