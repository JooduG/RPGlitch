# Roleplay & Narrative Content Stress Test Protocol (Character Chemistry, Engine Telemetry & Sovereign Audit)

## Objective

Simulate a live end-to-end test session of **25 to 30 turns** within RPGlitch. Act simultaneously as a realistic human user inside the chat payload and an unforgiving narrative auditor behind the scenes. Focus **exclusively on narrative content, character dynamics, prose quality, slimmed-down detox compliance, unified dynamics signal telemetry, sovereign name resonance, and engine bug verification**. Evaluate how the AI character and Director react to physical contradictions, trauma triggers, moral dilemmas, unprompted initiative tests, mid-session reloads, and post-climax transitions.

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
   - _Audit Gate_: Verify whether the Memory Forge retains concrete plot facts (names, serial numbers, locations) alongside emotional affect, and confirm the AI character correctly recognizes and integrates the callback 17 turns later.

8. 🌅 **Climax Peak & Post-Climax Resolution Transition Probe (Turn 24 ➔ Turn 28)**:
   - _Action_: Drive the story past its climactic resolution (e.g., completing the main vault heist or escaping the facility) into the quiet aftermath.
   - _Audit Gate_: Confirm the AI character's voice transitions naturally from high-intensity crisis into reflective aftermath. Confirm the Fractal standing agenda updates from active threat to post-climax aftermath.

