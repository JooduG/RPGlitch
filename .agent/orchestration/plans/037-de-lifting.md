# Implementation Plan - [037] Kinetic De-lifting & Hover Rescaling

This mission addresses user feedback regarding the "Y-Lift" hover effect. We will remove the vertical displacement (lift) from all components while maintaining atmospheric highlights (shadows/glows) and tactile feedback (active-state scaling).

## User Review Required

> [!IMPORTANT]
> **What stays**: 
> - **Tactile Active Scale**: Buttons will still "press down" (scale 0.96) when clicked.
> - **Atmospheric Highlights**: Hovering will still trigger `filter: brightness(1.1)` and `box-shadow` blooms.
> - **Action Registry**: `use:pulse`, `use:spin`, etc., are unaffected as they are opt-in behaviors.
> - **Transition Tokens**: We will keep `--motion-fast` timing to ensure color and shadow shifts remain smooth.
> [!NOTE]
> We will be removing the `transform: translateY(...)` calls from the hover states of the following components.

## Proposed Changes

### 💎 Atmosphere & Highlights

#### [MODIFY] [tokens.css](file:///c:/Users/johng/source/repos/RPGlitch/src/theme/tokens.css)
- Zero out `--motion-hover-y` and `--motion-button-hover-y` (set to `0`) or remove them to ensure the "lift" is mathematically dead.

### 🃏 Component Cleanup

#### [MODIFY] [Button.svelte](file:///c:/Users/johng/source/repos/RPGlitch/src/ui/atoms/Button.svelte)
- Remove `transform: translateY(var(--motion-button-hover-y))` from `.button:hover`.
- Ensure `:active` scaling remains.

#### [MODIFY] [LibraryCard.svelte](file:///c:/Users/johng/source/repos/RPGlitch/src/ui/organisms/library/LibraryCard.svelte)
- Remove `transform: translateY(var(--motion-hover-y))` from hover logic.

#### [MODIFY] [StoryboardCard.svelte](file:///c:/Users/johng/source/repos/RPGlitch/src/ui/organisms/storyboard/StoryboardCard.svelte)
- Remove `transform: translateY(var(--motion-hover-y))` from `.storyboard-stack:hover`.

#### [MODIFY] [VectorCard.svelte](file:///c:/Users/johng/source/repos/RPGlitch/src/ui/organisms/profile/VectorCard.svelte)
- Remove `transform: translateY(var(--motion-hover-y))` from hover logic.

#### [MODIFY] [InputBar.svelte](file:///c:/Users/johng/source/repos/RPGlitch/src/ui/organisms/storymode/InputBar.svelte)
- Remove `transform: translateY(var(--motion-button-hover-y))` from `.input-bar-unit.is-focused`.

#### [MODIFY] [ControlPanel.svelte](file:///c:/Users/johng/source/repos/RPGlitch/src/ui/organisms/panels/ControlPanel.svelte)
- Remove `transform: translateY(var(--motion-button-hover-y))` from `.nav-button:hover`.

---

## Open Questions
- None. The request was direct: remove the lift, keep the rest.

## Verification Plan

### Automated Tests
- `npm run verify` to ensure zero regression in CSS/JS purity.

### Manual Verification
- Verify that hovering buttons/cards no longer causes them to "jump" vertically.
- Verify that clicking buttons still results in a subtle "press" scale effect.
- Verify that hover glows and brightness shifts are still active.
