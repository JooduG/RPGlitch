# RPGlitch Typography System Refactor: Before and After Report

## 1. Executive Summary

This report documents the baseline audit, architectural redesign, enforcement tooling, and visual verification of the RPGlitch typography update comparing `HEAD` (`9c2b26203`, `:4002`) against the working tree (`:4001`).

The refactor replaced 74 ad-hoc Tailwind typography class combinations found in `typography.md` with a two-layer system in `DESIGN.md`:

- **Layer 1 (`@layer base`):** Recalibrated semantic `<h1>` to `<h6>` tags locked to RPGlitch's `0.25rem` (`4px`) vertical rhythm grid, paired with full typographic inheritance (`font: inherit`) on form controls.
- **Layer 2 (`@utility`):** Four everyday primitives (`type-body`, `type-interact`, `type-uppercase-label`, `type-data`), with `--font-display` (`Satisfy`) quarantined as a single-component exception in `StoryboardTitle.svelte`.

Automated Playwright verification across 10 UI states at `1440x900` (`reducedMotion: "reduce"`, `document.fonts.ready`, all `<img>` decoded, `1200ms` settle) produced:

- **3 confirmed visual regressions** requiring targeted fixes (`07 Dialog`, `03 Card Hand`, `09 Profile Edit` footer).
- **4 open visual taste decisions** to resolve before compiler lockout (`EntityCard` casing/size, `Profile` hero height, button casing split, `ChatBubble` line-height).
- **Broad legibility and alignment improvements** across `10 DevBubble`, `06 Console Panel`, `09 DevWing`, `04 Profile Read` metadata, and edit-mode stability (eliminating a `-24px` layout jump on the `Profile` hero).

---

## 2. Baseline State ("Before" Audit)

### 2.1 Original `DESIGN.md` Configuration

