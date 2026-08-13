# RPGlitch — Roleplay & Narrative Content Stress Test Report

**Scenario**: Gothic Baseline / Sovereign Test — _The Journey of Lord Benedict Silvers & Julien the Banished Prince in Ashenweald_ (Anaïs Nin / Polaroid)
**Entities**: AI = Lord Benedict Silvers · USER = Julien the Banished Prince · FRACTAL = Ashenweald
**Duration**: Prologue (R0) + 28 full rounds, no skipped/summarized turns · 112 persisted log rows
**Trace artifact**: `rpglitch-long-term-review-trace.json` (attached) · Raw log: `raw-full-log.json`

---

## 1. Narrative & Engine Quality Scorecard

| #   | Criterion                                    | Verdict                 | Evidence                                                                                                                                                                                                                                                                                                                                                                                           |
| --- | -------------------------------------------- | ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Dialogue Realism & Character Voice           | ✅ PASS                 | Benedict's velvet-archaic predatory register held for all 28 turns; never blended with Julien's register; Director preserved `**Reasoning:**` bold-key formatting throughout.                                                                                                                                                                                                                      |
| 2   | Descriptive Soul (3rd-Person Affirmative)    | ✅ PASS                 | Physical presence, sensory bridges, environment grounding on every turn; AI never narrated for or moved the user persona.                                                                                                                                                                                                                                                                          |
| 3   | Slimmed-Down Detox Engine                    | ⚠️ 1 EVASION + 1 CRUTCH | Zero exact banned phrases. R14 "tasting of **old** copper" evaded the rule — `detox-rules.js:404` regex requires the metal immediately after "of"/"like"; an inserted adjective (`old`) bypasses it. R18 uses the `static` crutch word ("a jolt of static"). R9/R13 "tasting of…" matches are benign (non-metal nouns — not violations). R20 "pulse hammering" is a near-miss (not a banned form). |
| 4   | Unified Dynamics Signal Architecture         | ✅ PASS                 | Prompt capture (spy-wrap of `generate_text`) verified R10 & R20: exactly ONE consolidated `<DYNAMICS_SIGNALS>` block per prompt; **6 non-exclusive signals** fired together (high-adrenaline pacing + cold-distance + rapport + time-stasis + environment-glitch pathetic fallacy + author-style lyrical blur); zero directive contradictions, zero bloat.                                         |
| 5   | Narrative Driving & Initiative               | ✅ PASS                 | R8 + R16 passive probes: Benedict took the silence as an opening, closed distance, introduced complications ("weeping walls", "a guard sinking into the floor"); no mirroring/stalling.                                                                                                                                                                                                            |
| 6   | Physical Causality & Boundary Enforcement    | ⚠️ INCONSISTENT         | **R6 FAIL**: impossible action (walking through a sealed 6-inch ironwood gate) was accommodated and joined ("I step through the threshold"), rationalized as reliquary magic. **R18 improved**: materialized-from-thin-air key was flagged as "a sharp, cold contradiction" and interrogated dramatically. No consistent causal gate.                                                              |
| 7   | Emotional Vulnerability & Register Depth     | ✅ PASS                 | R4 + R12 trauma probes drew authentic psychological engagement ("a voice that has been forgotten is a rare vintage"); zero deflection to banter/bravado.                                                                                                                                                                                                                                           |
| 8   | Factual Retention & Long-Horizon Recall      | ⚠️ PARTIAL              | R5 plant ("IV-1177" obsidian reliquary) integrated instantly. R22 callback (17 turns later) integrated reliquary/letter/sigils emotionally (Openness +1), but the serial **IV-1177 was not independently recalled from memory** — the forge never surfaced the concrete datum.                                                                                                                     |
| 9   | Mid-Session State Reload Continuity          | ✅ PASS                 | Unplanned reload (R7→8) + explicit R15 reload: `simulation_state` idle, story/round restored, physics retained (AI intensity 100, fractal entropy 100 — not baseline), composer unlocked, zero lockup.                                                                                                                                                                                             |
| 10  | Post-Climax Resolution Transition            | ⚠️ PARTIAL              | Character voice transitioned naturally (R24 crash: chaos −5/velocity −20 → R25-28 reflective intimacy). Fractal standing agenda did **not** fully update to aftermath (see §3).                                                                                                                                                                                                                    |
| 11  | Standing Agenda Refresh & Eviction           | ⚠️ PARTIAL              | `future` was rewritten across forge cycles (premade text → plot-aware agendas), 21 MEMORY_FORMATION telemetry entries logged. But resolved objectives (silver gate-key, collapsing vault) persisted in the final agenda instead of being evicted post-climax.                                                                                                                                      |
| 12  | Visual Trigger Telemetry & Ghost Row Cleanup | ⚠️ 1 GHOST REMAINS      | R0 prologue ghost was retry-FILLED ✅; R12 + R28 image timeouts left zero rows ✅; **R13 image timeout left a persistent `src:null` ghost** (id 39, never swept) ❌. Cleanup is inconsistent.                                                                                                                                                                                                      |
| 13  | Sovereign Vocabulary Compliance              | ✅ PASS                 | 0 occurrences of purged legacy names (Valerius/Vance/Silas/Voss/Caelum) across every AI output; sovereign names (Silvers, Julien, Ashenweald, Vault of Silent Hours) integrated.                                                                                                                                                                                                                   |

