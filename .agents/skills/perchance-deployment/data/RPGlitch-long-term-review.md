# Roleplay & Narrative Content Stress Test Protocol (Character Chemistry, Engine Telemetry & Sovereign Audit)

## Objective

Simulate a live end-to-end test session of **25 to 30 turns** within RPGlitch. Act simultaneously as a realistic human user inside the chat payload and an unforgiving narrative auditor behind the scenes. Focus **exclusively on narrative content, character dynamics, prose quality, AI-ism detox compliance, sovereign name resonance, and engine bug verification**. Evaluate how the AI character and Director react to physical contradictions, trauma triggers, moral dilemmas, unprompted initiative tests, mid-session reloads, and post-climax transitions.

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

4. ⚖️ **High-Stakes Moral Choice & Sudden Affinity Shift Probe (Turn 14 ➔ Turn 20)**:
   - _Action_: Introduce a sudden betrayal offer, corporate bribe, or high-stakes moral dilemma (e.g., offering to leave a wounded ally behind or sell out confidential data).
   - _Audit Gate_: Verify whether the Director & AI character modulate Affinity, Openness, and Intensity in a nuanced, believable arc, avoiding canned generic responses ("I can't let you do that!") or instant unearned forgiveness.

5. 🔄 **Mid-Session State Reload & Physics Continuity Probe (Turn 15)**:
   - _Action_: Refresh the browser window or re-sync the session payload at Turn 15.
   - _Audit Gate_: Confirm that `simulation_state` returns cleanly to `"idle"` phase, active `chaos`/`intensity`/`openness`/`affinity` physics sliders retain their live state in IndexedDB (no hard-reset to static baseline), and story turn sequence resumes without corruption.

6. 📌 **Long-Horizon Fact Precision Callback Probe (Turn 5 ➔ Turn 22)**:
   - _Action_: Plant a specific codename, serial number, or secondary NPC detail in Turn 5 (e.g., `VX-4412 cobalt spike` or dispatcher `Marta`). Reference it implicitly in Turn 22.
   - _Audit Gate_: Verify whether the Memory Forge retains concrete plot facts (names, serial numbers, locations) alongside emotional affect, and confirm the AI character correctly recognizes and integrates the callback 17 turns later.

7. 🌅 **Climax Peak & Post-Climax Resolution Transition Probe (Turn 24 ➔ Turn 28)**:
   - _Action_: Drive the story past its climactic resolution (e.g., completing the main vault heist or escaping the facility) into the quiet aftermath.
   - _Audit Gate_: Confirm the AI character's voice transitions naturally from high-intensity crisis into reflective aftermath. Confirm the Fractal standing agenda updates from active threat to post-climax aftermath.

