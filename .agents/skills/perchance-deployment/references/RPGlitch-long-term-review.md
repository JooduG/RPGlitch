# RPGlitch — Live Simulation Forensics & Engine Integrity Test Protocol

> **System Designation**: Sovereign AI Roleplay Engine (Perchance Iframe Environment)  
> **Protocol Focus**: Live 25–30 Turn Interactive Roleplay Stress Test & State Audit  
> **Target Scope**: End-to-end verification of recent Track 1 remediations, Four-Quadrant memory integrity, mutation ledger event sourcing, and architectural backlog targets from `ROADMAP.md`.

---

## 1. Primary Objectives & Inquiries Under Test

1. **Track 1 Remediations Verification**:
   - **Ghost Row Suppression (2.1)**: Image beat placeholders mount cleanly without emitting blank dialogue rows into the context window.
   - **Think-Only Recovery (2.2)**: If an AI persona emits solely internal reasoning (`<think>`), verify the engine triggers the automatic recovery retry directive to guarantee dialogue prose.
   - **Telemetry Deduplication (2.3)**: Confirm `DYNAMICS_DELTA` tokens in HUD cards and simlog contain no duplicated tokens.
2. **Behavioral & Narrative Integrity Audits**:
   - **P1 User Agency & Anti-Hijacking (2.5)**: Hard-test for first-person player puppeting (e.g., AI saying _"my hand shakes"_ on behalf of the user).
   - **Physical Causality & Terminal States (2.6)**: Challenge physical boundaries, injury, and terminal states (death/collapse) to test Director `story_status` handling.
   - **Cinematic Framing Lenses (2.4)**: Track image prompt framing to check whether the generator breaks out of wide environmental locks into close/medium character shots.
3. **State, Ledger & Background Pipeline Audits**:
   - **Genesis Ledger Attribution**: Verify whether story creation/character imports emit proper R0:S0 genesis rows in `db.mutation_ledger` (and observe premade seed behavior).
   - **Compare-Then-Skip Dedup**: Ensure no-op rounds append 0 redundant rows to `mutation_ledger`.
   - **Background Queue & Concurrency**: Ensure deferred image generation and rolling Memory Forge passes execute asynchronously without locking the UI or causing audio/streaming stutter.

---

## 2. Part 4 — Turn-by-Turn Narrative Stress Test Matrix (25–30 Turns)

Follow this targeted round sequence to systematically trigger and audit each engine capability:

```text
[T0: Prologue & Genesis Ledger] ──► [T1–T4: Quick Shot Latency & Relational Mesh] ──► [T5–T8: Forge Compare-Then-Skip Guard]
                                                                                                    │
[T25–T30: Replay Audit & History UI] ◄── [T17–T24: Epistemic Wall & Agency] ◄── [T9–T16: Image Cooldowns & Optics Lenses] ◄┘
```

---

### Phase 1: Genesis, Quick Shot Latency & Telemetry (Turns 0–4)

- **Turn 0 — Genesis & Baseline Setup**:
  - _Action_: Launch story with active Cast (AI Character, Protagonist, Fractal World).
  - _Audit Gate_: `Prologue.svelte` renders baseline tone lock. Inspect IndexedDB `db.mutation_ledger`: verify `birth_entity_core` emitted genesis entries (`round: 0, seq: 0, writer: "genesis", decider: "genesis"`) for all populated quadrants (`eternal`, `present`, `past`, `future`). Note behavior if using seeded premade cast.
- **Turns 1–2 — Quick Shot Latency & Telemetry Deduplication**:
  - _Action_: Alternate between a short physical command (_"Draw your blade."_) and expansive dialogue.
  - _Audit Gate_: Director returns streamlined 4-field schema (`next_action`, `keywords`, `directors_note`, `dynamics_deltas`). `runtime.last_director_ms` captures high-res execution duration. Verify `DYNAMICS_DELTA` card contains zero duplicate metric tokens.
- **Turns 3–4 — Relational Mesh Mutation & Ledger Dedup Check**:
  - _Action_: Challenge the AI character, triggering a dynamic relationship update in Director output (e.g. `User → AI: tense stand-off | hide w:8`).
  - _Audit Gate_: Director writes `seq: 1, writer: "director", decider: "director"` to `db.mutation_ledger` with `visibility: "hide"` and `weight: 8`. In Turn 4, repeat a neutral action with the same dynamic: confirm the Director's compare-then-skip guard suppresses redundant ledger appends.

---

### Phase 2: Memory Forge Compare-Then-Skip Guard & Single-Entity Databox (Turns 5–8)

- **Turn 5 — Rolling Worker: Target 1 (AI Character) & Delta Inspection**:
  - _Action_: Advance scene with high emotional weight.
  - _Audit Gate_: Back Shot worker targets AI Character (`forged_entity: "ai"`). Ledger logs entries with `seq: 3, writer: "forge", decider: "forge"`. Verify `old_value` is populated with pre-mutation content.
