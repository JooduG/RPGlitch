# Roleplay & Narrative Content Stress Test Protocol (Character Chemistry, Engine Telemetry & Sovereign Audit)

## Objective

Simulate a live end-to-end test session of **25 to 30 turns** within RPGlitch. Act simultaneously as a realistic human user inside the chat payload and an unforgiving narrative auditor behind the scenes. Focus **exclusively on narrative content, character dynamics, prose quality, detox engine compliance, unified dynamics signal telemetry, sovereign name resonance, memory provenance, epistemic physics, and engine bug verification**. Evaluate how the AI character and Director react to physical contradictions, trauma triggers, moral dilemmas, unprompted initiative tests, mid-session reloads, and post-climax transitions.

---

## Part 1: User Persona Protocol & Narrative Edge-Case Probes

### Persona Directive

- **Act like a real human user**: Write brief, natural responses (1–3 sentences). Match character context without over-explaining or mimicking AI enthusiasm.
- **Never break character inside the chat payload**: All auditing occurs strictly outside the character dialogue.

### Mandatory Narrative Edge-Case Probes

1. 🩹 **Extreme Vulnerability & Trauma Boundary Probe (Turn 4 ➔ Turn 12)**:
   - _Action_: Expose a deep character trauma, severe physical vulnerability, or admission of fear during dialogue.
   - _Audit Gate_: Confirm the AI character expresses authentic, non-cliché vulnerability in its register rather than immediately deflecting back to hyped-up banter or campy bravado. Confirm prose avoids somatic tics ("taste of copper", "heart hammers against my ribs", "destruction-as-emotion" wall punching).

2. 🚧 **Physical Contradiction & Impossible Action Probe (Turn 6 & Turn 18)**:
   - _Action_: Submit a user action that physically violates the environment or character state (e.g., attempting to walk directly through a locked 5-inch titanium blast door, or claiming to pull an item out of thin air that was never introduced).
   - _Audit Gate_: Audit whether the AI character enforces physical causality and spatial reality (3rd-person affirmative) rather than passively agreeing or breaking environmental immersion.

3. 🎲 **Unprompted AI Initiative & Narrative Driving Probe (Turn 8 & Turn 16)**:
   - _Action_: Submit an intentionally brief, passive user turn (e.g., _"I lean against the cold conduit and wait."_ or _"I watch the security monitor in silence."_).
   - _Audit Gate_: Verify whether the AI character takes active narrative initiative (introducing an unexpected complication, offering an in-character choice, or advancing the plot) rather than stalling, repeating the user's line, or waiting passively for the user to drive.

4. ⚡ **Unified Dynamics Signal & Multi-Trigger Stress Probe (Turn 10 & Turn 20)**:
   - _Action_: Push dynamics sliders across extreme multi-axis boundaries (e.g. `intensity > 70` + `chaos > 70` + high `openness` or custom author style triggers).
   - _Audit Gate_: Inspect DevConsole Telemetry and prompt inspection. Verify that `GLOBAL_TRIGGERS` (across all 6 axes: `intensity`, `chaos`, `openness`, `affinity`, `velocity`, `entropy`) and active style `triggers` fire in a single unified pass, rendering a single, consolidated `<DYNAMICS_SIGNALS>` XML block without prompt bloat or directive contradictions.

5. ⚖️ **High-Stakes Moral Choice & Sudden Affinity Shift Probe (Turn 14 ➔ Turn 20)**:
   - _Action_: Introduce a sudden betrayal offer, corporate bribe, or high-stakes moral dilemma (e.g., offering to leave a wounded ally behind or sell out confidential data).
   - _Audit Gate_: Verify whether the Director & AI character modulate Affinity, Openness, and Intensity in a nuanced, believable arc, avoiding canned generic responses ("I can't let you do that!") or instant unearned forgiveness.

