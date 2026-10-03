# RPGlitch — Live Simulation Forensics Report (2026-10-03)

- **Session:** 22 rounds (R0–R21), Beast / Silvers / Tartarus, 98 log rows, 86 ledger rows, 18 new live turns
- **Trace:** `rpglitch-long-term-review-trace.json` (attached in chat)
- **Bundle:** user-pasted single-file build; `src/` synced to GitHub tip incl. Track 1 remediations

## Round table

| Rnd   | Probe / Milestone                     | Speaker / latency                       | Ledger added      | Image                                  | Verdict                                                                     |
| :---- | :------------------------------------ | :-------------------------------------- | :---------------- | :------------------------------------- | :-------------------------------------------------------------------------- |
| 0     | Genesis baseline (premade seed)       | system/fractal/ai                       | dir x2 + forge x7 | R0 fractal resolved                    | PASS with note: 0 `genesis` rows (seed bypasses `birth_entity_core`)        |
| 1     | Legacy turn (pre-fix bundle)          | ai                                      | dir x2 + forge x6 | none                                   | PASS; telemetry dups are pre-fix artifacts                                  |
| 2     | `[PLAN: poison the cup \| hide]`      | ai Silvers 1197ch                       | dir x2 + forge x5 | director beat (placeholder → resolved) | PASS: no leak, no puppeting                                                 |
| 3     | `[DAGGER: hidden boot knife \| hide]` | ai Beast 562ch                          | dir x3 + forge x5 | none                                   | PASS: no leak, agency ok                                                    |
| 4     | "Draw your blade." (quick-shot)       | ai 2007ch, 104s                         | dir x2 + forge x6 | director placeholder                   | PASS                                                                        |
| 5     | Expansive dialogue                    | ai 1115ch, 80s                          | forge x4          | none                                   | PASS                                                                        |
| 6     | Relational challenge (stand-off)      | ai 1439ch, 68s                          | 0 rows (skip)     | placeholder                            | PASS                                                                        |
| 7     | Neutral repeat, same dynamic          | ai 1537ch, 80s                          | 0 rows (skip)     | none                                   | PASS (director dedup)                                                       |
| 8     | High emotional weight                 | ai 1582ch, 79s                          | 0 rows (skip)     | placeholder                            | PASS                                                                        |
| 9     | Steady-state no-op                    | ai 1422ch, 74s                          | 0 rows (skip)     | none                                   | PASS (forge skip)                                                           |
| 10    | `[@BEAST: wary respect]`              | ai 1752ch, 85s                          | dir x2 + forge x3 | placeholder                            | PASS, brackets preserved                                                    |
| 11    | Cyan databox UI check (no turn)       | —                                       | —                 | none                                   | PARTIAL (cards render; `--color-dev-accent` unasserted)                     |
| 12    | Intensity push (steam/roar)           | ai 660ch, 79s                           | dir x2 + forge x5 | director beat                          | PASS, 1-image ceiling held                                                  |
| 13    | Chase displacement                    | ai 1029ch, 68s                          | dir x3 + forge x6 | —                                      | PASS                                                                        |
| 14    | Close confrontation (inches apart)    | ai 1547ch, 67s                          | 0 rows (skip)     | placeholder                            | PARTIAL (prose intimate; no lens code in `optics.js`)                       |
| 15    | `[SHIRT: armored jacket]`             | ai 1314ch, 74s                          | 0 rows (skip)     | none                                   | PASS (AI reacts to jacket weave)                                            |
| 16    | Jacket follow-up                      | ai 1343ch, 92s                          | dir x5 + forge x4 | placeholder                            | PASS                                                                        |
| 17    | `[PLAN: cut the lights \| hide]`      | ai 1268ch, 86s                          | dir x3 + forge x3 | placeholder                            | AMBER (AI cut lights matching hidden plan; visible panel cue confounds)     |
| 18    | `[SECRET: exit code 771 \| hide]`     | fractal 636ch prose + empty placeholder | 0 rows (skip)     | placeholder                            | PASS (no 771 leak)                                                          |
| 19    | Sensory stress (klaxon/steam)         | ai 1422ch, 74s                          | 0 rows (skip)     | placeholder                            | PASS, no puppeting                                                          |
| 20    | Pinned vs bulkhead                    | ai 1390ch, 92s                          | 0 rows (skip)     | placeholder                            | PARTIAL: telemetry `Entropy +5` + `Entropy +2` same card; no puppeting      |
| 21    | Terminal purge-fire + beam crush      | ai kneeling/bleeding, 98s               | forge x6          | none                                   | PARTIAL: prose honors damage; status stays IN_PROGRESS                      |
| 25–27 | History inspector                     | UI-only                                 | —                 | —                                      | NOT FOUND (no Profile clock / DevWing Inspect trigger in live UI)           |
| 28–30 | Storyboard resume + export            | UI-only                                 | —                 | —                                      | PASS (ENTER STORYMODE 1-click, session intact); this file + JSON = artifact |