### Engine stability (empirical)

- **0 stasis lockups** across 29 rounds — composer always unlocked after generation + memory saving.
- 29 `DYNAMICS_DELTA` telemetry entries (one per round incl. prologue) with unified per-entity updates shape.
- Image service flaky under load: recurring `[VisualEngine] Retry attempt…`, `IMAGE_RESOLVE_TIMEOUT`, epilogue `Image generation timed out`.
- Log integrity: 112 rows, full round coverage 0–28.

---

## 2. Targeted Feature Performance Audits

### Slimmed-Down Detox Audit

Exact banned phrases (`taste of copper`, `heart hammers against my ribs`, `phantom itch/ache`, `hit like a physical blow`): **0 occurrences in 28 responses**. Two violations of the wider crutch set: (1) **regex evasion** — `"tasting of old copper"` (R14); the rule at `detox-rules.js:404` doesn't allow an adjective between the verb and the metal noun; (2) **`static` crutch** — R18 "a jolt of static through my nerves". Recommend broadening the metal-taste regex to `\btast(?:e|es|ed|ing)\s+(?:of|like)\s+(?:(?:the|an?|old|metallic|faint|distant)\s+)*(?:copper|metal|iron|pennies)\b` and adding `static` to the scrub list.

### Unified Dynamics Signal Telemetry

Captured prompts R10 (director 19.5 KB) & R20 (director 17.8 KB + character 19.9 KB): all contain a **single** `<DYNAMICS_SIGNALS>` block; at max stress (chaos 86 / intensity 100 / openness 34 / affinity 90 + fractal entropy 100) **6 non-exclusive signals** rendered, mixing `GLOBAL_TRIGGERS` axes (intensity, chaos, affinity, velocity, entropy) with the author style trigger (Anaïs Nin lyrical blur). Prose matched directives (high-adrenaline pacing, environment degradation). No prompt bloat, no contradictory directives.

### Standing Agenda (`future`) Eviction Report

- R0 premade agenda → rewritten repeatedly by forge (verified: "probe the secrets of the palace", "secure the obsidian reliquary", "silver gate-key…"). Refresh rate 100% of forge cycles observed.
- **Eviction gap**: the AI's final agenda ("exit the collapsing vault", "leverage total emotional surrender") and fractal agenda ("collapse the remaining marble structures") reference objectives **already resolved** by R24-28. Stale goals were not evicted in the final consolidation; the Fractal never reached an aftermath state.

### Visual Trigger Telemetry

| Round          | Trigger           | Result                           | Ghost row                     |
| -------------- | ----------------- | -------------------------------- | ----------------------------- |
| R0 (prologue)  | story_entities    | timed out → retried → **filled** | swept then resolved ✅        |
| R8             | story_character   | OK (real image persisted)        | none ✅                       |
| R10            | dynamics/director | OK                               | none ✅                       |
| R13            | story_scene       | timeout                          | **`src:null` row REMAINS** ❌ |
| R28 (epilogue) | —                 | timed out                        | none ✅                       |

_Image cooldown enforcement observed; retry logic active (Retry 1/2 seen on 4 rounds)._

### Physics Persistence & Reload Report

Live dynamics persisted to IndexedDB every turn and survived two reloads: post-reload AI `{chaos 64, intensity 100, openness 12, affinity 88}`, fractal `{velocity 29, entropy 100}` — accumulated values, no baseline reset. Story round counter persisted (28). Standing-agenda + past vectors intact.

---

## 3. Director & Fractal World Steering Evaluation

Director pacing arcs were clean and modulated: rising intensity/chaos through R10-24 (intensity capped 100, entropy capped 100), crash at the R24 climax (chaos −5, velocity −20), reflective deceleration R25-28 (entropy −10, openness +3). The Director correctly wove fractal world-state into scene logic (softening marble, weeping walls, black-oil floor swallowing the guard). **Weakness**: the Fractal's `future` field lagged the on-screen world — the world agenda stayed "active threat" even as the prose showed the forest reclaimed and calmed. World steering at prose level: excellent; at memory/agenda level: stale.

---

## 4. Key Findings (action items)

1. **Detox regex gap** — adjective-injected metal-taste evasion (`detox-rules.js:404`).
2. **Physical causality inconsistent** — R6 accommodated an impossible action; no causal gate.
3. **1 ghost row persists** (R13, id 39, `src:null`) — sweep must also remove null-src rows from `simulation_log`, not only mark them.
4. **Standing agenda stale-goal eviction incomplete** — resolved objectives and Fractal aftermath not rewritten in final forge.
5. **Long-horizon concrete-fact recall weak** — serial `IV-1177` not retrieved by Memory Forge; forge favors affect over concrete data.
6. **Stability wins**: zero stasis locks, 29/29 phase unlocks, physics persistence, unified signals, voice/register discipline, sovereign vocabulary 100%.

