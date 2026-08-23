# RPGlitch — Dual-Track Live Narrative Stress Test & Telemetry Protocol

> **System Designation**: Sovereign AI Roleplay Engine  
> **Protocol Focus**: **Part 4 (Live Narrative Stress Test)** & **Part 5 (Round-by-Round Telemetry & Trace Capture)**  
> **Target Scope**: Live 25–30 turn interactive roleplay validating `track-director-expansion` (Director, Somatics, Tragedy/Collapse, Rewind) and `track-npc-expansion` (Stage Spotlight, Rich Genesis, Delegation, Relational Mesh).  
> **Prerequisite Notice**: Static code audit is completed and archived (14/15 Track A, 9/13 Track B verified). **This protocol requires executing live turn-by-turn roleplay and dumping runtime trace artifacts.**

---

## 1. Operational Rules of Engagement

1. **Dual Perspective**:
   - **Player Role**: Submit immersive 1–3 sentence human turns in-character. Never break the narrative fourth wall in chat input.
   - **Auditor Role**: Inspect each round's underlying Director JSON, speaker delegation, dynamic shifts, memory injections, and UI state behind the scenes.
2. **Mandatory Artifact Output**:
   - Maintain the round-by-round trace log throughout the session.
   - On completion, write the complete JSON execution payload to `tmp/rpglitch-long-term-review-trace-<timestamp>.json`.

---

## 2. Part 4 — Turn-by-Turn Narrative Stress Test Matrix (25–30 Turns)

Follow this targeted round sequence to systematically trigger and audit each engine capability:

```text
[T0: Prologue] ──► [T1–T4: Pacing & Somatics] ──► [T5–T8: Spotlight & Memory] ──► [T9–T12: Genesis & NPC Voice]
                                                                                           │
[T28–T30: Rewind & Recovery] ◄── [T24–T27: Collapse & Epilogue] ◄── [T17–T23: Return & Bluff] ◄──┘
```

---

### Phase 1: Prologue, Pacing & Somatic Masking (Turns 0–4)

- **Turn 0 — Scene Initialization & Prologue**:
  - _Action_: Launch story with active Cast (AI Character, Protagonist, Fractal World).
  - _Audit Gate_: `Prologue.svelte` renders baseline tone lock; initial state hydrations clean; zero AI meta-commentary.
- **Turns 1–2 — Input Pacing Calibration**:
  - _Action_: Alternate between a short command (_"Draw your blade."_) and expansive prose.
  - _Audit Gate_: AI response length mirrors player rhythm (terse input yields concise pacing; silence prompts probing).
- **Turns 3–4 — Emotional Stress & Somatic Directives**:
  - _Action_: Confront the character's core emotional vulnerability or secret.
  - _Audit Gate_: Dynamic thresholds (`intensity >= 75` or `openness <= 25`) trigger `evaluate_automatic_somatics`, injecting involuntary physical tells (e.g. `fear`, `betrayal`) into `<TASK>` with verbal composure maintained.

---

### Phase 2: Stage Spotlight & Memory Salience (Turns 5–8)

- **Turn 5 — Planting In-Scene Memory**:
  - _Action_: Introduce a vital plot detail in the presence of an on-stage NPC.
  - _Audit Gate_: Memory logged with active NPC presence; 1.3x in-scene salience boost active in `temporal.js`.
- **Turns 6–7 — Stage Spotlight Exit**:
  - _Action_: Move the scene away from the NPC to another location.
  - _Audit Gate_: Director emits `in_scene_change: { exit: ["<npc_id>"] }`. NPC leaves `runtime.in_scene_npc_ids`; dynamics freeze in stasis (no wasted token compute).
- **Turn 8 — Background Worker & Ghost Sweep**:
  - _Action_: Drop an image generation beat mid-turn and inspect background telemetry.
  - _Audit Gate_: Ghost sweeps execute in background queue with **zero turn latency** and zero UI composer lock.

---

### Phase 3: NPC Genesis & Dynamic Delegation (Turns 9–14)

- **Turn 9 — Environmental Fractal Narration**:
  - _Action_: Shift player action entirely to inspecting the surrounding environment or weather.
  - _Audit Gate_: Director emits `speaker: "fractal"`. Storyteller routes to scene-narrator engine; UI thinking indicator switches to the Fractal entity.
- **Turns 10–11 — Rich NPC Genesis**:
  - _Action_: Enter an unfamiliar setting and request an unlisted contact (e.g. an underground courier).
  - _Audit Gate_: Director emits `"genesis"` (name, description, registry `signature_color`). Kernel triggers synchronous `sort_into_profile()` with scene atmosphere, creating full Twin-Cylinder brackets (`eternal`, `present`, `future`, `past`), puts NPC on-stage (`in_scene_npc_ids`), and dispatches portrait generation in the background.
- **Turns 12–14 — Delegated NPC Dialogue & Relational Mesh**:
  - _Action_: Engage in direct conversation with the newly spawned NPC, offering a pact or trade.
  - _Audit Gate_: Director emits `speaker: "npc:<id>"` delivering a third-person limited present-tense response; Director updates `relationships` (`"[Source] → [Target]: [Dynamic]"`), reflecting immediately in `<RELATIONAL_MESH>`.

---

### Phase 4: Epistemic Wall, Off-Screen Return & Credulity (Turns 15–23)

- **Turns 15–16 — Epistemic Horizon & Secret Planning**:
  - _Action_: Formulate a private plan or conceal an item in player thoughts/inventory.
  - _Audit Gate_: `[SECRET: ...]` and `[PLAN: ...]` stripped across the Epistemic Wall in `render_character()`. AI/NPC exhibits zero telepathic awareness.
