# Implementation Plan - [036] Animation & Kinetic Assessment

This mission performs a deep structural audit of the RPGlitch motion ecosystem. We will move away from "vibe-based" hardcoded durations and inconsistent behaviors toward a standardized, token-driven Kinetic Registry.

## Animation Inventory Audit (Current State)

The following inconsistencies have been identified across the component tree:

| Category | Component | Hover Interaction | Transition Property | Kinetic Language |
| :--- | :--- | :--- | :--- | :--- |
| **Atoms** | `Button (Primary)` | Static Color Shift | `background` | Static |
| | `Button (Signature)` | **TranslateY** | `transform` | Kinetic (Vertical) |
| | `Toggle` | Glow / Bloom | `box-shadow` | Atmospheric |
| **Molecules** | `Attachment` | **Scale (1.02x)** | `transform` | Kinetic (Zoom) |
| **Organisms** | `LibraryCard` | **TranslateY** | `transform` | Kinetic (Vertical) |
| | `StoryboardCard` | Static (Shadow/Bloom) | `box-shadow` | Atmospheric |
| | `VectorCard` | **TranslateX** | `transform` | Kinetic (Horizontal) |
| | `Message Actions` | Opacity Jump | `opacity` | Static |

## User Review Required

> [!IMPORTANT]
> **The Unified Kinetic Signature**: I propose we standardize on **Vertical Displacement (Y-Lift)** for all interactive surfaces (Cards, Buttons, Toggles) to create a cohesive "Nordic Depth" feel. 
> - Everything interactive lifts on hover.
> - Everything interactive pulses/pops on click.
> - Horizontal slides (TranslateX) will be eliminated to prevent visual cognitive load.
> [!CAUTION]
> **Performance Budget**: Any animations found targeting `width`, `height`, or `margin` will be refactored to use `transform: scale` or `translate` to prevent layout thrashing (Pank).

## Proposed Changes

### 🔋 Kinetic Registry (Actions)

#### [MODIFY] [kinetic.js](file:///c:/Users/johng/source/repos/RPGlitch/src/ui/utils/actions/kinetic.js)
- Refactor internal constants to dynamically read from `tokens.css` via `getComputedStyle` where possible, or align hardcoded defaults with the source of truth.
- Standardize durations: Replace manual `300ms`/`400ms` entries with `--motion-fast`/`--motion-slow` equivalents.

### 📐 Structural Transitions (Svelte)

#### [MODIFY] Multiple components in `src/ui/organisms/`
- Identify components using hardcoded `in:fade={{ duration: 300 }}` and migrate to token-based durations.
- Targets: `StorymodeFeed`, `StoryboardCard`, `ProfileWings`, `Modal`.

---

## Open Questions

- **Haptic Preference**: Should we consider "Haptic Easing" (snappier, shorter) for mobile devices separately from the desktop Nordic defaults?
- **Interactive Depth**: Should `tilt` remain an optional opt-in or be promoted to a global `material-interactive` class?

## Verification Plan

### Automated Tests
- Run `npm run verify` to ensure no lint regressions.
- Verify that `kinetic.js` imports stay clean of DOM-leakage.

### Manual Verification
- **Performance Baseline**: Verify that animations do not trigger layout recalculations in Chrome DevTools Performance panel.
- **Aesthetic Consistency**: Check `StorymodeFeed` and `StoryboardCard` for unified "Weighted Nordic" timing.
