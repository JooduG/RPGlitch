# Worst-Case Catalog

Realistic values that expose UI layout, wrapping, escaping, and state regressions, grouped by data category. Map component fields to these categories in your Phase 1 table (`break-ui.md`). Use `example.com`, `example.org`, or `.test` domains so fixtures never target real mailboxes or servers.

---

## 1. People and Names

| Value                                  | Breaks                                                                                             |
| :------------------------------------- | :------------------------------------------------------------------------------------------------- |
| `Aleksandra Wiśniewska-Kowalczyk`      | Long, hyphenated, diacritics; wraps to two lines at hyphen boundaries                              |
| `Christopher Alexander Montgomery III` | Long with Roman suffix; naive first + last initials yield `CI`                                     |
| `Konstantin Oberhauser-Wettstein`      | Long compound surname; overflows single-line card headers                                          |
| `Jo`                                   | Two characters; leaves wide slots mostly empty, yields single initial `J`                          |
| `J`                                    | One character; tiny click target if the name acts as a button                                      |
| `Ólafur Darri Ólafsson`                | Leading accented capital; locale sorting and uppercase transforms                                  |
| `Đặng Thị Ngọc Hân`                    | Stacked Vietnamese diacritics; top/bottom clip under tight `line-height`                           |
| `王秀英`                               | CJK with no spaces; word-split initial parsers treat it as one word                                |
| `نور الهدى عبد الرحمن`                 | RTL script; user/LLM names and prose spans need `dir="auto"` inside RPGlitch's LTR terminal chrome |
| `Seán O'Brien-Ó Súilleabháin`          | Apostrophe and accented characters; escaping, search, and initials                                 |
| `María José de la Cruz y Fernández`    | Lowercase particles; initials logic and surname sorting                                            |
| `dana`                                 | All lowercase; watermark initials should normalize to uppercase                                    |
| `🦊 Fox`                               | Leading emoji; UTF-16 `.charAt(0)` slices half a surrogate pair (`U+FFFD` replacement character)   |
| `👩🏽‍💻 Priya`                             | ZWJ emoji sequence; string `.length` is `7+`, naive slicing splits glyphs                          |
| `Sam   Lee`                            | Extra spaces; empty tokens produce missing initials or uneven gaps                                 |
| _(missing)_                            | Blank name; UI must render a safe default label and initial fallback                               |

---

## 2. Emails, URLs, and Identifiers

Unbreakable strings lack whitespace, so containers collapse or overflow unless `wrap-anywhere` is applied:

| Value                                                                                                     | Breaks                                                                                   |
| :-------------------------------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------------- |
| `bartholomew.fitzgerald@northwind-industries-holdings.example.com`                                        | Unbroken address that pushes sibling buttons off-row without `min-w-0` + `wrap-anywhere` |
| `a@b.co`                                                                                                  | Shortest realistic address; exposes layouts that assume long metadata                    |
| `first.last+billing-notifications@example.com`                                                            | Plus-addressing; naive validation rejecting `+` or end-truncation hiding suffix          |
| `ops@sub.department.region.example.co.uk`                                                                 | Multi-level subdomains and two-part TLD parsing                                          |
| `https://example.com/workspaces/acme/projects/q3-launch/docs/9f8e7d6c5b4a?tab=comments&filter=unresolved` | Long URL; overflow, or end-truncation hiding query parameters                            |
| `9f8e7d6c-5b4a-4c3d-8e2f-1a0b9c8d7e6f`                                                                    | UUID; monospace width, requires JS middle-truncation in narrow columns                   |
| `Q3 Board Deck - FINAL (revised) v12 [approved by legal].pdf`                                             | Filename; end-truncation hides extension and version suffix                              |
| `IMG_20250914_183022_HDR_portrait_edited_edited.HEIC`                                                     | Camera filename; unbreakable with uppercase extension                                    |
| `@a` / `@thisisaverylongusernamethatisallowed`                                                            | Minimum vs. maximum handle lengths                                                       |

---

## 3. Labels, Titles, and Copy from Data

