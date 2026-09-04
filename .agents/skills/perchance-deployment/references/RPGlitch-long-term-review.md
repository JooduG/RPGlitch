# RPGlitch — Four-Track Live Narrative Stress Test & Telemetry Protocol

> **System Designation**: Sovereign AI Roleplay Engine  
> **Protocol Focus**: **Part 4 (Live Narrative Stress Test)** & **Part 5 (Round-by-Round Telemetry & Trace Capture)**  
> **Target Scope**: Live 25–30 turn interactive roleplay systematically testing the four recent production tracks:
>
> - **Track 1**: Director Quick Shot (4-field schema, `last_director_ms` instrumentation, generation mutex).
> - **Track 2**: Back Shot Rolling Worker (single-target consolidation, round-robin cursor, outward relational mesh).
> - **Track 3**: Decoupled Image Trigger Cooldowns (`director_cooldown_rounds = 2`, `dynamics_cooldown_rounds = 3`, 1-image-per-round ceiling, `<CINEMATIC_FRAMING>` dynamic lenses).
> - **Track 4**: UI/UX Harmonization (single-entity cyan databox, click-to-pin message headers, 1-active-story restriction & Storyboard direct resume navigation, failed image cards).

---

## 1. Operational Rules of Engagement

1. **Dual Perspective**:
   - **Player Role**: Submit immersive 1–3 sentence human turns in-character. Never break the narrative fourth wall in chat input.
   - **Auditor Role**: Inspect each round's underlying Director Quick Shot latency, Back Shot rolling target, dynamic image triggers, memory vectors, relational mesh, and UI state behind the scenes.
2. **Mandatory Artifact Output**:
   - Maintain the round-by-round trace log throughout the session.
   - On completion, write the complete JSON execution payload to `tmp/rpglitch-long-term-review-trace-<timestamp>.json`.

---

## 2. Part 4 — Turn-by-Turn Narrative Stress Test Matrix (25–30 Turns)

Follow this targeted round sequence to systematically trigger and audit each engine capability:

```text
[T0: Prologue & Genesis] ──► [T1–T4: Quick Shot Latency & Somatics] ──► [T5–T8: Back Shot Rolling Worker]
                                                                                  │
[T25–T30: Collapse, Rewind & Storyboard Resume] ◄── [T17–T24: Cinematic Framing & Cooldowns] ◄──┘
```

---

### Phase 1: Prologue, Quick Shot Latency & Generation Mutex (Turns 0–4)

- **Turn 0 — Scene Initialization & Prologue**:
  - _Action_: Launch story with active Cast (AI Character, Protagonist, Fractal World).
  - _Audit Gate_: `Prologue.svelte` renders baseline tone lock; initial state hydrations clean; zero AI meta-commentary.
- **Turns 1–2 — Quick Shot Latency & 4-Field Schema Audit**:
  - _Action_: Alternate between a short command (_"Draw your blade."_) and expansive prose.
  - _Audit Gate_: Director returns streamlined 4-field schema (`next_action`, `keywords`, `directors_note`, `dynamics_deltas`). `runtime.last_director_ms` captures high-res execution duration into rolling `director_ms_pool`. `runtime.generation_mutex` locks and unlocks cleanly with zero UI deadlocks.
- **Turns 3–4 — Emotional Stress & Dynamic Deltas**:
  - _Action_: Confront the character's core emotional vulnerability or secret.
  - _Audit Gate_: Quick Shot returns mathematical dynamics deltas ($\Delta \text{intensity}$, $\Delta \text{affinity}$) applied synchronously to active physics.

---

### Phase 2: Back Shot Rolling Worker & Single-Entity Databox (Turns 5–8)

- **Turn 5 — Rolling Worker: Target 1 (AI Character)**:
  - _Action_: Advance scene with high emotional weight.
  - _Audit Gate_: Back Shot worker targets AI Character (`forged_entity: "ai"`). Message receives single-target forged progress marker in `meta.forged_entities`. Telemetry card renders a focused single-entity databox in research terminal cyan (`var(--color-dev-accent)`) with no portraits.
- **Turn 6 — Rolling Worker: Target 2 (User Persona)**:
  - _Action_: Player takes a decisive physical action.
  - _Audit Gate_: Rolling worker cursor automatically advances to User Persona (`forged_entity: "user"`). Telemetry card renders User Persona's forged memory vector and updated trajectory.
- **Turn 7 — Rolling Worker: Target 3 (Fractal / World)**:
  - _Action_: Inspect the changing environment or weather shift.
  - _Audit Gate_: Rolling worker cursor advances to Fractal (`forged_entity: "fractal"`), consolidating atmospheric shifts and minting environmental past vectors.
- **Turn 8 — Relational Mesh & Outward Edges**:
  - _Action_: Forge an explicit alliance or deep friction with an entity.
  - _Audit Gate_: Back Shot emits outward directed vectors (`"[Source] → [Target]: [Dynamic]"`). `kernel._apply_relationships` stores edges on source entity; Telemetry databox renders plain-text relational mutations (`Viper → Ghost: cautious trust`).

---

### Phase 3: Decoupled Image Trigger Cooldowns & Cinematic Framing (Turns 9–16)

- **Turns 9–11 — Decoupled Image Cooldown Arbitration**:
  - _Action_: Push scene intensity across displacement threshold while Director requests an image beat.
  - _Audit Gate_: `IMAGE_TRIGGER.director_cooldown_rounds = 2` and `IMAGE_TRIGGER.dynamics_cooldown_rounds = 3` operate independently. When both sources trigger simultaneously, Priority 1 (Director) > Priority 2 (Dynamics) arbitration fires with strict 1-image-per-round ceiling.