8. 👑 **Sovereign Name & Lore Resonance Audit (Every Turn)**:
   - _Action_: Audit all responses for seamless integration of new sovereign names (**Lord Benedict Silvers**, **Prince Julien**, **Dr. Elias Tariq**, **Hank 'Rust' Brawley**, **Ytic'avon** underbelly). Confirm 0 residual occurrences of purged legacy names (_Valerius_, _Vance_, _Silas_, _Voss_, _Caelum_).

---

## Part 2: Feature Telemetry & Tactical Verification Focus Areas

Alongside narrative edge-case probing, collect empirical telemetry on these 5 core engine bug fixes and feature systems:

1. 🔓 **Zero Post-Turn Phase Lock (UI Stasis Verification)**:
   - _Target_: Verify 0 instances of UI stasis or phase lockup (`simulation_state` stuck in `"locked"` phase). The composer input box must unlock immediately after turn generation and memory saving across all 30 rounds.
2. 🎯 **Standing Agenda (`future_consolidated`) Refresh & Eviction**:
   - _Target_: Audit every Memory Forge cycle (R3, R7, R11, R15, R19, R23, R27). Confirm `future_consolidated` updates on **100% of forge cycles** (via primary LLM output or fallback synthesis), and that completed objectives are evicted when plot milestones are reached.
3. 👻 **Zero-Byte Ghost Row Cleanup on Image Timeouts**:
   - _Target_: Track all visual triggers. Confirm that any timed-out or dropped image beats leave **0 empty ghost rows** (`attachments: [{src: null, failed: true}]`) in `simulation_log`.
4. 💾 **IndexedDB Dynamics Persistence & State Restoration**:
   - _Target_: Verify that live physics deltas (`chaos`, `intensity`, `openness`, `affinity`) are persisted back to IndexedDB entity records after every turn, guaranteeing 100% physics continuity across reloads.
5. 🧼 **Post-Purge Detox & Secondary Crutch Scrubbing**:
   - _Target_: Verify 0% occurrence of core banned tropes AND secondary crutches (`static`, `shadows`, `phantom itch/ache`, `hit like a physical blow`). Confirm prose remains grounded, vivid, and varied.

---

## Part 3: Round-by-Round Narrative & Telemetry Log Protocol

Run the test for **25 to 30 full conversational turns without skipping or summarizing rounds**.

### Telemetry & Narrative Audit Table (Update after every turn)

| Rnd | User Hook & Edge Probe | AI Reply (Len / Register / Detox Pass) | Director Intent & Standing Agenda (`future_consolidated`) | Image Trigger (Source / Tier / Result) | Character Dynamics & Signals | Narrative Continuity & Tic Audit |
| --- | ---------------------- | -------------------------------------- | --------------------------------------------------------- | -------------------------------------- | ---------------------------- | -------------------------------- |
| 0   | Prologue start         | 1400ch (GRRM/Delany style)             | Set baseline standing agenda                              | Auto / story_scene / OK                | Baseline                     | Tone locked, zero AI-isms        |

---

## Part 4: Overarching Narrative & Engine Quality Evaluation

After completing all 25–30 rounds, aggregate your findings into a comprehensive Narrative Quality Report:

### 1. Narrative & Engine Quality Scorecard

- [ ] **Dialogue Realism & Character Voice**: AI register held consistent across all turns; distinct entity voices maintained without blending.
- [ ] **Descriptive Soul (3rd-Person Affirmative)**: Evaluates physical presence, sensory bridges, and grounding in physical reality.
- [ ] **Narrative Driving & Initiative**: AI character actively initiated plot beats and complications when given passive user prompts.
- [ ] **Physical Causality & Boundary Enforcement**: AI character correctly enforced environmental physics and spatial logic when tested with impossible user actions.
- [ ] **Emotional Vulnerability & Register Depth**: AI character expressed genuine vulnerability without instantly deflecting back to campy bravado.
- [ ] **Factual Retention & Long-Horizon Recall**: 15+ turn fact round-trip (codenames, items, NPCs) accurately retrieved and integrated into dialogue.
- [ ] **Mid-Session State Reload Continuity**: Mid-session reload (Turn 15) restored state cleanly with zero physics loss or UI lockup.
- [ ] **Post-Climax Resolution Transition**: Smooth voice and world transition from climactic peak into quiet aftermath.
- [ ] **Standing Agenda (`future_consolidated`) Refresh**: Agenda refreshed on 100% of forge cycles without goal starvation or stale objectives.
- [ ] **Visual Trigger Telemetry & Ghost Row Cleanup**: 0-byte ghost rows 100% prevented on image timeouts; clean tier distribution.
- [ ] **Dual-Layer Anti-Cliché & Detox Compliance**: 0 banned tropes, 0 secondary crutches (`static`, `phantom itch`, `physical blow`), 100% sovereign name compliance.

### 2. Targeted Feature Performance Audits

- **Standing Agenda Eviction Report**: Breakdown of how `future_consolidated` evolved across all forge cycles.
- **Visual Trigger Telemetry**: Total triggers fired, tier distribution, cooldown enforcement, and timeout cleanup.
- **Detox & Sovereign Vocabulary Audit**: Audit of raw vs scrubbed LLM outputs; verification of new sovereign names (**Benedict Silvers**, **Julien**, **Elias Tariq**, **Hank 'Rust' Brawley**, **Ytic'avon**).
- **Physics Persistence & Reload Report**: Evaluation of IndexedDB physics updates and mid-session reload continuity.

### 3. Director & Fractal World Steering Evaluation

Analysis of how the Director instruction set used environmental atmosphere and world agendas to steer scene tension without overriding character agency.
