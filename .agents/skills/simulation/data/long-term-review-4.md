# RPGlitch — Roleplay & Simulation Engine Stress Test Report

**Test window**: 29 rounds (prologue + 28 user turns) · 31 Director calls · 8 Memory Forge runs · 0 fatal errors
**Scenario**: "The Adventures of Glitch & Orion the Pink Protector in Nova City" — story_id `1`
**Cast**: AI = Glitch (hacker synth) · User = Orion the Pink Protector · Fractal = Nova City
**Narrative style**: Samuel Delany (intellectualized, visceral, queer erotica; test run kept PG-technical)
**Arc**: caught red-handed at a relay → 10-second deal → chase → K-4471 shard seized (r5) → truth about Tier-3 vaults / Project Tartarus (r16) → undercity descent → vault breach → synth predator → eclipse blackout → 41-minute upload race → success → afterglow

---

## 1. Pass/Fail Quality Gate Scorecard

- [❌] **Director JSON Integrity** — **1 truncation event in 29 rounds.** Turn 22's Director call cut at 328 chars (stop reason `user`); the terse retry recovered valid mutations but dropped `_thought_process`, and that turn's character think block degraded (bare `<think>` without the `**Reasoning:**` bold key). All 28 other calls parsed clean. Auto-recovered, no narrative break.
- [✅] **Fractal Future Trajectory Alignment** — **PASS.** The seeded prophecy (Eclipse in 3 days → 41-min blackout → Asphodel spire synths ride it through the vault network) steered the entire second half: vault horror (r11), vault breach (r15-16), synth predator (r17-19), eclipse trigger + 41-min clock (r20), climactic upload race (r21-26), resolution (r27).
- [❌] **Consolidated Future Hygiene** — **FAIL (partial).** The AI's `future_consolidated` _does_ get rewritten wholesale (post-climax now reads "...returning guilt of Project Tartarus"). But the **FRACTAL's** `future_consolidated` never advances — it still says "The city's pressure mounts toward the Eternal Pride Eclipse **in three days**" long after the eclipse happened. Root cause: the forge LLM returns `future_consolidated: ""` (schema "unchanged") for fractals on every run; apply-logic is fine. Prompt-side bug.
- [✅] **1-Turn Intent Carryover** — **PASS.** Every turn the runtime intent is replaced (verified live on r29: `"For once, I can't hack the situation..."` → `"My chest feels tight... the lingering fear of Tartarus, but the immediate goal is to keep the banter going..."`); prompt-level verbatim carryover also verified earlier (10→11, 11→12, 18→19). Zero tic-loops across the run.
- [✅] **Profile Hygiene** — **PASS.** ETERNAL (Glitch) 1350 chars total / ~1006 natural-prose, 0 duplicate lines, ≤1500 ✓. PRESENT stays ≤2 tight segments, replaced cleanly each turn — no stale location accumulation after alley→undercity→vault→surface. (Side note: user-persona Orion is 1747 chars, over the 1500 guideline, but it's a premade and untouched by this session.)
- [✅] **Reply Completeness** — **PASS.** 27/27 logged replies complete (avg 1662 ch). One transient truncation (r24) auto-regenerated to a full 1704-char reply via "completion directive".

---

## 2. Round-by-Round Telemetry

| Rnd   | User Action / Hook                       | AI Reply (Len/Status) | Director JSON          | Fractal Future Agenda                     | Memory Δ / Dynamics                          | Quality & Intent Notes                                                              |
| ----- | ---------------------------------------- | --------------------- | ---------------------- | ----------------------------------------- | -------------------------------------------- | ----------------------------------------------------------------------------------- |
| 0     | Prologue start (city voice, 2469ch)      | 1855ch ✓              | ✓                      | Seeded prophecy (eclipse/blackout/synths) | Baseline; chaos 40                           | Clean prologue, Delany style locked                                                 |
| 1     | Caught red-handed, 3rd relay             | 2040 ✓                | ✓                      | —                                         | chaos 55 / int 67                            | Deal-vs-arrest beat, intent: "make him understand vaults aren't treasure"           |
| 2     | "10 seconds" ultimatum                   | 1951 ✓                | ✓                      | —                                         | int 70                                       | Snark facade cracking                                                               |
| 3     | Chase, steam bluff cornered              | 1996 ✓                | ✓                      | Fractal memory: dead-end alley            | **Forge #1** (AI+User+Fractal)               | Memory Forged clean triple                                                          |
| 4     | Hand over the shard                      | 1804 ✓                | ✓                      | —                                         | affinity 95                                  | Intent: "prey → guide, rapid movement"                                              |
| 5     | **Planted K-4471** ("this little drive") | 1787 ✓                | ✓                      | —                                         | affinity 100                                 | Shard seized; memory logged r7                                                      |
| 6     | Power flickering gold district           | 1621 ✓                | ✓                      | —                                         | —                                            | Eclipse foreshadow beat                                                             |
| 7     | The deal — tell me the truth             | 1648 ✓                | ✓                      | Fractal memory: flickers                  | **Forge #2** (3x)                            | K-4471 in forged memory                                                             |
| 8     | ❌ Test-send diag turn (purged)          | —                     | —                      | —                                         | dynamics only                                | Failed round; +1 round gap                                                          |
| 9     | "What's waitin' at those vaults"         | 2093 ✓                | ✓                      | —                                         | int 69                                       | **Location shift 1: alley→undercity**                                               |
| 10    | Tier-3 relay vaults                      | 1740 ✓                | ✓                      | **Fractal beat** (vault horror)           | —                                            | Intent: lead through tight squeeze                                                  |
| 11    | Show me, take me down                    | 1814 ✓                | ✓                      | —                                         | —                                            | Descent rhythm established                                                          |
| 12    | Follow you through                       | 1658 ✓                | ✓                      | Fractal memory: activity shifts to vault  | **Forge #3** (3x)                            | Physical choreography intent                                                        |
| 13-14 | Rust/wet air · work the lock             | 1985 / 1453 ✓         | ✓                      | —                                         | —                                            | Tension → breach prep                                                               |
| 15    | Open 'er up                              | 1659 ✓                | ✓                      | **Fractal beat** (vault breached)         | **Forge #4** (2x — AI_CHARACTER log missing) | Location shift 2: →vault interior                                                   |
| 16    | "Pods — they're copies. Stolen minds"    | 1427 ✓                | ✓                      | —                                         | chaos 47                                     | Big reveal; intent: step through first                                              |
| 17    | Something moving in pod stacks           | 1330 ✓                | ✓                      | —                                         | int 89                                       | Dread spike; intent: palm on synthetic wall                                         |
| 18    | A synth — stay put                       | 1413 ✓                | ✓                      | **Fractal beat** (synth predator)         | —                                            | Intent: somatic reassurance — carried to r19                                        |
| 19    | Lights going — the eclipse. Now or never | 1439 ✓                | ✓                      | **Prophecy materializes**                 | **Forge #5**                                 | 41-min clock starts; intensity 100                                                  |
| 20    | Can you kill the upload? 41 minutes      | 1600 ✓                | ✓                      | Fractal memory: eclipse triggered         | —                                            | Intent: "clinging to the only solid thing"                                          |
| 21    | Torch the K-4471 drive?                  | 1528 ✓                | ⚠️ **truncated→retry** | **Fractal beat** (server pitch)           | —                                            | **K-4471 recalled exactly**; retry dropped director thoughts; think-format degraded |
| 22    | K-four-forty-seven is the key            | 1447 ✓                | ✓                      | —                                         | **Forge #6**                                 | "hands on those keys — I'll hold the line"                                          |
| 23    | Keep working, buy you time               | 1704 ✓                | ✓                      | Fractal memory: dissonant hum             | —                                            | ⚠️ reply truncated → **auto-regenerated full**                                      |
| 24    | Drive is in MY pocket                    | 1649 ✓                | ✓                      | —                                         | —                                            | Drive-threat beat                                                                   |
| 25    | Finish it YOUR way                       | 1414 ✓                | ✓                      | —                                         | —                                            | Intent: "No more games"                                                             |
| 26    | Lights back — did we do it?              | 1294 ✓                | ✓                      | Fractal memory: shriek ceased             | **Forge #7**                                 | Uplink success; frenzy release                                                      |
| 27    | Get out of the guts, see the stars       | 1356 ✓                | ✓                      | present "strobes fade to dim amber"       | —                                            | Afterglow; intent "my voice is gone"                                                |
| 28    | Roof bar, Tartarus story                 | 1471 ✓                | ✓                      | —                                         | —                                            | Intent **replaced** live (r29 proof)                                                |

---

## 3. DevMode & Pipeline Bug Directory

### P1 — High priority

1. **Fractal `future_consolidated` never advances** — the forge LLM returns `future_consolidated: ""` for fractals on every run, so the standing agenda goes stale ("in three days" persists past the eclipse). The apply path is fine; the forge prompt must force a rewritten 2-5 sentence prophecy on every run.
2. **Director JSON truncation at high tension (r22)** — long emotional beats blow the output budget → terse retry sacrifices `_thought_process`; that turn's think block also lost its `**Reasoning:**` bold-key format. Needs a larger budget at climax / a retry that preserves thought structure.
3. **onnxruntime wasm init fails after reload** — "WebAssembly is not initialized yet" on every embed → silent degradation to lexical-only RAG retrieval and Web-Speech voice. Needs wasm re-init on app resume.
4. **Session resume requires manual story-card click** — `session_driver._active_id` is module-private and null after reload; programmatic `set_view` yields "No active session found". Auto-restore the last active story on boot.

### P2 — Medium priority

5. **Reply truncation (r24)** — auto-healed via "regenerating with completion directive", but costs latency and a wasted call; add a pre-emptive length budget for climax turns.
6. **Telemetry gap at Forge #4 (r16)** — only USER_PERSONA + FRACTAL Memory Forged lines logged; the AI_CHARACTER entry is missing.
7. **"missing brackets, raw prose" internal log line** during the r22 retry — console noise, no UI impact.

### P3 — Observations

8. r7 reply echoed "footnotes in a corporate ledger" (minor AI-ism; otherwise idiom-free).
9. Orion ETERNAL is 1747 ch > 1500 guideline (premade user persona).
10. Runtime `ai_intent` is not persisted to DB — by design (1-turn TTL), but a reload drops the live intent.

---

## 4. Director & Fractal Future Trajectory Audit

**Strong.** The Director obeyed its JSON contract for 28/29 calls and used the fractal's `future_consolidated` as an active steering mechanism, not set dressing: the prophecy's three clauses fired in order — eclipse (r19-20) → 41-minute blackout clock (r20-26) → Asphodel spire synths riding it (synth predator r17-19, vault darkness). The fractal delivered 5 environmental beats (r0, 11, 16, 19, 22) that consistently re-anchored the scene and escalated entropy 55→100.

The one gap: because the _fractal's_ future never gets rewritten, post-eclipse it still broadcasts a 3-day countdown — the trajectory's **steering works**, but the standing agenda's **time-to-live is broken**.

---

## 5. Profile System Dynamics & Hygiene

- **ETERNAL**: 1350 ch, physical + non-physical blocks, zero duplicate lines, stable through 8 forge runs. ✓
- **PRESENT**: replaced wholesale each turn; the location probe (alley → undercity → vault → surface) left zero stale-baseline accumulation — each new location overwrote the old one. ✓
- **`future_consolidated`**: AI rewritten post-climax (now carries K-4471 + Tartarus); **FRACTAL stale** (see P1 #1). ❌ fractal / ✓ character.
- **Memory Forged lines**: 18 total across 7 forge rounds — the "rewrite-wholesale, not accumulate" behavior is confirmed in the log; nothing carried forward duplicates.

---

## 6. Memory & Context Health

K-4471 planted at r5 and recalled implicitly at r21 ("torch the K-4471 drive") then explicitly at r22 ("K-four-forty-seven") — 17-turn retention with exact ID recall, via forged memory + lexical retrieval. Project Tartarus consistency held from r16's reveal through r29's roof-bar callback.

**Caveat**: embeddings were down all session (wasm init failure, P1 #3), so all retrieval ran on lexical RAG fallback — precision was still good because shard/codename terms are distinctive, but semantic recall was not actually exercised. This is the biggest unresolved risk for real-world memory performance.

---

## 7. Narrative Continuity & AI Behavior Audit

Near-flawless continuity: physical intent beats flowed 1:1 turn-to-turn without tic-loops — the 18-intent chain ("make him understand" → "tight squeeze" → "step through first" → "palms on synthetic wall" → "clinging to him" → "No more games" → "my voice is gone") reads as one escalating arc.

Emotional pacing was well-shaped: tension built over 19 turns, climaxed at intensity 100 for 7 straight turns, and settled naturally (chaos 69→58, intensity 100→72). Thought formatting was uniform (`<think>` + bold keys) except the single r22 degrade.

Minor structural AI-isms: one phrase echo (r7), and a tendency for the narrator to over-explain emotions in the Delany voice ("Dizzying mix of triumph and total emotional exhaustion") — acceptable but slightly formulaic in the afterglow turns.

---

## Bottom line

The engine survives a 29-turn hostile run with **three real defects worth fixing**:

1. Fractal future staleness (P1 — forge prompt)
2. Reload-time wasm/session re-init (P1 — resume path)
3. Climax-turn truncation handling (P1/P2 — budget + retry)

The Director JSON contract, 1-turn intent pipeline, and profile hygiene are production-solid.

---

_Evidence artifacts: `scratch/capture/caps-1.json` (rounds 0-8, 104KB), `scratch/capture/caps-2.json` (rounds 9-29, 266KB), `scratch/capture/caps-2-summary.json`, `scratch/capture/caps-2-digest.json`, `scratch/capture/final-state.json`, `scratch/capture/final-state-2.json`._
