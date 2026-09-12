---
name: track-intelligence-purification
description: Second-pass purification of src/intelligence — remove compat shims, wire (or delete) the inert manifest, dedupe helpers/registries, and break the module↔domain coupling
status: proposed
last_synchronized: 2026-09-11
---

# 🧪 Track: Intelligence Purification (Second Pass)

Reads against the completed
`track-intelligence-modularization-and-domain-consolidation` (PRESENT.md pulse
2026-09-11 21:37 → 23:53). This track is the **cleanup of the cleanup**: the
restructure created the right skeleton but left several seams that violate the
project's own laws (P4 zero-back-compat, single-source-of-truth, zero-sibling
modules, full-name naming).

All line numbers reference commit `c19e56e` (`main`, 2026-09-11) — the tree
now mirrored byte-exact into this workspace's `src/`.

---

## 0. What the big refactor actually did (goal recap)

1. **Decomposed prompt monoliths into structural modules** — `modules/system.js`,
   `constitution.js`, `protocols.js`, `entities.js`, `task.js` (+ `history.js`),
   the reusable "Lego bricks".
2. **Master declarative manifest** — `prompts.js` (`PROMPTS`) registers all 8
   modes keyed by module (`system` / `constitution` / `protocols` / `entities` / `task`).
3. **Centralised assembly line** — `builder.js` compiles every prompt from the
   manifest + modules, so domain files (`director.js`, `physics.js`,
   `profile.js`, `temporal.js`, `story.js`) stay prompt-free execution engines.
4. **Eliminated `src/intelligence/prompts/`** entirely (14 files), renamed
   `story-pipeline.js → story.js`, merged `profile-* → profile.js`,
   `temporal-* → temporal.js`.
5. **"Zero-sibling imports" pass** across `modules/`.

The commit lands a 6-step pulse-log sequence (all 2026-09-11, all `✅ Completed`),
which reads as the user _working toward_ exactly the purity this track names:

| pulse | move                                                                                                                                                                                                                                                                 |
| ----- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 21:37 | extract `modules/` bricks; consolidate physics/director/profile/temporal/story; delete `prompts/`                                                                                                                                                                    |
| 22:00 | enrich `macros.js` + modules with `MACRO_DIRECTIVES`, `SYSTEM_ROLES`, schemas, directives                                                                                                                                                                            |
| 23:02 | centralise ALL compilation in `builder.js`; `prompts.js` → master manifest; "relocate `MACRO_DIRECTIVES` to `protocols.js`"; prune `story-prompts.js`/`prompt-modes.js`                                                                                              |
| 23:20 | extract `modules/history.js`; enrich `system.js` with the XML envelopes; "builder 100% free of inline XML"                                                                                                                                                           |
| 23:31 | `render_role_xml` + `resolve_system_role_line`; reuse `open_system_tag`/`SYSTEM_CLOSE_TAG`                                                                                                                                                                           |
| 23:53 | "Intelligence Modules **Purity** & **Zero-Sibling** Architecture": extract `indent_all`/`inline_or_block`/`wrap_tag` to `@utils/xml.js`; "re-export `MACRO_DIRECTIVES` via `@utils/macros.js`"; relocate protocol bundles to `task.js`; **"0 cross-module imports"** |

So the _goal_ is unambiguous: **one declarative manifest + one dumb assembly line
on top of pure, dependency-free "Lego brick" modules, so domain engines contain no
prompt text.** The direction is right. The residue below is where the last pulses
stopped short of their own stated intent — which is exactly what this second pass
should finish:

---

## 1. Kill the backwards-compatibility shims (P4)

`prompts.js` still carries a legacy compatibility layer:

- `prompts.js:225` — `export const PROMPT_MODES = PROMPTS;` ("Compatible alias for legacy").
- `prompts.js:253` — `export const get_prompt_mode = get_prompt;` ("Backward-compatible alias").
- `prompts.js:239-246` — `get_prompt()` returns `Object.assign({}, base, { system_mode, ghostwrite, input: {tag}, think_format, sheets })` — an adapter exposing the OLD shape (`sheets`, `input.tag`, `system_mode`, `ghostwrite`) on top of the new manifest.

The adapter is **load-bearing**, so deleting it requires refactoring the readers:

- `modules/entities.js:321` — `config?.sheets` (should read `config.entities`).
- `modules/task.js:342` — `config?.input?.tag` (→ `config.task.input_tag`).
- `modules/task.js:356` — `config?.think_format` (→ `config.task.think_format`).
- `builder.js:323, 429` — `config.system_mode` (→ `config.system.mode`).
- `builder.js:281, 338, 344` — `config.ghostwrite` (→ `config.system.mode === "ghostwrite"`).
- `prompts.test.js` imports `PROMPT_MODES` / `get_prompt_mode` — update to `PROMPTS` / `get_prompt`.

**Exit:** manifest has one shape; no aliases, no adapter.

## 2. Make the manifest real (it is ~⅔ inert — "docs that lie")

The whole point of the refactor was a **declarative** manifest that drives
compilation. In reality only 7 of its 20 leaf keys are ever read — and 5 of those
7 are read _through the legacy `get_prompt` adapter_ (§1), i.e. the modern manifest
shape is barely consumed at all.