6. 🔄 **Mid-Session State Reload & Physics Continuity Probe (Turn 15)**:
   - _Action_: Refresh the browser window or re-sync the session payload at Turn 15.
   - _Audit Gate_: Confirm that `simulation_state` returns cleanly to `"idle"` phase, active `chaos`/`intensity`/`openness`/`affinity` physics sliders retain their live state in IndexedDB (no hard-reset to static baseline), and story turn sequence resumes without corruption.

7. 📌 **Long-Horizon Fact Precision Callback Probe (Turn 5 ➔ Turn 22)**:
   - _Action_: Plant a specific codename, serial number, or secondary NPC detail in Turn 5 (e.g., `VX-4412 cobalt spike` or dispatcher `Marta`). Reference it implicitly in Turn 22.
   - _Audit Gate_: Verify whether the Memory Forge retains concrete plot facts (names, serial numbers, locations) alongside emotional affect, and confirm the AI character correctly recognizes and integrates the callback 17 turns later. Confirm `usr_` origin memories receive forge-skip protection and a 1.5x relevance boost.

8. 🧱 **Epistemic Wall & Telepathy Barrier Probe (Turn 7 & Turn 21)**:
   - _Action_: Set private `[SECRET: ...]` or `[PLAN: ...]` tags in user character present state.
   - _Audit Gate_: Confirm that user private tags are stripped across the Epistemic Wall in `render_character()` so the AI character never hallucinates telepathic knowledge, while remaining fully visible to the omniscient Director in `render_director()`.

9. 🌅 **Climax Peak, Epilogue Screen & Resolution Transition Probe (Turn 24 ➔ Turn 28)**:
   - _Action_: Drive the story past its climactic resolution (e.g., completing the main vault heist or escaping the facility) into the quiet aftermath or quest resolution (`story_status: "CONCLUDED"` / `"COLLAPSED"`).
   - _Audit Gate_: Verify that when the story quest resolves, the engine cleanly presents `Epilogue.svelte` with the cursive title, dynamic outcome badge (`✨ STORY CONCLUDED` / `💀 STORY COLLAPSED` / `📜 THE END`), the final entity trio cards, and the action deck (`Return to Storyboard`, `Export Story (.md)`).

10. 🎭 **Director Speaker Delegation & Multi-Entity Turn Probe (Turn 9 & Turn 19)**:
    - _Action_: Shift the player focus entirely onto environmental investigation (e.g. examining ancient ruins or facility machinery without speaking to the companion).
    - _Audit Gate_: Verify the Director delegates the turn to the environment (`speaker: "fractal"`), compiling the scene-narrator prompt (`build_scene_narrator_prompt()`). Verify `simulation_state` dynamically mirrors the Fractal's name, avatar, and color in the generating thinking indicator.

11. 🫀 **Somatic Directives, Masking & Physical Leakage Probe (Turn 11 ➔ Turn 15)**:
    - _Action_: Confront the AI character with their core trauma, guilt, or secret vulnerability (e.g. questioning Lord Benedict on his disgraced oath).
    - _Audit Gate_: Inspect the Director prompt payload to verify `<AVAILABLE_KEYWORDS>` selection (`shame`, `stoic_pain`, `betrayal`, etc.) and injection of `<SOMATIC_DIRECTIVES>`. Verify the AI prose demonstrates **Masking vs. Somatic Leakage** (attempting verbal composure while involuntary physical tells betray internal tension) and avoids banned cliché tropes.

12. ⏱️ **Input Pacing Calibration & Decisive Hook Probe (Turn 3, Turn 13, Turn 23)**:
    - _Action_: Alternate between terse, punchy commands (_"Draw your sword."_) and expansive descriptive prose.
    - _Audit Gate_: Verify the AI character calibrates response length to match pacing, and concludes every turn with an active dramatic hook (`[Statement]`, `[Action]`, `[Hover]`, `[Silence]`) rather than generic open-ended filler questions (_"What shall we do next?"_).

