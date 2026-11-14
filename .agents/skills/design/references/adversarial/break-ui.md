# Breaking UI (Adversarial Component Stress-Testing)

An adversarial stress-test runbook for identifying layout collapse, clipping, state leakage, and XSS vulnerabilities under realistic worst-case inputs before release.

---

## Operating Posture

Cooperative demo data hides visual defects: single-line character names, populated avatars, short numeric deltas, and well-formed markdown. Stress-testing reverses those defaults one field at a time.

Two failure modes threaten coverage, with the first being the most common blind spot:

1. **Synthetic noise strings**: Repeating `"aaaa..."` across 5,000 characters tests unrealistically flat inputs. Every stress payload must reflect an authentic user entry, LLM output, or schema boundary (`src/config.js`, `src/utils/`).
2. **Focusing only on long strings**: Long names are obvious breaks. Quiet regressions ship through empty fields, orphaned dashes, `1` vs `0` singular/plural counts, broken portrait URLs, and unescaped HTML or markdown tokens.

## Core Rules

1. **Plausible or schema-backed inputs only**: Source fixtures from realistic strings or schema constants in the codebase.
2. **Test through external data boundaries**: Inject payloads via component props, Svelte state stores, or fixture imports rather than mutating component markup solely for testing.
3. **Pack multiple edges per pass**: Combine long names, missing images, boundary numbers, and empty collections into one adversarial fixture set.
4. **Record exact CSS/HTML root causes before patching**: Log which slot failed, the responsible rule, and the targeted layout fix.

---

## Phase 1: Component & Field Inventory Table

Catalog every dynamic slot in the target component and map it to one of the 9 categories in the Worst-Case Catalog (linked in `SKILL.md`):

| Component / Slot | Prop or State Source | Catalog Category | Layout Container | Expected Overflow / Fallback Rule |
| :-- | :-- | :-- | :-- | :-- |
| _Example: EntityCard / Name_ | `entity.name` | People & names | Flex row (`min-w-0`) | Wraps cleanly; multi-script uses `dir="auto"` |
| _Example: ChatBubble / Body_ | `display_text` | RPGlitch payloads / Strings | Flex column | Parsed via `MarkdownIt` + `use:safe_html`; `wrap-anywhere` |

## Phase 2: Adversarial Payload Injection

1. Select the matching stress inputs from each mapped category in `worst-case-catalog.md` plus Section 9 (RPGlitch Simulation & Epistemic Payloads).
2. Render the component at both `320px` (minimum stage width / `--spacing-grid-width` floor), `--spacing-column-unit` narrow sidebar columns, `< 48rem` mobile breakpoint, and `200%` browser zoom.
3. Test dynamic transitions (`busy`, loading, empty, error) and coarse-pointer touch views.

## Phase 3: Failure Signatures & Remediation

| Observed Failure | Root Cause | Canonical Fix |
| :-- | :-- | :-- |
| Avatar or icon squished into an oval | Flex child shrinking | Add `shrink-0` (`flex-shrink: 0`) on avatar or icon frames |
| Text overflows box instead of wrapping or truncating | Flex/grid child defaults to `min-width: auto` | Add `min-w-0` on text column (or `minmax(0, 1fr)` in grid) |
| Unbroken identifier bleeds past card edge | No whitespace break opportunities | Apply Tailwind v4 `wrap-anywhere` (`overflow-wrap: anywhere`) |
| Trailing action pushed off-screen or clipped | Middle column expands unrestrained | `min-w-0` on middle content + `shrink-0` on trailing action |
| Short status badge wraps mid-label | Badge allowed to shrink | `whitespace-nowrap shrink-0` on short pills; allow `flex-wrap` at `320px` if localized labels widen |
| Avatar centered vertically beside wrapped text looks unanchored | `items-center` on multi-line row | Use `items-start` (`align-items: flex-start`) when text wraps |
| Normal words split awkwardly mid-word | `break-all` (`word-break: break-all`) | Replace with `wrap-anywhere` (`overflow-wrap: anywhere`) |
| Numbers jitter horizontally in live counters | Proportional font glyphs | Apply `tabular-nums` (`font-variant-numeric: tabular-nums`) |
| Diacritics or descenders clip top or bottom | Tight `line-height` + `overflow-hidden` | Relax leading or add clearance padding (`pb-tight`) |
| Missing or 404 image leaves blank box or broken icon | Missing fallback layer | Use `ProfilePicture.svelte` (`Avatar.Fallback`: full-bleed `--signature-color` well with centered watermark initials) |
| Raw `<script>`, `&`, or `**text**` misfires | Wrong escaping vs. HTML sink | Plain text: Svelte `{value}` or `escape_html()`. Rich narrative markdown: `MarkdownIt` (`html: false`) + `sanitize()` / `use:safe_html` |

### Truncate, Wrap, or Clamp Strategy

- **Wrap**: Primary text required for comprehension (entity names, story dialogue, active prompt brackets).
- **Truncate at the end**: Secondary metadata where the prefix carries identity (sidebar labels, previews).
- **Truncate in the middle**: File names, UUIDs, or hashes where start and end characters distinguish entries — implement via a JS middle-slice helper before rendering (`text-overflow: ellipsis` only truncates at the end).
- **Clamp (`line-clamp-2` / `line-clamp-3`)**: Multi-line card summaries requiring uniform height for predictable card rhythm.
- **Never truncate**: Numbers, round counters, status states, `YYYY-MM-DD HH:MM` timestamps, or resource budgets.