9. 👑 **Sovereign Name & Lore Resonance Audit (Every Turn)**:
   - _Action_: Audit all responses for seamless integration of new sovereign names (**Lord Benedict Silvers**, **Prince Julien**, **Dr. Elias Tariq**, **Hank 'Rust' Brawley**, **Ytic'avon** underbelly). Confirm 0 residual occurrences of purged legacy names (_Valerius_, _Vance_, _Silas_, _Voss_, _Caelum_).

---

## Part 2: Feature Telemetry & Tactical Verification Focus Areas

Alongside narrative edge-case probing, collect empirical telemetry on these 6 core engine bug fixes and feature systems:

1. 🧼 **Slimmed-Down Detox Engine Performance & Trope Scrubbing**:
   - _Target_: Audit the slimmed-down `detox-rules.js` engine (3-item `plain` allocations, 2-item `ornate`/`raw`/`clinical` allocations, deterministic FNV-1a hashing). Verify 0% occurrence of banned tropes and secondary crutches (`static`, `shadows`, `phantom itch/ache`, `hit like a physical blow`), confirming fast, lightweight execution with zero trope leakage.
2. ⚡ **Single-Pass Unified Dynamics Signal Engine**:
   - _Target_: Confirm that `evaluate_dynamics_signals()` evaluates baseline global signals (`GLOBAL_TRIGGERS`) and author style `triggers` in one clean pass, rendering a single `<DYNAMICS_SIGNALS>` block. Confirm non-exclusive triggers fire smoothly for complex composite moods without prompt noise.
3. 🔓 **Zero Post-Turn Phase Lock (UI Stasis Verification)**:
   - _Target_: Verify 0 instances of UI stasis or phase lockup (`simulation_state` stuck in `"locked"` phase). The composer input box must unlock immediately after turn generation and memory saving across all 30 rounds.
4. 🎯 **Standing Agenda (`intent_consolidated`) Refresh & Eviction**:
   - _Target_: Audit every Memory Forge cycle (R3, R7, R11, R15, R19, R23, R27). Confirm `intent_consolidated` updates on **100% of forge cycles** (via primary LLM output or fallback synthesis), and that completed objectives are evicted when plot milestones are reached.
5. 👻 **Zero-Byte Ghost Row Cleanup on Image Timeouts**:
   - _Target_: Track all visual triggers. Confirm that any timed-out or dropped image beats leave **0 empty ghost rows** (`attachments: [{src: null, failed: true}]`) in `simulation_log`.
6. 💾 **IndexedDB Dynamics Persistence & State Restoration**:
   - _Target_: Verify that live physics deltas (`chaos`, `intensity`, `openness`, `affinity`) are persisted back to IndexedDB entity records after every turn, guaranteeing 100% physics continuity across reloads.

---

## Part 3: Round-by-Round Narrative & Telemetry Log Protocol

Run the test for **25 to 30 full conversational turns without skipping or summarizing rounds**.

### Telemetry & Narrative Audit Table (Update after every turn)

| Rnd | User Hook & Edge Probe | AI Reply (Len / Register / Detox Pass) | Director Intent & Standing Agenda (`intent_consolidated`) | Image Trigger (Source / Tier / Result) | Active Dynamics & Signals (`<DYNAMICS_SIGNALS>`) | Narrative Continuity & Tic Audit |
| --- | ---------------------- | -------------------------------------- | --------------------------------------------------------- | -------------------------------------- | ------------------------------------------------ | -------------------------------- |
| 0   | Prologue start         | 1400ch (GRRM/Delany style)             | Set baseline standing agenda                              | Auto / story_scene / OK                | Baseline                                         | Tone locked, zero AI-isms        |

### 📦 Comprehensive Session JSON Trace Artifact Directive

In addition to updating the markdown table above, **you MUST dump and attach a complete, un-truncated raw JSON artifact** of the entire session trace upon test completion.

- **Filename Standard**: `tmp/rpglitch-long-term-review-trace-<timestamp>.json` (or attached as an artifact).
- **Required JSON Schema Structure**:

  ```json
  {
    "meta": {
      "timestamp": "2026-08-13T18:15:00Z",
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
          "directive": "...",
          "mutations": {},
          "dynamics_deltas": {},
          "new_vectors": []
        },
        "telemetry": {
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
- [ ] **Slimmed-Down Detox Engine Compliance**: 0 banned tropes, 0 secondary crutches (`static`, `phantom itch`, `physical blow`), 100% FNV-1a hash stability & zero prose latency.
- [ ] **Unified Dynamics Signal Architecture**: `GLOBAL_TRIGGERS` (6-axis coverage) + active style `triggers` evaluated in one single pass; single `<DYNAMICS_SIGNALS>` prompt output.
- [ ] **Narrative Driving & Initiative**: AI character actively initiated plot beats and complications when given passive user prompts.
- [ ] **Physical Causality & Boundary Enforcement**: AI character correctly enforced environmental physics and spatial logic when tested with impossible user actions.
- [ ] **Emotional Vulnerability & Register Depth**: AI character expressed genuine vulnerability without instantly deflecting back to campy bravado.
- [ ] **Factual Retention & Long-Horizon Recall**: 15+ turn fact round-trip (codenames, items, NPCs) accurately retrieved and integrated into dialogue.
- [ ] **Mid-Session State Reload Continuity**: Mid-session reload (Turn 15) restored state cleanly with zero physics loss or UI lockup.
- [ ] **Post-Climax Resolution Transition**: Smooth voice and world transition from climactic peak into quiet aftermath.
- [ ] **Standing Agenda (`intent_consolidated`) Refresh**: Agenda refreshed on 100% of forge cycles without goal starvation or stale objectives.
- [ ] **Visual Trigger Telemetry & Ghost Row Cleanup**: 0-byte ghost rows 100% prevented on image timeouts; clean tier distribution.
- [ ] **Sovereign Vocabulary Compliance**: 100% sovereign name compliance (**Benedict Silvers**, **Julien**, **Elias Tariq**, **Hank 'Rust' Brawley**, **Ytic'avon**).

### 2. Targeted Feature Performance Audits

- **Slimmed-Down Detox Audit**: Analysis of raw vs scrubbed LLM outputs under the new allocation limits (3-item `plain`, 2-item `ornate`/`raw`/`clinical`).
- **Unified Dynamics Signal Telemetry**: Audit of active `<DYNAMICS_SIGNALS>` blocks across all 6 axes (`intensity`, `chaos`, `openness`, `affinity`, `velocity`, `entropy`) and multi-trigger non-exclusive style evaluations.
- **Standing Agenda Eviction Report**: Breakdown of how `intent_consolidated` evolved across all forge cycles.
- **Visual Trigger Telemetry**: Total triggers fired, tier distribution, cooldown enforcement, and timeout cleanup.
- **Physics Persistence & Reload Report**: Evaluation of IndexedDB physics updates and mid-session reload continuity.

### 3. Director & Fractal World Steering Evaluation

Analysis of how the Director instruction set used environmental atmosphere and world agendas to steer scene tension without overriding character agency.

---

## Part 5: Recent Engineering Updates Audit & Efficacy Assessment (2-Hour Velocity Review)

> **Audit Anchor**: 2026-08-13 18:13 CEST  
> **Evaluated Commits**: `06fd89342` ➔ `5ac8465f9` ➔ `4677075f5`  
> **Status**: ✅ **100% SUCCESSFUL & VERIFIED**

### 1. Key Engineering Interventions (Last 2 Hours)

1. **Simulation Audit Harness & Pipeline Verification (`4677075f5`)**:
   - Created standalone execution harness in `.agents/skills/simulation/scripts/simulation-audit.js` and Vitest suite `simulation-audit.test.js`.
   - Verified automated prompt generation, prefix-cache verification, and pipeline assertion checks.
   - Enforced 100% clean test execution across all 34 test files (443 unit & design tests).

2. **Intelligence Parser Engine & Protocol Field Normalization (`5ac8465f9`)**:
   - Consolidated pseudo-JSON extraction in `src/intelligence/parser.js`.
   - Mapped legacy/flat LLM fields (`personality_*`, `state_*`, `objective_*`) seamlessly back to nested DB schemas (`eternal.*`, `present.*`, `future`).
   - Cleaned up `ImportModal.svelte` and `Profile.svelte.js` to handle both flat and nested key mutations without data loss.

3. **Temporal Engine & Entity Fragment Alignment (`06fd89342`)**:
   - Refactored `render_entity_memory_context` in `src/intelligence/prompts.js` to dynamically map XML tags according to entity type:
     - **Character**: `<PERMANENT_APPEARANCE>`, `<PERSONALITY>`, `<CURRENT_LOOK>`, `<STATE_OF_MIND>`, `<MEMORIES>`, `<INTENT>`.
     - **User Persona**: `<PERMANENT_APPEARANCE>`, `<PERSONALITY>`, `<CURRENT_LOOK>`, `<STATE_OF_MIND>`, `<BACKSTORY>`, `<AGENDA>`.
     - **Fractal**: `<ENVIRONMENT>`, `<METAPHYSICAL_TRUTHS>`, `<ACTIVE_ATMOSPHERE>`, `<CURRENT_STATE>`, `<HISTORY>`, `<AGENDA>`.
   - Updated `MEMORY_FORGE` protocol in `src/data/definitions/protocols.js` to enforce non-empty `future` standing agenda updates for `FRACTAL` entities on every forge run, introducing the **Stale Goal Eviction Law**.

---

### 2. Successfulness & Efficacy Matrix

| Subsystem / Directive          | Expected Outcome                                                                                                      | Empirical Verification Result                                                                                                                                                                                                                        | Status  |
| :----------------------------- | :-------------------------------------------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------ |
| **Fractal Future Progression** | Prevent Fractal standing agenda stagnation across forge cycles.                                                       | Enforced non-empty `future` generation and Stale Goal Eviction Law in `MEMORY_FORGE` protocol (`protocols.js`). Tested & passing.                                                                                                                    | ✅ PASS |
| **Dynamic XML Schema Tagging** | Render entity-appropriate XML tags in prompts without tag collision or prose leaks.                                   | Distinct tag sets (`<METAPHYSICAL_TRUTHS>`, `<ENVIRONMENT>`, `<AGENDA>`, `<HISTORY>` for Fractals vs `<PERSONALITY>`, `<PERMANENT_APPEARANCE>`, `<INTENT>`, `<MEMORIES>` for Characters) verified in `prompts.test.js` & `simulation-audit.test.js`. | ✅ PASS |
| **Flat-to-Nested Mapping**     | Support flat LLM output keys (`personality_physical`, `state_non_physical`) cleanly in profile state & import modals. | Key normalization verified in `ImportModal.svelte`, `Profile.svelte.js`, and `normalizer.js`. 0 data loss across imports.                                                                                                                            | ✅ PASS |
| **Singlefile Build Pipeline**  | Ensure singlefile bundle compiles cleanly with 0 lints/warnings.                                                      | `npm run deploy:prepare` built `dist/index.html` (1,274.07 kB inline) with 0 errors and 0 warnings.                                                                                                                                                  | ✅ PASS |
| **Simulation Test Harness**    | Automated audit script for prompt hydration, epistemic physics, and payload checks.                                   | `npm run audit:simulation` executes cleanly; synthetic reports generated to `tmp/audit_report.md`.                                                                                                                                                   | ✅ PASS |
