# [Refactor] Standardizing Z-Index Design Tokens

Audit and refactor the z-index token system to ensure 100% compliance with the 3-tier design token architecture. This eliminates legacy `--z-` tokens and raw foundation usages in favor of semantic Tier 2 tokens.

## User Review Required

> [!IMPORTANT]
> I am introducing new semantic tokens to bridge the gap between `--surface-z-index` (10) and `--overlay-z-index` (100).
> Specifically, I'm adding `--surface-peak-z-index` (20) and `--mid-z-index` (50) to accommodate existing use cases that were hardcoded to foundations.

> [!NOTE]
> The `max-z-index` (9999) used for the noise layer is preserved as it ensures the "atmospheric noise" covers all visual elements while allowing interaction via `pointer-events: none`.

## Proposed Changes

### [Theme]

#### [MODIFY] [engine.css](file:///c:/Users/johng/source/repos/RPGlitch/src/theme/engine.css)

- Add new semantic tokens:
  - `--surface-peak-z-index`: `var(--z-index-20)` (For elements sitting atop a surface, e.g., headers).
  - `--mid-z-index`: `var(--z-index-50)` (For intermediate layers like dev tools or floating wings).
- Clean up any unused or legacy comments in the z-index section.

### [UI Components - Legacy Cleanup]

#### [MODIFY] Multiple Files (Atomic & Feature Components)

Replace legacy and foundation tokens with semantic equivalents:

| Legacy/Foundation                  | Semantic Replacement          | Impacted Files                                                                                                                   |
| :--------------------------------- | :---------------------------- | :------------------------------------------------------------------------------------------------------------------------------- |
| `var(--z-surface)`                 | `var(--surface-z-index)`      | `GlassPill.svelte`, `Skeleton.svelte`, `TextField.svelte`, `Button.svelte`                                                       |
| `var(--z-0)`                       | `var(--floor-z-index)`        | `ProfilePicture.svelte`                                                                                                          |
| `var(--z-50)`, `var(--z-index-50)` | `var(--mid-z-index)`          | `Storymode.svelte`, `VisualWing.svelte`, `DevWing.svelte`, `StoryCard.svelte`, `ImagePreview.svelte`, `DevTelemetryBlock.svelte` |
| `var(--z-index-20)`                | `var(--surface-peak-z-index)` | `Message.svelte`, `VectorArray.svelte`                                                                                           |
| `var(--z-index-10)`                | `var(--surface-z-index)`      | `Message.svelte`, `VectorArray.svelte`, `EntityFragments.svelte`                                                                 |

#### [MODIFY] [VectorArray.svelte](file:///c:/Users/johng/source/repos/RPGlitch/src/ui/profile/VectorArray.svelte)

- Refactor `calc(var(--modal-z-index) + 1)` to use `var(--overlay-peak-z-index)` if it needs to be above normal surfaces, or a more appropriate local stack.

## Verification Plan

### Automated Tests

- `npm run lint:css` to ensure no raw `z-index` values or disallowed tokens remain.
- `svelte-check` to verify no broken variable references.

### Manual Verification

- Inspect `Modal` and `Drawer` overlays to ensure they still stack correctly above the main UI.
- Verify `Tooltip` and `ImagePreview` are still visible at the highest layers.
- Check that the `Message` component headers correctly stack above their bodies.
