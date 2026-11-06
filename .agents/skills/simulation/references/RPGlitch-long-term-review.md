# RPGlitch — Live Greenfield Simulation Forensics & Integrity Test Protocol

> **System Designation**: Sovereign AI Roleplay Engine (Perchance Iframe Environment)  
> **Protocol Focus**: Live Interactive Roleplay Stress Test & State Audit for the Greenfield Nuclear Architecture  
> **Target Scope**: End-to-end verification of Greenfield Shipped Reality (`src/engine/`, `src/storage/`, and modernized `src/media/` per `GREENFIELD_REPORT.md` and `nuclear-plan.md`). Covers 1-shot / 2-shot Director execution, Kernel round sovereignty, Caretaker 3-cycle rotation, sliding-window context budgeting, Epistemic Wall integrity, sensory diffusion dispatch, and transactional rollback.

---

## 1. Primary Objectives & Inquiries Under Test (Greenfield Verification)

Verify that the Greenfield Nuclear Engine operates flawlessly in real Perchance iframe play with the `GREENFIELD` toggle enabled (`use_greenfield_engine: true`):

- **1. Turn Pipeline & Round Sovereignty (`execute_greenfield_turn` $\rightarrow$ `Kernel.submit_turn`)**:
  - Verify player message submission advances through the greenfield turn bridge seamlessly without UI lockup or orphan entries.
  - Verify authoritative macro round counter increments strictly $+1$ per round across turns ($0 \rightarrow 1 \rightarrow 2 \rightarrow \dots$), preventing skipped round stamps or chrono double-increments.
  - Verify assistant message rows in IndexedDB are stamped with `greenfield: true` metadata and the matching round number.
- **2. 2-Shot Director & Dynamic Pacing (`execute_round` $\rightarrow$ `execute_turn_1_director` $\rightarrow$ `execute_turn_2_character`)**:
  - Verify Turn 1 Director Quick Shot executes fast JSON staging inference when `director_enabled: true`, outputting `next_action`, `directors_note`, `camera_note`, and clamped `dynamics_deltas` ($[-20, 20]$).
  - Verify Turn 2 Storyteller receives the Director's note inside the prefilled `<think>` block, reflects the subtext and staging, and streams in-character prose to the player.
  - Verify dynamic turn tempo budgeting (`calculate_turn_tempo`) enforces sentence/beat constraints (1 beat for $<25$ chars, 2 beats for $<150$ chars, 3 beats for $<500$ chars, 4 beats for $\ge 500$ chars).
  - Verify 1-shot execution when `director_enabled: false` bypasses Turn 1 and streams character prose directly.
- **3. Subconscious Memory & Caretaker 3-Cycle Rotation (`execute_turn_3_caretaker`)**:
  - Verify Turn 3 Caretaker runs asynchronously in the background during player deliberation without introducing UI latency.
  - Verify the consolidation target rotates sequentially across rounds: $\text{AI} \rightarrow \text{USER} \rightarrow \text{FRACTAL}$.
  - Verify bracket deltas (`[KEY: VALUE | flags]`) across all 4 quadrants (`present.physical`, `present.non_physical`, `future`, `past`) are committed to active entity state and persisted to IndexedDB.
- **4. Context Cliff & History Sliding Window (`compile_prompt`)**:
  - Verify prompt compilation caps transcript history to the canonical working-memory window (`TEMPO_ROUNDS.STANDARD = 8` rounds) to prevent context blowup beyond 28–30k characters.
  - Verify the host does not perform silent middle-out truncation of character sheets or standing trajectory.
- **5. Epistemic Wall Integrity (`filter_entity_epistemics` / `format_clean_brackets`)**:
  - Verify bracket visibility respects the unified `see_hidden` scope across the 4 Purpose Cores:
    - `"own"` (`character` core): Preserves active character's own `| hide` brackets, strips counterpart `| hide` brackets and counterpart secret past/future.
    - `"all"` (`director` and `caretaker` cores): Retains hidden brackets for omniscient evaluation and memory synthesis.
    - `"none"` (`visualizer` core): Strips `| hide` and inventory items for camera diffusion.
  - Verify planted secrets (e.g. `[SECRET_PLOT: ... | hide]`) never leak into the AI character's inner reasoning or spoken dialogue.
