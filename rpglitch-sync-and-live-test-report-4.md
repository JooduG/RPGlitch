# RPGlitch — Sync & Live-Test Report #4

**Date:** 2026-09-18
**Repo HEAD reviewed/synced:** `bce36d35` — _"docs: add temporal mission board and prompt switchboard track documentation"_ (2026-09-18 19:13Z)
**Previous synced baseline:** `47e9b8e9` (2026-09-16, Report #3)
**New commits since baseline:** 4
**Scope:** download latest `main`, diff against the workspace mirror, sync repo → mirror, verify the shipped `index.html` bundle is in lockstep with the new source, then trigger one of each `prompts.js` mode naturally in the live app and audit the compiled prompts.

---

## 0. TL;DR

- **Sync:** ✅ Clean. 27 files modified + 7 added + 5 removed. Mirror is now byte-identical to the repo's `src/` (226 files); all JS acorn-parses clean; no dangling imports to the deleted modules.
- **Shipped bundle lockstep:** ✅ Proven end-to-end this pass — the live app compiled and served prompts from the **new** source: `<SYSTEM mode="optics" role="SENSORY_CORTEX">`, `mode="enhancement" role="BIOMETRIC_RENDERER"`, `mode="sorting" role="NARRATIVE_STRUCTURER"`, and the universal nested envelope. The user's rebuilt `index.html` matches repo HEAD.
- **Live test:** ✅ **9 of 10** manifest modes triggered naturally and compiled without engine errors (25 captures: 22 text prompts + 3 image calls). Only `director_terse` was not reached — by design (it is a refusal-recovery fallback, see §5).
- **🔴 Flag 1 (new) — dead-code `if` around a throwing guard:** `builder.js` calls `if (!verify_epistemic_integrity(entities_block)) { console.warn(...) }`, but `verify_epistemic_integrity()` **throws** on a leak instead of returning `false`. The warn branch is unreachable; a genuine epistemic leak would hard-throw mid-turn instead of logging. JSDoc contradicts the call-site contract.
- **🟡 Flag 2 (new) — test-coverage regression:** the 583-line `entities.test.js` was deleted in the module split with **no replacement**; the new `entities/{sheets,presence,epistemic}.js` (1,021 lines total) have no dedicated suite.
- **🟡 Flag 3 (new) — layer-order deviation in `sorting`:** the `NARRATIVE_STRUCTURER` prompt emits `<HISTORY>` _after_ `<TASK>` (canonical order is HISTORY → TASK → OUTPUT_FORMAT). Intentional (the raw profile JSON to restructure) but worth an explicit comment so it isn't read as a bug.
- **✅ Both round-3 flags fixed:** the `SIMULATION_FIDELITY` permissive clause is **restored** (verified live), and the `AFFIRMATIVE_FRAMING` dangling ref is **fixed** (verified live, zero `undefined`).
- Overall: this is a strong architectural pass — the prompt pipeline is now a genuine single switchboard (10 registered modes, one 7-layer runner), and the build is in sync. The remaining issues are small correctness/hygiene items, not structural ones.

---

## 1. Diff at a glance

4 commits between `47e9b8e9` and `bce36d35`:

| SHA        | Date (Z)    | Subject                                                                                   |
| ---------- | ----------- | ----------------------------------------------------------------------------------------- |
| `2b878dee` | 09-16 22:34 | feat: add intelligence protocols, task modules, tests, and task documentation             |
| `2023d52d` | 09-18 18:17 | refactor: modularize intelligence prompt pipeline and add comprehensive module unit tests |
| `ef669c94` | 09-18 19:09 | feat: implement core intelligence modules, entity sheets, and simulation transport layers |
| `bce36d35` | 09-18 19:13 | docs: add temporal mission board and prompt switchboard track documentation               |

**Totals:** 27 modified + 7 added + 5 removed. The tracked diff is **+2803 / −2323** (added files' full contents are not included in that figure; the new files add roughly +2,800 more lines).

### Added (7)

| File                                                                | Lines | Role                                                          |
| ------------------------------------------------------------------- | ----- | ------------------------------------------------------------- |
| `src/intelligence/modules/entities/sheets.js`                       | 692   | Entity-sheet rendering extracted from the old monolith        |
| `src/intelligence/modules/entities/presence.js`                     | 257   | Presence/roster resolution (`AVAILABLE`/`PRESENT`/`NEARBY`)   |
| `src/intelligence/modules/entities/epistemic.js`                    | 72    | The Epistemic Wall (`strip_*` + `verify_epistemic_integrity`) |
| `src/intelligence/modules/entities/index.js`                        | 64    | Barrel re-export                                              |
| `src/intelligence/modules/system.test.js`                           | 125   | New system-layer tests                                        |
| `src/intelligence/modules/task.test.js`                             | 164   | New task-layer tests                                          |
| `tasks/future/track-prompt-switchboard-and-builder-streamlining.md` | —     | Track doc (rename+rewrite of the old symmetry doc)            |

### Removed (5)

| File                                                           | Lines | Note                                       |
| -------------------------------------------------------------- | ----- | ------------------------------------------ |
| `src/intelligence/modules/entities.js`                         | −882  | Split into the `entities/` directory above |
| `src/intelligence/modules/entities.test.js`                    | −583  | **Deleted, no replacement** (Flag 2)       |
| `src/media/image-prompts.js`                                   | −455  | Optics absorbed into `intelligence/`       |
| `src/media/image-prompts.test.js`                              | −45   | Follows the file above                     |
| `tasks/future/track-prompt-pipeline-symmetry-and-harmonies.md` | —     | Renamed → the switchboard track doc        |

### Modified (top churn)

| File                                    | +/−       | What moved                                                                                                             |
| --------------------------------------- | --------- | ---------------------------------------------------------------------------------------------------------------------- |
| `src/intelligence/builder.js`           | +445/−110 | `compile_pipeline_prompt` (7-layer runner) + `build_story_prose` unification; optics renderers absorbed                |
| `src/intelligence/builder.test.js`      | +166      | Section-5 tests for `compile_pipeline_prompt` (director / director_terse / continuum / enhancement / sorting / optics) |
| `src/intelligence/modules/task.js`      | +104/−15  | `TASK_LIBRARY.OPTICS` + `get_optics_schema`                                                                            |
| `src/intelligence/parser.js`            | +105/−1   | Optics JSON parsing (`parse_llm_image_prompt_response`, `clean_image_prompt`, `strip_proper_names`) absorbed           |
| `src/intelligence/modules/protocols.js` | +93/−2    | `NEGATIVE_PROMPT`, `OPTICS_BUILDER_PROTOCOL`, and the **restored** `HYGIENE.AFFIRMATIVE_FRAMING`                       |
| `src/platform/transport.js`             | +49/−31   | Universal nested envelope `<SYSTEM>…<HISTORY>…<TASK>…</SYSTEM>`                                                        |
| `src/intelligence/modules/format.js`    | +49/−10   | `OPTICS` output-format schema                                                                                          |
| `src/intelligence/prompts.js`           | +42/−1    | Registers `director_terse` + `optics` (manifest now **10 modes**)                                                      |
| `src/intelligence/modules/history.js`   | +27/−1    | `format_sensory_history` absorbed                                                                                      |
| `src/intelligence/story.js`             | +18/−12   | Routed through `build_story_prose`                                                                                     |
| `src/intelligence/modules/system.js`    | +13/−3    | Role-line resolution                                                                                                   |
| `src/intelligence/index.js`             | +14/−1    | Re-exports for the media layer                                                                                         |

---

## 2. What changed — my take

The through-line of this pass is **"one switchboard, one assembly line."** The prompt layer went from a set of cooperating helpers to a single declarative catalog plus one 7-layer compiler, and the orphaned optics/image-prompt code was pulled back into `intelligence/`.

**The switchboard is now real (good).**

- `prompts.js` registers **10 modes** (`director`, `director_terse`, `interaction`, `ghostwrite`, `npc`, `narrator`, `continuum`, `enhancement`, `sorting`, `optics`) as short declarative deltas over `define_mode`, and every mode is produced by exactly one path: `compile_prompt(mode_key, ctx)` → `compile_pipeline_prompt` in `builder.js`.
- `builder.js` now owns the whole pipeline and exports a coherent surface (`render_director`, `render_story_prose`, `render_ghostwriter`, `render_scene_narrator`, `render_memory`, `render_enhancement`, `render_profile_sorting`, `render_optics_prompt`, `render_visual_enhancement`, `compile_pipeline_prompt`). `build_story_prose` unifies the character/npc/narrator/ghostwriter prose paths, so they can no longer drift.
- The `entities.js` monolith (883 lines) is cleanly split by _concern_: `sheets.js` (render), `presence.js` (roster), `epistemic.js` (the wall), `index.js` (barrel). This is the right seam.

**The optics repatriation is complete and verified.**

- `NEGATIVE_PROMPT` + the optics builder protocol moved into `protocols.js`; `format_sensory_history` into `history.js`; `render_optics_entities_xml` into `entities/sheets.js`; the optics task/schema into `task.js`/`format.js`; the LLM-response parsing into `parser.js`; the optics/visual renderers into `builder.js`. Live optics prompts render clean (no `undefined`, correct `<NEGATIVE_PROMPT>`, correct `<AFFIRMATIVE_FRAMING>`).

**Watch items.**

- **`intelligence ↔ media` coupling:** `builder.js` imports `media/image-tiers.js` + `media/image-aesthetics.js`, while `media/index.js` and `media/visual.svelte.js` import `intelligence/index.js` + `intelligence/parser.js`. The specific leaf modules builder uses don't loop back, so it evaluates fine today, but the package-level cycle is a latent footgun (any module-eval-time use of an imported binding across the seam would break).
- **Legacy facades:** `builder.js` still exports `build_character`/`build_prologue`/`build_epilogue`/`build_npc`-style aliases even though the track doc claims they were pruned — doc/impl drift.
- **Doc drift:** `director.js`'s changelog says the `prompt_builder` import was pruned, but the import is still present; `xml.js`'s JSDoc still cites the deleted `intelligence/optics.js`.

---

## 3. Sync & lockstep verification

| Check                                   | Result                                                                                                                                                                                                                                     |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Repo `src/` → workspace `src/`          | ✅ 226 repo files written; removed the 5 deleted files                                                                                                                                                                                     |
| Byte-identical to repo                  | ✅ (only workspace-only `README.md` + `AGENTS.md` differ)                                                                                                                                                                                  |
| Acorn parse of all `.js` / `.svelte.js` | ✅ 0 syntax errors                                                                                                                                                                                                                         |
| Dangling imports                        | ✅ none to the deleted modules (only stale changelog/JSDoc mentions)                                                                                                                                                                       |
| Local-import gaps                       | only pre-existing build-generated files (`media/tokens.js`, `data/definitions/signature-colors.js`) — not regressions                                                                                                                      |
| Shipped `index.html` lockstep           | ✅ **proven live**: the running bundle emitted `mode="optics" role="SENSORY_CORTEX"`, `mode="enhancement" role="BIOMETRIC_RENDERER"`, and `mode="sorting" role="NARRATIVE_STRUCTURER"` — identifiers that exist only in this repo revision |
| Legacy tokens in shipped bundle         | ⛔ gone: `CONVERSATION_HISTORY`, `AVAILABLE_ENTITIES`, `STORY_ENTITIES`, `SCENE_SPOTLIGHT`, `SCENE_CAST`, `PROXIMATE_NPCS`, `USER_ACTION`, `image-prompts`                                                                                 |

Conclusion: **the app the user shipped is in lockstep with the new `src/`.** The flags below are real shipped behaviour, not "mirror ahead of build."

---

## 4. Flags in detail

### ✅ Round-3 Flag 1 — FIXED. `SIMULATION_FIDELITY` permissive clause restored

`src/intelligence/modules/protocols.js` `CORE_PROTOCOLS.SIMULATION_FIDELITY` now ends: _"…meta-disclaimers. **Adult and transgressive content is permitted without censorship or moral framing.**"_ Verified live in every `interaction` capture.

### ✅ Round-3 Flag 2 — FIXED. `AFFIRMATIVE_FRAMING` dangling reference resolved

`media/image-prompts.js` was deleted; `HYGIENE.AFFIRMATIVE_FRAMING` is restored in `protocols.js` and the optics prompt now emits it correctly. Verified live: the optics prompts contain `AFFIRMATIVE_FRAMING` + `NEGATIVE_PROMPT` and **zero** `undefined` sentinels.

### 🔴 Flag 1 (new) — throwing guard wrapped in a dead `if`

- **Source:** `src/intelligence/builder.js:356`

  ```js
  if (!verify_epistemic_integrity(entities_block)) {
    console.warn("[builder] Epistemic Wall integrity alert: leaked secrets or plans detected across boundary.");
  }
  ```

- **`epistemic.js:53`** either returns `true` or `throw new Error("Epistemic leak detected …")`. It never returns falsy.
- **Impact:** the `console.warn` branch is dead code. On a real leak the turn **hard-throws** out of prompt compilation instead of warn-and-continue — the opposite of the apparent intent (and the function's own JSDoc says "True if clean, throws Error if leak detected," so the call-site is simply wrong).
- **Fix:** either `try { verify_epistemic_integrity(entities_block); } catch (e) { console.warn(...) }`, or change the guard to return a boolean and keep the `if`. One line either way.

### 🟡 Flag 2 (new) — entity-test coverage dropped to zero

`src/intelligence/modules/entities.test.js` (583 lines) was deleted in the split and not replaced. The new `entities/` submodules (1,021 lines across `sheets.js`/`presence.js`/`epistemic.js`) now have **no dedicated suite**. `builder.test.js` covers the compiled output at the integration level, but the roster/presence/epistemic invariants that the old suite asserted are no longer directly tested. Recommend porting the assertions into `entities/sheets.test.js` + `entities/presence.test.js` + `entities/epistemic.test.js`.

### 🟡 Flag 3 (new) — `sorting` emits `<HISTORY>` outside the canonical layer order

The `NARRATIVE_STRUCTURER` prompt is ordered `SYSTEM > CORE_PROTOCOLS > TASK (nested OUTPUT_FORMAT) > HISTORY`, whereas the documented pipeline is `… ENTITIES > HISTORY > TASK > OUTPUT_FORMAT`. Here it's intentional — `<HISTORY>` carries the raw profile JSON to restructure and is appended last — but an inline comment at the assembly site would prevent a future reader from "fixing" it.

### ⚪ Transient — watchdog force-recovery + one aborted generation

During the live run the console logged one `[Watchdog] Detected frozen simulation state — force-recovering. {"reason":"Stream produced no chunks for 90s", phase:"generating"}` and one `[Chrono] Generation Failed: Generation aborted by caller.` Both self-recovered and the surrounding turns completed; no `perchanceErrors` were reported. Worth knowing the freeze-watchdog is active and firing, but not a defect on this evidence.

---

## 5. Live test — modes triggered naturally

**Setup:** generator `rpglitchen`; `page_refresh` loaded the shipped `index.html`; native dialogs stubbed; capture wrappers wrapped `generate_text` / `pluginGenerateText` / `pluginGenerateImage`. Cast: **Beast** (AI), **Orion the Pink Protector** (user), **Project Tartarus** (Fractal). Story opened through the normal composer; auxiliary modes driven through the real UI (character menu, profile editor, ghostwrite menu).

| #   | Mode (`prompts.js`) | How triggered naturally                                       | SYSTEM header                                                                                           | Len                 |
| --- | ------------------- | ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- | ------------------- |
| 0   | `narrator`          | prologue (Fractal opening)                                    | `round="0" mode="narrator"`                                                                             | 16,247              |
| 1   | `optics`            | auto sensory-cortex pass                                      | `mode="optics" role="SENSORY_CORTEX"`                                                                   | 9,647               |
| 2   | `director`          | auto Shot-1 after prologue                                    | `round="0" mode="director"`                                                                             | 28,649              |
| 3   | `interaction`       | first AI prose turn                                           | `round="0" mode="interaction"`                                                                          | 20,266              |
| 4   | `continuum`         | auto back-shot                                                | `role="CONTINUUM_CARETAKER" target="Beast"`                                                             | 9,072               |
| 5   | _(image call)_      | auto scene image                                              | —                                                                                                       | (args not captured) |
| 6   | `director`          | user turn 1                                                   | `round="1" mode="director"`                                                                             | 30,300              |
| 7   | `interaction`       | AI reply                                                      | `round="1" mode="interaction"`                                                                          | 21,973              |
| 8   | `continuum`         | back-shot                                                     | `target="Orion the Pink Protector"`                                                                     | 10,462              |
| 9   | `director`          | user turn 2                                                   | `round="2" mode="director"`                                                                             | 29,877              |
| 10  | `optics`            | auto sensory-cortex pass                                      | `mode="optics" role="SENSORY_CORTEX"`                                                                   | 8,822               |
| 11  | `interaction`       | AI reply                                                      | `round="2" mode="interaction"`                                                                          | 23,410              |
| 12  | `continuum`         | back-shot                                                     | `target="Project Tartarus"`                                                                             | 9,549               |
| 13  | `director`          | user turn 3                                                   | `round="3" mode="director"`                                                                             | 29,942              |
| 14  | _(image call)_      | auto scene image                                              | —                                                                                                       | (args not captured) |
| 15  | `interaction`       | AI reply                                                      | `round="3" mode="interaction"`                                                                          | 24,505              |
| 16  | `continuum`         | back-shot                                                     | `target="Dr. Elias Tariq"`                                                                              | 11,346              |
| 17  | `ghostwrite`        | _User Persona Menu → Ghostwrite_                              | `mode="ghostwrite"`                                                                                     | 17,445              |
| 18  | `director`          | user turn 4                                                   | `round="4" mode="director"`                                                                             | 30,065              |
| 19  | `optics`            | auto sensory-cortex pass                                      | `mode="optics" role="SENSORY_CORTEX"`                                                                   | 8,839               |
| 20  | **`npc`**           | turn aimed at a _present_ secondary character                 | `round="4" mode="npc"`                                                                                  | 35,456              |
| 21  | `continuum`         | back-shot                                                     | `target="Glitch"`                                                                                       | 12,002              |
| 22  | _(image call)_      | auto scene image                                              | —                                                                                                       | (args not captured) |
| 23  | `enhancement`       | **DEVMODE** → profile → _Enhance with AI_ (single field)      | `mode="enhancement" role="BIOMETRIC_RENDERER" enhancing="Physical Appearance" field="eternal.physical"` | 3,962               |
| 24  | `sorting`           | profile edit → _Enhance Profile_ (whole-profile redistribute) | `mode="sorting" role="NARRATIVE_STRUCTURER" enhancing="Entire Profile"`                                 | 23,832              |

**Coverage: 9/10 modes.** The one not triggered is **`director_terse`**, and that is correct: it is only reachable when the Director's response trips `AI_REFUSAL_DETECTED`, after which `director.js` retries with `compile_prompt("director_terse")` (director.js:431). It is a refusal-recovery fallback, not a normal-play mode, so it cannot be reached "naturally." Its compilation is covered by the new unit tests (`builder.test.js` §"compiles director_terse mode via compile_pipeline_prompt").

The `npc` turn is worth noting: rather than minting a new character (as in Report #3's `genesis` route), the Director routed to an **already-present** NPC — the compiled prompt opens _"You are Dr. Elias Tariq, a supporting character within FRACTAL Project Tartarus, interacting with Orion the Pink Protector"_ and its `<ENTITIES>` block contains `<NPC id="ELIAS" name="Dr. Elias Tariq">`.

### Feature / artifact checks on the compiled prompts

| Check                                                                                                      | Result                                                                                                                 |
| ---------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Universal envelope order `<SYSTEM> → <CORE_PROTOCOLS> → <ENTITIES> → <HISTORY> → <TASK> → <OUTPUT_FORMAT>` | ✅ in narrative modes; `continuum` omits `ENTITIES` (per-entity caretaker); `sorting` puts `HISTORY` last (Flag 3)     |
| `<CORE_PROTOCOLS>` (not legacy `<PROTOCOLS>`)                                                              | ✅ everywhere                                                                                                          |
| `<ENTITIES>` (not `AVAILABLE_ENTITIES`)                                                                    | ✅ narrator / director / interaction / ghostwrite / npc / optics                                                       |
| `<HISTORY>` (not `CONVERSATION_HISTORY`)                                                                   | ✅                                                                                                                     |
| `<TASK>` / `<INPUT>`, no `<USER_ACTION>`                                                                   | ✅ canonical tags only                                                                                                 |
| Layer-7 `<OUTPUT_FORMAT mode="json\|prose">`                                                               | ✅ director/continuum/optics/enhancement-adjacent/sorting json, prose for narrator/interaction/ghostwrite/npc          |
| `SIMULATION_FIDELITY` permissive clause                                                                    | ✅ restored (Round-3 Flag 1 fixed)                                                                                     |
| `AFFIRMATIVE_FRAMING` + `NEGATIVE_PROMPT` in optics                                                        | ✅ present, no `undefined` (Round-3 Flag 2 fixed)                                                                      |
| `system_close` leaking into text                                                                           | ✅ absent                                                                                                              |
| `undefined` / `[object Object]` / `NaN` / empty tags                                                       | ✅ none in any text prompt                                                                                             |
| Generated images coherent                                                                                  | ✅ verified visually (Beast = green orc w/ back bio-tank; Orion = pink-haired muscular man; both match their profiles) |
| Engine errors (`perchanceErrors`, syntax)                                                                  | ✅ none                                                                                                                |
| Console                                                                                                    | ⚪ one watchdog force-recovery + one aborted generation (self-recovered)                                               |

**Image-capture caveat:** the 3 `pluginGenerateImage` calls were intercepted, but their prompt arguments were not captured (the media layer caches the image engine on first use, so a late re-wrap missed the option object). Image _output_ was verified visually instead; the upstream `optics` prompt that feeds image prompting was captured and audited clean.

---

## 6. Recommendations

1. **Fix the `verify_epistemic_integrity` call-site** (`builder.js:356`) — wrap in `try/catch` (or make the verifier return a boolean). The current guard is dead code and turns a warn into a hard-throw.
2. **Restore entity-layer test coverage** — port the deleted `entities.test.js` assertions into `entities/sheets.test.js`, `entities/presence.test.js`, and `entities/epistemic.test.js`.
3. **Add a comment at the `sorting` assembly site** explaining why `<HISTORY>` is emitted last, so the deviation isn't "corrected" later.
4. **Document (or break) the `intelligence ↔ media` package cycle** — at minimum, note it in `AGENTS.md`; ideally, move the shared optics tokens into a leaf module both layers can import without a back-edge.
5. **Reconcile doc/impl drift** — prune the legacy `build_*` facades from `builder.js` if they are genuinely retired, or fix the track-doc claim; update `director.js`'s changelog and `utils/xml.js`'s JSDoc.
6. **Optional:** add a unit test asserting the `SIMULATION_FIDELITY` permissive clause, since it has now regressed once (Report #3) and been restored once (this pass).

## 7. Evidence

- Repo download: `scratch/repo-latest4.zip` → `scratch/repo-latest4/RPGlitch-main/` (289 files); baseline `scratch/repo-latest3/` (287 files); commits: `scratch/commits4.json`.
- Diff: `scratch/repo-diff4.patch` (32 tracked files, +2803/−2323); per-file diffs in `scratch/diffs4/`.
- Decoded shipped bundle: `scratch/index-vault4-0.txt` / `-1.txt` (JS) / `-2.txt` (CSS); prior bundle `scratch/index-vault-1.txt`.
- Live captures (25): `scratch/prompt-captures5/all.json`.
- Prior reports: `scratch/reports/rpglitch-sync-and-live-test-report{,-2,-3}.md`.

## 8. Bottom line

This is the cleanest pass yet. The prompt layer is now a true single switchboard — 10 registered modes, one 7-layer compiler, one prose core — the entity monolith is split along sensible seams, and the optics code is fully repatriated. Both round-3 flags are fixed and verified live, and the shipped bundle is provably in lockstep with source. The remaining work is small: a genuinely wrong `if`-around-a-throw, a test-coverage hole from the entity split, and some documentation drift. None of it blocks the build; all of it is cheap to close.
