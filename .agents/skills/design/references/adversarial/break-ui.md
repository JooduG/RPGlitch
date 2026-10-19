---
name: break-ui
description: Adversarial UI stress-testing guide. Tests components against worst-case realistic data (unbreakable strings, diacritics, long names, empty states, boundary counts) and documents failure signatures and fixes.
---

# Breaking UI (Adversarial Component Stress-Testing)

An adversarial reference runbook. Its purpose is to take a piece of UI that looks clean with cooperative demo data, find the realistic worst case for every value it renders, and document what broke.

## Operating Posture

Demo data is chosen, usually without anyone noticing, to make the design look good: names that fit on one line, counts that never need a separator, every optional field filled in. The job here is to undo that choice, one field at a time.

Two failure modes, and the first is worse:

1. **Nonsense data.** `"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"` and 5,000-character strings prove nothing. Every worst-case value must be something a real user or LLM generation could plausibly produce, or the limit from the schema.
2. **Stopping at long text.** Long names are the obvious break. The ones that ship are the short name that leaves an orphaned dash, the missing avatar, the count of exactly 1 ("1 members"), the empty feed, and the unescaped markdown tag.

## Core Rules

1. **Plausible or schema-backed, never random.** Each worst-case value is either a realistic example or the actual limit from validation schemas or database columns.
2. **Change the data, not the component.** The worst case enters through the same boundary demo data does: props, stores, or fixtures.
3. **One dataset, many failures.** A single worst-case dataset should hit multiple edge cases at once across different rows.
4. **Report before fixing.** List the breaks, identify their root cause CSS/HTML signatures, and propose targeted fixes.

## Failure Signatures & CSS Fixes

| What you see                                         | Cause                                       | Fix                                                           |
| :--------------------------------------------------- | :------------------------------------------ | :------------------------------------------------------------ |
| Avatar or icon squished into an oval                 | Flex child shrinking                        | `flex-shrink: 0` on the avatar, icon, or fixed container      |
| Text overflows box instead of wrapping/truncating    | Flex/grid child has `min-width: auto`       | `min-width: 0` on the text column (`minmax(0, 1fr)` in grid)  |
| Long unbroken identifier runs past card edge         | No break opportunities in the string        | `overflow-wrap: anywhere` or `break-words`                    |
| Trailing action/button pushed off-screen or clipped  | Middle content expanded without constraint  | `min-width: 0` on middle column, `flex-shrink: 0` on action   |
| Status badge wraps onto two lines                    | Badge allowed to shrink                     | `white-space: nowrap; flex-shrink: 0` on badge                |
| Avatar centered against multi-line text looks adrift | `align-items: center` on multi-line row     | Top-align (`align-items: flex-start`) once text wraps         |
| Long word breaks mid-word awkwardly                  | `word-break: break-all`                     | `overflow-wrap: anywhere` breaks only when strictly necessary |
| Numbers jitter when updating in dials/meters         | Proportional width figures                  | `font-variant-numeric: tabular-nums`                          |
| Diacritics or descenders clipped top or bottom       | Tight `line-height` with `overflow: hidden` | Relax `line-height` or add reserve padding (`pb-1`)           |
| Broken image portrait                                | Missing fallback state                      | Fall back to styled initials ring and signature hue           |
| Content renders raw `<tag>`, `&`, or `**text**`      | Double-encoding or unescaped HTML           | Use deterministic DOMPurify fragment parsing                  |

## Truncate, Wrap, or Clamp Strategy

- **Wrap**: Text the user needs in full to identify entities: names, primary story prose.
- **Truncate at the end**: Secondary metadata where the start carries meaning: agendas, inventory notes, previews.
- **Truncate in the middle**: File names, UUIDs, or hashes where the beginning and ending distinguish entries.
- **Clamp** (`line-clamp: 2` or `line-clamp: 3`): Multi-line previews in compact cards to maintain rhythm.
- **Never truncate**: Numbers, status values, dates, or resource tallies.

## Reference Catalog

- [Worst-Case Catalog](./worst-case-catalog.md) — Dictionary of realistic breaking strings across names, identifiers, copy, and numbers.