- **6. Media & Sensory Dispatch (`src/media/`)**:
  - Verify image diffusion requests route through `dispatch_visual_generation` with proper resolution of host `{ dataUrl }` and `{ image }` shapes without throwing `EMPTY_IMAGE_RESPONSE`.
  - Verify profile picture generation and regeneration in `VisualWing.svelte` persist `payload.url` to the entity.
  - Verify context menu "Generate AI Character Image" runs through `VisualEngine.enhance()` before dispatching to `visualize()`.
  - Verify procedural Web Audio sound effects (`play_sfx`) fire on direct user gesture and Web Speech API fallback functions safely without audio context crashes.
- **7. Transactional Rollback & Transport Resilience**:
  - Verify aborted or failed generation triggers `Kernel.submit_turn` rollback (restoring previous dynamics, reverting round count, and pruning orphan history entries).
  - Verify single-lane transport mutex (`create_transport`) serializes foreground and background requests safely.

---

## 2. Turn-by-Turn Narrative Stress Test Matrix (20–25 Turns)

```text
[T0: Genesis & Greenfield Arming] ──► [T1–T3: 2-Shot Staging & Caretaker Cycle] ──► [T4–T6: Pacing & Epistemic Plant]
                                                                                               │
[T16–T20: Scaling Window & Image Pipeline] ◄── [T11–T15: Pacing Contrasts & Retries] ◄── [T7–T10: 1-Shot & Rollback] ◄┘
```

---

### Phase 1: Genesis, Greenfield Arming & 3-Cycle Caretaker (Turns 0–3)

- **Turn 0 — Genesis, Engine Selection & Baseline Verification**:
  - _Action_: Launch a fresh story session using premades (AI **Orion the Pink Protector**, USER **Glitch**, FRACTAL **Nova City**). Open the Console / DevControls (`DEVMODE`) and toggle the **`GREENFIELD`** switch to ON (`use_greenfield_engine: true`). Ensure `director_enabled: true`.
  - _Audit Gate_: Verify `[Kernel]` initializes with `round: 0`. Inspect prompt compilation in DevTools console: confirm `<SYSTEM round="0" identity="...">` root envelope, correct tag sequence (`REALITY` $\rightarrow$ `CHARACTERS` $\rightarrow$ `SCENARIO` $\rightarrow$ `TRAJECTORY` $\rightarrow$ `TASK`), and zero legacy mustache template leaks (`{{char}}`, `{{user}}`).
- **Turn 1 — Turn 1 Director Staging $\rightarrow$ Turn 2 Character $\rightarrow$ Turn 3 AI Caretaker**:
  - _Action_: Player sends a grounded introductory message (_"Check your harness, Orion. Nova City power grid is surging."_).
  - _Audit Gate_:
    - **Shot 1**: Director Quick Shot executes; outputs `next_action: "ai"`, `directors_note`, and valid `dynamics_deltas` within $[-20, 20]$.
    - **Shot 2**: Character streams prose; inner `<think>` block opens with Director's note prefill and closes cleanly before dialogue.
    - **Shot 3**: Background Caretaker consolidation fires targeting **Orion** (`Target = 1 % 3 = 1` $\rightarrow$ AI). Inspect IndexedDB to verify new bracket updates in Orion's state.
    - **Round Stamp**: Confirm assistant reply is stored in IndexedDB with `greenfield: true` and stamped with `round: 1`.
- **Turn 2 — Caretaker Rotation to User Persona**:
  - _Action_: Player offers a significant narrative commitment or trade (_"Here — take the Silvers courier key. We use it at the relay mast."_).
  - _Audit Gate_:
    - Caretaker consolidation fires targeting **Glitch** (`Target = 2 % 3 = 2` $\rightarrow$ User).
    - Verify Glitch's state in IndexedDB records new bracket diffs (e.g. `[EVENT: Glitch offered a Silvers courier key... | w: 5]`) and updated user dynamics persist.
- **Turn 3 — Caretaker Rotation to Fractal / Environment**:
  - _Action_: Player shifts focus to the environment (_"The storm sirens across Sector 4 just went dead."_).
  - _Audit Gate_:
    - Caretaker consolidation fires targeting **Nova City** (`Target = 3 % 3 = 0` $\rightarrow$ Fractal).
    - If no world-shattering event occurred, verify clean no-op without fabricating bogus state diffs.

---

### Phase 2: Pacing Budgets, Epistemic Wall & 1-Shot Bypass (Turns 4–10)

- **Turn 4 — Input-Proportional Pacing (Tiny Input)**:
  - _Action_: Player enters a very short message (< 25 chars: _"Nod."_ or _"Keep moving."_).
  - _Audit Gate_: Verify `calculate_turn_tempo` assigns a 1-beat budget. Storyteller output delivers 1 snappy, concise beat without ballooning into multi-paragraph exposition.
