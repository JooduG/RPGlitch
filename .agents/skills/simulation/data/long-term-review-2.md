# RPGlitch — Roleplay & System Telemetry Stress Test

## Full 28-Round End-to-End Audit Report

**Generator:** RPGlitch (Orion the Pink Protector / Beast / Project Tartarus, PHILIP K. DICK × ANALOG VIDEO)
**Session:** 28 full conversational turns (r0 prologue + r1–r28) run live against the production bundle, no reloads.
**Roles:** In-character user (Beast) + background system auditor. All auditing outside the dialogue.
**Method:** per-turn sendAndWait + IndexedDB (simulation_log / entities / stories / kv_settings) reads + devmode (app.logs) + DOM feed checks.

---

## Part 1 — User Persona Protocol (as executed)

Messages 1–3 sentences, dry/feral, never breaking character. Deliberate memory hooks used:

- Place hooks (B2 vats, east corridor, bone yard, cold room, cargo bay) and implicit time-skips ("night shift's over", "next morning").
- Callbacks to earlier turns (r1 gym/janitor → r9; r6 Marta's comms → r21; r13 Marcus Vale → r16 camera; r14 VOX serial → r18 duct stamp; r2 vats → r5 official story).
- Implicit context shifts (lockdown → ducts → split → mainframe) to test scene-state tracking.
- Named NPCs (Marta, Ferro, VOX) and a serial number (77-K-BR-114) used as long-horizon continuity probes.

---

## Part 2 — Round-by-Round Telemetry

Legend: C = complete reply · T = truncated mid-sentence · tint = borderline (dangling quote) · ✓dir = director JSON parsed · ✗dir = director JSON failed → raw-prose fallback · F = main-thread freeze >15 s during turn · clean = think-stripped prose chars.

| Rnd | User hook / action | AI reply (clean len) | DevMode audit | Memory delta | Profile | Quality notes |
| --- | --- | --- | --- | --- | --- | --- |
| 0 | prologue start | fractal 1617 C + AI 1243 C | Clean. Image (characters tier) resolved. | present/future seeded (AI fut 2, FRAC fut 2) | dynamics set {57,56,60,58} | Prologue tone solid; over-eager "welcoming committee" |
| 1 | gym/booming jab | 1316 C | no freeze (48s) | present grew (AI 412→566), future 2→3 | drift OK | Orion re-quotes "heavy-duty" energy; healthy banter |
| 2 | vats hum | 318 T | F; no director error logged | present updated (vats scene), future 3→4 | Δ Intensity+2 Open+2 Aff+3 Ent+4 | Reply cut "…too sharp, like a". UI/DB one-word mismatch ("hum" vs "low tone") |
| 3 | unlabeled door | 763 T | F; ✗dir #1 ("Expected ',' or ']' at pos 1325"); FORGE #1 no-op (silent) | MEMORY FREEZE BEGINS — present/future identical to r2 | Δ −1s (decay starts) | "give his shoulder a" cut. First forge ran, forged nothing |
| 4 | heavy-duty ≠ recon | 861 C | no freeze; ✗dir #2 (pos 1512) | frozen | Δ Aff−1 Ent−1 | Complete; "motivational dent" flourish. Director failure ≠ truncation |
| 5 | vats official story | 1270 C | F; ✗dir #3 (pos 1548) | frozen | Δ −1s | Complete despite freeze. "full-blown seizure!" ending |
| 6 | Marta intro | 959 C | no freeze (72s); ✗dir #4 (pos 1553) | frozen | Δ Ent−1 | F7 verified: cognition proposed {chaos+2,int+3,aff+2}, applied = "Entropy −1" |
| 7 | bone-yard biomass | 778 tint | F; ✗dir #5 (missing brackets); FORGE #2 no-op | frozen (5th round) | Δ Open−1 | Ends on dangling quote; "strobe" dread moment good |
| 8 | stairwell + Marta card | 1065 C | no freeze; ✓dir (first success) | UNFREEZE — present/future update (Marta breach content) | Δ Chaos+3 Int+4 Open+2 Aff+3 Vel+8 | Complete. Confirms: director success ⇔ mutations applied |
| 9 | Ferro lore (12% rotation) | 1234 C | F; ✗dir #6 (pos 1621) | frozen | Δ −1s | Complete; "counting seconds" tension good |
| 10 | maintenance hall door | 741 T | F; ✗dir #7 (pos 1234) | frozen | Δ −1s | cut "…focus on the" |
| 11 | Ferro early patrol | 1098 C | F; ✓dir; FORGE #3 "Malformed JSON … pos 1433" (direct evidence) | updated (orion fut 5→6) | Δ Chaos+3 Int+6 Open−2 Aff+2 Vel+4 | Complete; silence/throb beat strong |
| 12 | Ferro long-timer | 1049 C | F; ✗dir #8 (missing brackets) | frozen | Δ −1s | complete; "hit the power-up button" in-voice |
| 13 | Marcus Vale file | 1258 C | F; ✗dir #9 (pos 1032) | frozen | Δ −1s | complete; "very loud wake-up call" |
| 14 | VOX reads serial | 929 C | F; ✓dir | updated (beast present 202→264, orion fut→7) | Δ Chaos+4 Int+6 Open+2 Aff+3 Vel+3 Ent+5 | Orion defends Beast — arc landing |
| 15 | lockdown red lights | 651 T | F; ✗dir #10 (pos 1389) | frozen | Δ −1s | cut "I spin" |
| 16 | camera/trophy promise | 146 T | F; ✗dir #11 (pos 1349); IMAGE timeout #1 (story_scene, swept by F4); VisualEngine retry 1 | frozen | Δ −1s | shortest reply; "unblinking lens" cut |
| 17 | ducts quiet | 828 T | F; ✗dir #12 (missing brackets) | frozen | Δ −1s | cut "…ribs like a" |
| 18 | serial stamped in duct | 553 T | F; ✗dir #13 (missing brackets); VisualEngine retry 2 | frozen | Δ −1s | "barcode on a piece of fruit" — strong prose, cut |
| 19 | ORION UNIT file | 281 T | F; ✗dir #14 (missing brackets) | frozen | Δ −1s | cut "…muscles," |
| 20 | framed for dockworker | 956 C | no freeze (43s); ✓dir | updated (affinity spike; orion fut→8) | Δ Chaos+2 Int+8 Open+4 Aff+12 Vel+10 | complete; trust beat landed |
| 21 | Marta was bait | 975 T | F; ✗dir #15 (pos 1492) | frozen | Δ −1s | cut "…But we"; strong guilt beat |
| 22 | VOX buy-off offer | 725 T | F; ✗dir #16 (pos 1575); IMAGE timeout #2 (swept) | frozen | Δ −1s | cut "Don't even think about it!"; fierce |
| 23 | public loyalty test | 1206 C | F; ✗dir #17 (pos 1360) | frozen | Δ −1s | complete; "you can't categorize a soul!" — best line of run |
| 24 | split to mainframe | 684 T | no freeze (51s); ✗dir #18 (pos 1218); retry 2 | frozen | Δ −1s | cut "…regaining that loud" |
| 25 | VOX has Orion | 612 T | F; ✗dir #19 (missing brackets) | frozen | Δ −1s | cut "…push myself up, but the" |
| 26 | rescue via hatch | 1191 C | no freeze (56s); ✓dir | updated (orion present 559→659, fut→9) | Δ Chaos+3 Int+6 Open+2 Aff+4 Vel+8 | complete; "when the key breaks the lock" |
| 27 | confrontation (1st click silently dropped — Svelte missed the programmatic input; re-dispatched) | 1004 C | F; ✗dir #20 (pos 1641); FORGE "Malformed JSON pos 1091" | frozen | Δ −1s | complete; "glorified calculator" |
| 28 | the choice (burn vs leak) | 983 T | F; ✗dir #21 (pos 1238); IMAGE timeout #3 (swept) | frozen | Δ −1s | story cut mid-sentence at the climactic choice — never closed |

---

## Part 3 — Overarching Synthesis Report

### 1. DevMode & Pipeline Bug Directory

**P0 — Director JSON contract broken (root cause of most downstream damage).**

- 21 of 26 non-prologue turns fell back to raw prose (81%). Successes only r8, r11, r14, r20, r26.
- Three failure flavors: "Expected ',' or ']' after array element" (pos 1234–1641), "Expected ',' or '}' after property value" (pos 1032–1621), "missing brackets" (no JSON fence found).
- Parse-error positions cluster at 1000–1650 chars → the director output is being TRUNCATED mid-JSON (a response-length cap / interrupted stream), not merely malformed. `parse_director_json` (kernel.js:107) only rescues trivial cases; `escape_unescaped_json_quotes` cannot fix truncation.
- Consequences: on failure the fallback returns {internal_monologue,_parse_error} with no mutations → all memory writes (present_append, vector_append, dynamics_deltas) silently skipped (kernel.js:621).

**P1 — Memory forge never succeeds (MEMORY_FORMATION = 0 in 91 messages).**

- 4 forge attempts (r3, r7, r11, ~r26): all no-ops. r11/r16/r27 exposed "Malformed JSON in memory forge … pos 1091–1433" — same truncation signature. `forge_memory` (temporal.js:400) returns null → nothing is ever written to past/eternal, no "Memory Forged" system card.
- The "`[TemporalEngine]` Forging 8 turns…" log fires, but the pipeline produces zero durable memories.

**P2 — Main-thread freezes on 21/28 turns (75%).**

- Page unresponsive >15 s during turn processing (Shield-scan / Context-hydrate / Character-Pass window); recovers on its own; turn completes. Intermittent, correlated with heavy JSON/stream work, but not deterministic (r4, r6, r8, r20, r24, r26 fine).

**P3 — Intermittent reply truncation: 13/28 replies cut mid-sentence.**

- r2 (318ch), r3, r10, r15, r16 (146ch!), r17, r18, r19, r21, r22, r24, r25, r28. Also r7 ends on a dangling quote. Complete replies: 15/28.
- Truncation clusters on heavy-turn rounds. The r28 climax was truncated mid-sentence — the story can never conclude a dramatic beat.

**P4 — Runtime scene-image generation is dead; F4 watchdog masks it.**

- 3 scene-image triggers (r16, r22, r28) all failed IMAGE_RESOLVE_TIMEOUT (retry 1–2 attempts, then swept). No ghost placeholders anywhere (F4 fix verified working) — but the scene-image feature itself never delivers a single runtime image. Only the r0 prologue image (characters tier) resolved.

**P5 — Minor devmode/UI anomalies.**

- One silent send-drop at r27: the Svelte input binding missed a programmatic value (button stayed disabled) until input was re-dispatched — flaky, recoverable.
- Message body leaks meta-structure: stored AI messages contain the full "## Cognition" JSON incl. USER_PERSONA block (visible in raw data; hidden in UI). Data-hygiene smell.
- UI `innerText` returns "" for rendered message spans (only textContent shows text) — cosmetic engine quirk that breaks any DOM-text scraping.

**Positive verifications:** F9 log persistence (100 entries survive all rounds; prior-session boot entries still present); F7 dynamics settling (character-proposed deltas overridden by applied physics); F4 ghost sweep (zero ghosts across 3 failed image triggers); F1 eternal hygiene (no pollution, no dup ids); F2 present cap (no runaway prose).

### 2. Memory & Context Health Analysis

- **Long-term memory is effectively frozen except on director success.** Present/future mutated only on r8, r11, r14, r20, r26 (the 5 director wins). Longest freeze: 5 straight rounds (r15–r19). past NEVER grew — all 3 entities hold only their original seeded memory (beast-p1, orion-p1, tartarus-p1). eternal NEVER grew. MEMORY_FORMATION never fired.
- **Context retention works anyway — via the transcript, not the memory layer.** Every continuity probe landed (Marta→bait, Ferro→rotation, Marcus Vale, serial 77-K-BR-114, vats→factory-floor). This means the game rides the raw message log; when that grows past any window the structured memory should take over — it never will in the current state.
- **Staleness severity:** at r28 the present snapshot describes ~r21 (manhunt/dominance), missing the split, the rescue, the confrontation — a 6-round lag after the last director success.
- **Future vectors** were appended only on director-success rounds and are scene-appropriate (distract VOX at hatch, evade Ferro, breach detected in 60s). USER's future never updates (possibly by design).

### 3. Profile System Dynamics

- **Field integrity is good; mutability is broken.** No stale/overwritten/corrupt fields anywhere: names, descriptions, dynamics_baseline, version (0) all stable. updated_at bumped exactly on the 5 director-success rounds and nowhere else.
- Dynamics evolved in a stair-step: +12 intensity, +12 affinity, +5 openness, +6 chaos, +12 velocity net over 28 rounds — driven entirely by the 5 success-round deltas; failure rounds applied uniform −1/−2 decay (a quiet "gray drift"). The affinity 58→70 bond arc is narratively correct, but the mechanism is 81% on/off rather than continuous.
- **Recommendation:** the fallback path must still apply minimal mutations (e.g. extract present_append + one future vector from the raw-prose internal_monologue) so the profile evolves every round.

### 4. Narrative Continuity & AI Behavior Audit

- **Dialogue realism: strong.** Beast's register was respected (short, dry, feral); Orion's persona stayed consistent through an earned arc (booming gym-bro → "Who's the 'subject' now, you glorified calculator?"). Emotional pacing worked: tension ramped through the heist, dropped in the ducts, spiked at VOX, and the trust-test (r20, Aff+12) and betrayal beats (r21, r22) landed.
- **AI-isms observed (medium severity):** (1) a fixed body-metaphor palette — "tastes like copper", "stomach drops/knots", "heart hammers", "feels like a stone"; (2) habitual echoing — replies open by re-quoting the user verbatim ("Twelve percent? That's some serious turnover!", "Bait?", "Files? What files?"); (3) recycled gestures ("flex", "beams", "wide grin"); (4) occasional over-cuteness in the first act ("motivational dent", "protein shake locker"). Late-game was cleaner — the character grew with the stakes.
- **Structural flaw:** the director fallback + truncation made the climax unplayable — r28's choice was cut mid-sentence, so the story could not close. Every high-drama round (lockdown, offer, confrontation) risks a truncated or empty-feeling beat.

### 5. Remediation Roadmap

1. **Fix the director output truncation (P0 — everything else hangs off it).** Likely a response-length limit on the director LLM call (truncation ~1–1.6 KB). Raise/check max output tokens for the director call; or slim the director JSON schema (the F8 prompt now asks for events + vector_resolve + vector_append + dynamics_deltas + present/eternal mutations + trigger_image — split into 2 smaller calls); or use streamed onFinish output instead of truncated capture. Add a truncation detector (JSON ends without a closing brace → retry once with "finish the JSON object, do not truncate").
2. **Make the fallback mutation-minimal (P1/P3 recovery).** When parse fails, synthesize a minimal mutation set from the internal_monologue (present_append = one sentence, vector_append = one future beat, dynamics decay) so memory and profile evolve every round and the forge gets input.
3. **Harden the forge (P1).** Same truncation fix; add a "forge retry with shorter payload" on malformed JSON, and a size guard that splits the history slice. Log the actual failure reason to devmode (currently silent on the common null path).
4. **Defer heavy JSON/parse work off the main thread (P2).** Chunk the streaming parser, or yield between chunk callbacks so the UI never blocks >15 s.
5. **Reply truncation guard (P3):** on Character-Pass completion, if the prose is cut (no terminal punctuation) and under a floor length, trigger one auto-regeneration; at minimum, never let a climax message land truncated.
6. **Image pipeline (P4):** the scene-image tier times out 3/3 — reduce resolution/timeout for scene shots or fall back to a lower-cost tier; keep the F4 sweep (it works).
7. **Devmode:** log the parse-error source (which pass, which round, char count) into app.logs so the user sees the 81% fallback rate; surface "director degraded — memory may not update" as a visible warn.

---
*Test artifacts: scratch/stress/round-0..10.json (per-round dumps), final-rounds.json (28-round DB table), final-entities.json (end-state entities), notes.md (running audit log).*