- **Turn 6 — Memory Forge Compare-Then-Skip Guard (No-Op Round)**:
  - _Action_: Maintain steady-state dialogue where character trajectory and physical states do not shift.
  - _Audit Gate_: Memory Forge runs; confirm that fields returning unchanged values are **skipped** from `ledger_batch`, adding 0 duplicate lines to `db.mutation_ledger`.
- **Turn 7 — Non-Physical Bracket Preservation**:
  - _Action_: Forge updates `present.non_physical` summary prose while active relational brackets (`[@TARGET: dynamic]`) exist.
  - _Audit Gate_: Verify `sanitize_non_physical_prose` and bracket preservation logic keep the active relational brackets intact in `present.non_physical`, preventing summary prose from wiping interpersonal bonds.
- **Turn 8 — Single-Entity Cyan Databox & Telemetry Sync**:
  - _Action_: Inspect the Telemetry Card in the feed.
  - _Audit Gate_: Telemetry card renders a focused single-entity databox in research terminal cyan (`var(--color-dev-accent)`) with forged memory vectors, round decay, and updated trajectory.

---

### Phase 3: Decoupled Image Cooldowns & Optics Framing Lenses (Turns 9–16)

- **Turns 9–11 — Decoupled Image Cooldown Arbitration & Ghost Check**:
  - _Action_: Push scene intensity across displacement threshold while Director requests an image beat.
  - _Audit Gate_: `IMAGE_TRIGGER.director_cooldown_rounds = 2` and `IMAGE_TRIGGER.dynamics_cooldown_rounds = 3` operate independently. When both trigger simultaneously, Priority 1 (Director) > Priority 2 (Dynamics) arbitration fires with strict 1-image-per-round ceiling. Verify placeholder mounts as an image card without generating an empty dialogue bubble or leaking into next round's context.
- **Turns 12–14 — Photographic Dynamic Framing Lenses**:
  - _Action_: Shift from wide environmental exploration to high-intensity close confrontation.
  - _Audit Gate_: Audit whether photographic framing lenses (`<CINEMATIC_FRAMING>`: `Intimate Close-Up`, `Medium Action`, `Wide Environmental`, `Dutch / Low-Angle`) break free of wide-angle lock and adapt to scene intimacy.
- **Turns 15–16 — Universal Bracket State Grounding**:
  - _Action_: Player alters an item or outfit (e.g. `[SHIRT: armored jacket]`, `[DAGGER: hidden boot knife | hide]`).
  - _Audit Gate_: `merge_prose_into_field` updates `present.physical` in place; subsequent turns show AI reacting accurately to current items without ghosting superseded apparel.

---

### Phase 4: Epistemic Wall, User Agency & Terminal States (Turns 17–24)

- **Turns 17–20 — Epistemic Horizon & Secret Planning (`| hide`)**:
  - _Action_: Player conceals an item or formulates private plans using hidden brackets (`[PLAN: poison the cup | hide]`).
  - _Audit Gate_: Epistemic filter in `src/intelligence/veil.js` strips private brackets from the other entity's generation prompt. Persona LLM exhibits zero telepathic leak or awareness of the concealed plan.
- **Turns 21–22 — P1 User Agency & Anti-First-Person Hijacking**:
  - _Action_: Present high-stress sensory or psychological moments where the AI might attempt to puppeteer the player.
  - _Audit Gate_: AI strictly adheres to third-person descriptive observation of the protagonist; zero first-person pronouns ("I feel", "my body") assumed on behalf of the player.
- **Turns 23–24 — Physical Causality & Terminal State Evaluation**:
  - _Action_: Introduce fatal biological states or irreversible environmental collapse.
  - _Audit Gate_: Director evaluates physical causality instead of ignoring damage; correctly transitions `story_status` towards `COLLAPSED` or `CONCLUDED` with appropriate epilogue dispatch.

---

### Phase 5: Replay Reconstruction, Field History Inspector & Storyboard Resume (Turns 25–30)

- **Turns 25–27 — Read-Side History Inspector (`FieldHistoryModal`) Audit**:
  - _Action_: Open `Profile` -> click the clock history button on `present.non_physical` or open `DevWing` -> click "Inspect History".
  - _Audit Gate_: `FieldHistoryModal.svelte` opens.
    - **Timeline Tab**: Displays chronological mutations with `R{round}:S{seq}`, `writer`, `decider`, `old_value -> new_value`, and `hide`/`w:N` badges.
    - **Reconstructed Tab**: Displays replayed bracket predicates assembled via `replay_entity_field(entity_id, field)`. Confirm flags (`| hide w:8`) are restored faithfully.