| manifest leaf              | consumed?                      | where                                                                                                         |
| -------------------------- | ------------------------------ | ------------------------------------------------------------------------------------------------------------- |
| `system.mode`              | ✅ (via adapter `system_mode`) | `builder.js:323,429`                                                                                          |
| `entities.dispositions`    | ✅ (via adapter `sheets`)      | `modules/entities.js:322`                                                                                     |
| `entities.dynamic_axes`    | ✅ (via `sheets`)              | `modules/entities.js:323`                                                                                     |
| `entities.user_agenda`     | ✅ (via `sheets`)              | `modules/entities.js:352`                                                                                     |
| `entities.proximate_npcs`  | ✅ (via `sheets`)              | `modules/entities.js:420`                                                                                     |
| `task.input_tag`           | ✅ (via adapter `input.tag`)   | `modules/task.js:342`                                                                                         |
| `task.think_format`        | ✅ (via adapter)               | `modules/task.js:356`                                                                                         |
| `system.role`              | ❌                             | `resolve_system_role_line` branches on `is_npc`/`is_narrator` flags (`modules/system.js`)                     |
| `constitution.axiomatic`   | ❌                             | builder calls `render_axiomatic_constitution()` for prose/narrator, omits it elsewhere (`builder.js:296,403`) |
| `protocols[]`              | ❌                             | `builder.js` hardcodes render_protocols strings (`:201`, `:494`, `:536`, `:572`)                              |
| `entities.spotlight`       | ❌                             | spotlight is computed from live ids (`render_scene_spotlight_xml({entities,npc_entities,in_scene_ids})`)      |
| `entities.target_context`  | ❌                             | memory path passes args explicitly                                                                            |
| `entities.scene_cast`      | ❌                             | ditto                                                                                                         |
| `entities.chapter_history` | ❌                             | ditto                                                                                                         |
| `entities.field_context`   | ❌                             | enhancement path passes `field_context` as a literal arg                                                      |
| `task.directive`           | ❌                             | directives come from `CHARACTER_DIRECTIVES`/`SCENE_DIRECTIVES` (`builder.js:330-345`)                         |
| `task.rules`               | ❌                             | rules are baked into `render_director_task` (`delta`/schema passed explicitly)                                |
| `task.schema`              | ❌                             | `DIRECTOR_SCHEMA`/`MEMORY_FORGE_SCHEMA`/`PROFILE_SCHEMA` passed explicitly                                    |
| `task.contract`            | ❌                             | `TEMPORAL_CONTRACT` passed explicitly                                                                         |
| `task.directives`          | ❌                             | `SORTING_DIRECTIVES` passed explicitly                                                                        |

Also note the _spirit_ of the manifest is to make protocol selection declarative,
yet `interaction`/`ghostwrite`/`npc`/`narrator` all declare
`["STATE.PSEUDO_JSON","COGNITION.EPISTEMIC_PHYSICS","HYGIENE.DATA"]` and builder
instead emits `"STATE.PSEUDO_JSON, COGNITION.EPISTEMIC_PHYSICS"` + `render_core_protocols`
(hardcoded) — so even the _values_ diverge from the declaration.

**Exit:** one of two. (a) Make `builder` consume the keys (manifest becomes the
real control surface — the intended design), or (b) prune the dead two-thirds so
`prompts.js` is an honest registry. Either is fine; leaving it is not.

## 2b. One read surface for `config`

Whichever way §1/§2 land, `builder` should pass the manifest record to the modules
in ONE shape. Today `render_task`/`render_entity_sheets` take the adapter object
(`{sheets, input.tag, think_format, system_mode, ghostwrite}`) while everything
else they need is passed as explicit args — two conventions in one call. Pick the
modern manifest record (`config.entities`, `config.task.input_tag`, …) and pass it
consistently.

## 3. Dedupe duplicated text & helpers

- **Indentation, three copies:** `ind` (`utils/text.js:497`), `indent_all`
  (`utils/xml.js:251`), `_indent` (`modules/task.js:237`). Consumers: `builder.js`
  (12× `ind`), `modules/entities.js` (6× `ind`), `modules/task.js` (11× `_indent`).
  Collapse to one `indent_all` in `@utils/xml.js`; delete `ind` and `_indent`.
- **`MACRO_DIRECTIVES` defined twice** — `utils/macros.js:17` AND
  `modules/protocols.js:22`, byte-identical. `modules/task.js:20` imports the
  `@utils` copy while `protocols.js:205` uses its own. Keep one (protocol text
  belongs in the prompt layer) and fix the false changelog note in `macros.js:421`.
- **Stability-lock text defined twice** — `modules/system.js` `STABILITY_LOCK`
  vs `modules/protocols.js` `PROTOCOL_LIBRARY.HYGIENE.STABILITY_WARNING/CRITICAL`
  (identical strings). One home; the other references it.

## 4. Break the module↔domain coupling (restores the "pure bricks" invariant)

