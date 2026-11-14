# Multi-Variant Svelte 5 Prototyping

Temporary exploration harness for comparing 2–3 competing UI or spatial interaction directions side-by-side before committing a winner to `src/ui/`.

## 1. When to Prototype vs Build Directly

- **Prototype when** layout topology, information hierarchy, or interactive pacing admits 2–3 genuinely distinct approaches with clear tradeoffs.
- **Skip prototyping when** the `DESIGN.md` token/component pattern is already settled, the change affects a single visual tweak, or you are editing existing copy/controls.
- **Vary one axis at a time**: generate 2–3 materially different layouts or interaction models rather than cosmetic color, border-radius, or padding variations.
- **Cleanup obligation**: keep prototype code strictly scoped to a temporary harness during exploration. Once a variant is promoted to `src/ui/` (wired to `DESIGN.md` tokens and `src/ui/primitives/`), **delete all temporary prototype files and `.proto-picker` CSS** so `npm run audit:design`, `npm run lint`, and the 4.00 MB Perchance bundle limit remain clean.

## 2. Svelte 5 `{#key}` Stage & State Contract

Drive variant switching and replay purely through Svelte 5 Runes — never inject HTML strings via `innerHTML` or mutate DOM structure outside Svelte templates.

```svelte
<script>
  const VARIANTS = [
    { id: 1, label: "Compact Dock", has_replay: false },
    { id: 2, label: "Split Telemetry", has_replay: true },
  ];

  const initial_variant = Number(new URLSearchParams(location.search).get("variant") ?? 1);
  let active_index = $state(initial_variant >= 1 && initial_variant <= VARIANTS.length ? initial_variant : 1);
  let replay_tick = $state(0);

  function select_variant(next_index) {
    active_index = next_index;
    const url = new URL(location.href);
    url.searchParams.set("variant", String(next_index));
    history.replaceState(null, "", url);
  }
</script>

<!-- Stage switches must be 0ms instant; {#key} replays mount motion cleanly -->
{#key `${active_index}-${replay_tick}`}
  <!-- Render active variant component or {@render snippet()} here -->
{/key}
```

### Stage & Keyboard Rules

1. **Instant switching**: Changing `active_index` swaps the stage in `0ms` with zero crossfade wrapper; only the incoming variant's own mount animation (if any) runs.
2. **Scoped keyboard shortcuts**:
   - `1`–`N`, `ArrowLeft`, `ArrowRight`: switch `active_index` (wrapping or clamping cleanly).
   - `R` / `r`: increment `replay_tick` to remount the active variant (no-op if no variant has mount motion).
   - **Input guard**: Ignore shortcuts when `event.metaKey || event.ctrlKey || event.altKey` is pressed, or when `event.target` is `INPUT`, `TEXTAREA`, `SELECT`, or `isContentEditable`.
3. **Single active state**: Exactly one selector button holds `data-active="true"` and `aria-current="true"` at all times.

## 3. Floating `.proto-picker` Chrome

Because `.proto-picker` is temporary scaffolding (never part of production `DESIGN.md` tokens or shipped `src/` components), keep its stylesheet co-located inside the temporary prototype component `<style>` block and remove it on cleanup.

### Visual & Behavior Spec

| Property               | Specification                                                                                                                                                                                                                                                                                                                                            |
| :--------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Placement**          | `position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%); z-index: var(--z-index-tooltip);`                                                                                                                                                                                                                                                |
| **Top Override**       | Support `data-position="top"` (`top: 24px; bottom: auto;`) only when an active variant occupies bottom-center (`Console` dock area).                                                                                                                                                                                                                     |
| **Glass Pill Surface** | `background: rgba(10, 10, 10, 0.82); backdrop-filter: blur(12px) saturate(1.4); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 999px; padding: 4px;`                                                                                                                                                                                        |
| **Typography**         | Monospace (`var(--font-mono)`), `font-size: 12px`, `font-variant-numeric: tabular-nums`.                                                                                                                                                                                                                                                                 |
| **Active Pill Glide**  | Measure active button metrics and animate a highlight pill strictly with compositor `transform` (`translateX(...) scaleX(...)` with `transform-origin: left center`) using `var(--duration-fast) var(--ease-out)` gated behind `data-ready="true"` set one `requestAnimationFrame` after initial mount so the indicator does not slide from `0` on load. |
| **Reduced Motion**     | `@media (prefers-reduced-motion: reduce)` forces `transition: none` on the sliding indicator.                                                                                                                                                                                                                                                            |
| **Replay Control**     | Append a `1px` vertical hairline divider + `↻` button (`aria-label="Replay variant animation"`) **only** when `VARIANTS.some((variant) => variant.has_replay)` is true.                                                                                                                                                                                  |

## 4. Decision Tradeoff Table & Promotion

Before deleting the prototype and implementing the chosen variant in `src/ui/`, document the comparison cleanly for the user:

| #   | Variant  | Axis Explored    | When It Fits                  | Tradeoff                               |
| :-- | :------- | :--------------- | :---------------------------- | :------------------------------------- |
| 1   | `<Name>` | `<What Changed>` | `<Best Scenario / User Need>` | `<Space, Latency, or Complexity Cost>` |

After selecting the winner:

1. Port the markup and styling into `src/ui/` using compiled `DESIGN.md` utilities (`--duration-*`, `--ease-*`, `--color-*`), `src/ui/primitives/`, and `@media` motion helpers.
2. Delete the temporary prototype file(s) and `.proto-picker` rules.
3. Run `npm run audit:design` and `npm run verify` to confirm zero leftover CSS classes or unused symbols.
