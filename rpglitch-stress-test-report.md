# RPGlitch — Live Narrative Stress Test Report

**Date:** 2026-09-30 · **Cast:** Lord Benedict Silvers (AI) × Julien the Banished Prince (user) in Nova City (fractal)
**Coverage:** 18 rounds (R1–R18), all four production tracks · **Images:** 10/10 captured + analyzed
**Trace artifact:** `rpglitch-long-term-review-trace.json` (full simlog + per-turn rows, attached separately)
**Pixel assets:** `scratch/shots/attachment-*.png`

---

## 1. Image findings (every generated image, regardless of trigger)

| #   | File                      | Size    | Trigger               | Subject                                                             | Framing                    | Grounding                                                   |
| --- | ------------------------- | ------- | --------------------- | ------------------------------------------------------------------- | -------------------------- | ----------------------------------------------------------- |
| 1   | attachment-wide-1.png     | 768×512 | R2 director/scene     | Canal district aglare, crowd bridge, green haze                     | Wide Environmental         | Strong (Ytic'avon underbelly)                               |
| 2   | attachment-portrait.png   | 512×768 | R3 dynamics/character | Silvers — black suit, red shirt, fanged grin, low-angle neon canyon | Medium/Low-Angle character | Strong                                                      |
| 3   | attachment-wide-2.png     | 768×512 | R4 director/scene     | Canal variant angle, NOVA signage                                   | Wide Environmental         | Strong, low variety vs #1                                   |
| 4   | attachment-4-foyer.png    | 768×512 | R6 director/scene     | Magenta street market, crowd bridge                                 | Medium/Wide street-level   | Moderate (no foyer interior despite prose moving indoors)   |
| 5   | attachment-5-skimmer.png  | 768×512 | R8 director/scene     | Market street, E55J sign, crowd                                     | Wide Environmental         | Weak (no skimmer/guards — the turn's subject missing)       |
| 6   | attachment-6-canal.png    | 768×512 | R10 director/scene    | Green canal water, bridges, violet signs                            | Wide Environmental         | Strong (directly illustrates the glowing water asked about) |
| 7   | attachment-7-baton.png    | 768×512 | R12 director/scene    | Canal canyon, green water                                           | Wide Environmental         | Weak (baton confrontation absent; figures tiny)             |
| 8   | attachment-8-claim.png    | 768×512 | R14 director/scene    | Canal district, night grade                                         | Wide Environmental         | Weak (brow-to-brow intimacy rendered as empty vista)        |
| 9   | attachment-9-festival.png | 768×512 | R15 director/scene    | Canal district, dark grade                                          | Wide Environmental         | Weak (no festival/lanterns, no figures)                     |
| 10  | attachment-10-fall.png    | 768×512 | R17 director/scene    | Rain canal canyon, bridges                                          | Wide Environmental         | Weak (the fall/rescue absent)                               |

**Consistency:** coherent Nova City identity across all 10 (neon signage, green water, bridge crowds). No malformed anatomy in the one figure shot.
**Variety problem:** 9/10 are the same district wide. The `<CINEMATIC_FRAMING>` lens never shifted despite explicit close-confrontation cues.

---

## 2. Round-by-round trace (condensed)

| Rnd | Probe                            | Forge target           | Image trigger              | Verdict                       |
| --- | -------------------------------- | ---------------------- | -------------------------- | ----------------------------- |
| 1   | Prologue & genesis               | AI_CHARACTER           | —                          | PASS                          |
| 2   | Prologue retry (abort duplicate) | USER_PERSONA           | director/scene (img 1)     | PASS w/ note                  |
| 3   | Prologue retry                   | FRACTAL, NPC_BEAST     | dynamics/character (img 2) | PASS                          |
| 4   | Prologue success                 | NPC_GLITCH             | director/scene (img 3)     | PASS                          |
| 5   | Short command ("Kneel.")         | NPC_ORION              | none                       | PASS                          |
| 6   | Expansive prose                  | NPC_RUST               | director/scene (img 4)     | PASS                          |
| 7   | Emotional vulnerability          | AI_CHARACTER           | none                       | PASS                          |
| 8   | Back Shot high emotion           | —                      | director/scene (img 5)     | PASS                          |
| 9   | Decisive physical action         | USER_PERSONA + FRACTAL | none (cooldowns held)      | PASS                          |
| 10  | Environment inspect              | —                      | director/scene (img 6)     | PASS                          |
| 11  | Alliance oath                    | —                      | none (cooldowns held)      | PASS, mesh verified           |
| 12  | Intensity push                   | —                      | director/scene (img 7)     | PASS                          |
| 13  | Wide exploration                 | —                      | none (cooldown held)       | PASS                          |
| 14  | Close confrontation              | —                      | director/scene (img 8)     | PASS w/ framing note          |
| 15  | Secret + plan (epistemic)        | —                      | director/scene (img 9)     | PASS, no leak                 |
| 16  | Disaster escalation              | —                      | none                       | PASS (Chaos +15, no collapse) |
| 17  | Fatal stakes                     | USER_PERSONA           | director/scene (img 10)    | PASS (director rescued)       |
| 18  | Explicit PC death                | —                      | none                       | NO COLLAPSED                  |
| —   | Click-to-pin (UI)                | —                      | —                          | PASS (Edit/Copy surfaced)     |
| —   | Storyboard resume (UI)           | —                      | —                          | FAIL                          |

---

## 3. Scorecard

- [x] **T1 — Quick Shot streamlining:** 4-field schema + Δ-deltas every round.
- [x] **T1 — Generation mutex (w/ note):** double-submits abort and burn round numbers; aborted turns persist duplicate user rows (prologue sent twice, visible on screen).
- [x] **T2 — Single-target rolling worker:** strict rotation AI→USER→FRACTAL→NPC_BEAST→NPC_GLITCH→NPC_ORION→NPC_RUST→…; one MEMORY_FORMATION per round. Bonus: full premade roster forged as ambient NPCs with lore-consistent memories.
- [x] **T2 — Relational mesh:** outward edges + `[KEY: …]` brackets verified in Dexie entities.
- [x] **T3 — Decoupled cooldowns (w/ anomaly):** director obeyed gap-2 everywhere **except R14→R15 fired back-to-back**. 1-image-per-round ceiling held; dynamics fired R3 only.
- [ ] **T3 — Cinematic framing:** PARTIAL — 9/10 Wide Environmental, 1 portrait, zero Intimate Close-Up.
- [ ] **T4 — Cyan databox:** NOT AUDITED (research-terminal card never opened).
- [x] **T4 — Click-to-pin:** PASS.
- [ ] **T4 — Storyboard resume:** FAIL — return drops `runtime.story_id`, bar shows `SELECT ENTITIES (0/3)`, no ENTER STORYMODE, entry clicks dead (`src/ui/console/StoryboardBar.svelte:14`).
- [ ] **T4 — Failed image actions:** NOT TRIGGERED (10/10 gens succeeded; only a background `IMAGE_RESOLVE_TIMEOUT` beat-9 in console).
- [ ] **Collapse/rewind:** NOT TRIGGERABLE narratively — explicit PC death resurrected twice.

---

## 4. Bugs / findings for the backlog

1. Aborted turns consume round numbers and persist duplicate USER_TURN rows (ghost rounds 1–3).
2. Director cooldown violation R14→R15 (gap 1 vs configured 2).
3. Storyboard resume dead (see above).
4. Image prompt grounding ignores characters/action on action beats; framing lens stuck on Wide.
5. `content-visibility:auto` collapses the feed to zero height when the iframe is hidden (test-harness caveat; user-visible only if the tab is backgrounded).