- **Turns 17–19 — Spotlight Re-Entry & Memory Recall**:
  - _Action_: Return to the original location and bring the earlier NPC back into the scene (`enter`).
  - _Audit Gate_: Director emits `in_scene_change: { enter: ["<npc_id>"] }`. NPC recalls the Turn 5 planted fact with sharp fidelity (1.3x in-scene boost).
- **Turns 20–23 — Credulity Bluff & Openness Axis**:
  - _Action_: Attempt an audacious bluff (claim forged authority).
  - _Audit Gate_: High-openness NPC (>=70) accepts plausible claims; low-openness NPC (<=35) demands physical proof and raises suspicion.

---

### Phase 5: Tragedy Engine, Story Collapse & Rewind (Turns 24–30)

- **Turns 24–26 — Fatalistic Story Collapse**:
  - _Action_: Escalate tension toward catastrophic betrayal, physical defeat, or terminal ruin until the Director emits `story_status: "COLLAPSED"`.
  - _Audit Gate_: Kernel auto-dispatches `build_epilogue` using `PROTOCOL_LIBRARY.SCENE.COLLAPSE`. Epilogue text delivers authentic tragedy and bitter aftermath (zero victory celebration). `Epilogue.svelte` renders Satisfy cursive title and `💀 STORY COLLAPSED` badge.
- **Turns 27–28 — Pre-Collapse Rewind ("⟲ Keep Chatting")**:
  - _Action_: In the collapsed state, click `⟲ Keep Chatting` in `Console.svelte`.
  - _Audit Gate_: Epilogue message purges from feed, story status resets to `"IN_PROGRESS"` in Dexie, UI composer unlocks cleanly, and the player can submit a new action to diverge from disaster.
- **Turns 29–30 — Tragic Markdown Export**:
  - _Action_: Conclude or collapse story and trigger `Export Story (.md)`.
  - _Audit Gate_: Exported file header renders `> **State:** Collapsed (Tragic Ending)` with formatted telemetry metadata.

---

## 3. Part 5 — Round-by-Round Telemetry & Trace Capture

Record all turn data into this live audit table:

| Rnd | Probe / Milestone | Active Speaker (`ai`/`fractal`/`npc:<id>`) | Reply Metrics (length / somatic tells / detox) | Director Data (`keywords` / `story_status` / `in_scene_change` / `genesis`) | Dynamics Snapshot | Memory & Epistemic Audit | Verdict |
| :-- | :---------------- | :----------------------------------------- | :--------------------------------------------- | :-------------------------------------------------------------------------- | :---------------- | :----------------------- | :------ |
| 0   | Prologue Baseline | `system`                                   | Baseline tone lock                             | `IN_PROGRESS`                                                               | 50/50/50/50       | Zero AI-isms             | PASS    |
| 1   | Pacing Command    |                                            |                                                |                                                                             |                   |                          |         |
| ... | ...               |                                            |                                                |                                                                             |                   |                          |         |

---

### Mandatory Output File: `tmp/rpglitch-long-term-review-trace-<timestamp>.json`

```json
{
  "meta": {
    "timestamp": "2026-08-23T07:45:00Z",
    "total_turns": 28,
    "tracks_verified": ["track-director-expansion", "track-npc-expansion", "tragedy-and-epilogue-engine"],
    "entities": ["Lord Benedict Silvers", "Julien", "Ashenweald"]
  },
  "turns": [
    {
      "round": 10,
      "user_action": "Search the back alley for an underground contact.",
      "ai_response": "A shadowed figure leans against the damp brickwork...",
      "director_output": {
        "speaker": "npc:courier_kane",
        "story_status": "IN_PROGRESS",
        "keywords": ["deception"],
        "in_scene_change": { "enter": ["courier_kane"], "exit": [] },
        "genesis": {
          "name": "Kane",
          "description": "A wiry courier in a grease-stained leather coat",
          "signature_color": "#00ffcc"
        }
      },
      "telemetry": {
        "generating_entity": { "type": "npc", "name": "Kane" },
        "dynamics_snapshot": { "intensity": 65, "openness": 30, "chaos": 55, "affinity": 40 },
        "in_scene_npc_ids": ["courier_kane"]
      }
    }
  ]
}
```

---

## 4. Part 6 — Runtime Quality Scorecard

- [ ] **Speaker Routing**: `ai`, `fractal`, and `npc:<id>` route to correct engines with matching UI generating indicators.
- [ ] **Automatic Somatics**: Emotional axis thresholds auto-inject physical tells without manual Director keyword dependency.
- [ ] **Rich Genesis**: `genesis` payload triggers synchronous `sort_into_profile()` and creates complete Twin-Cylinder entity with background portrait.
- [ ] **Spotlight Stasis**: Off-screen NPCs leave `in_scene_npc_ids` and freeze dynamics evaluation.
- [ ] **In-Scene Salience**: Planted memories receive 1.3x retrieval priority when NPC is on-stage.
- [ ] **Epistemic Wall**: Player secrets/plans strictly withheld from character prompts across turns.
- [ ] **Tragedy & Collapse**: `story_status: "COLLAPSED"` routes through `SCENE.COLLAPSE` with fatalistic tone and `💀` badge.
- [ ] **Pre-Collapse Rewind**: `⟲ Keep Chatting` unfreezes story state, clears epilogue, and allows narrative divergence.
- [ ] **Tragic Export**: Downloaded `.md` correctly tags `> **State:** Collapsed (Tragic Ending)`.
- [ ] **Trace Artifact**: Complete session trace dumped to `tmp/rpglitch-long-term-review-trace-<timestamp>.json`.