The baseline `DESIGN.md` defined four font tokens (`--font-display`: `"Satisfy", cursive`, `--font-heading`: `"Ubuntu", sans-serif`, `--font-mono`: `"JetBrains Mono", monospace`, `--font-sans`: `"Inter", sans-serif`), a `0.25rem` spacing unit (`--spacing-unit`), and a manual `@theme` entry `--breakpoint-mobile: 48rem` (numerically identical to Tailwind's default `md:`).

The original `@layer base` stylesheet applied marketing-page fluid `clamp()` scales to `h1` through `h6` and `small`/`code`:

| Tag | Original `DESIGN.md` Formula | Computed Range (16px root) | Ceiling Width | Operational Issue |
| :-- | :-- | :-- | :-- | :-- |
| `h1` | `clamp(3rem, 5vw + 2rem, 6rem)` | `48px` to `96px` | `1280px` | Pinned at `96px` on desktop; overpowered `Profile` card height |
| `h2` | `clamp(2.8rem, 4.5vw + 2.2rem, 4.8rem)` | `44.8px` to `76.8px` | `924px` | Far too large for modals or panels; overridden `2/2` times |
| `h3` | `clamp(2rem, 3vw + 1.6rem, 3.2rem)` | `32px` to `51.2px` | `853px` | Unused across the codebase |
| `h4` | `clamp(1.6rem, 2vw + 1.4rem, 2.4rem)` | `25.6px` to `38.4px` | `800px` | Oversized for a body-equivalent heading; produced `38.4px` in `CardHand` |
| `h5` | `clamp(1.1rem, 1.2vw + 1rem, 1.5rem)` | `17.6px` to `24px` | `667px` | Unused across the codebase |
| `h6` | `clamp(1rem, 1vw + 0.9rem, 1.25rem)` | `16px` to `20px` | `560px` | Larger than or equal to body text with `-0.02em` tracking; fought uppercase eyebrows |
| `small` | `clamp(0.8rem, 0.6vw + 0.7rem, 0.95rem)` | `12.8px` to `15.2px` | `667px` | Bypassed by explicit `text-xs` stacks |
| `code` | `clamp(0.8rem, 0.6vw + 0.7rem, 0.95rem)` | `12.8px` to `15.2px` | `667px` | Overridden `1/1` time |

Because most `clamp()` formulas hit their ceilings between `560px` and `924px`, headings sat static at oversized desktop maximums while scaling awkwardly at small widths.

### 2.2 Baseline Codebase Inventory (`typography.md`)

Auditing `src/**/*.svelte` surfaced **74 unique typography class combinations** split across 9 clusters:

| Audit Category              | Total Occurrences | Bare (`DESIGN.md`) |               Local Override               |
| :-------------------------- | :---------------: | :----------------: | :----------------------------------------: |
| `<h1>`                      |         1         |         0          |                     1                      |
| `<h2>`                      |         2         |         0          |                     2                      |
| `<h4>`                      |         1         |         0          |                     1                      |
| `<h6>`                      |         4         |         0          |                     4                      |
| `<code>`                    |         1         |         0          |                     1                      |
| `<p>`                       |        16         |         2          |                     14                     |
| Inline `style="font-..."`   |         2         |         0          | `Profile.svelte:573`, `Profile.svelte:601` |
| Scoped `<style>` font rules |         1         |         0          |       `LayoutGrid.svelte` (2 props)        |

Cluster distribution of the 74 unique class strings:

- `h1`: 2 combinations
- `p (body)`: 6 combinations
- `small`: 5 combinations
- `code`: 6 combinations
- `Display Title`: 2 combinations
- `Mono Uppercase Badges / Telemetry`: 11 combinations (26 total instances)
- `UI Controls / Labels`: 21 combinations
- `Prose / Italic / Muted`: 10 combinations
- `Misc / Fragments`: 11 combinations

### 2.3 Root Causes of Baseline Drift

1. **Zero bare heading adoption:** Every `<h1>`, `<h2>`, `<h4>`, `<h6>`, and `<code>` tag overrode `DESIGN.md` because the base ladder mismatched real UI density.
2. **Uppercase kicker fragmentation:** More than 25 near-duplicate uppercase tracked strings existed across `font-sans` (12 instances of `font-bold tracking-widest uppercase` across `Accordion`, `Label`, `SourceField`, `CardHand`, `Console`, `DevBubble`, `Profile`) and `font-mono` (11 combinations across `DevWing`, `VisualWing`, `ImagePreview`, `DevBubble`, `Profile`, `ChatBubble`), mixing `tracking-wide`, `tracking-wider`, and `tracking-widest` alongside `font-semibold` and `font-bold`.
3. **Partial form-control reset and edit-mode tag swapping:** `DESIGN.md` reset `font-family`, `font-size`, `line-height`, and `color` on form elements while omitting `font-weight`, `letter-spacing`, `text-transform`, and `text-shadow`. Templates also swapped tags in edit mode (`Profile.svelte:556` `<input>` at `72px` with `tracking-normal` vs. `Profile.svelte:589` `<h1>` at `96px` with `tracking-tight`; `StoryCard.svelte:88` `<input>` vs. `102` `<span>`; `Profile.svelte:610` `<textarea>` vs. `646` `<p>`), creating duplicated classes and a `-24px` vertical jump on edit.
4. **Parent leaks and colliding utilities:** Applying typography utilities to wrappers forced defensive resets (`font-sans normal-case text-xs tracking-normal` in `Slider.svelte:192` and `Tooltip.svelte:421`; `font-normal font-sans text-xs tracking-normal` in `Profile.svelte:1002`). Multiple templates carried same-axis utility collisions (`leading-snug leading-tight` and `tracking-wide tracking-widest` in `EntityCard.svelte:472`; `tracking-tight tracking-wider` in `BracketList.svelte:168`; `font-bold font-medium` in `ChatBubble.svelte:486`).
5. **Inconsistent font territories:** `Inter`, `Ubuntu`, and `JetBrains Mono` competed for identical roles (for example, `StoryCard` titled in `Inter` while `EntityCard`, `ContextMenu`, `Avatar`, and `ChatBubble` used `Ubuntu`).

---

## 3. Target Typography Architecture ("After" Design)

### 3.1 Conceptual Model

Design-system theory separates UI text into 12 to 16 semantic roles (Navigation, Conversation Content, Temporal Metadata, Input/Composition, System Feedback), while a Svelte + Tailwind codebase operates best with 4 to 6 concrete primitives plus orthogonal utility modifiers. Styling headings directly on native HTML tags (`h1` to `h6`) paired with 4 focused `@utility` primitives prevents wrapper component bloat and aligns with RPGlitch's existing `@utility` architecture (`glass-input`, `terminal-box`, `mask-border-solid`).

### 3.2 Exclusive Font Family Territories

Each typeface holds a single non-overlapping job:

- **`--font-heading` (`Ubuntu`):** Structural headings (`<h1>` to `<h5>`).
- **`--font-sans` (`Inter`):** Baseline reading prose (`body`, `<p>`, `type-body`) and interactive UI widgets (`type-interact`).
- **`--font-mono` (`JetBrains Mono`):** All uppercase tracked eyebrows/labels (`<h6>`, `type-uppercase-label`) and uncapped telemetry, brackets, code, and tabular numbers (`<code>`, `type-data`).
- **`--font-display` (`Satisfy`):** One-off exception quarantined to `StoryboardTitle.svelte`. Excluded from core everyday primitives.

### 3.3 Vertical Rhythm & Tailwind v4 `calc()` Line-Height Math

Line heights use Tailwind v4's unitless `calc(target-rem / font-size-rem)` formula so every line box snaps to a multiple of `0.25rem` (`4px`, matching `--spacing-unit`) while remaining a unitless multiplier that inherits safely:

- `0.75rem` (`12px`) with `calc(1 / 0.75)` -> `16px` line box (`1.33` ratio)
- `0.75rem` (`12px`) with `calc(1.25 / 0.75)` -> `20px` line box (`1.67` ratio)
- `0.875rem` (`14px`) with `calc(1.25 / 0.875)` -> `20px` line box (`1.43` ratio)
- `1rem` (`16px`) with `calc(1.5 / 1)` -> `24px` line box (`1.50` ratio)
- `1.25rem` (`20px`) with `calc(1.75 / 1.25)` -> `28px` line box (`1.40` ratio)
- `1.5rem` (`24px`) with `calc(2 / 1.5)` -> `32px` line box (`1.33` ratio)

### 3.4 Recalibrated Semantic Headings (`@layer base`)

Heading tags encode document outline by active view hierarchy (`h1` = primary title of active view). In traditional browser defaults, `h4` matches body size (`1rem` / `16px`), while `h5` (`~13.3px`) and `h6` (`~10.7px`) fall below modern UI legibility thresholds. The new scale keeps `h4` at `1rem`, steps `h5` to `0.875rem`, and holds `h6` at the `0.75rem` (`12px`) legibility floor using uppercase tracked mono:

| Tag | Font | Size | Line-Height (Box) | Weight / Tracking | Target Role |
| :-- | :-- | :-- | :-- | :-- | :-- |
| `h1` | `Ubuntu` | `clamp(2.25rem, 4vw + 1rem, 4rem)` (`36px` to `64px`) | `1.1` | `800` / `-0.02em` | Active view hero (`Profile` name / nested `<input>`) |
| `h2` | `Ubuntu` | `1.5rem` (`24px`) | `calc(2 / 1.5)` (`32px`) | `700` / `-0.02em` | Major panel or modal title |
| `h3` | `Ubuntu` | `1.25rem` (`20px`) | `calc(1.75 / 1.25)` (`28px`) | `700` / `-0.01em` | Card title or major section (`EntityCard`) |
| `h4` | `Ubuntu` | `1rem` (`16px`, body size) | `calc(1.5 / 1)` (`24px`) | `700` / `0` | Subheading, speaker header, `StoryCard` title |
| `h5` | `Ubuntu` | `0.875rem` (`14px`) | `calc(1.25 / 0.875)` (`20px`) | `700` / `0` | Compact header (`ContextMenu`, small fanned cards) |
| `h6` | `JetBrains Mono` | `0.75rem` (`12px`) | `calc(1 / 0.75)` (`16px`) | `700` / `0.1em` / `uppercase` | Section eyebrow (`PHYSICAL`, `NON-PHYSICAL`, compact section headers) |

### 3.5 Chameleon Form Reset (`@layer base`)

```css
button,
input,
optgroup,
select,
textarea {
  font: inherit;
  letter-spacing: inherit;
  text-transform: inherit;
  text-shadow: inherit;
  margin: 0;
  color: inherit;
}
```

HTML5 allows `<input>` inside `<h1>` through `<h6>` (phrasing content). Keeping the heading tag mounted in both read and edit modes and placing `<input aria-label="...">` inside it makes read and edit states pixel-identical without duplicating classes.

### 3.6 Four Everyday Primitives (`@utility`)

Interactive controls use `type-interact` inside `@atoms` rather than bare `<button>` / `<select>` rules because `bits-ui` renders `<div>` widgets with ARIA roles and bare `<button>` elements wrap cards, icons, and mono accordion triggers.

| Utility | Font | Size / Line-Height | Weight / Extra | Target Role |
| :-- | :-- | :-- | :-- | :-- |
| `type-body` | `Inter` | `1rem` / `calc(1.5 / 1)` | `400` / `letter-spacing: 0` | Chat dialogue, modal copy, bios, standalone `<textarea>` composers |
| `type-interact` | `Inter` | `0.875rem` / `calc(1.25 / 0.875)` | `500` / `letter-spacing: 0` | Buttons, dropdown triggers/items, context menu rows, toggles, sliders, tooltips |
| `type-uppercase-label` | `JetBrains Mono` | `0.75rem` / `calc(1 / 0.75)` | `700` / `0.1em` / `uppercase` | Non-heading uppercase labels, accordion triggers, badges, telemetry tags (matches `<h6>`) |
| `type-data` | `JetBrains Mono` | `0.75rem` / `calc(1.25 / 0.75)` | `400` / `tabular-nums` | Dev logs, prompt brackets, timestamps, meters, progress counters, `<code>` |

Orthogonal modifiers (`italic`, `font-bold`, `text-sm`, `truncate`, color/opacity) layer on top of base tags or `type-*` utilities. Applying `type-*` strictly to leaf text nodes stops inheritance leaks into child widgets.

### 3.7 Three-Layer Automated Enforcement Plan

1. **Template Linter (`scripts/check-typography.mjs`):** Scans `src/**/*.svelte` with `--warn` migration mode, strict CI exit `1`, `<!-- typography-ignore: <reason> -->` escape hatch, and `StoryboardTitle.svelte` exemptions. Six rules:
   - `no-inline-font-style`: Blocks inline `style="font-..."` and `style:...` typography props.
   - `no-raw-uppercase-label`: Blocks `uppercase` paired with `tracking-*`.
   - `no-raw-font-recipe`: Blocks `font-heading` or `font-mono` paired with `tracking-*`, `leading-*`, or font-size `text-*`.
   - `no-heading-override`: Blocks typography overrides on `<h1>` through `<h6>`.
   - `no-typography-collision`: Blocks duplicate utilities on the same typographic axis without distinct responsive/state prefixes.
   - `no-font-display`: Quarantines `font-display` to `StoryboardTitle.svelte`.
2. **Stylelint Svelte Override:** Disallows `/^font(-|$)/`, `line-height`, `letter-spacing`, and `text-transform` inside `src/**/*.svelte` `<style>` blocks while exempting `src/media/design.css`.
3. **Post-Migration Tailwind v4 Compiler Lockout:** After migration and visual sign-off, adding `--tracking-*: initial;` and `--leading-*: initial;` inside `@theme` in `DESIGN.md` prevents ad-hoc tracking and leading drift at compile time.

---

## 4. Quantitative Before-and-After Diff (`HEAD` vs. Working Tree)

### 4.1 Pixel Diff Summary (Playwright, `1440x900`)

| Screen | Changed Pixels | Primary Typography & Layout Delta |
| :-- | :-: | :-- |
| **01 Storyboard** | `6.67%` | `StoryboardTitle` `<h1>` tightened (`lh: 45.76px` vs. `62.4px`); `EntityCard` titles shifted from `24px uppercase` `<span>` to `20px` sentence-case `<h3>` |
| **02 Context Menu** | `6.25%` | Menu header moved to bare `<h5>` (`Ubuntu 14px`), menu rows to `type-interact`, plus Storyboard cards behind the menu |
| **03 Card Hand** | `2.67%` | `#hand-title` dropped from `38.4px` `Ubuntu` `<h4>` to `12px` `JetBrains Mono` `<h6>` (`SELECT AI CHARACTER`); library card titles shifted to sentence-case `<h5>` |
| **04 Profile (Read)** | `11.69%` | Hero `<h1>` scaled from `96px` (`-2.4px` tracking) to `64px` (`-1.28px`); section `<h6>` eyebrows shifted to `12px` `JetBrains Mono`; description `lh` locked to `20px` |
| **05 Profile (Edit)** | `12.46%` | `0px` edit-mode jump (`64px` -> `64px` on `<h1>` `<input>`); wing headers (`type-uppercase-label`) and footer updates |
| **06 Console Panel** | `3.89%` | Accordion triggers (`AUDIO`, `STORYBOARD`, `LIBRARY`, `ADVANCED`) moved to `12px` `JetBrains Mono`; `StoryCard` title moved from `Inter` to `Ubuntu 16px` `<h4>` |
| **07 Dialog** | `2.28%` | `<h6>` title (`WIPE DATA?`) shrank from `20px` `Ubuntu` to `12px` `JetBrains Mono`; body `<p>` tightened from `26px` to `24px` line-height |
| **08 Storymode** | `2.04%` | `ChatBubble` prose tightened from `26px` (`leading-relaxed`) to `24px` (`type-body`) |
| **09 Profile + DevWing** | `16.60%` | `DevWing` mono telemetry (`BORN:` / `SYNC:`, `VIEW JSON DATA`), `<h1>` `<input>` (`72px` -> `64px`), and `@ORION · 1ST PERSON` edit footer |
| **10 Storymode + DevBubble** | `7.45%` | `DevBubble` headers unified under `type-uppercase-label` and bracket chips under `type-data`; `ChatBubble` on `type-body` |

### 4.2 Computed Typography Metrics (`OLD` -> `NEW`)

| Element | `OLD` (`HEAD`) | `NEW` (Working Tree) | Measured Effect |
| :-- | :-- | :-- | :-- |
| **Profile Read `<h1>`** | `Ubuntu` / `96px` / `lh: 96px` / `ls: -2.4px` | `Ubuntu` / `64px` / `lh: 70.4px` / `ls: -1.28px` | Calibrated to app scale; reveals 2 extra trait rows above fold |
| **Profile Edit `<input>`** | `Ubuntu` / `72px` / `lh: 72px` / `ls: normal` | `Ubuntu` / `64px` / `lh: 70.4px` / `ls: -1.28px` | Eliminated `-24px` read-to-edit size jump (`0px` shift) |
| **Profile Description `<p>` / `<textarea>`** | `Inter` / `14px` / `lh: 22.75px` | `Inter` / `14px` / `lh: 20px` | Locked to `4px` vertical grid (`20px`) |
| **Profile Section `<h6>`** | `Ubuntu` / `20px` / `lh: 30px` / `ls: 2px` | `JetBrains Mono` / `12px` / `lh: 16px` / `ls: 1.2px` | Unified mono eyebrow |
| **CardHand `#hand-title`** | `<h4>` `Ubuntu` / `38.4px` / `lh: 57.6px` | `<h6>` `JetBrains Mono` / `12px` / `lh: 16px` | Over-reduced focal overlay title (regression) |
| **EntityCard Title** | `<span>` `Ubuntu` / `24px` / `uppercase` | `<h3>` `Ubuntu` / `20px` / `sentence-case` | Semantic `<h3>`; quieter presence on Storyboard |
| **Accordion Label** | `Inter` / `10px` / `lh: 15px` | `JetBrains Mono` / `12px` / `lh: 16px` | Raised above `12px` legibility floor |
| **StoryCard Title** | `<span>` `Inter` / `16px` / `lh: 24px` | `<h4>` `Ubuntu` / `16px` / `lh: 24px` | Aligned entity/card titles to `Ubuntu` |
| **Dialog Title `<h6>`** | `Ubuntu` / `20px` / `lh: 30px` | `JetBrains Mono` / `12px` / `lh: 16px` | Shrank below body text (regression) |
| **Dialog Body `<p>`** | `Inter` / `16px` / `lh: 26px` | `Inter` / `16px` / `lh: 24px` | Locked to `4px` vertical grid (`24px`) |
| **Storymode Composer** | `Inter` / `16px` / `lh: 24px` | `Inter` / `16px` / `lh: 24px` | Unchanged |

---

## 5. Screen-by-Screen Visual Assessment

### 01 & 02: Storyboard & Context Menu (`02-context-menu-old.jpg` vs. `02-context-menu-new.jpg`)

- **Entity Cards:** `NOVA CITY` and `GLITCH` changed from `24px` all-caps to `20px` sentence-case (`Nova City`, `Glitch`). The cards look more editorial and less poster-like; single-word titles like `Glitch` carry slightly less weight against the artwork.
- **Context Menu:** The `Orion the Pink Protector` header (`<h5>`) and action rows (`Profile`, `Profile Picture`, `Enable AI Voice`, `Swap`) on `type-interact` look cleaner and better balanced than baseline.

### 03: Card Hand (`03-card-hand-old.jpg` vs. `03-card-hand-new.jpg`)

- **Overlay Title (`#hand-title`):** `SELECT AI CHARACTER` collapsed from a `38.4px` `Ubuntu` anchor into a faint `12px` mono line lost in the dark blurred backdrop.
- **Fanned Cards:** Moving small card labels (`Beast`, `Dr. Elias Tariq`, `Glitch`, `Hank 'Rust' Brawley`, `Julien the Banished Prince`, `Orion the Pink Protector`, `Lord Benedict Silvers`) from all-caps to sentence-case `<h5>` improved scannability and reduced crowding at narrow card widths.

### 04: Profile Read (`04-profile-read-old.jpg` vs. `04-profile-read-new.jpg`, `04-profile-read-diff.jpg`)

- **Hero & Vertical Space:** Reducing `Orion the Pink Protector` from `96px` to `64px` traded poster-scale impact for practical density, pulling two additional trait rows (`EYES`/`FACE` and `SPEECH`) into view without scrolling. Most magenta signal in `04-profile-read-diff.jpg` reflects upward vertical reflow from this hero reduction.
- **Metadata & Footer:** `PHYSICAL`, `NON-PHYSICAL`, all pink bracket keys (`GENDER`, `ETHNICITY`, `HEIGHT`, `AGE`, `BELIEF`, `SPONSORSHIP`, `FEAR`, `CIVILIAN_MODE`, `SPEECH`), and the `@ORION · 1ST PERSON` footer became noticeably crisper and more legible than baseline micro-text.

### 06: Console Panel (`06-console-panel-old.jpg` vs. `06-console-panel-new.jpg`)

- **Accordion & Controls:** Upgrading `AUDIO`, `STORYBOARD`, `LIBRARY`, `ADVANCED`, `DEVMODE`, and `GRID` from `10px Inter` to `12px JetBrains Mono` (`type-uppercase-label`) produced a clear legibility gain and reinforced the terminal aesthetic.
- **StoryCard:** `Visual Diff Fixture` in `Ubuntu` `<h4>` above tabular mono `2025-11-22 15:00` established clean visual hierarchy.
- **Casing Split Observed:** The `DELETE ALL` button renders in uppercase mono (`type-uppercase-label`), contrasting with `Erase All` in sentence-case `Inter` inside `07 Dialog`.

### 07: Dialog (`07-dialog-old.jpg` vs. `07-dialog-new.jpg`)

- **Modal Title:** `WIPE DATA?` shrank from `20px` bold `Ubuntu` to `12px` `JetBrains Mono` (`<h6>`), making the destructive confirmation heading smaller than its own `16px` paragraph copy.
- **Body Copy:** Tightening body line-height from `26px` to `24px` produced a compact, clean 3-line block.

### 08: Storymode (`08-storymode-old.jpg` vs. `08-storymode-new.jpg`, `08-storymode-diff.jpg`)

- **ChatBubble:** On the 2-line test fixture, tightening line-height from `26px` to `24px` is subtle, shifting the bubble's bottom edge upward by a few pixels. Composer text is pixel-identical.

### 09: Profile Edit + DevWing (`09-profile-devwing-old.jpg` vs. `09-profile-devwing-new.jpg`)

- **Hero Input:** `<h1>` `<input>` dropped from `72px` (`Orion the P`) to `64px` (`Orion the Pin`), matching Read mode (`0px` shift) and fitting more characters inside the field.
- **Right Sidebar (DevWing):** Every control label (`POSITIVE PROMPT`, `NEGATIVE PROMPT`, `FLIP IMAGE`, `VOICE`, `CADENCE: BRISK`, `CHAOS`, `INTENSITY`, `OPENNESS`, `AFFINITY`, `VIEW JSON DATA`) and bottom-right metadata (`BORN:`, `SYNC:`) improved substantially in clarity at `12px` mono.
- **Edit Footer Bug:** The bottom-left `[icon] ORION` input visible on an underline in `09-old` vanished or clipped in `09-new`, leaving a faint pink mark on the left while `1ST PERSON` shifted right next to the `▲` button. Because `@ORION · 1ST PERSON` renders properly in `04 Profile Read`, this defect is isolated to Edit mode.
- **Prompt Header Icons:** Action icons on the right edge of the `POSITIVE PROMPT` and `NEGATIVE PROMPT` headers appear in `09-old` and are absent in `09-new`. Verify whether this is a fixture/hover difference or clipping caused by taller `12px` labels.

### 10: Storymode + DevBubble (`10-storymode-devbubble-old.jpg` vs. `10-storymode-devbubble-new.jpg`, `10-storymode-devbubble-diff.jpg`)

- **Telemetry Console:** Biggest single visual upgrade in the pass. Baseline sub-`12px` mismatches across `15:00`, `PORTRAIT`, `(DIRECTOR)`, `TRAIT`, `MOOD`, and `VIEW RAW DATA` unified onto one crisp `12px` `JetBrains Mono` baseline. The diff mask (`10-storymode-devbubble-diff.jpg`) confirms clean row expansion and downward bubble reflow with zero clipping.

---

## 6. Consolidated Issue Triage

### 6.1 Confirmed Regressions (Must Fix)

1. **`07 Dialog` hierarchy inversion:** `WIPE DATA?` stayed on `<h6>` literally and shrank below `16px` body copy. Promote dialog titles to `<h3>` (`20px` `Ubuntu`) or `<h2>` (`24px` `Ubuntu`) so modal headers match their structural weight.
2. **`03 Card Hand` title collapse:** `SELECT AI CHARACTER` was demoted from `<h4>` (`38.4px`) to `<h6>` (`12px`) to preserve uppercase styling, erasing the overlay's visual anchor. Promote to `<h2>` (`24px` `Ubuntu`) or `<h3>` (`20px` `Ubuntu`).
3. **`09 Profile Edit` footer regression:** Restore visibility and flex alignment for the `@ORION` handle input in Profile edit mode (`09-new` vs. `09-old`), and verify why the `POSITIVE PROMPT` / `NEGATIVE PROMPT` header action icons disappeared.

### 6.2 Open Taste Decisions (Analyze Systemic Impact Before Locking)

1. **`EntityCard` title treatment (`02` Storyboard vs. `03` Card Hand):** Decide whether Storyboard cards stay `20px` sentence-case `<h3>`, step up to `<h2>` (`24px`), or retain uppercase styling while keeping `03 Card Hand`'s compact `<h5>` sentence-case.
2. **`Profile` Hero `<h1>` ceiling (`04` / `09`):** Decide between keeping `64px` (better proportion, 2 extra visible trait rows, fits more edit characters) or raising the `h1` max slightly (for example, `72px` to `80px`) to recover poster impact while keeping read and edit modes locked to the same size.
3. **Action button convention (`06 Console` vs. `07 Dialog`):** Standardize whether action buttons uniformly use `type-interact` (sentence-case `Inter`, like `Erase All`) or whether console/destructive buttons intentionally use `type-uppercase-label` (like `DELETE ALL`).
4. **`ChatBubble` multi-paragraph density (`08 Storymode`):** Spot-check a 3 to 4 paragraph roleplay response to confirm whether `24px` (`1.5`) feels right for extended reading or whether chat prose benefits from `26px` (`1.625`).

### 6.3 Confirmed Wins (Keep As-Is)

- `10 Storymode + DevBubble` unified `12px` mono telemetry baseline.
- `06 Console Panel` accordion headers, toggles, and `Ubuntu` `StoryCard` hierarchy.
- `09 DevWing` sidebar labels, stat meters, and `BORN:` / `SYNC:` legibility.
- `04 Profile Read` bracket key and footer sharpness.
- Zero read-to-edit `<h1>` layout shift via nested `<input>` inheritance.
- `02 Context Menu` header and `type-interact` item polish.

---

## 7. Next Steps Before Lock-In

1. Resolve the 3 regressions (`Dialog` heading level, `CardHand` `#hand-title` level, `Profile` edit footer + prompt header icons).
2. Lock final choices on the 4 taste decisions and check how any `DESIGN.md` change (`h1` ceiling, button convention, card titles, `type-body` line-height) propagates across all views.
3. Re-run the Playwright visual diff suite to confirm clean output on `03`, `07`, and `09`.
4. Flip `lint:typography` to strict mode (`0` violations), apply the `@theme` `--tracking-*: initial;` / `--leading-*: initial;` lockout in `DESIGN.md`, run `npm run sync:css`, and complete full lint, test, and build verification.
