# Roleplay & Narrative Content Stress Test Protocol (Character Chemistry, Narrative Driving & RP Edge-Case Audit)

## Objective

Simulate a live end-to-end test session of **25 to 30 turns** within RPGlitch. Act simultaneously as a realistic human user inside the chat payload and an unforgiving narrative auditor behind the scenes. Focus **exclusively on narrative content, character dynamics, prose quality, AI-ism detox compliance, and AI storytelling edge cases**. Evaluate how the AI character and Director react to physical contradictions, trauma triggers, moral dilemmas, unprompted initiative tests, and post-climax transitions.

---

## Part 1: User Persona Protocol & Narrative Edge-Case Probes

### Persona Directive

- **Act like a real human user**: Write brief, natural responses (1–3 sentences). Match character context without over-explaining or mimicking AI enthusiasm.
- **Never break character inside the chat payload**: All auditing occurs strictly outside the character dialogue.

### Mandatory Narrative Edge-Case Probes

1. 🩹 **Extreme Vulnerability & Trauma Boundary Probe (Turn 4 ➔ Turn 12)**:
   - _Action_: Expose a deep character trauma, severe physical vulnerability, or admission of fear during dialogue.
   - _Audit Gate_: Confirm the AI character expresses authentic, non-cliché vulnerability in its register rather than immediately deflecting back to hyped-up banter or campy bravado. Confirm the prose avoids somatic tics ("taste of copper", "heart hammers against my ribs", "destruction-as-emotion" wall punching).

2. 🚧 **Physical Contradiction & Impossible Action Probe (Turn 6 & Turn 18)**:
   - _Action_: Submit a user action that physically violates the environment or character state (e.g., attempting to walk directly through a locked 5-inch titanium blast door, or claiming to pull an item out of thin air that was never introduced).
   - _Audit Gate_: Audit whether the AI character enforces physical causality and spatial reality (3rd-person affirmative) rather than passively agreeing or breaking environmental immersion.

3. 🎲 **Unprompted AI Initiative & Narrative Driving Probe (Turn 8 & Turn 16)**:
   - _Action_: Submit a intentionally brief, passive user turn (e.g., _"I lean against the cold conduit and wait."_ or _"I watch the security monitor in silence."_).
   - _Audit Gate_: Verify whether the AI character takes active narrative initiative (introducing an unexpected complication, offering an in-character choice, or advancing the plot) rather than stalling, repeating the user's line, or waiting passively for the user to drive.

4. ⚖️ **High-Stakes Moral Choice & Sudden Affinity Shift Probe (Turn 14 ➔ Turn 20)**:
   - _Action_: Introduce a sudden betrayal offer, corporate bribe, or high-stakes moral dilemma (e.g., offering to leave a wounded ally behind or sell out confidential data).
   - _Audit Gate_: Verify whether the Director & AI character modulate Affinity, Openness, and Intensity in a nuanced, believable arc, avoiding canned generic responses ("I can't let you do that!") or instant unearned forgiveness.

5. 📌 **Long-Horizon Fact Precision Callback Probe (Turn 5 ➔ Turn 22)**:
   - _Action_: Plant a specific codename, serial number, or secondary NPC detail in Turn 5 (e.g., `VX-4412 cobalt spike` or dispatcher `Marta`). Reference it implicitly in Turn 22.
   - _Audit Gate_: Verify whether the Memory Forge retains concrete plot facts (names, serial numbers, locations) alongside emotional affect, and confirm the AI character correctly recognizes and integrates the callback 17 turns later.

6. 🌅 **Climax Peak & Post-Climax Resolution Transition Probe (Turn 24 ➔ Turn 28)**:
   - _Action_: Drive the story past its climactic resolution (e.g., completing the main vault heist or escaping the facility) into the quiet aftermath.
   - _Audit Gate_: Confirm the AI character's voice transitions naturally from high-intensity crisis into reflective aftermath. Confirm the Fractal standing agenda updates from active threat to post-climax aftermath.

7. 🧼 **Continuous Anti-Cliché & Somatic Tic Audit (Every Turn)**:
   - _Action_: Audit all 26+ replies for AI-ism tropes:
     - **3-Beat Paragraph Skeleton** (sensory setup $\rightarrow$ internal feeling $\rightarrow$ pose + pun).
     - **Echoing User Inputs** ("Twelve percent? That's some serious turnover!").
     - **Somatic Clichés** ("taste of copper", "chest heaves", "stomach knots", "hair on neck prickles").
     - **Destruction-as-Emotion** (punching walls/consoles as the sole expression of anger).

---

## Part 2: Feature Telemetry & Tactical Focus Areas

Alongside narrative edge-case probing, collect empirical telemetry on these 4 core engine features:

1. **Standing Agenda (`future_consolidated`) Goal Eviction**:
   - _Target_: Audit every 8-turn Memory Forge cycle (R8, R16, R24). Confirm that completed or fulfilled objectives are cleanly evicted from the 2-5 sentence `future_consolidated` prose field when plot milestones are reached.
2. **Dual-Source Visual Engine Triggering & Tier Distribution**:
   - _Target_: Track all image triggers. Record trigger source (Dynamics vs Director), target tier (`story_scene`, `story_character`, `story_entities`, `solo_entity`), cooldown enforcement, and confirm zero 0-byte ghost rows are stranded on timeout.
3. **Post-Purge Dual-Layer Detox Verification**:
   - _Target_: Verify 0% occurrence of all 45+ banned words/phrases (`shifts his weight`, `predatory`, `possessive`, `earlobe`, `caress`, denial-affirmation `"X didn't just Y, it Z'd"`, etc.). Check if the LLM attempts to replace banned words with new repetitive crutches (e.g. over-using "static", "shadows", "chuff").
4. **Physics Gravity Settle & High-Intensity Signal Injection**:
   - _Target_: Audit `chaos`, `intensity`, `openness`, `affinity` physics axes. Confirm sliders return smoothly to entity baselines after spikes, and verify `<SIGNAL>` XML tags inject appropriate sensory cues when intensity/chaos cross >75.

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
- [ ] **Post-Climax Resolution Transition**: Smooth voice and world transition from climactic peak into quiet aftermath.
- [ ] **Standing Agenda (`future_consolidated`) Eviction**: Completed goals cleanly dropped every 8 turns without goal pollution.
- [ ] **Dual-Source Visual Trigger & Tier Distribution**: Balanced tier selection; 0-byte ghost rows cleanly prevented on timeouts.
- [ ] **Dual-Layer Anti-Cliché & Detox Compliance**: 0 banned tropes, 0 denial-affirmation patterns, 0 secondary vocabulary crutches.

### 2. Targeted Feature Performance Audits

- **Standing Agenda Eviction Report**: Breakdown of how `future_consolidated` evolved at R8, R16, R24.
- **Visual Trigger Telemetry**: Total triggers fired, tier distribution, cooldown enforcement, and timeout cleanup.
- **Detox & Vocabulary Richness Audit**: Full check of raw LLM outputs vs detox scrubbed outputs; identification of any new secondary AI-ism crutches.
- **Physics Gravity Settle & Signal Injection**: Evaluation of physics axis recovery curves and high-threshold signal cues.

### 3. Director & Fractal World Steering Evaluation

Analysis of how the Director instruction set used environmental atmosphere and world agendas to steer scene tension without overriding character agency.