- **Turns 28–30 — Storyboard 1-Click Resume & Trace Output**:
  - _Action_: Click "Return to Storyboard" in `ControlPanel.svelte` while the story is in progress.
  - _Audit Gate_: `session_driver.clear_active()` is **not** called. Story session and `runtime.story_id` remain intact in memory and Dexie. Storyboard bottom bar displays **`"ENTER STORYMODE"`** in emerald green. Clicking it instantly returns to the active conversation.
  - _Final Step_: Export session JSON trace to `tmp/rpglitch-long-term-review-trace-<timestamp>.json`.

---

## 3. Part 5 — Round-by-Round Telemetry & Mutation Ledger Trace Capture

Record all turn data into this live audit table:

| Rnd | Probe / Milestone | Active Speaker (`ai`/`fractal`/`npc:<id>`) | Quick Shot (`next_action` / latency ms) | Back Shot (`forged_entity` / memory / relationships) | Mutation Ledger Entries Added (seq / writer / decider / dedup status) | Image Trigger (`tier` / `source` / framing lens) | UI & History State (`pinned_id` / history modal audit) | Verdict |
| :-- | :---------------- | :----------------------------------------- | :-------------------------------------- | :--------------------------------------------------- | :-------------------------------------------------------------------- | :----------------------------------------------- | :----------------------------------------------------- | :------ |
| 0   | Genesis Baseline  | `system`                                   | Genesis Sync                            | Initial State Sync                                   | R0:S0 genesis entries for all 4 quadrants                             | None (Cooldown armed)                            | Storyboard $\rightarrow$ Storymode Flip                | PASS    |
| 1   | Quick Shot Probe  |                                            |                                         |                                                      |                                                                       |                                                  |                                                        |         |
| ... | ...               |                                            |                                         |                                                      |                                                                       |                                                  |                                                        |         |

---

## 4. Part 6 — Runtime Quality Scorecard

### Core Physics & Prompt Integrity

- [ ] **P1 User Agency**: AI strictly respects user autonomy; zero first-person puppeting or player narration.
- [ ] **Epistemic Partitioning**: Zero telepathic prompt bleed of `| hide` brackets across character viewpoints.
- [ ] **Track 1 — Quick Shot Streamlining**: 4-field schema executes with sub-second latency; `last_director_ms` records accurate timings.
- [ ] **Track 1 — Think-Only Guard (2.2)**: Model never persists empty speech bubble when reasoning exclusively in `<think>`.
- [ ] **Track 1 — Telemetry Deduplication (2.3)**: `DYNAMICS_DELTA` telemetry logs zero duplicate metric tokens.
- [ ] **Track 1 — Ghost Row Suppression (2.1)**: Standalone image beat attachments do not emit blank dialogue entries into prompt history.
- [ ] **Track 1 — Framing Lenses (2.4)**: Optics pipeline successfully alternates between wide environment and intimate/character framing.
- [ ] **Track 1 — Terminal State Grounding (2.6)**: Lethal consequences trigger proper `COLLAPSED` status.

### Event Sourcing & Ledger Hardening

- [ ] **Genesis Quadrant Logging**: All 4 quadrants log `round: 0, seq: 0, writer: "genesis"` on entity creation and import.
- [ ] **Director Dedup-Before-Write**: Identical relational directives are skipped from the ledger on subsequent rounds.
- [ ] **Memory Forge Compare-Then-Skip**: Unchanged fields during Shot 2 consolidation are skipped from `ledger_batch`.
- [ ] **Sequence & Writer Reconciliation**: Director logs `seq: 1, writer: "director", decider: "director"`; Forge logs `seq: 3, writer: "forge", decider: "forge"`.
- [ ] **Flag Preservation**: `visibility` (`hide`) and `weight` (`w:N`) persist in `db.mutation_ledger` and restore via `replay_entity_field`.
- [ ] **Field History Inspector**: `FieldHistoryModal.svelte` renders timeline audit and reconstructed state cleanly from `DevWing` and `Profile`.

### Directorial Mechanics & UI/UX

- [ ] **Single-Target Rolling Worker**: Back Shot forges exactly 1 entity per round round-robin ($\text{AI} \rightarrow \text{USER} \rightarrow \text{FRACTAL}$) with non-physical bracket preservation.
- [ ] **Decoupled Image Cooldowns**: Independent cooldown timers (`director: 2`, `dynamics: 3`) enforce strict 1-image-per-round ceiling.
- [ ] **Single-Entity Cyan Databox**: Telemetry cards render a focused single databox in pure terminal cyan (`var(--color-dev-accent)`) without portraits.
- [ ] **Click-to-Pin Message Header**: Clicking message body pins header open; action toolbars execute without collapse.
- [ ] **Storyboard Direct Resume Navigation**: Returning to storyboard preserves `story_id`; emerald `"ENTER STORYMODE"` button resumes session in 1 click.
- [ ] **Trace Artifact**: Complete session trace dumped to `tmp/rpglitch-long-term-review-trace-<timestamp>.json`.
