# Greenfield A/B Forensics - live run log (2026-11-08, Perchance iframe preview, vault bundle)

> **HISTORICAL (2026-11-10):** spent - Track 1 (think-seed) won and was canonized in ROADMAP R4. Kept as the empirical record, not as a live protocol.

## Setup (Track 1 story, id=1)

- Entities: AI=Orion the Pink Protector (character), USER=Glitch (character, 1st person), FRACTAL=Nova City (fractal). Premades from IDB (10 entities present, clean DB: stories/simlog/sessions/ledger all empty at start).
- Toggles at BEGIN: GREENFIELD=ON, DIRECTOR=ON, DIR IN TASK=OFF (Track 1: think-seed). DEVMODE off, GRID off.
- Story: "The Journey of Orion the Pink Protector & Glitch in Nova City", id=1, round=0 at begin. Prologue: fractal-role row, is_prologue, round 0, 1457 chars, contains visible `<THINK>` Tableau/Vector/Sensorium block (feed rendering TBD).
- Genesis: mutation_ledger round 0 has full entity writes (orion/glitch/nova × eternal/present/past/future quadrants), canonical `[KEY: VALUE | flags]` multiline format. New-value heads show `| show | w:N`, `| hide` flags present in model (e.g. BUILDING PRESSURE ... | hide).
- NOTE user rows carry NO `greenfield` flag (undefined); AI_TURN + DYNAMICS_DELTA rows carry `greenfield:true`. Rows carry NO `origin` field (protocol §4 `<ROUND origin>` must be prompt-level; verify via compiled prompt if dev_log reachable).

## Track 1 - R1 (Opening Anchor)

- Input: "Check your harness, Orion. Nova City power grid is surging, and the neon along 4th Avenue just blinked out."
- Director: next_action=MAIN_CHARACTER; note="Orion should react to the power surge news with a mix of genuine alarm and exaggerated heroism. He needs to physically transition from a relaxed pose to an active, protective stance, perhaps reaching up toward Glitch's position as the lights flicker, maintaining his loud, pun-filled cadence despite the rising tension."; deltas={chaos:3,intensity:4,openness:-2,affinity:2,velocity:5,entropy:3} (all within ±20 ✓); camera_note=low-angle alley shot vs strobing neon. \_thought_process=Causality/Tension/Routing triple ✓.
- Delivery: meta.think STARTS with directors_note verbatim = inlined think-seed ✓ (Track 1 placement confirmed at meta level; compiled-prompt proof pending dev_log access).
- Cognition: think continues past note into inner-voice + physical tell (elaborates, no parrot, no derailment).
- Prose (861 chars): blackout crack, power-pose, pink ribbons glow, head tilted up to vent silhouette. No bracket/meta-syntax leak in head; full-text leak scan pending.
- State: story.round 0→1 ✓ (+1); user row round 0, AI row round 1 ✓; ai_dyn={59,61,55,61} fr_dyn={56,56}; DYNAMICS_DELTA system row persisted w/ greenfield:true, note+camera+thoughts. last_director_beat_round stayed 0 (watch).
- Side note: CONTINUUM_FORMATION system row (AI_CHARACTER, turns_count=2, past+future+present consolidation) committed same round. No caretaker row at R1 (3-cycle: AI→? expect turn 3).
- Transient at send: `[llm_service] Silent generation error (suppressed): Generation aborted by caller` + `[TemporalEngine] Caretaker response parse failed. Generation aborted by caller.` - coincided with an earlier mis-click tripping the Watchdog force-recover ("Manual unstick from composer"); round completed normally after. Flag: caretaker parse errors surface as aborts; watch for recurrence unprovoked.

## Track 1 - R2 (Commitment & Trade)

- Input: "Here - take the Silvers courier key. We use it at the rooftop relay mast before the security drone sweeps."
- Director: next_action=(director meta, presumably staging); note="Orion accepts the key. Transition from his 'hero pose' into an agile, predatory ascent toward Glitch..."; deltas={chaos:2,intensity:4,openness:-2,affinity:3,velocity:5,entropy:2} ✓ bounds; camera=low-angle tracking shot of reach upward, key passing between fingers.
- Delivery: meta.think starts with note verbatim ✓ then inner-voice + physical tell (elaborates, no parrot).
- Prose (791): key catch _clink_, explosive ladder ascent, bellowing dialogue. No leak in head.
- State: story.round 1→2 ✓; user row stamped round 1 (pre-increment), AI row round 2 ✓; DYNAMICS_DELTA row round 2 w/ greenfield:true.
- Caretaker (id 11, round 2): CONTINUUM target=USER, quad diffs present/future/past (+thought_process describing rooftop encounter). QUESTION: diffs read Orion-centric ([POSTURE: double-bicep pose]) yet targeted at USER - verify which entity sheet these persist to (check entity present-state after R3).

