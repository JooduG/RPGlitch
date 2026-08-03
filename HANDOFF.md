# RPGlitch — DevTelemetryBlock Labels (Color-Matched, Renamed, Nowrap) + Q&A

**Date**: 2026-08-03 · **Session**: perchance workspace (`scratch/src/src/`)
**User actions required**: `npm run test` → `npm run build` → redeploy. No schema migration, no new deps.

---

## 0. Q&A (the three questions)

### 0.1 "What are the MEMORY_FORMATION WEAVED chips?"

The small text chips at the start of each weaved-memory row inside a `MEMORY_FORMATION` ("Memory Forged") card: a **`FORGED`** status chip (you renamed it from `WEAVED`) plus the memory's **type chip** (`past`/`future`, CSS-uppercased). They identify each row as a newly-consolidated memory before the directive text.

### 0.2 "What do you mean by 'legacy PAST/FUTURE grids'?"

The two-column **PAST MEMORIES / FUTURE VECTORS** section at the bottom of the default telemetry card. It is fed by `meta.vectors.{past,future}` — the _old_ flat telemetry shape — and only renders when `meta.type !== "DYNAMICS_DELTA"`. Since the kernel now always sends `DYNAMICS_DELTA`, those grids never appear in practice (they're kept as a backward-compat fallback for pre-restructure log entries). Each row shows the `_relevance` (or `emotional_weight`) number plus the directive.

### 0.3 "Why does every prologue think block begin with `## Reasoning`?"

Because the think block is assembled from **five optional sections**, and `## Reasoning` is the only one that survives. In `kernel.js` the sections are pushed in order: `## Cognition` ← `internal_monologue`, `## Intent` ← `intent`, `## Somatic Tells` ← `somatic_tells`, `## Dialogue Direction` ← `dialogue_direction`, then `## Reasoning` ← `_thought_process` (kernel.js:453-457). A block that _begins_ with `## Reasoning` means the four earlier fields were empty.

Why are they empty? The director's JSON schema (`DIRECTOR_JSON_SCHEMA` in `prompts.js`) only ever requests **`_thought_process`** — the model is told to record its reasoning in that one key. The other four fields are never requested by any prompt, so they stay undefined in real runs and their `if (...)` guards never fire. (The only path that ever produced `## Cognition` is the JSON-parse-error fallback in `parse_director_json`, which stashes raw prose under `internal_monologue`.)

So every think block — including the opening-turn block right after the prologue — is exactly `## Reasoning\n<director's step-by-step evaluation>`. The prologue prose itself carries no think block; the block you see is the first AI turn's director pass.

---

## 1. What changed and why

All in `DevTelemetryBlock.svelte`, per your request:

### 1.1 Label colors now match the left border

The card's design language is "gray border = retrieved/past, cyan border = created/new". The labels now follow their row's border:

| Row                         | Left border               | Label text (was)            | Label text (now)                                       |
| --------------------------- | ------------------------- | --------------------------- | ------------------------------------------------------ |
| Present amendment           | cyan `--state-dev-accent` | cyan `PRESENT PHYSICAL`     | cyan (unchanged)                                       |
| Present amendment           | cyan                      | cyan `PRESENT NON-PHYSICAL` | cyan (unchanged)                                       |
| Eternal amendment           | cyan                      | cyan `ETERNAL PHYSICAL`     | cyan (unchanged)                                       |
| Eternal amendment           | cyan                      | cyan `ETERNAL NON-PHYSICAL` | cyan (unchanged)                                       |
| New vector row              | cyan                      | cyan `FUTURE`               | cyan `FUTURE VECTOR`                                   |
| **Retrieved vector row**    | **gray `slate-500`**      | **cyan** `PAST`             | **gray `slate-500`** `PAST MEMORY`                     |
| MEMORY_FORMATION weaved row | gray `slate-600`          | cyan `FORGED` + cyan type   | **gray `slate-500`** `FORGED` + **gray** `PAST MEMORY` |
| Legacy PAST grid            | gray `slate-600`          | cyan relevance number       | **gray `slate-500`** number                            |
| Legacy FUTURE grid          | cyan                      | cyan relevance number       | cyan (unchanged)                                       |

Gray is `text-slate-500` everywhere: it matches the retrieval borders (`slate-500`) exactly and sits one step lighter than the `slate-600` borders so it stays readable. If you'd rather the `FORGED` chip keep its cyan emphasis (it's a "brand" chip rather than a label), say so and I'll revert just that one.

### 1.2 Labels renamed to `FUTURE VECTOR` and `PAST MEMORY`

New `vector_label(type, fallback)` helper in the `<script>` block maps `future → "FUTURE VECTOR"`, `past → "PAST MEMORY"`, anything else → uppercased verbatim. Used by:

- the new-vector rows (`{vector_label(nv.type, "future")}`),
- the retrieved-vector rows (`{vector_label(rv.type, "past")}`),
- the MEMORY_FORMATION weaved-row type chip (`{vector_label(v.type, "past")}`).

The section headers (`PAST MEMORIES` / `FUTURE VECTORS`) are left as-is.

### 1.3 Hyphenated labels forced onto one line

Every label span got `whitespace-nowrap`, so `PRESENT NON-PHYSICAL`, `ETERNAL NON-PHYSICAL`, `FUTURE VECTOR`, `PAST MEMORY` can never split at the hyphen/space.

⚠️ One caveat on width: your manual edit set the label column to `w-20` (80px). At 12px monospace, `PRESENT NON-PHYSICAL` is ~145px — so at `w-20` the label wraps _at the hyphen_ and `whitespace-nowrap` would make it overflow. I sized the column to the widest label instead: **`w-40` (160px) + `shrink-0`**, which keeps the uniform label column (your earlier requirement) _and_ fits every label on one line. If you specifically want the column narrower, the only way is shorter labels (e.g. `PRESENT` / `NON-PHYS`).

## 2. Your manual edits, analysed

Diffed your paste against the previous baseline — here's every change you made and what it improves:

1. **`WEAVED` → `FORGED` everywhere** (`FORGED` chip, `NEWLY FORGED MEMORIES` header, `NO MEMORIES FORGED`): one consistent vocabulary across the whole card — matches the "Memory Forged" `DataBox` label and the `Forged for X · from N turns` eyebrow. Previously the card mixed "forged" (label/eyebrow) with "weaved" (chips/headers).
2. **Amendment labels rewritten**: `PHYSICAL` → `PRESENT PHYSICAL`, `NON-PHYSICAL` → `PRESENT NON-PHYSICAL`, `◇ ETERNAL · PHYSICAL` → `ETERNAL PHYSICAL`, `◇ ETERNAL · NON-PHYSICAL` → `ETERNAL NON-PHYSICAL`. This is a clear improvement: each label now maps 1:1 to its payload key (`present_mutations.physical`, `eternal_mutations.non_physical`, …), is self-explanatory to a reader, and drops the decorative `◇` glyph for a plain word (the glyph is still used on the eternal-shift tag chip, where it stays meaningful).
3. **Label column `w-52` → `w-20`**: intent to shrink the label gutter — but see §1.3: 80px is too narrow for the new longer labels, so I set `w-40` + `whitespace-nowrap` to satisfy both your "narrow uniform column" and "hyphenated words on one line" asks.
4. **Formatting-only cleanups** (no behavior change, all good): `has_mods` broken multi-line, the two delta-bar `<div>`s broken multi-line, and the `[T] PER-ENTITY STATE CHANGES` comment de-indented to match the section.

## 3. Files

| File                                         | Change                                                                                                                                                                                 |
| -------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/ui/molecules/DevTelemetryBlock.svelte`  | `vector_label()` helper; labels color-matched to borders; `FUTURE VECTOR`/`PAST MEMORY` renames; `w-40 shrink-0 whitespace-nowrap` label column; your manual edits adopted as baseline |
| `src/ui/molecules/DevTelemetryBlock.test.js` | mirror `vector_label` + test (15 → 16) — optional to sync, old tests still pass without it                                                                                             |
| `tasks/PRESENT.md`                           | new pulse row (`2026-08-03 14:30`)                                                                                                                                                     |

Not changed: `Message.svelte`, `kernel.js`, `temporal.js`, `prompts.js`, `FUTURE.md`.

## 4. Verification (this session, no Node)

- Svelte 5.56.3 `client` + `server` compile of `DevTelemetryBlock.svelte`: **0 warnings, 0 errors**.
- SSR render of all three variants: new `updates` shape (DYNAMICS_DELTA + thoughts + trigger_image), MEMORY_FORMATION, and legacy flat shape.
  - `FUTURE VECTOR` / `PAST MEMORY` / `PRESENT PHYSICAL` / `PRESENT NON-PHYSICAL` / `ETERNAL PHYSICAL` / `ETERNAL NON-PHYSICAL` all render.
  - exactly 6 label spans carry `w-40` + `whitespace-nowrap`; retrieval label is `text-slate-500`, new-vector label stays accent, 4 amendment labels stay accent.
  - MEMORY_FORMATION: `FORGED` + `PAST MEMORY` chips are gray; header reads `NEWLY FORGED MEMORIES`.
  - Legacy grids (type `SIMULATION_TICK`): PAST grid number gray, FUTURE grid number accent, borders untouched.
  - zero leftover `w-20` label spans, `WEAVED`, or bare `PHYSICAL`/`NON-PHYSICAL` labels anywhere.
- Mirror test suite (functions extracted from `DevTelemetryBlock.test.js`, incl. the new `vector_label` test): **16/16 pass**.