- **Turns 12–14 — Photographic Dynamic Framing Lenses**:
  - _Action_: Shift from high-intensity close confrontation to wide exploration.
  - _Audit Gate_: `prompt_templates.BUILDER` dynamically injects photographic framing lenses (`<CINEMATIC_FRAMING>`: `Intimate Close-Up`, `Medium Action`, `Wide Environmental`, `Dutch / Low-Angle`) based on scene tier and dynamic tension.
- **Turns 15–16 — Failed Image Retry & Dismiss**:
  - _Action_: Trigger image generation and simulate/observe error handling.
  - _Audit Gate_: Errored/timed-out image card renders interactive `[Retry]` (re-dispatches with cached prompt) and `[Remove]` (cleans attachment) buttons directly on the card chassis.

---

### Phase 4: Click-to-Pin Message Headers & Action Toolbars (Turns 17–24)

- **Turns 17–20 — Click-to-Pin Message Header Interaction**:
  - _Action_: Click on a message body to expand the pinned header and action buttons.
  - _Audit Gate_: `app.pinned_message_id` pins the header open. Clicking action buttons (Copy text, Speak TTS, Edit message, Regenerate) executes immediately without collapsing the header. Clicking outside or clicking another message cleanly transfers pin state.
- **Turns 21–24 — Epistemic Horizon & Secret Planning**:
  - _Action_: Formulate a private plan or conceal an item in player thoughts/inventory.
  - _Audit Gate_: `[SECRET: ...]` and `[PLAN: ...]` stripped across the Epistemic Wall in `render_character()`. Character prompt exhibits zero telepathic leak.

---

### Phase 5: Tragedy, Storyboard Resume & 1 Active Story Invariant (Turns 25–30)

- **Turns 25–27 — Fatalistic Story Collapse & Rewind**:
  - _Action_: Escalate tension until Director triggers `story_status: "COLLAPSED"`.
  - _Audit Gate_: Kernel auto-dispatches `build_epilogue` using `PROTOCOL_LIBRARY.SCENE.COLLAPSE`. `Epilogue.svelte` renders Satisfy title and `💀 STORY COLLAPSED` badge. Clicking `⟲ Keep Chatting` resets status to `"IN_PROGRESS"` and unlocks the composer.
- **Turns 28–30 — Storyboard 1-Click Resume & 1 Active Story Rule**:
  - _Action_: Navigate from storymode back to Storyboard while the story is in progress.
  - _Audit Gate_: Storyboard bottom bar button dynamically displays **`"ENTER STORYMODE"`** in emerald green (regardless of slot count). Clicking it instantly flips back to `app.view = "story"`.

---

## 3. Part 5 — Round-by-Round Telemetry & Trace Capture

Record all turn data into this live audit table:

| Rnd | Probe / Milestone | Active Speaker (`ai`/`fractal`/`npc:<id>`) | Quick Shot (`next_action` / latency ms) | Back Shot (`forged_entity` / memory / relationships) | Image Trigger (`tier` / `source` / framing lens) | Header & UI State (`pinned_id` / Storyboard button) | Verdict |
| :-- | :---------------- | :----------------------------------------- | :-------------------------------------- | :--------------------------------------------------- | :----------------------------------------------- | :-------------------------------------------------- | :------ |
| 0   | Prologue Baseline | `system`                                   | Genesis Sync                            | Initial State Sync                                   | None (Cooldown armed)                            | Storyboard $\rightarrow$ Storymode Flip             | PASS    |
| 1   | Quick Shot Probe  |                                            |                                         |                                                      |                                                  |                                                     |         |
| ... | ...               |                                            |                                         |                                                      |                                                  |                                                     |         |

---

## 4. Part 6 — Runtime Quality Scorecard

- [ ] **Track 1 — Quick Shot Streamlining**: 4-field Quick Shot schema executes with sub-second latency; `last_director_ms` records accurate timings.
- [ ] **Track 1 — Generation Mutex**: `runtime.generation_mutex` prevents overlapping turns and releases cleanly.
- [ ] **Track 2 — Single-Target Rolling Worker**: Back Shot forges exactly 1 entity per round round-robin ($\text{AI} \rightarrow \text{USER} \rightarrow \text{FRACTAL} \rightarrow \text{NPC}_n$) with cursor auto-advancement.
- [ ] **Track 2 — Relational Mesh**: Outward directed vectors update entity profiles and render plain-text mutations.
- [ ] **Track 3 — Decoupled Image Cooldowns**: Independent cooldown timers (`director: 2`, `dynamics: 3`) enforce strict 1-image-per-round ceiling.
- [ ] **Track 3 — Cinematic Framing**: Photographic lenses (`Intimate Close-Up`, `Medium Action`, `Wide Environmental`, `Dutch / Low-Angle`) inject cleanly into image prompts.
- [ ] **Track 4 — Single-Entity Cyan Databox**: Telemetry cards render a focused single databox in pure terminal cyan (`var(--color-dev-accent)`) without portraits.
- [ ] **Track 4 — Click-to-Pin Message Header**: Clicking message body pins header open; toolbar buttons execute without premature focusout collapse.
- [ ] **Track 4 — Storyboard Direct Resume Navigation**: Bottom bar dynamically displays `"ENTER STORYMODE"` whenever an active story exists, resuming play in 1 click.
- [ ] **Track 4 — Failed Image Actions**: Failed image attachments allow interactive `[Retry]` and `[Remove]` directly on the card.
- [ ] **Trace Artifact**: Complete session trace dumped to `tmp/rpglitch-long-term-review-trace-<timestamp>.json`.