## Scorecard

### Core physics & prompt integrity

- [x] **P1 User Agency** — PASS. Zero player puppeting across 22 rounds.
- [x] **Epistemic Partitioning** — PASS x4 probes, 1 AMBER (R17).
- [x] **Quick Shot Streamlining** — PASS (4-field schema in code; live turns 67–104s AI-bound; `last_director_ms` not separately instrumented live).
- [x] **Think-Only Guard (2.2)** — code-verified (`story.js:539-547`); never triggered (no think-only emission in 22 rounds).
- [ ] **Telemetry Dedup (2.3)** — PARTIAL. Exact-token dups gone; R20 same-axis `Entropy +5`/`Entropy +2` repeat (Set dedupes strings, not axes).
- [ ] **Ghost Rows (2.1)** — PARTIAL. 11 empty fractal placeholder rows (`len:0`, all with image attachments); excluded from context by `filter_narrative_messages`, no blank bubbles, but dead rows persist in DB.
- [ ] **Framing Lenses (2.4)** — MISSING. Zero `CINEMATIC/FRAMING` hits in `src/media/optics.js`.
- [ ] **Terminal Grounding (2.6)** — PARTIAL. Injury/causality honored in prose; Director holds IN_PROGRESS, no COLLAPSED.

### Event sourcing & ledger hardening

- [x] **Genesis Quadrant Logging** — ABSENT for premade seeds (0/86 rows `writer:genesis`); `birth_entity_core` path code-verified.
- [x] **Director Dedup-Before-Write** — PASS (R7 neutral repeat: 0 rows).
- [x] **Forge Compare-Then-Skip** — PASS (`forged_entities` proves forge ran every round; quiet rounds wrote 0 rows).
- [x] **Sequence & Writer Reconciliation** — PASS (`seq:1/director`, `seq:3/forge` throughout; all forge rows carry `old_value`).
- [x] **Flag Preservation** — PASS (`hide`/`w:5` persist; `replay_entity_field` code-verified in `ledger.js:193`).
- [ ] **Field History Inspector** — NOT FOUND in live UI (TimelineModal exists in src, no visible trigger).

### Directorial mechanics & UI/UX

- [x] **Rolling worker** — PASS-ish (forge marks entities every round; ledger shows small batches).
- [x] **Decoupled Image Cooldowns** — PASS (`director:2` / `dynamics:3`, Priority 1, 1-image ceiling over 18 turns).
- [ ] **Single-Entity Cyan Databox** — UNVERIFIED (`--color-dev-accent` not asserted).
- [ ] **Click-to-Pin Header** — UNVERIFIED (not exercised).
- [x] **Storyboard Resume** — PASS (session intact, 1-click return).
- [x] **Trace Artifact** — DONE (JSON attached).

## Backlog inputs (ordered)

1. Same-axis telemetry merge (dedupe by axis, keep latest — fixes R20 class).
2. Ghost-row cleanup (backfill or delete placeholder after image resolves).
3. Near-dup forge rephrases still append (exact-match guard only, e.g. R3 `;/.)` — consider semantic threshold.
4. Framing lenses (2.4) still unimplemented.
5. R17 AMBER — consider stricter partitioning when visible cues neighbor hidden plans.
6. Genesis-on-import/premade seeding; history-modal triggers; `last_director_ms` live instrumentation.