- **Turn 5 — Epistemic Wall Secret Planting (`| hide`)**:
  - _Action_: Open Profile Studio for Glitch. Add a hidden bracket to `present.non_physical`: `[SECRET_GOAL: betray the syndicate at midnight | hide]`. (Plant through UI profile editor to ensure in-memory state is synchronized). Then send a normal, unrelated message.
  - _Audit Gate_:
    - Inspect compiled prompts for Director, Character, and Caretaker in DevTools console.
    - Confirm `SECRET_GOAL` is completely redacted from the Character core prompt (`see_hidden: "own"` strips counterpart hidden brackets).
    - Confirm AI character exhibits zero telepathic knowledge in `<think>` cognition or spoken dialogue.
- **Turn 6 — Input-Proportional Pacing (Expansive Input)**:
  - _Action_: Player authors a detailed, multi-sentence prompt (> 500 chars) exploring physical environment, sensory details, and tactical planning.
  - _Audit Gate_: Verify `calculate_turn_tempo` assigns a 4-beat budget. Storyteller output delivers rich, expansive multi-beat prose advancing the scene.
- **Turns 7–8 — 1-Shot Mode Toggle (Director Bypass)**:
  - _Action_: In DevControls, toggle `director_enabled` to OFF. Send a player message.
  - _Audit Gate_: Verify Turn 1 Director call is completely bypassed. Generation proceeds immediately to Turn 2 Character, followed by normal background Caretaker consolidation.
- **Turn 9 — Abort & Transactional Rollback Audit**:
  - _Action_: Send a message, then click the **Stop** button mid-stream.
  - _Audit Gate_:
    - Verify `simulation_state` returns to `"idle"`.
    - Verify round counter rolls back to previous value without leaving an orphan user message in transcript history.
    - Verify entity dynamics restore cleanly to their pre-turn values.
- **Turn 10 — Greenfield Retry Execution**:
  - _Action_: Click the message Regenerate / Retry button on the last turn.
  - _Audit Gate_: Verify generation retries on the **greenfield** branch, executing a fresh prompt compilation rather than throwing missing method errors.

---

### Phase 3: Sensory Cortex, Scaling Window & Diffusion (Turns 11–20)

- **Turn 11 — Context Cliff Sliding Window (Turn 8+ Check)**:
  - _Action_: Advance dialogue through turn 11.
  - _Audit Gate_:
    - Inspect the compiled prompt length in DevTools console.
    - Verify dialogue history is sliced to the canonical `TEMPO_ROUNDS.STANDARD = 8` working-memory window.
    - Confirm total compiled prompt character count remains safely below host truncation thresholds (~20–22k chars, ~6k tokens), with zero middle-out truncation warnings from the host plugin.
- **Turn 12 — Visual Optics Enhancement Pass (`VisualEngine.enhance`)**:
  - _Action_: Right-click Orion's EntityCard or use the message context menu and click **"Generate AI Character Image"**.
  - _Audit Gate_:
    - Verify the request calls `visual_engine.enhance(prompt, subject, entity)`.
    - Verify the greenfield `visualizer` purpose core compiles and executes an LLM refinement pass (returning structured `{ prompt, negative_prompt }`).
    - Verify diffusion dispatches with the refined prompt, situating the character within the active fractal setting.
- **Turn 13 — Visual Style Raw Bypass (`llm_refine: false`)**:
  - _Action_: In Profile Studio, switch visual style to `none` (or a style configured with `llm_refine: false`). Trigger image generation.
  - _Audit Gate_: Verify `VisualEngine.enhance()` detects the bypass and returns the draft prompt untouched without calling the LLM.
- **Turn 14 — Profile Picture Generation & Persistence**:
  - _Action_: Open `VisualWing.svelte` in Profile Studio and generate a new portrait.
  - _Audit Gate_: Verify `VisualEngine.generate()` returns `{ ...dispatched, url: dispatched.image_url }`, allowing `VisualWing` (`if (payload?.url)`) to cleanly update and persist `profile_picture`.
- **Turns 15–18 — Origin Attribution & Multi-Role History**:
  - _Action_: Roleplay across varied scene shifts involving environmental announcements and system events.
  - _Audit Gate_: Verify `<ROUND number="..." origin="...">` in compiled prompts cleanly attributes speakers (`user`, `ai`, `fractal`, `system`) without misattributing narrative events to the wrong entity.
- **Turns 19–20 — Audio SFX & Web Speech Verification**:
  - _Action_: Interact with buttons and UI toggles; trigger dialogue speech where available.
  - _Audit Gate_:
    - Verify procedural Web Audio sound effects (`play_sfx`) play cleanly on user gesture with 0 downloaded assets.
    - Verify `speak` calls route safely through the native Web Speech API without locking or throwing unhandled errors.

