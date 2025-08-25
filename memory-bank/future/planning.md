# Future — Ideas & Distant Plans (Backlog, Not Yet Committed)

> Purpose: a *parking lot* for ideas, moonshots, and speculative directions. Nothing here is scheduled. When an item is approved, it moves to **present/** with a delivery target.

---

## How we use this file

* **Status values**: `idea` (default), `researching`, `spiking`, `approved` (then move).
* **Impact/Effort** are rough gut-checks (S/M/L) to aid prioritization.
* **Signals to commit** list concrete evidence we’ll watch for before promoting.

---

## Idea Backlog (RPGlitch & Tooling)

| Idea                                     | Rationale                                                                | Impact | Effort | Dependencies                                  | Status      | Signals to Commit                                                                     |
| ---------------------------------------- | ------------------------------------------------------------------------ | ------ | ------ | --------------------------------------------- | ----------- | ------------------------------------------------------------------------------------- |
| Offline profile/mode                     | Fully inlined app = offline-friendly; offer resilience and speed.        | M      | M      | Core chat loop stable; asset caching strategy | idea        | Consistent user need for offline; repeated network issues; success on small PWA spike |
| Seeded image-gen per message             | Cohesive aesthetic, deterministic re-renders; aligns with hover actions. | M      | M      | Chat FSM, thread/message seeds                | idea        | Users request visual consistency; hover actions stable for ≥2 sprints                 |
| Character Library: tags/search/duplicate | Scale beyond a handful of personas; shareable packs.                     | M      | M      | Dexie schema; import/export                   | idea        | >20 personas in use; repeated search friction                                         |
| Summarizer hook for long threads         | Keep token budget tidy; speed up prompt build.                           | M      | M      | Prompt composer; model access                 | idea        | Frequent trims; latency spikes on long chats                                          |
| Prompt Snippets/Templates                | Reusable system/style macros to accelerate persona creation.             | M      | S      | Prompt composer                               | idea        | Repetition detected in persona fields; user time-on-creation high                     |
| Dev HUD: advanced (diffs, event log)     | Faster debugging; fewer “UI lies” moments.                               | S      | S      | Current Dev HUD                               | idea        | Debug sessions prolonged due to missing visibility                                    |
| Rule System Consolidation                | Reduce cognitive load; unify naming across docs/rules                    | M      | M      | MCP docs consolidation                        | idea        | Confusion in PR reviews about rule source of truth                                    |
| Performance analytics dashboard          | Visibility into latency, token spend, errors                             | M      | M      | Telemetry layer                               | idea        | “Slow”/“expensive” complaints without data                                            |
| Template marketplace (personas/worlds)   | Shareable packs; community growth                                        | L      | L      | Import/export hardening; content review       | idea        | Pilot pack usage; external requests                                                   |
| TTS output for assistant                 | Accessibility + immersion                                                | S      | M      | Audio plugin / browser APIs                   | idea        | Repeated asks for listen-on-the-go                                                    |
| Voice input (ASR)                        | Hands-free; role-play immersion                                          | M      | M      | Browser ASR / plugin                          | idea        | Positive TTS adoption; ASR API reliability                                            |
| Cross-project learning (rules)           | Port patterns/heuristics between apps                                    | M      | L      | Docs consolidation                            | idea        | Evidence of repeated solves across apps                                               |
| Build system: parallel/incremental v2    | Faster local dev cycles                                                  | M      | M      | Current build scripts                         | researching | Profiling shows build hot spots; prototype proves 2× speed                            |
| “Continue automatically” policy          | Reduce manual continue clicks                                            | S      | S      | FSM hook                                      | idea        | >10% of turns are manual continues                                                    |

---

## Moonshots (Speculative)

* **Agentic Scene Director**: model proposes next storyboard beat, drafts prompts, and assembles assets.
* **Co-op Sessions**: two users role-play with synchronized state and per-user UI affordances.
* **Heuristics-augmented Decider**: lightweight rules layer that nudges sampling params based on scene type.

---

## Maybe/Later (cool, but not urgent)

* **Advanced theming editor** (export/import CSS tokens).
* **In-app tutorial mode** (guided tooltips over first-run flow).
* **Screenshot-to-Persona** (parse character card from an image using OCR + heuristics).

---

## Assumptions & Risks (for ideas above)

* Token costs will remain within budget after adding summarization or TTS.
* Browser APIs (ASR/TTS) are sufficiently reliable across Chromium/WebKit.
* Import/export remains the user’s primary sharing mechanism until any marketplace exists.

---

## Not Doing (for now)

* Server-side persistence beyond Dexie (doesn’t fit Perchance single-file constraint).
* Large UI redesigns (functionality first).

---

## Intake Template (copy for new ideas)

```md
### <Idea Title>
**Rationale:** <why>
**Impact:** S/M/L
**Effort:** S/M/L
**Dependencies:** <systems/features>
**Status:** idea
**Signals to commit:** <what evidence unlocks promotion>
```