| Value                                                        | Breaks                                                                                                                                                                                                                   |
| :----------------------------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Senior Product Design Engineer, Platform Infrastructure`    | Long subtitle; wraps across multiple lines inside secondary slots                                                                                                                                                        |
| `Invitation expired 12 days ago`                             | Long status pill; wraps mid-label or starves adjacent title slots at `320px`                                                                                                                                             |
| `Benachrichtigungseinstellungen`                             | 30-character German compound word; overflows fixed badges without `wrap-anywhere`                                                                                                                                        |
| `Paramètres de confidentialité et de sécurité`               | Localized expansion (~30% longer than English); overflows fixed button widths                                                                                                                                            |
| `Twelve tags: design, frontend, q3, urgent, needs-review, …` | Multi-tag list; expands vertically unless capped with `+N` overflow badge                                                                                                                                                |
| `customer-feedback-from-enterprise-onboarding`               | Single tag wider than its parent badge row                                                                                                                                                                               |
| `Untitled` / `""` / `"   "`                                  | Empty or whitespace-only title; collapses row height without placeholder fallback                                                                                                                                        |
| `<script>alert(1)</script>` / `&` / `**bold**`               | Plain fields must render literally via `{value}` or `escape_html()` (`src/utils/html.js`); narrative HTML sinks must pass through `MarkdownIt` (`html: false`) + `sanitize()` / `use:safe_html` (`src/utils/actions.js`) |
| `Line one\nLine two`                                         | Newline inside a single-line header or badge doubles row height or disappears                                                                                                                                            |
| A 2,000-character pasted bio or prompt description           | Tests `TextField.svelte` `auto_resize`, scroll bounds, and `line-clamp-2` previews                                                                                                                                       |

> **Narrow-Column Rule (`320px`)**: Never apply single-line `truncate` (`white-space: nowrap`) to primary prose inside a `320px` mobile container because most content becomes unreadable; use `line-clamp-2` or `wrap-anywhere` instead.

---

## 4. Numbers and Numeric Readouts

_(Includes cross-domain currency/count edge cases alongside RPGlitch numeric meters.)_

| Value                                    | Breaks                                                                                                   |
| :--------------------------------------- | :------------------------------------------------------------------------------------------------------- |
| `0`                                      | Zero state (`0 items`), empty meters, or divide-by-zero percentage math                                  |
| `1`                                      | Singular/plural grammar (`1 item` vs `1 items`)                                                          |
| `1284`                                   | Needs grouping or clean width allocation                                                                 |
| `1000000`                                | Badge width overflow without compact formatting (`1M`)                                                   |
| `12345678.9`                             | `$12,345,678.90`; wide financial totals overflowing summary columns                                      |
| `-42.5`                                  | Negative sign handling in unsigned inputs or meters                                                      |
| `0.1 + 0.2`                              | Raw IEEE-754 `0.30000000000000004` printed without rounding (`Slider.svelte` `.toFixed()`)               |
| `142%` / `-3%`                           | Out-of-bounds progress percentages (must clamp `[0, 100]` as in `ProgressBar.svelte` and `Meter.svelte`) |
| `null` / `undefined` / `NaN`             | Literal `"NaN"` or `"undefined"` rendered inside numeric labels                                          |
| `1.284` (`de-DE`) vs `1,284` (`en-US`)   | Locale-dependent decimal and grouping separators                                                         |
| Live counter transitioning `99` -> `100` | Horizontal layout jitter if `tabular-nums` is missing                                                    |

---

## 5. Collections

| Value                                     | Breaks                                                              |
| :---------------------------------------- | :------------------------------------------------------------------ |
| `0` items                                 | Missing empty-state copy or collapsed container                     |
| `1` item                                  | Multi-column bento grid looks unbalanced with one lone card         |
| `page_size` and `page_size + 1`           | Off-by-one pagination bugs showing an empty trailing page           |
| `1,000+` history turns or vector memories | Scroll frame drops and DOM bloat without bounded rendering          |
| One item `10x` taller than siblings       | CSS Grid tracks stretching empty space around shorter sibling cards |
| Items with identical display names        | Lists lacking unique IDs or secondary tags to disambiguate rows     |

---

## 6. Time & Chronology

RPGlitch timestamps follow `GEMINI.md`'s **Swedish Date Standard (`YYYY-MM-DD HH:MM`, `Europe/Stockholm`)** via `format_datetime(ts)` (`src/utils/text.js`), while narrative turns display integer `round` counters (`runtime.svelte.js`):

| Value                         | Breaks                                                                                    |
| :---------------------------- | :---------------------------------------------------------------------------------------- |
| `null` / `undefined` / `0`    | Must fall back cleanly (e.g., `"---"` in `format_datetime`) instead of `1970-01-01 01:00` |
| `0` seconds elapsed           | Awkward `"0 seconds ago"` strings instead of `"just now"` in relative timers              |
| `12 days ago` / `3 years ago` | Threshold rollover into explicit `YYYY-MM-DD HH:MM` timestamps                            |
| Future timestamp              | Signed bugs rendering `"-3 days ago"`                                                     |
| `2025-12-31T23:30:00-08:00`   | Cross-midnight UTC vs `Europe/Stockholm` date rollover                                    |
| Round `999` -> `1000`         | Four-digit counter wrapping inside narrow telemetry headers                               |

Use `format_datetime()` (`sv-SE` / `Intl.DateTimeFormat`) for timestamps rather than manual string concatenation.

---

## 7. Images and Media

| Value                                          | Breaks                                                                                         |
| :--------------------------------------------- | :--------------------------------------------------------------------------------------------- |
| Avatar URL returning `404`                     | Native broken-image icon instead of `ProfilePicture.svelte` `Avatar.Fallback` initials         |
| No portrait media (`null` / `""`)              | Fallback contrast, centering, and sizing parity with loaded portraits                          |
| `4000x200` extreme panorama                    | Stretches or squishes without `object-cover`                                                   |
| `200x4000` extreme portrait                    | Overflows card height without constrained container bounds (`--spacing-character-card-height`) |
| Transparent PNG on `#171717` (`--color-chalk`) | Low-contrast artwork vanishes into obsidian backgrounds                                        |
| Slow-loading remote diffusion image            | Layout shift (CLS) if container lacks fixed dimensions or `aspect-ratio`                       |