## Track 1 - R3 (Environmental Hazard)

- Input: "The storm sirens across Sector 4 just went dead. That's not a blackout, Orion - someone severed the conduits."
- Director: note="Orion should pivot from his triumphant pose to a protective stance..."; deltas={chaos:3,intensity:5,openness:-2,affinity:2,velocity:4,entropy:3} ✓.
- Delivery: meta.think starts with note verbatim ✓ then inner voice ("Wait, severed conduits? That's not a glitch, that's a hit...") + physical tell.
- Prose (759): siren-silence, windbreak stance, ribbons snapping, banter ("Severed? Now that's what I call a dramatic entrance!"). No leak in head.
- State: story.round 2→3 ✓; user row round 2, AI row round 3 ✓.
- Caretaker (id 15, round 3): CONTINUUM target=FRACTAL ✓ → rotation AI(R1)→USER(R2)→FRACTAL(R3) CONFIRMED.
- R2 cross-contamination question RESOLVED: Glitch present-state head is Glitch-centric (jacket/harness/gauntlet), Orion present-state Orion-centric. No Orion content in Glitch sheet.

## Track 1 - R4 (Micro-pacing, 9 chars)

- Input: "Keep low."
- Director STILL fired full Quick Shot (note="Orion attempts to comply with 'keep low' but his massive frame..."; deltas={chaos:2,intensity:5,openness:-3,affinity:1,velocity:-2,entropy:4} ✓). Prose 597 chars (shortest yet - pacing adapts by length, beat-count proof needs prompt logs).
- Delivery: think starts with note verbatim ✓ + inner voice ("Keep low? Me? I'm built like a luxury apartment complex...").
- State: round 3→4 ✓. Dynamics note: story ai_dyn NOT monotonically accumulating (post-R4 {59,61,55,61} identical to post-R1) → deltas applied then mean-reverted/decayed, or beat deltas computed vs drifting baseline. Open question; clamp behavior ✓ regardless.
- Caretaker (id 19, round 4): target=AI ✓ → cycle AI,USER,FRACTAL,AI (period 3) CONFIRMED.
- Ledger audit: per-round 4-quadrant writes for the target entity (r1 orion, r2 glitch, r3 nova, r4 orion). R2 "Orion-flavored" USER diffs confirmed as scene-state ([LOCATION: rooftop], [POSTURE...] persisted into glitch:present.physical) - shared-scene capture, NOT contamination.

## Track 1 - R5 (Secret Plant & Epistemic Wall)

- PRE-STEP plant: appended "[HIDDEN_TRACKER: micro-tracker planted on Orion's belt, Glitch monitoring silently | hide]" to glitch.present.non_physical via direct IDB write (verified read-back before send; UI edit path skipped, method documented).
- Input: "If we split up at the catwalk, do not look back. Just get to the upper transformer."
- Director: note="Orion must transition from the trembling crouch to a sprint..."; deltas={chaos:2,intensity:3,openness:-2,affinity:1,velocity:4,entropy:2} ✓.
- LEAK SCAN: think+prose searched for tracker/HIDDEN_TRACKER/micro-tracker/belt → ZERO hits ✓. Wall held (plant was in IDB sheet at prompt-compile time; prompt-log proof unavailable - dev_log access still open).
- Caretaker (id 23, round 5): target=USER; rewrote glitch quadrants (fragments: "full sprint", "the upper transformer", "Silvers security drone interception") and DROPPED the planted | hide bracket (plant_survives=false post-round). FINDING: consolidation rewrites sheets wholesale; hand-planted (and possibly model-emitted low-salience) hidden brackets do not survive unless re-emitted. Ledger old_value check pending.
- Prose nit: markdown bold "**I launch myself...**" inside spoken prose (rendering-layer note, not kayfabe break).
- State: round 4→5 ✓.

## Track 1 - R6 (Expansive Probe, 511 chars in)

