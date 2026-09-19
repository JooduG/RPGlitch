# RPGlitch — Sync & Live-Test Report #8

**Type:** Dynamic / integration (repo sync + live prompt-pipeline trigger audit)
**Date:** 2026-09-19
**Repo:** `JooduG/RPGlitch` · **Generator:** `rpglitchen` (`f40d8ce0f45b8e804912024a8fc34b28.perchance.org/rpglitchen`)
**New HEAD analysed:** `4865c31b` — _"docs: add temporal mission board and track roadmap in PRESENT.md"_ (2026-09-19T01:51:33Z)
**Previous baseline:** `ec2bdf19` — _"feat: add visual rendering engine, narrative styles, and intelligence modules"_ (2026-09-18T23:02Z) — the HEAD analysed by the [Consolidated Mega Report](./rpglitch-mega-report.md)
**Method:** GitHub API download → workspace `src/` mirror sync → live-page instrumentation (wrapped `generate_text` / `generate_image`) → natural UI trigger of every `prompts.js` mode → capture audit

> Follow-up to the Mega Report (#5/#6/#7). That report's plan (item IDs **P1/P4, R1–R5, F1–F6, S1/S2/S6, D2/D3, T1**) has now landed in `4865c31b` — this report verifies it on the live app and surfaces what it broke.

---

## 0. Executive Summary

The new commit is **the implementation commit for the Mega Report plan**. It retires the `prompt_builder` facade (P4), routes every mode through the single `compile_prompt()` switchboard (S1), and lands the behavioural fixes **R1, R2, R3, R5, F1, F2, F3, F5, F6, D2, D3, S6**. On the live app I confirmed **R1, R2, R3, R5, F1, F2 and F3 working**, and captured **9 of the 10 manifest modes naturally**.

**One real regression was introduced and confirmed live (new, high):**

| ID     | Sev     | Finding                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| ------ | ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **E1** | 🔴 High | **Profile-field enhancement silently lost its field metadata.** When `prompt_builder.build_enhancement(...)` was deleted, the `PROFILE_FIELD_CATALOG` lookup that supplied `enhancer` / `label` / `directive` / `layer_key` / `is_array_field` was **not** migrated to the new `compile_prompt("enhancement", …)` call sites in `ui/profile/Profile.svelte.js`. The compiled prompt now emits `role="ENHANCER"` (generic), no `enhancing=` label, no `<LAYER>` tag, and **no field-specific output directive** — and profile enhancement is observably breaking (`eternal.physical` enhancement result rejected by the parser; console: _"Physical enhancement … rejected — unparsable or missing mandatory keys. Keeping current value."_). |

Everything else captured was clean: no empty `<CORE_PROTOCOLS>`, no `undefined` / `NaN` / `[object Object]`, correct tier selection, and the quality-floor negatives present on every image call.

---

## 1. Sync & Diff Review

### 1.1 What arrived

|                        |                                                                                                        |
| ---------------------- | ------------------------------------------------------------------------------------------------------ |
| Commits since baseline | `c26e29a6` (code) → `eae836db` (track docs) → `4865c31b` (PRESENT.md docs)                             |
| Files changed          | **19 modified, 0 added, 0 removed** (repo `src/`); workspace-only extras are `README.md` + `AGENTS.md` |
| Net size               | `builder.js` **−300 lines** (`+118 / −418`) — the `prompt_builder` deletion                            |

| File                                                                                             | +/−         | Role of change                                                                                                                                                                      |
| ------------------------------------------------------------------------------------------------ | ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `intelligence/builder.js`                                                                        | +118 / −418 | Deletes `prompt_builder`, `prompt_templates`, `render_visual_enhancement`; adds `build_scoring_context`; `compile_pipeline_prompt` inlines director/narrator/npc/optics; **R1** fix |
| `intelligence/modules/protocols.js`                                                              | +11 / −4    | **D2** dedup `AFFIRMATIVE_FRAMING`; **R5** omit empty `<CORE_PROTOCOLS>`                                                                                                            |
| `intelligence/modules/task.js`                                                                   | +14 / −4    | **D3** import shared `PROSE_FORMAT`; **F3** tier-parameterised `FIRST_SENTENCE_MANDATE`                                                                                             |
| `intelligence/modules/format.js`                                                                 | +5 / −2     | **R3** real negative-prompt atom injection; **S6** `entity_type`                                                                                                                    |
| `intelligence/modules/entities/sheets.js`                                                        | +2 / −0     | **F1** `<SIGNATURE_COLORS>` directive                                                                                                                                               |
| `media/visual.svelte.js`                                                                         | +43 / −22   | **R2** tier map; **F2** baseline floor; **F5** case-fold dedup; **F1** signature-colour merge; **S1/R4** optics via `compile_prompt`                                                |
| `ui/profile/Profile.svelte.js`                                                                   | +23 / −4    | `prompt_builder.build_enhancement`/`build_profile_sorting` → `compile_prompt` (**source of E1**)                                                                                    |
| `App.svelte`                                                                                     | +10 / −2    | **F6** fallback-aware regeneration                                                                                                                                                  |
| `intelligence/story.js`, `director.js`, `intelligence/index.js`, `media/index.js` + 6 test files | —           | Call-site/barrel migration; test shims                                                                                                                                              |

### 1.2 My take

This is a **large, well-executed architectural cleanup** that does exactly what the Mega Report asked: one front door (`compile_prompt`), the `prompt_builder` facade gone, and the R/F fixes landed. It is not a light commit — `builder.js` loses ~300 lines and the public surface of `@intelligence` changes (`compile_prompt`/`build_scoring_context` in, `prompt_builder` out).

Two concerns, both migration-completeness rather than design:

1. **E1 — a call-site swallowed a lookup during the facade removal** (§5). This is the classic cost of "delete the façade first": the façade was doing hidden work that the callers didn't know they depended on. It is a genuine user-facing break, not cosmetics.
2. **Stale artifacts left behind** (§5.2): `builder.js` header still advertises `build_character/build_scene_narrator/...`; `director.js` doc comments still cite `prompt_builder`; and `story.test.js` still carries a ~60-line `prompt_builder` mock shim whose `compile_pipeline_prompt` mock re-implements the old routing — i.e. the tests still exercise a phantom of the deleted layer. None of these break runtime, but they erode the "single pipeline" claim the commit is trying to establish.

The unit tests could not have caught E1: `prompts.test.js` (`:307`) and `builder.test.js` (`:246`, `:367`) both **pass `label`/`directive`/`enhancer` explicitly**, so they prove `render_enhancement` works when fed the metadata — never that the real caller supplies it.

---

## 2. Live Test Method

1. Downloaded the repo archive, diffed against the mirror, then wrote all 19 changed files into `src/` (**verified byte-identical: 19/19 match HEAD `4865c31b`**).
2. Refreshed the live page so the shipped bundle (updated `index.html`) ran the new code.
3. Instrumented the live page: wrapped `window.generate_text` / `pluginGenerateText` and `window.generate_image` / `pluginGenerateImage` to record every compiled system+task envelope and every image call into `window.__cap`.
4. Drove the **real UI**: Shuffle Entities → Begin Story (prologue + rounds 0–2), the AI's profile editor (wand + "Enhance Profile"), the User persona **Ghostwrite** action, and image generation via each tier.
5. Audited every capture for: SYSTEM envelope attributes, role line, `<CORE_PROTOCOLS>` contents/non-emptiness, `<ALTERNATION_OPTIONS>`, tier, and `undefined`/`NaN`/`[object Object]` leakage.

**Captured:** 16 text-prompt compilations and 5 image generations.

---

## 3. Mode-by-Mode Results

| Mode                      | Natural trigger used                                    | Captured | SYSTEM envelope                                                                  | Verdict                                                                                      |
| ------------------------- | ------------------------------------------------------- | -------- | -------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| **director** (Shot 1)     | every turn (×3)                                         | ✅       | `<SYSTEM round="N" mode="director">`                                             | ✅ non-empty `<CORE_PROTOCOLS>` with `<ALTERNATION_OPTIONS>` — **R1 fixed**                  |
| **director_terse**        | only on AI refusal / JSON truncation (fallback)         | ❌       | —                                                                                | Not naturally reachable (see §4.1)                                                           |
| **interaction** (Shot 2A) | default AI turn (×3)                                    | ✅       | `<SYSTEM round="N" mode="interaction">`                                          | ✅ 9 protocols, ALT present, clean                                                           |
| **ghostwrite**            | Character Menu → User → Ghostwrite                      | ✅       | `<SYSTEM round="0" mode="ghostwrite">`                                           | ✅ "You are Dr. Elias Tariq…", 9 protocols                                                   |
| **npc**                   | round-2 user message directing an in-scene NPC (Glitch) | ✅       | `<SYSTEM round="2" mode="npc">`                                                  | ✅ "You are Glitch, a supporting character", 9 protocols                                     |
| **narrator**              | story prologue                                          | ✅       | `<SYSTEM round="0" mode="narrator">`                                             | ✅ 8 protocols, ALT present                                                                  |
| **continuum** (Shot 2B)   | back-shot after each turn (×3)                          | ✅       | `<SYSTEM mode="continuum" role="CONTINUUM_CARETAKER" target="…">`                | ✅ targets Orion / Elias / Ashenweald                                                        |
| **enhancement**           | Profile → Edit → field wand (Physical Appearance)       | ✅       | `<SYSTEM mode="enhancement" role="ENHANCER" field="eternal.physical">`           | 🔴 **E1 — metadata missing**                                                                 |
| **sorting**               | Profile → Edit → "Enhance Profile"                      | ✅       | `<SYSTEM mode="sorting" role="NARRATIVE_STRUCTURER" enhancing="Entire Profile">` | ✅ HISTORY + JSON schema correct                                                             |
| **optics**                | every image generation (×4 LLM + 1 direct)              | ✅       | `<SYSTEM mode="optics" role="SENSORY_CORTEX">`                                   | ✅ tiers scene/entities/character/solo; SIGNATURE_COLORS present; schema negatives populated |

**Mode coverage: 9/10 naturally triggered.** `director_terse` is only reachable via the refusal/truncation recovery path and is not a "natural" prompt.

---

## 4. Mega-Report Fix Verification (live)

| ID              | Claim                                                              | Live evidence                                                                                                                                                                                                                                                                       | Status                            |
| --------------- | ------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------- |
| **R1**          | Director's alternation directive restored                          | Director `CORE_PROTOCOLS` non-empty and contains `<ALTERNATION_OPTIONS>Resolve {Option A\|Option B}…</ALTERNATION_OPTIONS>`; entity sheets are rendered before protocols (`builder.js:230-233`)                                                                                     | ✅ **Fixed**                      |
| **R2**          | Scene shots no longer get character-only negatives; tier map fixed | Actual image calls: `story_scene` negatives = style tokens + floor, **no** "empty background/no humans"; `story_entities` / `story_character` / `solo_entity` negatives **do** include "empty background, landscape without characters, scenery only, no humans, empty environment" | ✅ **Fixed**                      |
| **R3**          | Resolved negative tokens now reach the optics schema               | Optics `<OUTPUT_FORMAT>` negative atom now reads `…Style baseline: digital vector, smooth CGI, glossy render, photograph of real human, flat 2d, drawing`                                                                                                                           | ✅ **Fixed**                      |
| **R5**          | Empty `<CORE_PROTOCOLS></CORE_PROTOCOLS>` omitted                  | Every capture with a resolving protocol list is non-empty; no empty wrapper observed                                                                                                                                                                                                | ✅ **Fixed**                      |
| **F1**          | Signature colour/identity anchors enforced                         | `<SIGNATURE_COLORS>Every character's distinctive color and physical identifiers … preserve all declared color and identity tokens verbatim…</SIGNATURE_COLORS>` present in optics prompts                                                                                           | ✅ **Fixed**                      |
| **F2**          | `VISUAL_STYLES.none` baseline quality floor applied                | Every image call's `negativePrompt` ends with `blurry, low resolution, compressed artifacts, watermark, bad anatomy, distorted features` (and the `solo_entity` call adds its own style tokens)                                                                                     | ✅ **Fixed**                      |
| **F3**          | Tier-parameterised first-sentence mandate                          | `story_scene` → _"establish vast environmental geometry … in the VERY FIRST sentence"_; `story_character` → _"place main entities and active physical interactions in the VERY FIRST sentence"_                                                                                     | ✅ **Fixed**                      |
| **F5**          | Negative-token dedup case/format-insensitive                       | No duplicate tokens observed in any real negative string (no triggering input this run)                                                                                                                                                                                             | ⚪ Inconclusive (present in code) |
| **S1/R4**       | Optics compiles through `compile_prompt`                           | Live optics prompts emit `<SYSTEM mode="optics" role="SENSORY_CORTEX">`                                                                                                                                                                                                             | ✅ **Fixed**                      |
| **D2/D3/S6/F6** | Protocol dedup / shared format / `entity_type` / fallback regen    | Internal; no adverse evidence live                                                                                                                                                                                                                                                  | ⚪ Not directly observable        |
| **T1**          | Test blind spot                                                    | See §5.2 — blind spot persists (tests pass metadata the real caller omits)                                                                                                                                                                                                          | ⚠️ **Still open**                 |

---

## 5. Findings

### 5.1 🔴 E1 — Enhancement prompt lost its field metadata (functional regression)

**Symptom (live).** Clicking the magic wand on **Physical Appearance** produced:

```
<SYSTEM mode="enhancement" role="ENHANCER" field="eternal.physical">
...
<TASK>
    Use placeholder macros for entities: '{{me}}' … Never hardcode names.
  </TASK>
```

…i.e. **no `enhancing=` label, no `<LAYER>` tag, no field directive, generic role** — and the model's reply was rejected:

```
[ProfileState] Physical enhancement for eternal.physical rejected — unparsable or missing mandatory keys. Keeping current value.
```

**Expected** (per `src/data/definitions/profile-fields.js`): `role="BIOMETRIC_RENDERER"`, `enhancing="Physical Appearance"`, `<LAYER>ETERNAL</LAYER>`, and the directive `[KEY: value] permanent biometrics (gender, age, …) … Return bracketed directives…`.

**Root cause.** `render_enhancement` (`builder.js:608-646`) was always metadata-driven — it _reads_ `enhancer`, `label`, `directive`, `layer_key`, `is_array_field`. Those used to be supplied by the now-deleted `prompt_builder.build_enhancement()`, which did a `PROFILE_FIELD_CATALOG[`${type}.${key}`]` lookup internally. The new call sites pass only `{ field_id, content, entity_name, entity_type, is_image_field, entity, [array_mode] }`:

- `ui/profile/Profile.svelte.js:324` (`enhance_field_inner`)
- `ui/profile/Profile.svelte.js:437` (`enhance_vector_item`)

Notably `enhance()` (`:306-315`) already computes `catalog_meta` — it's used only as a gate (`if (!catalog_meta) return;`) and then dropped.

**Impact.** All field-level enhancement degrades: physical fields lose the `[KEY: value]` output contract (parser rejects the prose result → field silently unchanged); prose fields (`Personality`, `state of mind`) lose their "prose only / dense paragraph" directive and `COGNITIVE_ARCHITECT` role; `past` (array) loses `is_array_field` so its output rules are wrong; and the model loses the field label/layer entirely. `sorting` ("Enhance Profile") is **unaffected** — `render_profile_sorting` supplies its own role/label.

**Why tests missed it.** `prompts.test.js:307-315` and `builder.test.js:246/367` both pass `label`/`directive`/`enhancer` explicitly, so they validate the renderer, never the real call site (**T1**).

**Recommended fix (call-site; minimal):** pass the catalog metadata through. `PROFILE_FIELD_CATALOG` is already imported in `Profile.svelte.js`.

```js
// ui/profile/Profile.svelte.js — in enhance_field_inner() and enhance_vector_item()
const catalog_meta = PROFILE_FIELD_CATALOG[`${type}.${key}`];
const payload = compile_prompt("enhancement", {
  field_id: key,
  content: value,
  entity_name: this.char.name || "",
  entity_type: type,
  is_image_field: false,
  entity: this.char,
  enhancer: catalog_meta?.enhancer,
  label: catalog_meta?.label,
  directive: catalog_meta?.directive,
  layer_key: catalog_meta?.layer_key,
  is_array_field: catalog_meta?.type === "array",
});
```

(`enhance()` should pass its already-computed `catalog_meta` into `enhance_field_inner` rather than recomputing. `render_enhancement` keeps its parameterised signature for `VisualWing`/test callers.) _Alternative:_ restore the `PROFILE_FIELD_CATALOG` lookup **inside** `render_enhancement`/the `enhancement` dispatcher so every caller is fixed at once — acceptable since `intelligence/payload.js` already imports `PROFILE_FIELD_CATALOG` from `@data`.

**Regression guard:** add a test that calls `compile_prompt("enhancement", {field_id:"eternal.physical", entity_type:"character", entity})` **without** label/enhancer/directive and asserts the catalog-derived `role="BIOMETRIC_RENDERER"`, `enhancing="Physical Appearance"` and `<LAYER>ETERNAL</LAYER>`. Then make the caller satisfy it.

### 5.2 🟡 Stale artifacts from the P4 retirement (cleanup, non-breaking)

| Where                                          | Issue                                                                                                                                                                                                                                                                         |
| ---------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `intelligence/builder.js:11-14`                | Header still lists `build_character, build_scene_narrator, build_npc, build_prologue, build_epilogue, build_ghostwriter` as the "Story Prose Compilers" — those facades no longer exist                                                                                       |
| `intelligence/director.js:404, 514, 515`       | Doc/CHANGELOG comments still say the Director compiles "via prompt_builder"                                                                                                                                                                                                   |
| `intelligence/story.test.js:9, 142-149, 567-…` | A ~60-line `prompt_builder` mock shim remains; its `compile_pipeline_prompt` mock re-implements the _old_ routing (calls `build_director`/`build_character`/…), so those `expect(prompt_builder.build_*)` assertions test a phantom layer, not the live `compile_prompt` path |
| `intelligence/story.js:935-936`                | CHANGELOG references the retired `prompt_builder.build_story_prose`                                                                                                                                                                                                           |
| `intelligence/builder.js:1040`                 | CHANGELOG still says it "absorbed … render_visual_enhancement and prompt_templates" (both deleted)                                                                                                                                                                            |

Recommendation: purge these in a follow-up so the repo's docs/tests match the "one front door" architecture; otherwise a future reader is told the deleted layer still exists.

---

## 6. Recommendations (priority order)

1. **Fix E1** (§5.1 patch) — highest impact; user-visible field enhancement is degraded.
2. **Add the E1 regression test** and delete the `story.test.js` `prompt_builder` shim so the tests exercise `compile_prompt`, not a mock of the removed façade.
3. **Sweep the stale comments/headers** listed in §5.2.
4. Optional: give `render_enhancement` its own catalog lookup as a defensive default (so a future caller can't silently omit metadata again).
5. Re-run `npm run verify` locally — I cannot run vitest here; the call-site omission in E1 is exactly the kind of thing the current tests let through.

---

## 7. Caveats / Not Tested

- **`director_terse`** was **not** triggered naturally. It only fires when the Director's primary call is detected as a refusal (`AI_REFUSAL_DETECTED`) or returns truncated JSON (`director.js:426-478`). Verified that it is a _fallback-only_ mode; it remains covered by `director.test.js`, not by live triggering.
- **`director_terse` / `D2` / `D3` / `S6` / `F6`** were reviewed statically, not exercised end-to-end.
- **F5** dedup had no triggering input this run (no case-duplicate tokens appeared), so it is unverified live.
- The test run created/advanced a story in the app's local storage ("The Tale of Orion…", round 2). Harmless; delete via the library if undesired.
- No code was changed by this pass: the `src/` mirror is left **byte-identical to HEAD `4865c31b`** so the sync is faithful. The E1 fix above is a recommendation, not yet applied.

---

## 8. Traceability

| This report | Mega Report source       | Status after `4865c31b`                |
| ----------- | ------------------------ | -------------------------------------- |
| §4 R1       | Mega R1 (🔴)             | ✅ verified fixed                      |
| §4 R2       | Mega R2 (🔴)             | ✅ verified fixed                      |
| §4 R3       | Mega R3 (🟠)             | ✅ verified fixed                      |
| §4 R5       | Mega R5 (🟡)             | ✅ verified fixed                      |
| §4 F1       | Mega F1 (🟠)             | ✅ verified fixed                      |
| §4 F2       | Mega F2 (🟠)             | ✅ verified fixed                      |
| §4 F3       | Mega F3 (🟡)             | ✅ verified fixed                      |
| §5.1 E1     | (new — introduced by P4) | 🔴 open                                |
| §5.2        | Mega S1/S2/T1/T4         | partially open (test shim, stale docs) |