---

## 8. States

| Value                    | Breaks                                                                                                     |
| :----------------------- | :--------------------------------------------------------------------------------------------------------- |
| `loading` / `streaming`  | Shimmer placeholders (`Shimmer.svelte`) not matching final card proportions                                |
| Backend/LLM error string | Uncaught `TypeError` string overflowing compact modal body instead of friendly fallback                    |
| Partial optional fields  | Misaligned cards when some rows omit style badges or subtitles                                             |
| All enum badges at once  | Long vs. short status labels breaking fixed column alignment                                               |
| `disabled` vs `busy`     | Busy controls (`brightness-90 grayscale cursor-wait pointer-events-none`) leaking clicks during async work |

---

## 9. Environment & Viewport

Baseline the component, then switch environment conditions to these extremes:

| Condition                                           | Breaks                                                                                                                                       |
| :-------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------- |
| Container at `320px` (`--spacing-grid-width` floor) | Horizontal overflow, modal clipping, and button wrapping                                                                                     |
| Narrow `--spacing-column-unit` sidebar placement    | Wide components compressed into sidebar columns                                                                                              |
| `2560px` ultrawide desktop                          | Overly long prose lines (`max-w-*` missing) or disconnected gutters                                                                          |
| Browser zoom `200%` / enlarged OS font size         | Fixed-pixel `h-*` heights clipping scaled text                                                                                               |
| High-luminance vs dark `--signature-color` extremes | `#fde047` (Lemon Yellow, luminance `0.81`) vs `#15803d` (Forest Green) / `#3b82f6` (Space Blue): white text fails `4.5:1` on solid `#fde047` |
| Coarse pointer / touch viewport (`< 48rem`)         | Hover-only controls unreachable and interactive targets under `44x44px` (`touch-target-coarse`)                                              |

---

## 10. RPGlitch Simulation & Epistemic Payloads

| Payload                                                                                       | Breaks                                                                                                 |
| :-------------------------------------------------------------------------------------------- | :----------------------------------------------------------------------------------------------------- |
| Raw `[SECRET: hidden agenda \| hide]` / `[MOOD: calm]`                                        | Epistemic bracket leakage in UI prose if `\| hide` or bracket stripping is skipped                     |
| Unclosed `[INVENTORY: rusty key, cracked...`                                                  | Bracket parser or highlight spans eating the remainder of a turn message                               |
| Stacked multi-item `[INVENTORY: ...]` / `[STASH: ...]` (`20+` items)                          | Unwrapped chip/bracket inspectors overflowing `DevWing.svelte` or `TextField.svelte`                   |
| Unclosed `<think>` or `<DYNAMICS>` during token stream                                        | Streaming chunk renderer exposing raw internal chain-of-thought before `strip_cognition_blocks` closes |
| `DYNAMICS.SCALE` (`1..100`) edge values (`0`, `1`, `15`, `50`, `85`, `100`, `NaN`)            | `Meter.svelte` / `ProgressBar.svelte` clamping, missing track fill at `1`, or overflow above `100`     |
| Corrupt PNG without `chara` `tEXt` chunk, or non-image blob dropped onto `SourceField.svelte` | `extract_card_from_png` error handling leaving `is_fetching` stuck busy without `finally` reset        |
