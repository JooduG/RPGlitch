# RPGlitch — Consolidated Mega Report & Unified Plan

**Merges:** Report #5 (_Sync & Live-Test Report_), Report #6 (_Image-Generation Pipeline Test Report_), Report #7 (_Prompt-Pipeline Unification Analysis_)
**Date of merge:** 2026-09-19
**Repo HEAD analysed:** `ec2bdf19` — _"feat: add visual rendering engine, narrative styles, and intelligence modules"_ (2026-09-18 23:02Z)
**Repo:** `JooduG/RPGlitch` · **Generator:** `rpglitchen` · workspace `src/` byte-identical mirror (227/227 files)
**Prior baseline:** `bce36d35` (Report #4) · **Shipped bundle:** verified in lockstep with `ec2bdf19`

> This document supersedes the three source reports for planning purposes. Every finding carries a stable consolidated ID and a traceability row to its source report in §7. Where the three reports overlap or interact, §3 makes the connection explicit — that synthesis is the main value of the merge.

---

## 0. Executive Summary

Across the three passes the picture is consistent and encouraging: the project has **built all the parts of a unified 7-layer prompt pipeline** and, as of round 5, **genuinely collapsed Layer 3 to a single compiler** and made the style system symmetric and structured. The shipped app is provably in lockstep with source. The remaining work is **not** about building the pipeline — it is about (a) fixing a handful of real behavioral/prompt bugs, (b) closing **three parallel front doors** into **one**, (c) deleting the duplicate/dead paths that still make the pipeline "nominal" rather than "literal", and (d) repairing the **test blind spots that let all of the above pass CI**.

**The three headline problems:**

| #      | Headline                                                                                                                                                                                                                                                                                                                                                    | Severity       | Source    |
| ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------- | --------- |
| **R1** | **The Director (Shot 1) lost its alternation directive** — `render_director` never passes `has_alternation`, so its only protocol resolves to nothing and it emits an empty `<CORE_PROTOCOLS></CORE_PROTOCOLS>`. Round-4 emitted the directive; round 5 regressed it. One-line fix.                                                                         | 🔴 High        | #5 Flag 1 |
| **R2** | **Every story-scene image is sent character-only negative tokens** (`empty background, landscape without characters, scenery only, no humans, empty environment`) because `visual.svelte.js`'s tier map only recognises character tiers and lets `story_scene` fall through to `story_character`. Silent, seed-dependent corruption of environmental shots. | 🔴 High        | #6 Bug 1  |
| **R3** | **The engine's resolved negative tokens never reach the optics schema.** `get_output_format`'s negative-prompt injection is a textual no-op (it replaces a placeholder string that exists nowhere). Both optics compilers pass negatives in and silently discard them.                                                                                      | 🟠 High/Medium | #7 E1     |

**One further structural headline (not a bug):** `compile_prompt()` is documented as _the_ single pipeline entry, yet **8 of the 10 manifest modes bypass it entirely in production** — reached instead through the `prompt_builder` facade or the `prompt_templates` facade. The switchboard's `optics` branch is a **duplicated, already-divergent** copy of the live `render_optics_prompt`, and the test suite exercises the _dead_ copy — false confidence. This is the heart of the "close in on one unified pipeline" objective (**S1/S2/R4**).

**Fixed since baseline (verified):** Round-4 Flag 1 (epistemic dead-`if`) and Round-4 Flag 3 (sorting layer-order ambiguity), plus `xml.js`/`director.js` doc drift. **Still open:** Round-4 Flag 2 (no entity-layer tests).

---

## 1. What the three source reports did

| Report                                        | Type                  | Scope                                                                                                                                  | Method                                                                                         | Headline                                                                                                       |
| --------------------------------------------- | --------------------- | -------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| **#5 — Sync & Live-Test**                     | Dynamic / integration | Sync repo→mirror, prove shipped-bundle lockstep, trigger **9/10 modes** naturally, audit compiled prompts                              | Live page instrumented; 17 captures (`scratch/prompt-captures6/`)                              | Director regression (**R1**) + empty-wrapper (**R5**) + test gap (**T1**)                                      |
| **#6 — Image-Generation Pipeline Test**       | Dynamic / integration | End-to-end image pipeline in **story + profile** contexts; capture optics prompt + exact `generate_image` args per path; visual review | Live page wrappers; **11 image / 11 optics-LLM** calls (`scratch/captures7/`); `vision` review | story-scene negatives (**R2**), `none`-floor not applied (**F2**), identity-token loss (**F1**)                |
| **#7 — Prompt-Pipeline Unification Analysis** | Static / call-graph   | Every prompt symbol in `src/**`; dead-symbol analysis; front-door reach                                                                | Static scan + dead-export cross-reference; **no code changes**                                 | 3 front doors (**S1/S2**), divergent optics duplicate (**R4**), negative no-op (**R3**), dead exports (**D1**) |

Together they cover the **dynamic** surface (what the app actually sends at runtime) and the **static** surface (what the code claims to do) — which is why merging them exposes the cross-cutting themes in §3.

---

## 2. Consolidated Findings

**Severity legend:** 🔴 High (user-visible/behavioral, silent) · 🟠 Medium-High · 🟡 Medium/Low · ⚪ Informational
**Effort key:** **XS** ≤ one line · **S** a few lines + test · **M** multi-site change · **L** structural refactor

### 2.1 Correctness & behavioral regressions (R)

| ID     | Sev | Finding                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | Evidence (`file:line`)                                                                         | Source    |
| ------ | --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- | --------- |
| **R1** | 🔴  | **Director lost its alternation-resolution directive; `<CORE_PROTOCOLS>` is empty.** `render_director` calls `render_core_protocols({ protocols })` without `has_alternation`; the flag defaults to `false`; the Director's _only_ declared protocol is `CORE_PROTOCOLS.ALTERNATION_OPTIONS`, and `static_rules` excludes every `CORE_PROTOCOLS.*` key → empty block, no `<ALTERNATION_OPTIONS>`, even when the entity sheet carries `{A\|B}`. Prose modes are unaffected (they pass the flag). Live story text leaked two literal `{hushed\|voyeuristic}` alternations.                          | `builder.js:210`; `protocols.js:229`; `prompts.js:95`; contrast `builder.js:355`               | #5 Flag 1 |
| **R2** | 🔴  | **story-scene shots receive character-only negative tokens.** The tier is pre-selected by a hardcoded ternary recognising only `solo_entity\|story_character\|story_entities` (+`fractal`); `story_scene` falls through to `"story_character"`, so `is_character_shot` is `true` and scenes get `empty background, landscape without characters, scenery only, no humans, empty environment`. `normalize_image_tier("story_scene")` itself is correct — the ternary never lets it through. Secondary: `tier_guidance_baseline` uses the wrong tier (9 vs 7), currently masked by the style clamp. | `media/visual.svelte.js:227-238`, `:253`; captures `img_04`, `img_10`                          | #6 Bug 1  |
| **R3** | 🟠  | **Negative-prompt injection into the optics schema is a no-op (real latent bug).** `get_output_format` replaces `'"<negative prompt tokens>"'`, a string that appears nowhere in the codebase. The real atom is `<Negative tokens avoiding quality buzzwords; ground using physical artifacts and flaws.>`. Both optics compilers pass `resolved_negative_prompt` in and silently do nothing → **engine negatives never reach the optics JSON schema**.                                                                                                                                           | `modules/format.js:165` (bad placeholder), `:56` (real atom), `:788` (caller)                  | #7 E1     |
| **R4** | 🟠  | **The optics compiler is duplicated (~90 lines) and already divergent.** `render_optics_prompt` (live) vs `case "optics"` in `compile_pipeline_prompt` (dead). Divergences: dead copy omits dice `roll`/`onAlternationPick`; uses `has_alternations(rolled_intent)` vs live `has_alternations(combined_input_text)`; style_key `tier==="solo_entity"` vs live `tier==="solo_entity"\|\|mode==="enhance"`; forwards `context.directives` (live doesn't); `closed:false`+`pack_prompt` vs live `closed:true`. Tests only exercise the dead copy (**T4**).                                           | `builder.js:697-819` (live) vs `:905-980` (dead); `builder.test.js:366`, `prompts.test.js:169` | #7 B      |
| **R5** | 🟡  | **Empty `<CORE_PROTOCOLS></CORE_PROTOCOLS>` wrapper emitted instead of omitted** when a mode's protocol list resolves empty. Token noise + a false "protocols present" signal — and the reason **R1** slipped CI (**T1**).                                                                                                                                                                                                                                                                                                                                                                        | `modules/protocols.js` (`render_core_protocols`)                                               | #5 Flag 2 |

### 2.2 Prompt fidelity & content quality (F)

| ID     | Sev | Finding                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | Evidence (`file:line`)                                                                        | Source   |
| ------ | --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- | -------- |
| **F1** | 🟠  | **The optics LLM systematically drops distinctive colour/identity tokens.** Orion the Pink Protector's `pink moustache / pastel pink irises / glowing pink tattoo accents / short pink wavy hair` are in the _input_ entity sheet but absent from the _output_ prompt for both the solo persona and the group shot. Character becomes visually unrecognisable; reproducible across two independent calls.                                                                                                                                                                                                                                                         | input `llm_02` L29-32 / `llm_04` L51-54; output `img_03`, `img_05` (§5.1)                     | #6 5.1   |
| **F2** | 🟠  | **The advertised `VISUAL_STYLES.none` "baseline quality floor" is never applied on the real path.** Only `_mock_generate` references it; real `generate()` uses the active style's own negatives only, so non-`none` styles lose the baseline guards (`blurry, low resolution, bad anatomy, distorted features…`). Doc/behaviour mismatch vs. the style description and the `visual.svelte.js` changelog. **Cross-report note:** Report #5 records that the `NEGATIVE_PROMPT` protocol constant was _purged_ in favour of `VISUAL_STYLES.none` as "the floor" — so the floor is doubly broken: removed from protocols _and_ never applied in the engine (see §3). | `media/visual.svelte.js:239`, `:649`; `visual-styles.js:98`; changelog `visual.svelte.js:721` | #6 Bug 2 |
| **F3** | 🟡  | **Scene prompts lead with characters, not environment.** Both `story_scene` outputs open on human/orc subjects before any environment clause, despite `<TARGET>story_scene</TARGET>` + an "expansive landscape" MANDATE. The tier mandate is advisory only.                                                                                                                                                                                                                                                                                                                                                                                                       | captures `img_04`, `img_10` (§5.2)                                                            | #6 5.2   |
| **F4** | 🟡  | **Group shot under-represents the user persona** — described Beast fully but reduced Orion to a generic muscular man (subset/consequence of **F1**).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | capture `img_05` (§5.3)                                                                       | #6 5.3   |
| **F5** | 🟡  | **Negative-token dedup is case/format-sensitive.** `new Set(tokens.map(t=>t.trim()))` — no case-fold, no punctuation strip. `3D render` and `3d render` both survive; `missing scanlines.` coexists with the `scanlines` family; near-duplicate `anime style`/`anime`. Cosmetic bloat, occasionally contradictory.                                                                                                                                                                                                                                                                                                                                                | `media/visual.svelte.js:241-249`; capture `img_02`                                            | #6 Bug 3 |
| **F6** | 🟡  | **Regenerate pass 1 reuses a possibly-generic stored prompt.** Pass 1 (`regenerate_count=0`) replays the stored prompt across 3 seeds; if a story image was stored before its refined prompt landed, regeneration inherits the weak generic seed. By design, but worth a guard.                                                                                                                                                                                                                                                                                                                                                                                   | `App.svelte:184-258`; captures `img_07/08/09` (§5.4)                                          | #6 5.4   |

### 2.3 Pipeline structure & unification gaps (S)

| ID     | Sev | Finding                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | Evidence                                                               | Source             |
| ------ | --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------- | ------------------ |
| **S1** | 🟠  | **Three parallel front doors; 8/10 modes bypass `compile_prompt()` in production.** Door 1 = `compile_prompt`→`compile_pipeline_prompt` (**2** production sites: `director_terse`, `continuum`). Door 2 = `prompt_builder.*` (**4**: director/story/profile). Door 3 = `prompt_templates.*` (**2**: media optics). All 10 modes are implemented but only 2 enter via the documented pipeline.                                                                                                    | `prompts.js:298`→`builder.js:848`; `builder.js:1002`; `builder.js:830` | #7 A, C, App. B    |
| **S2** | 🟠  | **`compile_pipeline_prompt` ↔ `prompt_builder` recursion trap.** `case "director"` calls `prompt_builder.build_director`, which lives in the same module — naïvely pointing `build_director` at `compile_prompt("director")` is infinite recursion. This is _why_ the surfaces were never merged. Merging requires **inverting** the dependency: runner calls the core `render_*`; facades call the runner.                                                                                      | `builder.js:853`, `:1002`                                              | #7 A               |
| **S3** | 🟡  | **Envelope & role convention drift.** Two role conventions: (a) role-as-sentence via `resolve_system_role_line` (`render_director:227`, `render_prose_turn_core:358`); (b) role-as-`role=`-attribute (`render_memory:578`, `render_enhancement:620`, `render_profile_sorting:670`, `render_optics_prompt:807`). And `mode=` is on every compiler **except** `render_memory`. Consequence: four `SYSTEM_ROLES` factories are dead (**D5**).                                                       | `builder.js` sites above                                               | #7 F               |
| **S4** | 🟡  | **Manifest fields are only partially load-bearing.** `constitution` honored only by `render_prose_turn_core`; `history` truly consumed only by `render_memory` via `resolve_history`; `entities.chapter_history` only by `render_memory`; `field_context` only by enhancement; `present_entities` only by director. `task.input_tag` is inert (**S7**). The manifest is a _partial_ contract — any declarative runner (**Phase 4**) must first decide which layers are truly universal.          | `builder.js:332`, `:555`; `prompts.js`                                 | #7 G               |
| **S5** | 🟡  | **Import cycles.** (1) `prompts.js` ↔ `builder.js` (builder imports `get_prompt`; prompts imports `compile_pipeline_prompt` at `prompts.js:272`) — ESM-hoisting hides it, but it is the root reason `compile_prompt` lives in the manifest file. (2) `intelligence` ↔ `media` (`builder.js:63` imports `normalize_image_tier, resolve_visual_engine_tokens` from `@media`; `media/index.js:58` re-exports `prompt_templates` from `../intelligence/index.js`). Flagged in Report #4, still open. | `prompts.js:272`; `builder.js:63`; `media/index.js:58`                 | #7 H, #5 §2        |
| **S6** | 🟡  | **Parameter/naming drift.** `get_output_format(spec, options)` is called with `{target_type}` (`builder.js:567`), `{resolved_type}` (`:658`), `{}` (`:609`), `{variant, negative_prompt}` (`:788`); the resolver accepts `entity_type \|\| target_type \|\| resolved_type`. Three names for one concept.                                                                                                                                                                                         | `builder.js` sites                                                     | #7 I               |
| **S7** | ⚪  | **Inert manifest fields.** (a) `config.task.input_tag` is defaulted by `define_mode` and documented by `history.js`, and `render_input_history_xml` reads `options.tag \|\| options.input_tag`, but nothing ever forwards the manifest value → dead. (b) `prompts.js` `enhancement.system = "ENHANCER"` is inert — `render_enhancement` derives the role from the field catalog's `enhancer` key (`BIOMETRIC_RENDERER`, …).                                                                      | `prompts.js:79`; `history.js:18`,`:177`; `render_enhancement`          | #7 E4/F, #5 Flag 4 |

### 2.4 Dead code, duplication & hygiene (D)

| ID     | Sev | Finding                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | Source    |
| ------ | --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| **D1** | 🟠  | **Dead exports** (referenced only by own definition / barrel / tests): `resolve_prompt_mode` (`prompts.js:287`), `render_output_format_xml` (`format.js:187`), `build_ghostwriter` (`builder.js:1316`), `build_terse_director_task` (`:1324`), `build_character` (`:1178`), `build_scene_narrator` (`:1182`), `build_npc` (`:1186`), `build_prologue` (`:1190`), `build_epilogue` (`:1194`), `build_memory` (`:1214`), `build_continuum` (`:1242`), `build_sorting` (`:1307`), `render_ghostwriter` (`:485`). The five `build_character…build_epilogue` aliases are pure pass-throughs (their target `build_story_prose` is live) — deleting them removes an entire redundant naming layer. | #7 D      |
| **D2** | 🟡  | **`AFFIRMATIVE_FRAMING` duplicated** verbatim across `PROTOCOL_LIBRARY.HYGIENE` (`protocols.js:30/31`) and `PROTOCOL_LIBRARY.OPTICS` (`:62`); only the `OPTICS.*` key is referenced by a manifest.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | #7 E3     |
| **D3** | 🟡  | **Prose output-format string duplicated.** `task.js:593` hardcodes `"Emit strictly plain prose. No preamble, commentary, markdown, or structural tags."` — a verbatim duplicate of `PROSE_FORMAT` (`format.js:120`); `task.js` never imports `PROSE_FORMAT`.                                                                                                                                                                                                                                                                                                                                                                                                                                | #7 E2     |
| **D4** | 🟡  | **Dead `compile_prompt` branches** never firing in production: `director` (`:852`), `enhancement` (`:877`), `sorting` (`:886`), default prose (`:981`); the `optics` branch (`:905`) is not just dead but divergent (**R4**). Only `director_terse` (`:856`) and `continuum` (`:868`) are live.                                                                                                                                                                                                                                                                                                                                                                                             | #7 C      |
| **D5** | 🟡  | **Dead `SYSTEM_ROLES` factories:** `CONTINUUM_CARETAKER`, `NARRATIVE_STRUCTURER`, `ENHANCER`, `SENSORY_CORTEX` (`system.js:25-30`) are never invoked on their paths (those compilers use `role=` attributes — see **S3**).                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | #7 D/F    |
| **D6** | ⚪  | **Doc drift.** `protocols.test.js`'s header still advertises the pruned `render_optics_protocols`; changelog claims for the `none` floor (**F2**) don't match behaviour.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | #5 Flag 4 |

### 2.5 Test coverage gaps (T)

| ID     | Sev | Finding                                                                                                                                                                                                                         | Evidence                                     | Source            |
| ------ | --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------- | ----------------- |
| **T1** | 🟠  | **Director alternation blind spot.** `builder.test.js:313` only asserts `<CORE_PROTOCOLS>` _exists_, so an empty block passes CI and let **R1** through. The prose path is covered (`story.test.js:2044`); the Director is not. | `builder.test.js:313`                        | #5 Flag 3         |
| **T2** | 🟠  | **No entity-layer tests.** No `entities/*.test.js` exists; the ~1,000-line `entities/{sheets,presence,epistemic}.js` split has no dedicated suite. (Round-4 Flag 2 — still open.)                                               | —                                            | #5 Round-4 Flag 2 |
| **T3** | 🟠  | **Image-path tests never inspect negatives or tier-derived guidance.** `visual.svelte.test.js:80-115` asserts only `generate_options.mode === "story_scene"`, so **R2** passes CI.                                              | `visual.svelte.test.js:80-115`               | #6 Bug 1 gap      |
| **T4** | 🟠  | **Optics tests exercise the dead branch**, asserting behavior production never exhibits — false confidence in **R4**.                                                                                                           | `builder.test.js:366`, `prompts.test.js:169` | #7 B              |
| **T5** | 🟡  | No regression coverage for the `none` floor (**F2**), negative dedup (**F5**), or the envelope/`mode=` shape (**S3**).                                                                                                          | —                                            | inferred          |

### 2.6 Fixed / verified since the prior baseline (X) — for reference

| ID  | Item                                                                                                                                            | Status      | Source       |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ----------- | ------------ |
| X1  | Round-4 Flag 1 — `verify_epistemic_integrity` contract aligned (returns `false`, never throws)                                                  | ✅ Fixed    | #5           |
| X2  | Round-4 Flag 3 — `sorting` `<TASK>`-before-`<HISTORY>` order documented in-code                                                                 | ✅ Fixed    | #5           |
| X3  | `utils/xml.js` / `director.js` doc drift cleaned (dead `parse_visual_engine` removed)                                                           | ✅ Fixed    | #5           |
| X4  | Sync integrity — 227/227 byte-identical; 164 JS files acorn-parse clean; shipped bundle lockstep (repo-5 tokens present, round-4 tokens gone)   | ✅ Verified | #5 §3        |
| X5  | Live mode coverage — 9/10 modes triggered naturally, compiled clean (no `undefined`/`[object Object]`/`NaN`); 11/11 image+optics paths captured | ✅ Verified | #5 §5, #6 §0 |

---

## 3. Cross-Report Synthesis (what merging reveals)

The value of the merge is in the intersections — issues that look minor in one report but compound when read together:

1. **The "one baseline floor" is doubly broken.** Report #5 describes the round-5 pass purging the `NEGATIVE_PROMPT` protocol constant and declaring `VISUAL_STYLES.none.negative_prompt` _the_ baseline floor. Report #6 then proves that floor is **never applied on the real `generate()` path** (only in `_mock_generate`). Combined: the baseline quality guards were **removed from the protocol layer and never wired into the engine layer** — so styled generations have _no_ universal floor at all. This is a single, higher-severity story than either report tells alone (**F2** + **R3**).
2. **Negative handling is broken end-to-end.** Report #7 shows engine negatives never reach the optics schema (**R3**); Report #6 shows the tier→negatives mapping actively injects _wrong_ negatives for scenes (**R2**) and dedup is fuzzy (**F5**). The optics _prompt_ audits clean (Report #5/#6), but the **engine argument assembly** is where negatives fail. Fixing only one layer leaves the pipeline inconsistent.
3. **Tests validate dead or weak paths, masking real regressions.** Report #7 (offline tests hit the dead optics duplicate — **T4**), Report #5 (Director test asserts existence only — **T1**), Report #6 (image test ignores negatives — **T3**). The same meta-pattern caused **R1**, **R2**, and **R4** to ship. Test repair is not polish — it is a prerequisite for the refactor.
4. **The unification reports and the live reports converge on one front door.** Report #7's **S1/S2** says 8/10 modes bypass `compile_prompt`. Report #6's image path enters through `prompt_templates` (door 3) and Report #5's director/prose/profile through `prompt_builder` (door 2). Routing everything through `compile_prompt` is therefore not just tidiness — it is what makes negative/schema fixes (**R3**) and layer fixes (**R1**) apply _uniformly_ across all modes.
5. **A P2 declarative runner fixes R1 and R5 as a side effect.** Report #7 notes that a runner passing entity text to `render_core_protocols` uniformly would restore the Director's directive. So **R1/R5** can be fixed now (one line, low risk) _and_ become structurally impossible later.

**Unified narrative in one sentence:** the pipeline's _architecture_ is largely right and its _prompt text_ audits clean, but the **negatives path, the tier→engine mapping, the third front door, and the tests** are the four places where "unified" is still nominal — and those four places are exactly where all three reports' bugs live.

---

## 4. Unified Prioritized Plan

The three source plans are merged here into one sequence. Ordering is by **(severity × risk-reduction) / effort**, with hard dependencies respected. Phases 0–1 are behavior/quality; Phases 2–5 are the unification objective; Phase 6 is the safety net that should be started in parallel.

### Phase 0 — Restore correctness (quick wins; low risk; do first)

| Item   | Action                                                                                                                                                                                                                                                         | File                                 | Effort | Verify                                                                         |
| ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------ | ------ | ------------------------------------------------------------------------------ |
| **R1** | Pass `has_alternation: has_alternations(entity_sheets)` in `render_director` (or emit `CORE_PROTOCOLS.ALTERNATION_OPTIONS` unconditionally if that's the intent). Restores round-4 behaviour.                                                                  | `builder.js:210`                     | **XS** | Director prompt contains `<ALTERNATION_OPTIONS>` when a sheet carries `{A\|B}` |
| **R5** | Make `render_core_protocols` return `""` when `blocks` is empty (no empty wrapper).                                                                                                                                                                            | `modules/protocols.js`               | **XS** | No empty `<CORE_PROTOCOLS>` in any compiled mode                               |
| **R2** | Fix the tier map — `normalize_image_tier(entity_type === "fractal" ? "story_scene" : entity_type)` so `story_scene` passes through.                                                                                                                            | `media/visual.svelte.js:227`         | **XS** | Scene negatives exclude `empty background, landscape without characters, …`    |
| **R3** | Fix `get_output_format` negative injection — match the real `SCHEMA_ATOMS.negative_prompt` placeholder and decide the intended semantics (optics _should_ receive engine negatives; Report #6 flags negative weaknesses). Delete the no-op branch if obsolete. | `modules/format.js:165`              | **S**  | Optics JSON schema carries the resolved negative tokens                        |
| **T1** | Add a Director alternation assertion mirroring `story.test.js:2044`.                                                                                                                                                                                           | `builder.test.js:313`                | **S**  | Test fails if R1 regresses                                                     |
| **T3** | Add a scene-tier negative-prompt assertion (scene negatives must **exclude** character tokens; tier guidance uses the scene baseline).                                                                                                                         | `media/visual.svelte.test.js:80-115` | **S**  | Test fails if R2 regresses                                                     |

**Gate:** after Phase 0, run a fresh live pass (Report #5/#6 method) and confirm the Director emits `<ALTERNATION_OPTIONS>` and scene images carry scene negatives.

### Phase 1 — Prompt & image fidelity

| Item   | Action                                                                                                                                                                                                                              | File                                                               | Effort | Verify                                                      |
| ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ | ------ | ----------------------------------------------------------- |
| **F1** | Instruct the optics LLM to preserve all `<HAIR>`/`<EYES>` colour/identity tokens verbatim, **or** deterministically merge the entity's hard colour tokens into the final positive prompt (as already done for visual-style tokens). | optics template (`builder.js` optics path) + entity-token plumbing | **M**  | Orion's pink descriptors survive solo + group optics output |
| **F2** | Apply the `VISUAL_STYLES.none` baseline floor in `generate()` (union with style negatives) — **or** correct the changelog/style description if `none`-only was intended. Prefer applying it, given F2+R3.                           | `media/visual.svelte.js:239`                                       | **S**  | Styled generation includes baseline guards                  |
| **F3** | Strengthen `story_scene` steering — move environment clauses ahead of subjects for scene tiers; make the MANDATE enforce ordering, not just advise.                                                                                 | optics task/tier template                                          | **M**  | Scene prompts lead with environment                         |
| **F5** | Normalise case + strip trailing punctuation before negative dedup (fold `3D render`/`3d render`, `scanlines.`/`scanlines`).                                                                                                         | `media/visual.svelte.js:241-249`                                   | **S**  | No duplicate/contradictory tokens in captured args          |
| **F6** | Guard regenerate pass 1 against a stale/generic stored prompt (re-refine when the stored prompt predates a refined one).                                                                                                            | `App.svelte:184-258`                                               | **S**  | Pass-1 candidates use the refined prompt                    |
| **T5** | Add regression tests for F2/F5 (and the S3 envelope shape during Phase 4).                                                                                                                                                          | tests                                                              | **S**  | —                                                           |

### Phase 2 — De-duplicate & delete dead code (Report #7 P0; zero behavior change)

| Item   | Action                                                                                                                                                                                                         | File                                                | Effort | Verify                                                             |
| ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------- | ------ | ------------------------------------------------------------------ |
| **R4** | Delete the dead optics branch (`:905-980`); retarget tests to `compile_prompt("optics")` → live `render_optics_prompt`. Removes the only true logic duplication.                                               | `builder.js`; **T4** tests                          | **M**  | Optics output byte-identical to live path; dice callback preserved |
| **D3** | Import `PROSE_FORMAT` in `task.js:593` instead of the literal.                                                                                                                                                 | `modules/task.js`                                   | **XS** | Identical string, single source                                    |
| **D2** | Delete `HYGIENE.AFFIRMATIVE_FRAMING` (or alias `OPTICS.*` to it).                                                                                                                                              | `modules/protocols.js:30/31`                        | **XS** | No duplicate constant                                              |
| **D1** | Delete the dead exports + the five `build_character…build_epilogue` aliases + `render_ghostwriter`; update `story.test.js`/`temporal.test.js`/`builder.test.js` mocks.                                         | `builder.js`, `prompts.js`, `format.js`, tests      | **M**  | Suite green; barrel exports pruned                                 |
| **D4** | Remove the now-unreachable `compile_prompt` branches (`director`/`enhancement`/`sorting`/prose) once Phase 3 routes production through the runner.                                                             | `builder.js:852-981`                                | **M**  | No dead switch arms                                                |
| **S7** | Either forward `config.task.input_tag` (`render_memory`→`render_input_history_xml`) or remove it from `define_mode` + `history.js` docs. Decide for `enhancement.system="ENHANCER"` likewise (wire or remove). | `prompts.js:79`, `history.js`, `render_enhancement` | **S**  | No inert manifest field                                            |
| **S6** | Standardise `get_output_format`'s option name to `entity_type` at all four call sites.                                                                                                                         | `builder.js`                                        | **S**  | Single option name                                                 |
| **D6** | Prune the `render_optics_protocols` mention from `protocols.test.js`'s header; align changelog claims with F2 behaviour.                                                                                       | tests/docs                                          | **XS** | No stale references                                                |

### Phase 3 — One door (Report #7 P1; the substantive unification)

| Item   | Action                                                                                                                                                                                                                             | Effort | Verify                                                             |
| ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ | ------------------------------------------------------------------ |
| **S2** | Invert the recursion: `compile_pipeline_prompt` calls the core `render_*` directly; `prompt_builder.*` becomes thin adapters forwarding to `compile_prompt`.                                                                       | **L**  | `compile_prompt(mode, ctx)` byte-identical to the former live path |
| **S1** | Route `prompt_templates.build_prompt`/`enhance_prompt` (`media/visual.svelte.js:358`,`:451`) through `compile_prompt("optics", …)`, threading `onAlternationPick`/`roll` so dice-picking survives. Then retire `prompt_templates`. | **M**  | Optics dice-pick preserved; single optics entry                    |
| —      | Add `compile_prompt` coverage for optics/enhancement/sorting/director; delete the redundant dead-entry tests (**T4**).                                                                                                             | **M**  | Door reach = 100% of modes                                         |

**Behavioral assertion (gate):** `compile_prompt("director"|"interaction"|"enhancement"|"sorting"|"optics", ctx)` must produce byte-identical output to the pre-refactor live path for the same inputs (except where Phase 0 intentionally changes it).

### Phase 4 — Declarative runner (Report #7 P2)

| Item   | Action                                                                                                                                                                                                                                                                                                    | Effort |
| ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| **S4** | Add a `layers` block to every `define_mode` record (declare which of the 7 layers each mode uses) and rewrite `compile_pipeline_prompt` as a plan-executor + a small `MODE_LAYER_ADAPTERS` dispatch table — **no monolithic switch**. Prerequisite: decide which layers are truly universal (S4 finding). | **L**  |
| **S3** | Unify the `<SYSTEM>` envelope: every mode emits `mode=`; every role is the first child line from `resolve_system_role_line` (re-activating the dead `SYSTEM_ROLES` factories, or deleting them if role-lines are abandoned).                                                                              | **M**  |

_Side effect:_ a runner that passes entity text to `render_core_protocols` uniformly makes **R1/R5** structurally impossible.

### Phase 5 — Architecture polish (Report #7 P3)

| Item    | Action                                                                                                                                                                                                                | Effort |
| ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| **S5a** | Move `compile_prompt` + runner into a new `src/intelligence/pipeline.js`; make `prompts.js` a pure manifest (kills the `prompts↔builder` cycle).                                                                      | **M**  |
| **S5b** | Resolve `intelligence↔media`: media computes `engine_tokens` and passes them into `compile_prompt("optics")`, so `builder.js` no longer imports from `@media`. Document the constraint in `AGENTS.md` in the interim. | **M**  |

### Phase 6 — Test infrastructure (start in parallel; Report #5 Round-4 Flag 2)

| Item            | Action                                                                                                                                                            | Effort  |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- |
| **T2**          | Restore entity-layer coverage: `entities/sheets.test.js`, `entities/presence.test.js`, `entities/epistemic.test.js` (port the old `entities.test.js` assertions). | **M**   |
| **T1/T3/T4/T5** | Fold the Phase 0/1/2 regression tests into CI so each fixed bug has a keeper.                                                                                     | **S–M** |

### Dependency & sequencing notes

- **Phase 0 unblocks verification of everything else** — fix the two one-liners + tests before any refactor so the gates are meaningful.
- **R4/T4 precede or accompany Phase 3** — deleting the dead optics branch first shrinks the merge surface.
- **S4 is a prerequisite for clean D4/S3** — don't delete switch branches until the runner replaces them.
- **T2 is independent** and should progress alongside Phases 1–3.
- **Keep the two "don't touch" invariants throughout:** the shipped `index.html` is rebuilt by the user (`npm run deploy:prepare`) — never edit it; no push tool exists — sync ships as an **incremental** archive of changed `src/` files preserving paths.

---

## 5. Consolidated Verification Strategy

**Agent-side (no Node/vitest available):**

- Acorn-parse every edited `.js` file (`await import('https://esm.sh/acorn')`).
- Pure-logic `execute_js` harness asserting `compile_prompt` output equality before/after the Phase 3 inversion.
- `page_refresh` + `perchanceErrors` for live checks; force a director / optics / continuum / image turn and diff the captured `<SYSTEM>` envelopes and `generate_image` args.

**User-side (authoritative):** `npm run verify` (acorn parse + full vitest suite), then `npm run deploy:prepare` to rebuild the shipped bundle.

**Live integration gate (Reports #5/#6 method):** instrument `pluginGenerateText`/`pluginGenerateImage`; trigger each path natively; dump captures; assert: Director emits `<ALTERNATION_OPTIONS>` when a sheet has `{A|B}`; scene images carry scene negatives; optics output preserves colour tokens; no empty tags / `undefined` / `NaN`.

**Visual gate (Report #6 method):** `vision` review of the rendered scene/profile images against intended style + identity (don't trust an error-free console for visual changes).

---

## 6. Don't-Regress Checklist (consolidated)

- `render_core_protocols` remains the **sole** Layer-3 compiler (round-5 invariant).
- `render_prose_turn_core` remains the sole prose core; `render_task` the sole Layer-6 dispatcher.
- Director's `<SYSTEM round mode>` + present-entities extras survive.
- The **live** optics dice-pick callback (`onAlternationPick`) must survive the front-door merge.
- `sorting`'s intentional `<TASK>`-before-`<HISTORY>` ordering survives.
- `compile_prompt(mode, ctx)` byte-identical to the former live path for every mode (post-Phase 3).
- No empty protocol/tag wrappers; no `undefined`/`[object Object]`/`NaN` in any compiled prompt.
- Shipped `index.html` untouched by the agent; syncs only as incremental `src/` archives.

---

## 7. Traceability Matrix (consolidated item → source report)

| Consolidated | Source report(s)                     | Consolidated name                               |
| ------------ | ------------------------------------ | ----------------------------------------------- |
| **R1**       | #5 Flag 1; #6 §7.6; #7 don't-regress | Director alternation directive lost             |
| **R2**       | #6 Bug 1                             | story-scene character-only negatives            |
| **R3**       | #7 E1                                | Negative-prompt injection no-op                 |
| **R4**       | #7 B; #6 §7.6 (indirect)             | Divergent optics duplicate                      |
| **R5**       | #5 Flag 2                            | Empty `<CORE_PROTOCOLS>` wrapper                |
| **F1**       | #6 5.1                               | Optics drops colour/identity tokens             |
| **F2**       | #6 Bug 2; #5 §2 (purged floor)       | `none` baseline floor never applied             |
| **F3**       | #6 5.2                               | Scene prompts character-centric                 |
| **F4**       | #6 5.3                               | Group shot under-represents persona             |
| **F5**       | #6 Bug 3                             | Case-sensitive negative dedup                   |
| **F6**       | #6 5.4                               | Regenerate reuses weak stored prompt            |
| **S1**       | #7 A/C/App.B                         | Three front doors                               |
| **S2**       | #7 A                                 | compile_prompt↔facade recursion trap            |
| **S3**       | #7 F                                 | Envelope/role drift                             |
| **S4**       | #7 G                                 | Manifest only partially load-bearing            |
| **S5**       | #7 H; #5 §2; #4                      | Import cycles                                   |
| **S6**       | #7 I                                 | get_output_format param drift                   |
| **S7**       | #7 E4/F; #5 Flag 4                   | Inert manifest fields                           |
| **D1**       | #7 D                                 | Dead exports                                    |
| **D2**       | #7 E3                                | Duplicated AFFIRMATIVE_FRAMING                  |
| **D3**       | #7 E2                                | Duplicated PROSE_FORMAT                         |
| **D4**       | #7 C                                 | Dead compile_prompt branches                    |
| **D5**       | #7 D/F                               | Dead SYSTEM_ROLES factories                     |
| **D6**       | #5 Flag 4                            | Doc drift                                       |
| **T1**       | #5 Flag 3                            | Director test blind spot                        |
| **T2**       | #5 Round-4 Flag 2                    | No entity-layer tests                           |
| **T3**       | #6 Bug 1 gap                         | Image test ignores negatives                    |
| **T4**       | #7 B                                 | Optics tests hit dead branch                    |
| **T5**       | inferred (#6/#7)                     | Missing regression tests (floor/dedup/envelope) |
| **X1–X5**    | #5                                   | Fixed/verified reference items                  |

---

## Appendix A — Production prompt call sites (Report #7, App. A)

- `director.js:425` `prompt_builder.build_director(payload, snapshot)`
- `director.js:431` `compile_prompt("director_terse", { round })`
- `story.js:223` `prompt_builder.build_scoring_context(...)`
- `story.js:373` `prompt_builder.build_story_prose(payload, {snapshot, director_data, is_narrator, npc})`
- `story.js:639` `prompt_builder.build_story_prose(payload, {snapshot: {}, is_prologue: true})`
- `story.js:761` `prompt_builder.build_story_prose(...)` (epilogue)
- `story.js:844` `prompt_builder.build_story_prose(payload, {input, ghostwrite: true})`
- `temporal.js:602` `compile_prompt("continuum", {target_entity, target_key, other_entities, history})`
- `Profile.svelte.js:324,430` `prompt_builder.build_enhancement(...)`
- `Profile.svelte.js:530` `prompt_builder.build_profile_sorting(this.char, entity_type, {redistribute: true})`
- `media/visual.svelte.js:358` `prompt_templates.enhance_prompt(text, type, entity)`
- `media/visual.svelte.js:451` `prompt_templates.build_prompt(tier, sanitized_prompt, {...})`

## Appendix B — Live-mode coverage & capture inventory

**Mode coverage (Report #5 §5): 9/10 modes** — `narrator`, `optics`, `director` (×3), `interaction`, `continuum` (×4), `ghostwrite`, `npc`, `enhancement`, `sorting`. Only `director_terse` not triggered (by design — refusal-recovery fallback). 17 live captures.

**Image coverage (Report #6 §8): 11 image / 11 optics-LLM calls** — story menu, direct visualize, user persona, fractal scene, group shot, auto-turn scene, profile enhance, profile generate ×2, regenerate candidates ×3. Evidence: `scratch/captures7/{audit,img-meta,all}.json`, `llm_*.txt`, `img_*.txt`.

**Key captures cited:** `img_04`/`img_10` (R2 scene negatives), `img_03`/`img_05` (F1 pink dropped), `img_02` (F5 dedup), `llm_07` (R1 empty `<CORE_PROTOCOLS>`), `img_07/08/09` (F6 regenerate).

## Appendix C — Source evidence & prior reports

- Repo download `scratch/repo-latest5.zip` → `scratch/repo-latest5/RPGlitch-main/`; baseline `scratch/repo-latest4/`.
- Diff `scratch/compare5.json` (31 files, +977/−666); commits `scratch/commits5.json`.
- Decoded shipped bundle `scratch/index-vault5-{1,2,3}.txt`; prior `scratch/index-vault4-1.txt`.
- Live prompt captures `scratch/prompt-captures6/*`; round-4 baseline `scratch/prompt-captures5/all.json`.
- Image captures `scratch/captures7/*`.
- Prior reports: `scratch/reports/rpglitch-sync-and-live-test-report{,-2,-3,-4}.md`.

---

**Bottom line:** the architecture is sound and the shipped app is provably current; the four soft spots — **negatives handling, the tier→engine mapping, the third front door, and the tests** — are where all three reports' bugs concentrate. Phase 0 restores the two real regressions in days; Phases 2–5 turn the "one unified pipeline" from a documented intent into a structural fact; Phase 6 keeps it that way.