---

## 3. Forensic Telemetry & Inspection Guide (For Tester Agent)

Execute the test in the live browser environment against the deployed Perchance generator:

1. **DevTools Console Interception (`F12`)**:
   - Filter logs by `[Kernel]`, `[Turn]`, `[Director]`, `[Caretaker]`, `[Visual]`.
   - Inspect prompt closures and compiled XML strings to verify tag sequence, bracket format, and origin attribution.
2. **IndexedDB Inspection (`Application` $\rightarrow$ `Storage` $\rightarrow$ `IndexedDB`)**:
   - Open database `rpglitch_db` (or `rpglitch_nuclear_db`).
   - Check `entities` table: verify 4 quadrants (`eternal`, `present`, `future`, `past`) are stored as clean multiline strings.
   - Check `stories` table: verify log rows contain `greenfield: true` and synchronized round numbers.
   - Check `mutation_ledger`: verify event diffs recorded by Caretaker and genesis.
3. **DevControls & DevLog Panel**:
   - Use the **`GREENFIELD`** toggle to switch engines dynamically.
   - Inspect `dev_log` ring-buffer entries for `DYNAMICS_DELTA`, `TURN_TEMPO`, and staging decisions.

---

## 4. Greenfield Quality Scorecard

### Kernel & Turn Orchestration

- [ ] **Authoritative Round Sovereignty**: Macro round increments strictly $+1$ per round ($0 \rightarrow 1 \rightarrow 2\dots$), matching IndexedDB reply stamps.
- [ ] **2-Shot Director Execution**: Director JSON staging produces valid `next_action`, `directors_note`, and $[-20, 20]$ dynamics deltas.
- [ ] **1-Shot Direct Streaming**: Disabling Director bypasses Turn 1 and streams character prose directly.
- [ ] **Dynamic Pacing Budget**: `calculate_turn_tempo` enforces 1/2/3/4-beat constraints matching player message lengths.
- [ ] **Caretaker 3-Cycle Rotation**: Consolidation alternates sequentially between AI $\rightarrow$ User $\rightarrow$ Fractal each round.
- [ ] **Transactional Rollback**: Stream abort or failure rolls back round count, entity dynamics, and orphan messages.
- [ ] **Greenfield Retry**: Message retry/regeneration executes cleanly on the greenfield branch without missing-method crashes.

### Memory & Prompt Architecture

- [ ] **Context Sliding Window**: History capped to `TEMPO_ROUNDS.STANDARD = 8` rounds, preventing middle-out host truncation.
- [ ] **Epistemic Wall Isolation**: Planted `| hide` brackets strictly redacted from counterpart character generation prompts.
- [ ] **Origin Attribution**: `<ROUND origin="...">` tags preserve accurate speaker roles across AI, User, Fractal, and System.
- [ ] **Caretaker Bracket Patching**: Diffs across all 4 quadrants (`present.physical`, `present.non_physical`, `future`, `past`) persist cleanly.
- [ ] **Multiline Bracket Syntax**: Entity state parses and serializes via canonical `[KEY: VALUE | flags]` format.

### Sensory & Media Cortex

- [ ] **Diffusion Payload Resolution**: `dispatch_visual_generation` extracts `{ dataUrl }` and `{ image }` without `EMPTY_IMAGE_RESPONSE`.
- [ ] **Visualizer Refinement (`VisualEngine.enhance`)**: Refines draft prompts through the `visualizer` purpose core.
- [ ] **Style Bypass (`llm_refine: false`)**: Preserves draft prompts untouched when visual style opts out of LLM refinement.
- [ ] **Profile Picture Persistence**: `VisualEngine.generate()` returns `url` alias, updating `profile_picture` in `VisualWing`.
- [ ] **Procedural Web Audio**: UI sound effects (`play_sfx`) play cleanly on user gesture with 0 downloaded MP3/WAV assets.
- [ ] **Web Speech API**: Positional speech calls route cleanly through browser TTS without crashing.

### Narrative Quality & Roleplay Purity

- [ ] **Immersion & Tone**: Dense, sensory, scene-faithful prose without meta-commentary or breaking kayfabe.
- [ ] **Perspective Integrity**: Third-person limited / first-person non-user voice maintained without mind-reading or puppeteering the protagonist.
- [ ] **Directive Adherence**: Storyteller incorporates Director's subtext notes without mechanical leak into speech bubbles.