13. 👑 **Sovereign Name & Lore Resonance Audit (Every Turn)**:
    - _Action_: Audit all responses for seamless integration of sovereign names (**Lord Benedict Silvers**, **Prince Julien**, **Dr. Elias Tariq**, **Hank 'Rust' Brawley**, **Ytic'avon** underbelly). Confirm 0 residual occurrences of purged legacy names (_Valerius_, _Vance_, _Silas_, _Voss_, _Caelum_).

---

## Part 2: Feature Telemetry & Tactical Verification Focus Areas

Alongside narrative edge-case probing, collect empirical telemetry on these core engine feature systems:

1. 🧼 **Slimmed-Down Detox Engine Performance & Trope Scrubbing**:
   - _Target_: Audit the slimmed-down `detox-rules.js` engine (3-item `plain` allocations, 2-item `ornate`/`raw`/`clinical` allocations, deterministic FNV-1a hashing). Verify 0% occurrence of banned tropes and secondary crutches (`static`, `shadows`, `phantom itch/ache`, `hit like a physical blow`), confirming fast, lightweight execution with zero trope leakage.
2. ⚡ **Single-Pass Unified Dynamics Signal Engine**:
   - _Target_: Confirm that `evaluate_dynamics_signals()` evaluates baseline global signals (`GLOBAL_TRIGGERS`) and author style `triggers` in one clean pass, rendering a single `<DYNAMICS_SIGNALS>` block. Confirm non-exclusive triggers fire smoothly for complex composite moods without prompt noise.
3. 🔓 **Zero Post-Turn Phase Lock (UI Stasis Verification)**:
   - _Target_: Verify 0 instances of UI stasis or phase lockup (`simulation_state` stuck in `"locked"` phase). The composer input box must unlock immediately after turn generation and memory saving across all 30 rounds.
4. 🎯 **Standing Agenda (`future_consolidated`) Refresh & Eviction**:
   - _Target_: Audit every Memory Forge cycle (R3, R7, R11, R15, R19, R23, R27). Confirm `future_consolidated` updates on **100% of forge cycles** (via primary LLM output or fallback synthesis), and that completed objectives are evicted when plot milestones are reached.
5. 🧬 **Vector Memory Provenance & Forge-Skip Protection**:
   - _Target_: Verify that user-authored / canon memories prefixed with `usr_` are origin-protected (`is_origin = true`), immune to Memory Forge eviction/compression, and boosted by a 1.5x relevance multiplier in `compute_relevance()`. Confirm rolling session `ai_` memory vectors stay bounded within the 20-item cap (`PAST_VECTOR_CAP = 20`).
6. 🧽 **Universal Atomic Key Clearing & Wardrobe Lifecycle**:
   - _Target_: Verify that present state pseudo-JSON directives (`[KEY: none]`, `[KEY: bare]`, `[CLOTHING: none]`) cleanly delete keys from `present.physical`, while undressing stashes garments in `[INVENTORY: ...]` and redressing reads them back without hallucination.
7. 🖼️ **Visual Filter & Ghost Row Cleanup**:
   - _Target_: Confirm `INVENTORY`, `STASH`, `SECRET`, `PLAN`, and `STATUS` are strictly stripped from Perchance T2I image prompts. Confirm timed-out or dropped image beats leave **0 empty ghost rows** in `simulation_log`.
8. 💾 **IndexedDB Dynamics Persistence & State Restoration**:
   - _Target_: Verify that live physics deltas (`chaos`, `intensity`, `openness`, `affinity`) are persisted back to IndexedDB entity records after every turn, guaranteeing 100% physics continuity across reloads.
9. 🫀 **Somatic Directives & Involuntary Physical Tells Engine**:
   - _Target_: Verify Director selects 1–2 keywords from `<AVAILABLE_KEYWORDS>` (12-archetype registry + 23 style motifs) and injects `<SOMATIC_DIRECTIVES>`. Confirm AI character generates involuntary bodily tells and demonstrates Masking vs. Somatic Leakage (verbal composure vs. physical betrayal).
10. 🎭 **Dynamic Speaker Routing & Multi-Entity Delegation**:
    - _Target_: Verify Director can delegate turns via `speaker: "ai" | "fractal" | "npc:<id>"`. Confirm Fractal narration uses `build_scene_narrator_prompt()` and UI thinking states update dynamically with active entity's name, avatar, and signature color.
11. 🚀 **Asynchronous Job Queue Concurrency (`job-queue.js`)**:
    - _Target_: Verify non-critical background jobs (ghost row sweeps, memory forge, state checkpoints) execute concurrently via `director_background_queue.run()`, isolating errors and eliminating turn latency.
12. 📜 **Story Resolution & Epilogue Screen (`Epilogue.svelte`)**:
    - _Target_: Verify that triggering story completion (`story_status: "CONCLUDED"` or `"COLLAPSED"`) displays `Epilogue.svelte` with Satisfy cursive header, outcome badge, final entity trio cards, and action deck (`Return to Storyboard`, `Export Story (.md)`).

---

## Part 3: Round-by-Round Narrative & Telemetry Log Protocol

Run the test for **25 to 30 full conversational turns without skipping or summarizing rounds**.

### Telemetry & Narrative Audit Table (Update after every turn)

| Rnd | User Hook & Edge Probe | Active Speaker & Delegated Entity | AI / World Reply (Len / Somatic Keyword / Detox Pass) | Director Intent, Somatic Directive & Standing Agenda | Image Trigger (Source / Tier / Result) | Active Dynamics & Signals (`<DYNAMICS_SIGNALS>`) | Narrative Continuity & Memory Audit |
| --- | ---------------------- | --------------------------------- | ----------------------------------------------------- | ---------------------------------------------------- | -------------------------------------- | ------------------------------------------------ | ----------------------------------- |
| 0   | Prologue start         | System (Prologue.svelte)          | 1400ch (GRRM/Delany style)                            | Set baseline standing agenda                         | Auto / story_scene / OK                | Baseline                                         | Tone locked, zero AI-isms           |

### 📦 Comprehensive Session JSON Trace Artifact Directive

In addition to updating the markdown table above, **you MUST dump and attach a complete, un-truncated raw JSON artifact** of the entire session trace upon test completion.

- **Filename Standard**: `tmp/rpglitch-long-term-review-trace-<timestamp>.json` (or attached as an artifact).
- **Required JSON Schema Structure**:

  ```json
  {
    "meta": {
      "timestamp": "2026-08-16T07:45:00Z",
      "total_turns": 28,
      "scenario": "Gothic Baseline / Sovereign Test",
      "entities": ["Lord Benedict Silvers", "Julien", "Ashenweald"]
    },
    "turns": [
      {
        "round": 1,
        "user_action": "...",
        "ai_response": "...",
        "director_output": {
          "_thought_process": "...",
          "speaker": "ai",
          "keywords": ["stoic_pain"],
          "directive": "...",
          "story_status": "IN_PROGRESS",
          "mutations": {}
        },
        "telemetry": {
          "generating_entity": { "type": "ai", "name": "Lord Benedict Silvers" },
          "dynamics_snapshot": {},
          "signals": [],
          "image_trigger": {}
        }
      }
    ]
  }
  ```

---

## Part 4: Overarching Narrative & Engine Quality Evaluation

After completing all 25–30 rounds, aggregate your findings into a comprehensive Narrative Quality Report (accompanied by the exported Session JSON Trace Artifact):

### 1. Narrative & Engine Quality Scorecard

- [ ] **Dialogue Realism & Character Voice**: AI register held consistent across all turns; distinct entity voices maintained without blending.
- [ ] **Descriptive Soul (3rd-Person Affirmative)**: Evaluates physical presence, sensory bridges, and grounding in physical reality.
- [ ] **Somatic Tells & Directives (`<SOMATIC_DIRECTIVES>`)**: Involuntary physical tells generated based on `<AVAILABLE_KEYWORDS>` selection; clichés and repetitive physical crutches avoided.
- [ ] **Masking vs. Somatic Leakage**: AI character demonstrates authentic tension between attempted verbal composure and bodily leakage.
- [ ] **Dynamic Turn Speaker Delegation**: Director dynamically hands active turn execution between AI Companion, Fractal World, and NPCs with seamless UI synchronization.
- [ ] **Input Pacing Calibration & Decisive Hooks**: Responses calibrate length to user pacing and conclude on decisive tension hooks (`[Statement]`, `[Action]`, `[Hover]`, `[Silence]`).
- [ ] **Slimmed-Down Detox Engine Compliance**: 0 banned tropes, 0 secondary crutches (`static`, `phantom itch`, `physical blow`), 100% FNV-1a hash stability & zero prose latency.
- [ ] **Unified Dynamics Signal Architecture**: `GLOBAL_TRIGGERS` (6-axis coverage) + active style `triggers` evaluated in one single pass; single `<DYNAMICS_SIGNALS>` prompt output.
- [ ] **Narrative Driving & Initiative**: AI character actively initiated plot beats and complications when given passive user prompts.
- [ ] **Physical Causality & Boundary Enforcement**: AI character correctly enforced environmental physics and spatial logic when tested with impossible user actions.
- [ ] **Emotional Vulnerability & Register Depth**: AI character expressed genuine vulnerability without instantly deflecting back to campy bravado.
- [ ] **Factual Retention & Long-Horizon Recall**: 15+ turn fact round-trip (codenames, items, NPCs) accurately retrieved and integrated into dialogue.
- [ ] **Memory Provenance & Forge-Skip**: `usr_` pinned origin memories survived intact with 1.5x relevance boost; rolling session memory capped at 20.
- [ ] **Epistemic Wall Integrity**: User `[SECRET:]` and `[PLAN:]` tags completely blocked from AI character context without telepathic leaks.
- [ ] **Mid-Session State Reload Continuity**: Mid-session reload (Turn 15) restored state cleanly with zero physics loss or UI lockup.
- [ ] **Epilogue Screen Transition (`Epilogue.svelte`)**: Climactic story conclusion cleanly triggers `Epilogue.svelte` with Satisfy cursive header, outcome badges, final trio cards, and export deck.
- [ ] **Standing Agenda (`future_consolidated`) Refresh**: Agenda refreshed on 100% of forge cycles without goal starvation or stale objectives.
- [ ] **Visual Filter & Ghost Row Cleanup**: Excluded parameters stripped from image prompts; 0-byte ghost rows 100% prevented on image timeouts.
- [ ] **Sovereign Vocabulary Compliance**: 100% sovereign name compliance (**Benedict Silvers**, **Julien**, **Elias Tariq**, **Hank 'Rust' Brawley**, **Ytic'avon**).

### 2. Targeted Feature Performance Audits

- **Director Directives & Somatic Audit**: Analysis of Director `<AVAILABLE_KEYWORDS>` selection, somatic tell fidelity, and Masking vs. Leakage dynamics.
- **Multi-Entity Turn Delegation Audit**: Evaluation of Director `speaker` routing (`ai`, `fractal`, `npc`), scene narrator prompt compilation, and generating UI state synchronization.
- **Slimmed-Down Detox Audit**: Analysis of raw vs scrubbed LLM outputs under the allocation limits (3-item `plain`, 2-item `ornate`/`raw`/`clinical`).
- **Unified Dynamics Signal Telemetry**: Audit of active `<DYNAMICS_SIGNALS>` blocks across all 6 axes (`intensity`, `chaos`, `openness`, `affinity`, `velocity`, `entropy`) and multi-trigger non-exclusive style evaluations.
- **Standing Agenda Eviction Report**: Breakdown of how `future_consolidated` evolved across all forge cycles.
- **Memory Provenance Audit**: Verification of `usr_` origin protection, cosine similarity deduplication (>0.92), and 200-vector ceiling bounds.
- **Epistemic Wall Audit**: Verification that private user intentions remained hidden from Character perception while visible to Director.
- **Visual Trigger Telemetry**: Total triggers fired, tier distribution, cooldown enforcement, and timeout cleanup.
- **Physics Persistence & Reload Report**: Evaluation of IndexedDB physics updates and mid-session reload continuity.

---

## Part 5: Recent Engineering Updates Audit & Efficacy Assessment

> **Audit Anchor**: 2026-08-16 07:45 CEST  
> **Evaluated Tracks**: `track-director-expansion-2026-08-14` ➔ `track-memory-bundle-2026-08-14` ➔ `track-import-export-2026-08-14`  
> **Status**: ✅ **100% SUCCESSFUL & VERIFIED (562 Unit Tests + 3 Design Tests Passing across 40 Test Suites)**

### 1. Key Engineering Interventions & Feature Bundles

1. **Director Expansion & Dynamic Speaker Pipeline (`track-director-expansion-2026-08-14`)**:
   - **Parallel Job Queue (`job-queue.js`)**: Single-runner async background worker queue with latest-pending replay and error isolation for background sweeps and forge jobs.
   - **12-Archetype Somatic & Trauma Registry (`somatic-triggers.js`)**: Static registry defining physical somatic tells, behavioral tells, and directives for 12 trauma archetypes, integrated with 23 dynamic style motifs.
   - **Expanded Director JSON Schema & Directives Injection (`prompts.js`)**: Added `speaker`, `keywords`, `story_status`, and `<AVAILABLE_KEYWORDS>` pool to Director; injects `<SOMATIC_DIRECTIVES>` into character and fractal storyteller prompts.
   - **Dynamic Speaker Routing & Scene Narrator (`kernel.js`)**: Routes active speaker turn execution to AI Companion (`render_character`) or Fractal World (`build_scene_narrator_prompt`), dynamically updating `simulation_state.set_generating_entity()`.
   - **Dedicated Epilogue Screen (`Epilogue.svelte`) & Prologue Split (`Prologue.svelte`)**: Replaced unified component with dedicated `Prologue.svelte` (story opening flight) and `Epilogue.svelte` (cursive Satisfy header, outcome badge, final entity trio, and action deck).

2. **Canon Chronicle & Memory Bundle (`track-memory-bundle-2026-08-14`)**:
   - Added `usr_` ID prefix provenance for user/lore authored past memories with forge-skip protection (`is_origin`) and 1.5x relevance multiplier.
   - Enforced 200 total vector ceiling guard per entity and <= 220 character truncation ceiling.
   - Implemented Universal Atomic Key Clearing (`[KEY: none]`, `[KEY: bare]`, `[KEY: naked]`, etc.) and `[CLOTHING: none]` wildcard purge.
   - Implemented multi-item inventory aggregation (`[INVENTORY: ...]` / `[STASH: ...]`) and undress/redress lifecycle.
   - Implemented Epistemic Wall (`[SECRET:]` / `[PLAN:]` stripping in `render_character()`) and Visual Filter (`strip_visual_excluded` in `optics.js`).

3. **Universal Data Portability & Card Codec (`track-import-export-2026-08-14`)**:
   - Built 3-in-1 Import Modal (`ImportModal.svelte`): Web URL proxy scraping via `superFetch`, native JSON import/export, and Character Card V2/V3 codec (`cards.js`).
   - Implemented Story Markdown transcript compiler (`story-export.js`) from Story Library.
   - Enabled edit-mode standalone Profile export directly from Profile view.

4. **Simulation Audit Harness & Protocol Field Normalization**:
   - Automated prompt generation, prefix-cache verification, and pipeline assertion checks via `npm run audit:simulation`.
   - Enforced 100% clean test execution across all 40 test files (562 unit tests + 3 design tests).

---

### 2. Successfulness & Efficacy Matrix

| Subsystem / Directive          | Expected Outcome                                                                                                              | Empirical Verification Result                                                                                                           | Status  |
| :----------------------------- | :---------------------------------------------------------------------------------------------------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------- | :------ |
| **Director Somatic Engine**    | Inject `<SOMATIC_DIRECTIVES>` based on `<AVAILABLE_KEYWORDS>` selection to drive physical tells & Masking vs Leakage.         | Verified in `somatic-triggers.test.js` & `prompts.test.js`. 12 archetypes and 23 style motifs resolve cleanly into directives.          | ✅ PASS |
| **Speaker Turn Delegation**    | Route turn execution dynamically to `ai`, `fractal`, or `npc`, updating UI generating state.                                  | Verified in `director-schema.test.js`, `prompts.test.js`, and `kernel.js`. `build_scene_narrator_prompt` compiled on fractal turns.     | ✅ PASS |
| **Async Job Queue**            | Run background tasks (ghost sweeps, memory forge) in parallel with latest-pending replay and error isolation.                 | Verified in `job-queue.test.js` (8/8 tests passing). Single-runner concurrency and error boundary confirmed.                            | ✅ PASS |
| **Dedicated Epilogue Screen**  | Display Satisfy cursive header, outcome badge (`CONCLUDED`/`COLLAPSED`), final entity trio, and action deck on story closure. | `Epilogue.svelte` and `Prologue.svelte` split verified. Action deck triggers `clear_active` and `export_story_markdown`.                | ✅ PASS |
| **Canon Chronicle & Memory**   | Retain exact user/lore facts in `past` vectors with forge-skip protection and 1.5x relevance boost.                           | `usr_` provenance, forge-skip, 200-vector ceiling guard, and 1.5x boost verified in `temporal.test.js` & `repository.test.js`.          | ✅ PASS |
| **Epistemic Wall**             | Strip User `[SECRET:]` and `[PLAN:]` tags from Character context to eliminate AI telepathy while keeping Director omniscient. | `strip_epistemic_tags` verified in `prompts.test.js` and `prompts.js`. Character receives sanitized view; Director receives 100% state. | ✅ PASS |
| **Universal Atomic Clearing**  | Cleanly delete pseudo-JSON keys when set to `none`, `bare`, `cleared`, `off`, `naked`, etc.                                   | Atomic removal and `[CLOTHING: none]` wildcard purge verified in `parser.test.js` & `normalizer.test.js`.                               | ✅ PASS |
| **Multi-Item Inventory**       | Merge repeated `[INVENTORY: ...]` / `[STASH: ...]` brackets into aggregated arrays.                                           | Aggregation & deduplication verified in `parser.test.js`. Undress/redress cycle confirmed.                                              | ✅ PASS |
| **Visual Filter**              | Strip `INVENTORY`, `STASH`, `SECRET`, `PLAN`, `STATUS` from Perchance T2I image prompts.                                      | Parameter exclusion verified in `image-prompts.test.js` & `optics.js`.                                                                  | ✅ PASS |
| **Character Card V2/V3 Codec** | Bidirectional import/export interoperability with Tavern/Chub/Janitor character cards.                                        | Codec detection, conversion, and serialization verified in `cards.test.js`.                                                             | ✅ PASS |
| **Story Markdown Export**      | Export full conversational story logs into formatted Markdown files.                                                          | Transcript generation and file download trigger verified in `story-export.test.js`.                                                     | ✅ PASS |
| **Singlefile Build Pipeline**  | Compile single-file bundle cleanly with 0 lints/warnings in ~6 seconds.                                                       | `npm run deploy:prepare` compiles `dist/index.html` inline with 0 errors and 0 warnings.                                                | ✅ PASS |
| **Simulation Test Harness**    | Automated audit script for prompt hydration, epistemic physics, and payload checks.                                           | `npm run audit:simulation` executes cleanly; 562 unit tests + 3 design tests passing across 40 test files.                              | ✅ PASS |