- `modules/protocols.js:18` imports `resolve_context_directives` from `../physics.js`
  (used at `:174` for the `first_contact` directive); `modules/entities.js:36`
  imports `render_dynamics_axes_xml` from `../physics.js` (used at `:206`, `:282`). Modules are supposed to
  be pure string compilers — they currently depend on a domain engine. Move the
  context-directive registry into the prompt layer (or a leaf registry module) and
  pass dynamics XML in from `builder`.
- **Dependency cycle:** `temporal.js:19` imports `render_memory` from `builder.js` (used `:579`),
  while `builder.js:60` imports `temporal_engine`/`resolve_vector_pool` from
  `temporal.js`. Also `builder.js:59` imports three renderers from `physics.js`.
  ESM tolerates it, but it defeats the "assembly line on top, engines below"
  layering. Either inject the render functions into the engines, or have the
  engines return data and let `builder` do all string work.

## 5. Unify the `<SYSTEM>` envelope contract

Two conventions coexist:

- `render_prose_system_xml` returns the block **without** `</SYSTEM>` (the caller
  gets `system_close` separately — `builder.js:358`, `:471`, consumed by transport).
- `render_director_system_xml` / `render_memory_system_xml` /
  `render_enhancement_system_xml` / `render_sorting_system_xml` all **embed**
  `</SYSTEM>`.

Also `<SYSTEM mode="director">` (`modules/system.js:132`) drops the `round`
attribute that `open_system_tag` emits, and director/memory/enhancement use manual
`  ` indentation in the template literals rather than `open_system_tag` +
`SYSTEM_CLOSE_TAG`. Pick one envelope contract for all modes.

## 6. Prune vestigial surface

- `builder.js:403` — `render_axiomatic_constitution({ is_narrator: true })`; the
  function takes **no args** (`modules/constitution.js:36`). Dead argument.
- `builder.js:115-117` — `render_builder.render_history` is a passthrough to
  `modules/history.js:30`; also re-exposed on `prompt_builder` (`:586`). Collapse.
- `builder.js:839` — `window.exposed = { ...prompt_builder }` debug bridge in an
  intelligence module; confirm it's still used, else drop.
- `modules/task.js:223, 228` — `TEMPORAL_PROTOCOLS` / `PROFILE_PROTOCOLS` bundles
  are consumed only by tests (`temporal.test.js:17`, `profile.test.js:9`); the
  engines import `TEMPORAL_CONTRACT`/`DIRECTOR_SCHEMA` directly. Either make them
  the real accessors or delete them and point tests at the primitives.

## 7. Decompose the remaining god-files

The restructure moved _text_ out but left the pipelines monolithic:
`story.js` 1050 lines, `temporal.js` 932, `builder.js` 855, `entities.js` 634.
Candidate splits (keep pure-compute separate from orchestration):

- `temporal.js` → vector math/scoring · dedup/caps · forge pipeline · (renderers moved out).
- `builder.js` → accessor factory · system/prose compilers · task compilers ·
  studio compilers (enhancement/sorting/memory).
- `entities.js` → epistemic filters · sheet compilers · spotlight · memory context.

## 8. Naming (per AGENTS.md full-name law)

- `ind` is a lazy stem → remove (see §3).
- `_indent` / `indent_all` inconsistent.
- Two builder objects: `render_builder` vs `prompt_builder` (`builder.js:76`, `:581`)
  with overlapping methods — converge on one name.
- `PROMPTS` / `get_prompt` vs the old `PROMPT_MODES` / `get_prompt_mode` (§1).

## 9. Housekeeping

- ~~The workspace `src/` mirror is stale.~~ DONE 2026-09-11: re-synced byte-exact
  from repo `main` @ `c19e56e` (pre-refactor `intelligence/prompts/` and
  `*-pipeline.js` files deleted from the mirror; workspace-only files kept are
  `AGENTS.md`, `HANDOVER-2026-09-04.md`, `README.md`). Keep it in sync.
- The `modules/protocols.js` + `macros.js` changelogs assert moves that didn't
  happen — fix them as part of the dedupe.
- `.agents/.../track-intelligence-modularization...md` claims "0 cross-module
  imports"; §4 shows `modules/` still reaches into `../physics.js`.

---

## Suggested sequencing

1. §1 (kill the shims) + §3 (dedupe helpers) — mechanical, high payoff, few tests.
   Do §1 and §2b together: refactor the 5 adapter reads to the modern record, then
   delete `PROMPT_MODES`/`get_prompt_mode`/the adapter, then update `prompts.test.js`.
2. §2 (manifest truth) — the design decision: wire the dead keys (manifest becomes
   the control surface) or prune them. Get the user's call before touching.
3. §4 (coupling/cycle) — highest-risk; do behind the full suite.
4. §5, §6, §8 — consistency sweep.
5. §7 — the big split; treat as its own track.
6. §9 — keep HANDOVER + mirror in sync throughout.

<!-- CHANGELOG
- 2026-09-11: Drafted from the modularization diff review (repo main vs workspace mirror).
- 2026-09-11: Re-verified against commit c19e56e after a fresh re-download; corrected
  line numbers; expanded §2 from "half inert" to the full 20-leaf inventory
  (only 7 leaves read, 5 via the legacy adapter); added §2b.
-->
