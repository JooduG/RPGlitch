
# 📋 Active AI Backlog

*Last Swept: 2026-03-28T05:23:02.798Z*

**Current State**: Mid-refactor of the **Storyboard UI**. We have successfully transitioned the `StoryboardPill` and `StoryboardCard` components into the **Nordic Glass** regime (Chalk tokens, frosted glass, zero-tilt grounded physics).

**Active Problem**: The last session struggled with **Interaction Leakage**—specifically "phantom" clicky cursors appearing in the flex-gaps between cards and buttons. We also had to reconcile "Spooky Red" hover states that defaulted when no entity was present.

## 🧠 Logic (The "Why")

**Decisions**:
- **Vacuum Lock**: Applied `pointer-events: none` to `.storyboard-stack` (flex container) and `pointer-events: auto` to children to kill phantom cursors in the `gap`.
- **Material Parity**: Removed `opacity: 0.6` from empty cards to ensure they have the same material density as active buttons.
- **Spectral Fallback**: Forced `signature_color` to `var(--color-frozen)` when slots are empty to avoid aggressive red alerts.

## ⚒️ Actions (The "What")

### Completed (Nordic Polish)
- [x] **Zero-Tilt Prop**: Removed `use:tilt` from `StoryboardPill.svelte` (Grounded).
- [x] **Placeholder Logic**: Forced interaction through the "Select" button; empty cards are now visual-only (`cursor: default`).
- [x] **Optics Audit**: Hardened cursors on `Button` atom and `StoryboardCard` labels (`pointer-events: none` on spans).
- [x] **Stylelint Cleanup**: Resolved word-break and declaration spacing issues in `StoryboardCard.svelte`.

### 🎭 The Profile Modal (Next Objective)

> [!IMPORTANT]
> **Modal Material Sync**: The profile modal must be refactored into `var(--glass-xl)` to match the new selection drawer. It should feel like a weighty, hardware-accelerated document sliding over the simulation.

- [ ] **Modal Base**: Apply `var(--glass-xl)` and `backdrop-filter: var(--glass-blur-xl)`.
- [ ] **Signature Headers**: Use the entity's signature color for the top border and decorative accents (avoiding harsh reds).
- [ ] **Kinetic Entry**: Standardize the entry animation with an elastic scale or fly-in.
- [ ] **Handoff Logic**: Ensure state-sync between the modal and the library drawer.

**Operational Command**: Open `ProfileModal.svelte` and perform a standard Nordic Glass audit. Verify that no legacy `surface-sunken` or `is-empty` overrides from the previous iteration are present.

---

## 🕒 History Audit (Session: 422c4a6f)

**Goal**: Refine `StoryboardCard` to the Nordic Glass standard and purge "Spooky Red" fallbacks.

**Accomplishments**:
- **Glass-Base Purity**: Transitioned `StoryboardCard.svelte` to the global `.glass-base` utility.
- **Vacuum Lock**: Applied `pointer-events: none` to the storyboard-stack flex container; no more phantom clicky-cursors in gaps.
- **Spectral Defaults**: Changed empty card fallback color to `var(--color-frisk)` (muted) to avoid confusion with active signatures.
- **Logic Cleanup**: Purged unused `is_processing` and `simulationState` variables/imports.
- **Interaction Polish**: Standardized `ProfileQuickLink` hover borders to use the entity's signature color.
- **Verification**: Zero Stylelint or ESLint debt remaining in the organism layer.