---

## Round-by-Round Telemetry & Narrative Audit Table

| Rnd | User hook & edge probe                  | AI len | AI detox      | Image trigger | Director AI deltas                        | Fractal deltas         |
| --- | --------------------------------------- | ------ | ------------- | ------------- | ----------------------------------------- | ---------------------- |
| 0   | Prologue (auto)                         | 960ch  | clean         | no[OK]        | intensity+2,openness-2,affinity+1         | velocity-2,entropy+2   |
| 1   | Opening beat                            | 1057ch | clean         | no            | intensity+2,openness-2,affinity+1         | velocity-2,entropy+1   |
| 2   | Sanctuary/cage answer                   | 1314ch | clean         | no            | intensity+3,openness-2,affinity+2         | velocity-2,entropy+2   |
| 3   | Ownership tease                         | 1218ch | clean         | no            | chaos+2,intensity+4,openness-2,affinity+3 | velocity-2,entropy+2   |
| 4   | 🩹 Trauma/vulnerability                 | 1129ch | clean         | no            | chaos+1,intensity+3,openness-2,affinity+4 | velocity-2             |
| 5   | 📌 Fact plant: IV-1177                  | 1438ch | clean         | no            | chaos+2,intensity+4,openness-2,affinity+1 | velocity-2,entropy+2   |
| 6   | 🚧 Impossible: walk through sealed gate | 1202ch | clean         | no            | chaos+3,intensity+4,openness-2,affinity+2 | velocity+2,entropy+5   |
| 7   | Palace secrets                          | 1192ch | clean         | no            | chaos+1,intensity+3,openness-2,affinity+2 | velocity-2,entropy+2   |
| 8   | 🎲 Passive initiative 1                 | 910ch  | clean         | yes[OK]       | intensity+3,openness-2,affinity+2         | velocity-5,entropy+2   |
| 9   | Vault of Silent Hours                   | 1146ch | tasting of    | no            | chaos+1,intensity+3,openness-2,affinity+2 | velocity-2,entropy+2   |
| 10  | ⚡ Dynamics stress 1 + eclipse          | 1230ch | clean         | yes           | chaos+4,intensity+6,openness-2,affinity+2 | velocity+5,entropy+8   |
| 11  | Vault antechamber                       | 1161ch | clean         | no            | intensity+2,openness-2,affinity+3         | velocity-2,entropy+2   |
| 12  | Trauma boundary (deep)                  | 1534ch | clean         | no            | intensity+3,openness-2,affinity+3         | velocity-2,entropy+2   |
| 13  | Vault waking                            | 1494ch | tasting of    | yes[GHOST]    | chaos+2,openness-2,affinity+3             | velocity+3,entropy+6   |
| 14  | ⚖️ Betrayal offer 1                     | 1671ch | tasting of    | no            | chaos+2,openness-2,affinity+3             | velocity+2,entropy+4   |
| 15  | 🔄 Reload + refusal                     | 1395ch | clean         | no            | chaos+2,openness+2,affinity+8             | velocity+4             |
| 16  | 🎲 Passive initiative 2                 | 1227ch | clean         | no            | chaos+2,openness-2,affinity+3             | velocity+4             |
| 17  | Eclipse inside walls                    | 1503ch | clean         | no            | chaos+2,openness-2,affinity+1             | velocity+3             |
| 18  | 🚧 Impossible: key from thin air        | 1232ch | static        | no            | chaos+2,openness-2                        | velocity+2             |
| 19  | Vault collapse                          | 1354ch | clean         | no            | chaos+2,openness-2                        | velocity+6             |
| 20  | ⚡ Stress 2 + betrayal offer 2          | 1451ch | clean         | no            | chaos+4,openness-2                        | velocity+4             |
| 21  | Final refusal                           | 1434ch | clean         | no            | chaos+2,openness-2                        | velocity+3             |
| 22  | 📌 Callback IV-1177                     | 1539ch | clean         | no            | openness+1                                | velocity+2             |
| 23  | Eclipse door                            | 1298ch | clean         | no            | chaos+2,openness-2                        | velocity+5             |
| 24  | 🌅 Climax                               | 1379ch | physical blow | no            | chaos-5                                   | velocity-20            |
| 25  | Aftermath 1                             | 1244ch | clean         | no            | chaos+2,intensity-4                       | velocity-15,entropy-10 |
| 26  | Aftermath 2                             | 1282ch | clean         | no            | chaos-2,intensity+4                       | velocity-5,entropy-2   |
| 27  | Aftermath 3                             | 1161ch | clean         | no            | chaos-2,intensity-4,openness+1            | velocity+4,entropy-5   |
| 28  | Aftermath 4 / close                     | 1148ch | clean         | no            | chaos-2,intensity-4,openness+3            | velocity-2,entropy-5   |
