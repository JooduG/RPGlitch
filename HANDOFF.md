# RPGlitch — DevTelemetryBlock (Backward-Compat Removal + Thoughts Heading Strip + Label Column Rework) + Q&A

**Date**: 2026-08-03 · **Session**: perchance workspace (`scratch/src/RPGlitch-main/`)
**User actions required**: `npm run test` → `npm run build` → redeploy. No schema migration, no new deps.

---

## 0. Q&A (the three questions)

### 0.1 "What are the MEMORY_FORMATION WEAVED chips?"

The small text chips at the start of each weaved-memory row inside a `MEMORY_FORMATION` ("Memory Forged") card: a **`FORGED`** status chip (you renamed it from `WEAVED`) plus the memory's **type chip** (`FUTURE VECTOR`/`PAST MEMORY`, CSS-uppercased). They identify each row as a newly-consolidated memory before the directive text.

### 0.2 "What do you mean by 'legacy PAST/FUTURE grids'?"

The two-column **PAST MEMORIES / FUTURE VECTORS** section at the bottom of the old default telemetry card, fed by `meta.vectors.{past,future}` — the _old flat_ telemetry shape. It only rendered when `meta.type !== "DYNAMICS_DELTA"`, so in the current pipeline it never appeared. **This round removed them entirely** (see §1.1) along with all other backward-compat fallbacks, per your request — the component now reads only the `{ type, updates }` shape.

### 0.3 "Why does every prologue think block begin with `## Reasoning`?"

Because the think block is assembled from **five optional sections**, and `## Reasoning` is the only one that survives. In `kernel.js` the sections are pushed in order: `## Cognition` ← `internal_monologue`, `## Intent` ← `intent`, `## Somatic Tells` ← `somatic_tells`, `## Dialogue Direction` ← `dialogue_direction`, then `## Reasoning` ← `_thought_process` (kernel.js:447-451). A block that _begins_ with `## Reasoning` means the four earlier fields were empty.

Why are they empty? The director's JSON schema (`DIRECTOR_JSON_SCHEMA` in `prompts.js`) only ever requests **`_thought_process`** — the model is told to record its reasoning in that one key. The other four fields are never requested by any prompt, so they stay undefined in real runs and their `if (...)` guards never fire. (The only path that ever produced `## Cognition` is the JSON-parse-error fallback in `parse_director_json`, which stashes raw prose under `internal_monologue`.)

So every think block — including the opening-turn block right after the prologue — is exactly `## Reasoning\n<director's step-by-step evaluation>`. The prologue prose itself carries no think block; the block you see is the first AI turn's director pass.

---

## 1. What changed and why

All in `DevTelemetryBlock.svelte`, per your request. This round sits **on top of** the earlier label pass (colors matched to borders, `FUTURE VECTOR`/`PAST MEMORY` renames, `FORGED` vocabulary, your manual edits adopted).

### 1.1 Backward-compat removal (your request)

- The legacy flat-shape fallback in `entity_blocks` (`meta.entities`, `meta.ai`, `meta.deltas`, `meta.mutations`, `meta.snapshot`, `meta.vectors`) is deleted.
- The legacy **PAST MEMORIES / FUTURE VECTORS** grids at the card bottom are deleted.
- `get_entity_name` now resolves names from `runtime.active_*` only (no `meta.*_name` lookups).
- `forged_vectors` still reads `meta.vectors.past` for the MEMORY_FORMATION weaved rows — the one piece of the old shape that stays, because `MEMORY_FORMATION` events still carry it.

### 1.2 `##` headings stripped from the THOUGHTS block

New `display_thoughts` derived removes `/^##\s+.*$/gm` lines and trims, so `## Reasoning` (and any `##` section) no longer appears under the THOUGHTS label. The raw payload still shows it in **View Raw Data**, and the chat-bubble think block (Message.svelte) still shows the full assembled markdown including `## Reasoning` — that block is the raw `kernel.js` output and is untouched.

### 1.3 Label column rework (width + hyphen wrapping)

Dropped `w-40` + `whitespace-nowrap` for **`w-24 shrink-0` (96px)** with normal wrapping, and `NON-PHYSICAL` now uses the **non-breaking hyphen** `&#8209;` (U+2011):

- `PRESENT NON-PHYSICAL` breaks as `PRESENT` / `NON-PHYSICAL` — **at the space, never at the hyphen**.
- Same for `ETERNAL NON-PHYSICAL`.
- `FUTURE VECTOR` (13 chars) and `PAST MEMORY` (11 chars) fit on one 96px line.
- The column stays uniform (all 6 label spans share `w-24 shrink-0`), closer to your `w-20` gutter intent than the old `w-40`.

If you'd rather see the whole label phrase on one line, the only option is a wider column (`w-40`) or shorter labels (e.g. `PRESENT` / `NON-PHYS`).

### 1.4 (Carried over from the label pass)

- `vector_label(type, fallback)` helper maps `future → "FUTURE VECTOR"`, `past → "PAST MEMORY"`, other types uppercased verbatim.
- Label colors match the left border: gray `slate-500` on gray-bordered rows (retrieval, weaved-memory chips), accent-cyan on cyan-bordered rows (amendments, new vectors).
- Your manual edits adopted as baseline: `WEAVED → FORGED` everywhere, `PRESENT/ETERNAL` label renames (dropped the `◇` glyph), `has_mods`/delta-bar divs reformatted, `[T]` comment de-indented.

---

## 2. Files

| File                                         | Change                                                                                                                                                                                                                 |
| -------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/ui/molecules/DevTelemetryBlock.svelte`  | backward-compat fallback + legacy grids deleted; `display_thoughts` heading strip; `w-24 shrink-0` label column with U+2011 non-breaking hyphens; (carried: `vector_label`, color-matched labels, `FORGED` vocabulary) |
| `src/ui/molecules/DevTelemetryBlock.test.js` | mirrors updated to match — legacy branch + legacy tests removed, name resolution runtime-only, `vector_label` mirror kept (**16 → 10 tests**)                                                                          |
| `tasks/PRESENT.md`                           | new pulse row (`2026-08-03 15:35`)                                                                                                                                                                                     |
| `tasks/FUTURE.md`                            | track entry (`2026-08-03 15:35`)                                                                                                                                                                                       |
| `src/ui/organisms/Message.svelte`            | unchanged this round (still carries the `[&_.think-block-container_p]:mb-0` thoughts override from the earlier pass)                                                                                                   |

Not changed: `kernel.js`, `temporal.js`, `prompts.js`, `parser.js`.

---

## 3. Verification (this session, no Node)

- Svelte 5.56.3 `client` + `server` compile of `DevTelemetryBlock.svelte` and `Message.svelte`: **0 warnings, 0 errors**.
- SSR render of DYNAMICS_DELTA: THOUGHTS body heading-free (`## Reasoning` appears only inside the raw-meta `<pre>`); exactly 6 label spans carry `w-24 shrink-0`; U+2011 rendered in the `NON-PHYSICAL` labels; legacy grids absent.
- SSR render of MEMORY_FORMATION: `NEWLY FORGED MEMORIES` header, gray `FORGED` + `PAST MEMORY` chips, `Forged for X · from N turns` eyebrow intact.
- Mirror test suite (functions extracted from `DevTelemetryBlock.test.js`): **10/10 pass**.