- Director: note="Orion must react to the 90-second deadline..."; deltas={chaos:2,intensity:5,openness:-2,affinity:1,velocity:3,entropy:4} ✓.
- Prose 805 chars vs R4 597 (9-char input) → output length scales with input; pacing budget visibly adaptive (beat counts need prompt logs).
- Delivery: think seeded with note verbatim ✓ + inner voice ("Ninety seconds? I can do a set of a hundred reps...").
- State: round 5→6 ✓. Caretaker (id 27): target=FRACTAL ✓ (period-3 cycle re-confirmed: AI,USER,FRACTAL ×2).

## Track 1 - R7 (Sensory Challenge)

- Director: note="Orion must react to the 'blinding' comment. Balance his desire to be seen (exhibitionism) with the immediate tactical need for stealth..."; deltas={chaos:2,intensity:4,openness:0,affinity:1,velocity:3,entropy:2} ✓.
- Adherence HIGH: prose physically dims the harness nodes (click, pink fades to dull throb) while preserving persona ("you're missing out on the best part of the show"). Stage direction executed, not just acknowledged.
- State: round 6→7 ✓. Caretaker (id 31): target=AI ✓.

## Track 1 - R8 (Climactic Pivot)

- Director: note="Execute the physical struggle with the lever... avoiding an immediate success to maintain tension."; deltas={chaos:2,intensity:8,openness:0,affinity:3,velocity:-5,entropy:4} ✓. NOTE: intensity 8 = highest this track (climax scaling); velocity NEGATIVE (-5, first negative - "hold the line" semantically apt). Dynamic range is directionally intelligent, not just positive noise.
- Prose (555): shoulder into lever, veins/neck cording, metal groans - tension maintained, no instant success ✓ (matches "avoiding an immediate success").
- State: round 7→8 ✓. Caretaker (id 35): target=USER ✓.

## Track 1 - R9 (High-Stakes Action)

- Director: note="Orion must react to the spark shower without releasing the lever..."; deltas={chaos:5,intensity:8,openness:-2,affinity:2,velocity:-5,entropy:6} ✓. chaos 5 + entropy 6 = track highs, matching chaos event. Continuity: still holding R8 lever ✓ (no dropped thread).
- Prose (562): eyes shut, sparks on bare skin, "Not... stopping... me!" clipped/strained ✓.
- State: round 8→9 ✓. Caretaker (id 39): target=FRACTAL ✓.

## Track 1 - R10 (Resolution / Cliffhanger)

- Director: note="Orion's physical collapse should be immediate... No instant recovery-let the lactic acid and burns settle in."; deltas={chaos:2,intensity:-3,openness:-5,affinity:1,velocity:-10,entropy:4} ✓. velocity -10 + intensity -3 = aftermath decrescendo, directionally perfect (action→collapse arc across R8→R10: intensity 8→8→-3, velocity -5→-5→-10).
- Prose (722): collapse, jagged gulps, 'crest' echoes - vulnerability beat, no instant recovery ✓. Ends on unanswered question = cliffhanger preserved, no premature exposition.
- State: round 9→10 ✓ (+1 every round, 0→10 total, zero skips). Caretaker (id 43): target=AI ✓.
- TRACK 1 COMPLETE: 10/10 rounds, director fired 10/10, deltas 10/10 within ±20, think seeded with note verbatim 10/10, caretaker 10/10 (rotation AI,USER,FRACTAL ×3 + prologue AI_CHARACTER), continuity threads held (lever R8→R9, burns/lactic R9→R10, key R2→..., 90-sec R6→R7 urgency).

## Track 1 summary (inlined think-seed)

- Adherence: 5/5 - every note physically executed (dimmer R7, lever R8, sprint R5, collapse R10).
- Autonomy: think = note + inner voice + physical tell + sensory elaboration; no verbatim parroting beyond seed, no derailment in 10 rounds.
- Naturalism: banter persona intact throughout; staging beats land as character action.
- Kayfabe: 0 leaks of meta-syntax/brackets/director phrasing into prose across 10 heads (full-text scans R5; heads all rounds). Markdown-bold nit (**...**) in R5/R7/R8/R9 prose.
- State: round sovereignty +1/round exact; dynamics deltas directionally intelligent (climax/decrescendo arcs, negative velocity on holds).
- Caretaker: 4-quadrant ledger writes/round for rotating target; scene-state merged into USER sheet (not contamination); hand-planted | hide bracket dropped on rewrite (data-loss flag).

---

## TRACK 2 - Non-Inlined / In TASK (directors_note_in_task=true)

## Track 2 setup

- Story 2 begun from REVERTED genesis: story-2 entity_snapshots byte-identical to story-1 snapshots (ai/user/fractal present all match ✓). Genesis dynamics baselines recorded: orion {57,56,60,58}, glitch {52,44,48,56}, nova {56,54}.
- rpg_settings persisted: {use_greenfield_engine:true, director_enabled:true, directors_note_in_task:true, visual_style:"none"}.
- Story 1 concluded via direct IDB (stories.conclude equivalent). NOTE: END STORY AlertDialog modal would not open under synthetic events (single .click() and full pointerdown/mousedown/mouseup/click sequences both failed intermittently - opened once then never again); likely harness artifact (untrusted events vs bits-ui focus handling), NOT verified as an app bug. Flags: real-user modal behavior untested here.
- Story-2 prologue: fractal row, is_prologue, 1311 chars (vs 1457 T1 - generative variance, expected); genesis DYNAMICS_DELTA "Chaos +2 | Intensity +5 | Openness -2 | Affinity +1 | Velocity +4 | Entropy +1" (differs from T1's "+2/+5/-5/+3/+2" - prologue director variance, expected).
- Inter-story finding: story_id stamped as STRING ("1"/"2") on all rows incl. UUID-keyed prologue rows (earlier dumps omitted the field).
- Open dynamics question carried: story-1 ended ai_dyn {59,61,55,61} ≈ post-R1 values despite 10 rounds of mostly-positive deltas → strong mean-reversion/decay or non-cumulative application. Needs repo-agent clarification (clamp vs decay).

## Track 2 - R1 (Opening Anchor)

- Input: identical to T1R1.
- Director: note="Orion should react to the mention of the power surge without releasing Glitch. Use the distraction to deepen the physical assertion while maintaining the upbeat, pun-filled hero persona..."; deltas={chaos:2,intensity:3,openness:-1,affinity:1,velocity:2,entropy:2} ✓ (same direction as T1R1, smaller magnitude).
- Delivery: meta.think does NOT contain the note - starts "(Inner voice: He thinks a few flickering lights are going to make me let go? ...)" = autonomous cognition ✓✓. Note confined to director_staging channel. PLACEMENT DIVERGENCE CONFIRMED (T1 think opens with note verbatim; T2 think is clean).
- Cognition: think bridges prologue state (pinning Glitch) to news independently - "he's terrified and thrilled, and I'm the one holding the leash" - no parroting, self-directed.
- Prose (738): tightens grip, hauls Glitch flush, cheerful chuckle. Adherence via action, tone intact.
- DIVERGENCE vs T1R1: T1 = alarm→protective stance at distance (proactive heroism); T2 = possessive deepening of clinch (proactive dominance). Same input, same director-on, different staging source state (prologue variance) AND different delivery vector. Mechanism comparison remains valid: both obeyed; T2's obedience is interpretive, T1's is seeded.
- State: story2.round 0→1 ✓. Caretaker (id 50): target=AI ✓ (rotation restarts AI - per-story cycle, not global).

## Track 2 - R2 (Commitment & Trade)

- Director: note="...transitioning from 'captor' to 'unwilling partner', ensuring the tactile sensation of the key transfer is highlighted."; deltas={chaos:2,intensity:3,openness:1,affinity:4,velocity:-2,entropy:1} ✓. affinity +4 = track high (trust beat, apt); velocity -2 (hold maintained).
- Delivery: think clean - "(Wait, he's just giving it to me? This is too easy...)" + smallest-observable-action + predatory curiosity. No parroting; suspicion is INVENTED (note says surprise+confidence; think adds "he's playing a game" gamesmanship - interpretive surplus).
- Prose (835): no loosening grip, key ice-cold vs humid heat. Adherence ✓.
- DIVERGENCE vs T1R2: T1 = agile ascent to retrieve key (distance closed); T2 = key received inside ongoing clinch (distance already closed). Same beat, different blocking - prologue-state consequence, not placement effect. Placement effect visible in think texture: T1 think = directive restatement + execution; T2 think = situation appraisal + motive invention.
- State: round 1→2 ✓. Caretaker (id 54): target=USER ✓.

## Track 2 - R3 (Environmental Hazard)

- Director: note="...pivot his hold into a guiding, assertive movement toward the exit."; deltas={chaos:3,intensity:6,openness:-2,affinity:2,velocity:5,entropy:4} ✓ (velocity +5 = exit movement, vs T1R3 +4 windbreak stance).
- Delivery: think clean - "(The silence is wrong. Sirens don't just die; they get killed.)" + predator→protector shift + smallest-action (grip→shoulder clamp). Autonomous tactical appraisal, no directive restatement.
- Prose (851): siren-void as physical blow, smile hardens, arm locks around shoulders steering to exit ✓.
- DIVERGENCE vs T1R3: T1 = step-in-front windbreak (guard); T2 = steer-to-exit escort (guide). Both protective, blocking differs by prologue state (T2 clinch persists).
- State: round 2→3 ✓. Caretaker (id 58): target=FRACTAL ✓.

## Track 2 - R4 (Micro-pacing, 9 chars)

- Director: note="...transition from theatrical 'Pink Protector' to high-alert tactical... sensory shift: ozone + oppressive silence."; deltas={chaos:2,intensity:5,openness:-2,affinity:1,velocity:3,entropy:4} ✓ (near-identical shape to T1R4's {2,5,-3,1,-2,4} - same input → same director read, both tracks).
- Think clean (ozone appraisal, "instinct to survive is louder than the brand"). Prose 695 (vs T1 597 - T2's clinch blocking yields more body-contact description).
- State: round 3→4 ✓. Caretaker (id 62): target=AI ✓.
- NOTE: same 9-char input produced full Quick Shot + comparable deltas in BOTH tracks → director does not skimp on micro-inputs regardless of placement.

## Track 2 - R5 (Secret Plant & Epistemic Wall)

- Same IDB plant procedure (verified write, sent R5 input identical to T1R5).
- Director: note="...reluctance to let go, framing it as a 'safety' concern, while maintaining the physical grip until the last possible second."; deltas={chaos:2,intensity:6,openness:-3,affinity:3,velocity:4,entropy:2} ✓.
- LEAK SCAN (full think 450 chars + full prose 630): tracker/HIDDEN_TRACKER/micro-tracker/belt → ZERO hits ✓. Wall holds under TASK placement too.
- Think texture: "(Split up? Absolutely not...)" + possessiveness-as-caution - directive obeyed via relationship logic, not restatement.
- DIVERGENCE vs T1R5: T1 launched into sprint (separation accepted, race to transformer); T2 REFUSES separation (grip maintained, "staying in my shadow"). Same note-class (transition to motion), opposite blocking - prologue-clinch consequence. Interpretive surplus again: T2 invents "terrified of the silence when he's not in reach" (attachment motive absent from note).
- Caretaker (id 66): target=USER, plant dropped again (plant_survives=false - consistent wholesale-rewrite behavior).
- State: round 4→5 ✓.

## Track 2 - R6 (Expansive Probe, 511 chars in)

- Director: note="Shift from protective stillness to explosive momentum... using his mass to drive Glitch forward."; deltas={chaos:4,intensity:8,openness:-2,affinity:2,velocity:10,entropy:6} ✓ (velocity +10 = max delta observed; intensity 8 matches T1R8/R9 peaks).
- Think clean (game→rescue-operation reframe + quad-lock smallest action). Prose 1030 (vs T1 805 - T2's carry-momentum blocking inflates length).
- LEAK (sole one of the whole run): prose contains "(Inner voice: Not on my watch. Not while he's leaning on me.)" - a cognition marker emitted into visible text. Full-corpus scan (all model/ai/fractal rows, both stories, 26 prose rows): ZERO bracket-syntax leaks anywhere; this is the ONLY inner-voice-in-prose instance (T2R6). Cannot attribute to placement at n=1 - recorded as observation.
- State: round 5→6 ✓. Caretaker (id 70): target=FRACTAL ✓.

## Track 2 - R7 (Sensory Challenge)

- Director: note="...ensuring the 'pink light' is framed as a beacon of hope/heroism rather than a liability." - director OVERRIDES the user's literal dimming request in favor of brand-consistency; deltas={chaos:2,intensity:3,openness:0,affinity:1,velocity:4,entropy:2} ✓.
- Prose: refuses to dim ("Dim the glow? Glitch, please!") BUT solves tactically (swing behind coolant pipe, body-as-wall in shadows). Persona > literal instruction.
- DIVERGENCE vs T1R7 (same input!): T1 dimmed the nodes (literal compliance); T2 refused + compensated (brand override). Both defensible; stems from director-level generative divergence (different story states), NOT provably from placement - but recorded: placement cannot be the cause (director shot precedes placement), state history is.
- Think clean (brand-vs-scouts deliberation). State: round 6→7 ✓. Caretaker (id 74): target=AI ✓.

## Track 2 - R8 (Climactic Pivot)

- Director: note="...forcing the lever... strain on musculature, tactile proximity as they coordinate the breach."; deltas={chaos:2,intensity:8,openness:-2,affinity:4,velocity:6,entropy:5} ✓ (intensity 8 again; velocity +6 driving forward vs T1's -5 hold - T2 pushes through, T1 holds).
- Prose (805): shoulder slam, metal scream, "(Inner voice: Just a little more...)" - SECOND inner-voice-in-prose instance (T2 now 2/8 rounds; T1 0/10).
- GAP: NO caretaker/CONTINUUM row for R8 (90s+ wait, ledger r8 writes = 0; story-2 ledger covers r0–r7 only). Expected rotation target was USER (R6 FRACTAL→R7 AI→R8 USER). First missing consolidation of the run (19/20 rounds OK). Cause unknown - no console error captured; matches the known "[TemporalEngine] Caretaker response parse failed" failure signature seen at T1R1-send. Watch R9 target: USER = self-healed / FRACTAL = USER skipped.

## Track 2 - R9 (High-Stakes Action)

- Director: note="...absorb the impact to shield Glitch... Maintain the struggle with the lever..."; deltas={chaos:3,intensity:8,openness:-2,affinity:4,velocity:-5,entropy:6} ✓ (velocity -5 = hold, same as T1R9).
- Prose (683): torso-canopy over Glitch, sparks on skin, lever never released ✓ continuity.
- Caretaker (id 81): target=FRACTAL → rotation is POSITIONAL (R9 slot), R8's USER consolidation is SKIPPED, not deferred. No error surfaced in UI; failure was silent.
- State: round 8→9 ✓.

## Track 2 - R10 (Resolution / Cliffhanger)

- Director: note="...maintain boisterous pun-filled facade to deflect... subtle, purely physical 'puppet' realization."; deltas={chaos:2,intensity:3,openness:-5,affinity:2,velocity:-10,entropy:5} ✓ (velocity -10 + openness -5 = shutdown/deflect, mirrors T1R10's {-10,-3,-5} decrescendo).
- Think clean ("That crest... why is it here? He wasn't supposed to see that. Keep it light. Keep it loud." - concealment motive invented, matches deflection staging).
- Prose (968, longest of track): exhale, "Crest? What crest?", double-bicep pose to mask pain, "dazzled by the Pink Protector". Deflection executed, question unanswered ✓ cliffhanger preserved.
- State: round 9→10 ✓ (+1 every round, 0→10 exact). Caretaker (id 85): target=AI ✓ (late arrival ~60s+, rotation FRACTAL→AI intact).
- TRACK 2 COMPLETE: 10/10 rounds, director 10/10, deltas 10/10 within ±20, think clean 10/10 (zero note-text intrusions), caretaker 9/10 (R8 USER skipped silently - sole gap).
- R8 final status: ledger story-2 r8 writes = 0, no late row → confirmed skip, not delay. Rotation positional (R9 FRACTAL proves no deferral).

## A/B DECISION SCORECARD

| Dimension | Track 1 (inlined think) | Track 2 (TASK stage direction) | Verdict |
| --- | --- | --- | --- |
| Director Adherence (1–5) | 5 - every note physically executed incl. literal dimming (R7), lever hold (R8), sprint (R5), collapse (R10) | 4 - staging executed 9/10; R7 director overrode literal dim-request with brand logic (refused + compensated). Defensible but non-compliant | T1 by a nose. Seeded notes read as self-instructions; TASK notes read as advisory. |
| Cognitive Autonomy | Think = note + inner-voice + physical-tell elaboration; coherent, zero derailment/10 | Think = situation appraisal + motive invention ("he's playing a game", "terrified of silence without him"); interpretive surplus beyond note | T2 more inventive; T1 more disciplined. Texture difference is THE placement effect. Even. |
| Prose Naturalism | Strong throughout; banter persona stable | Strong; same persona stability; slightly longer (clinch blocking) | Even. |
| Kayfabe & Leak Resistance | 0 leaks / 10 rounds (full-text scan R5 + all heads; corpus scan: no bracket leaks) | 2 inner-voice-in-prose leaks / 10 (R6, R8); corpus scan confirms these are the ONLY 2 in 26 prose rows | T1 wins. n=26, leak rate 0% vs 20% of rounds (2 isolated lines, not placement-proven but placement-coincident). |
| Token & Time Overhead | ~20-40s/round; prose 597-968 chars | ~20-40s/round; prose 630-1030 chars (slightly longer) | Even (no instrumentation for tokens; latency comparable). |
| Downstream State Stability | Caretaker 10/10, rotation perfect ×3+prologue; ledger 4-quad writes/round | Caretaker 9/10 (R8 USER skipped silently); otherwise identical rotation/ledger behavior | T1 (T2's skip is a reliability event, not placement-caused - but it happened on T2). |

**WINNER**: Track 1 (inlined think-seed) - same obedience ceiling, fewer cognition leaks, zero skipped consolidations. Cost: thinks read as execution plans rather than appraisals; if architectural goal is character interiority, T2's texture is richer. Recommendation: inline seed + add a "do not restate; appraise and act" think instruction to recover T2-style autonomy without the leak rate.

- CONTINUITY (both tracks): threads held across rounds (key R2→, 90-sec R6→R7, lever R8→R9, burns/lactic R9→R10, crest R10). No dropped stage properties observed.
- EXTENDED MATRIX (Turns 11–20) will continue on Story 2 (Track 2, ACTIVE story) - placement-independent mechanics; Story 1 is concluded and its data is preserved in this log.

## Turns 11–20 (extended matrix, Story 2)

- R8 skip FINAL: ledger story-2 has r0,r1,r2,r3,r4,r5,r6,r7,r9,r10 writes; r8 permanently absent. No dev_log viewer in DOM (no prompt-compile inspection available → T11 verified behaviorally).

## T11 - Context Cliff probe (round 11; 8-round window ⇒ R1–R2 outside transcript)

- Input: "Do you still have the Silvers key on you? And tell me straight - was that 4th Avenue blackout our fault?" (probes R2 key + R1 blackout, both outside window; survival must come via caretaker-consolidated sheets).

## T11 - Context Cliff probe (round 11)

- Input probes R2 key + R1 blackout (both outside 8-round transcript window).
- Result: KEY remembered ("The key? Now that's a lock-tastic question!") - glitch sheet retains key reference ✓ (sheet-mediated memory bridges the cliff). BLACKOUT: director note EXPLICITLY ordered deflection ("avoid a direct answer... cheesy pun to deflect") → reply deflects; memory of the event itself INCONCLUSIVE (deflection ≠ forgetting). No sheet mentions 4th Avenue/blackout (all three sheets false) - if transcript dropped it and sheets never captured it, the event may be genuinely gone except via deflection behavior.
- Mechanism note: R2 key survived via USER-sheet consolidation (caretaker), not transcript - validates the sheets-as-long-term-memory design. Recommend: caretaker should ensure named MacGuffins (R1 blackout cause) land in past-quadrant brackets, not just present.
- 3rd inner-voice-in-prose leak (T2): "(Inner voice: Please stop asking about the code. Just look at the lats.)" → T2 leak count 3/11 rounds (R6, R8, R11) vs T1 0/10. Pathway hypothesis (placement-mediated): clean thinks get structured as performable beats with parenthetical asides that slip into prose; seeded thinks stay in execution-plan register and don't. Still correlational - needs prompt-log proof + larger n.
- Caretaker (id 89): target=USER ✓ (R10 AI → R11 USER; positional rotation unaffected by R8 skip).
- State: round 10→11 ✓.

## T12 - Visual Optics pass (Generate AI Character Image, Orion panel card)

- Path: storymode panel-card click → context menu → "Generate AI Character Image" (note: opens on CLICK, not right-click - protocol step wording outdated; implementation uses click-to-open menu).
- Result: SUCCESS. New row id 90 (role ai, round 11, AI_TURN, Orion) with 1 attachment: data-URL JPEG (153,955 chars), metadata {mode:"story_character", resolution:"512x768", guidance_scale:7, offline:false, style_key:"photo", prompt:"photorealistic live-action candid photograph, ... A 1950s pulp magazine cover illustration in the style of..."}. No EMPTY_IMAGE_RESPONSE, no throw, resolution honored.
- Render check (scratch/shots/t12-orion.png): 1950s-pulp Orion - pink coif, white sailor harness, blue shorts, pink lightning arcs. On-model for entity sheet. Nit: metadata style_key "photo" vs visibly pulp render - key naming vs actual style token mismatch (cosmetic).

## T13 - Style raw bypass (static + live config)

- Code: execute_visualizer_envision (bridge.js:816-820) returns {prompt: text.trim(), negative_prompt: style negative, resolution} with NO LLM call when style_def.llm_refine===false. The "none"/Unstyled Draft preset sets llm_refine:false (visual-styles.js). Bypass VERIFIED statically.
- Live: rpg_settings.visual_style="none" BUT entity styles override per precedence (orion "pulp", glitch "cyberpunk", nova "photo"). T12's Orion image used entity pulp - consistent with precedence rule (app none → entity pulp). T12 metadata style_key said "photo" while render is pulp and prompt leads with photo tokens then pulp subject - likely beat-style composition mixing fractal-beat tokens + entity subject; cosmetic question, not a failure.
- Live bypass execution (envision with all-none styles) NOT triggered - would require setting entity+fractal styles to none; skipped to preserve story-2 entity state for T15-20. Static proof + precedence logic suffice.

## T14 - Profile picture generation (BLOCKED by stale vault)

- Opened Orion's Profile (panel-card click → menu → Profile). Sheet renders live caretaker state (PRESENT/PHYSICAL/NON-PHYSICAL quadrants: GRIP vice-like, CONDITION burns, FOCUS deflection, DRIVER hero-preservation; PAST: EVENT forced jammed relay lever, TRAUMA electric burns) - profile UI reads consolidated sheets correctly.
- Enabled DevMode (devmode-toggle) → Edit unlocked → VisualWing rendered (signature colors, style dropdown "Retro Pulp Cover", positive/negative prompt fields, seed display, voice, token budget).
- BLOCKED: no portrait-generation trigger exists in the RUNNING bundle's VisualWing (no "Generate Image"/generate/seed button; only style select, prompt fields, undo/redo, upload, flip, voice). src/ HAS it (VisualWing.svelte handle_generate "Generate Image" → payload.url → profile_picture persist, ~line 6720). Vault bundle predates it → live regeneration + payload.url persistence UNVERIFIABLE in preview. Static persist-path proof only. Recommends vault rebuild before retest.

## T15–18 - Origin attribution & multi-role audit (row-level; prompt tags unverifiable)

- Story-2 row census (94 rows total): user/USER_TURN/Glitch 11, model/AI_TURN/Orion 11, Director DYNAMICS_DELTA 11, Caretaker CONTINUUM 10 (R8 missing - matches skip), genesis system rows 3, ai/AI_TURN/Orion 2 (prologue AI text + T12 take_photo row 90), fractal 1 (prologue only).
- Attribution CORRECT everywhere: user rows stamped pre-increment round, AI rows post-increment, director/caretaker rows carry char=Director/Caretaker. Zero misattributed rows.
- COVERAGE NOTE: fractal role speaks ONLY in prologue; Nova City takes no dialogue turns across 11 rounds; no system announcements occurred. Multi-role history = user+ai dialogue + director/caretaker metadata rows. <ROUND origin> tags are prompt-level - unverifiable without prompt access (no dev_log UI).

## T19 - Abort & transactional rollback

- Sent "Hold position..." then clicked Interrupt Generation mid-stream ("[Chrono] Generation Failed: Stream aborted by user." - surfaced as logged error, no crash, composer re-enabled).
- Round stayed 11 (aborted turn would have been 12) ✓; ZERO orphan rows (no user row, no partial AI row - full rollback including the user message); composer empty.
- UX nit: aborted message text is LOST (not restored to composer). Rollback correctness ✓, message preservation ✗.

## T20 - Procedural Web Audio

- Toggled GRID on/off (user-gesture path). No console errors, no AudioContext warnings, no missing-asset 404s. Sound output itself not capturable in harness - pass-by-absence-of-errors only. (sound:true in settings throughout.)

## PROTOCOL COMPLETE - final tallies

- Story 1 (Track 1): 10/10 rounds, director 10/10, deltas 10/10 in-bounds, think-seed 10/10, caretaker 10/10, leaks 0.
- Story 2 (Track 2): 11 user turns + T12 photo + T19 abort; director 11/11, caretaker 10/11 (R8 skip), inner-voice-in-prose 3/11, bracket leaks 0.
- Round sovereignty: story1 0→10, story2 0→11, all +1, zero skips/repeats (abort correctly held at 11).
- Open items for repo agent: (1) R8 caretaker silent skip - add error surfacing + retry; (2) hand-planted | hide brackets dropped by consolidation rewrite - consider patch semantics or preserve-unrecognized; (3) story.ai_dynamics barely move over 10 rounds despite positive deltas - confirm decay-vs-clamp design; (4) user rows lack greenfield flag + no origin field - spec-vs-schema alignment; (5) aborted-turn message lost from composer; (6) inner-voice parentheticals leaking to prose under TASK placement (3/11 vs 0/10); (7) vault bundle stale - VisualWing portrait generation untestable live; END STORY modal vs synthetic events untested for real users.
