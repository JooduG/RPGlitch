# Storymode SOTA Refactor (Mariana Trench)

This mission targets the core simulation interface components to ensure they meet the highest standards of architectural purity and aesthetic fidelity. Following the success of the `StoryboardCard` refactor, we will apply the same "Mariana Trench" philosophy to the Storymode layer.

## User Review Required

> [!IMPORTANT]
> The refactor involves significant DOM flattening. While visual parity is the goal, some minute adjustments to scroll behavior or spacing might occur. We will verify these via manual UI audit.

## Proposed Changes

### Storymode Components

#### [MODIFY] [Message.svelte](file:///c:/Users/johng/source/repos/RPGlitch/src/ui/storymode/Message.svelte)

- **Flattening**: Reduce redundant `div` wrappers in the message row and bubble structure.
- **Logic**: Refactor entity and signature color resolution into a more declarative `$derived` structure.
- **CSS**: Harmonize nomenclature with Ultra-Lean standards. Replace hardcoded dimensions with design tokens (e.g., `min-width`, `max-width`).
- **Optimization**: Ensure the holographic border and glassmorphic effects are performant.

#### [NEW] [Message.test.js](file:///c:/Users/johng/source/repos/RPGlitch/src/ui/storymode/Message.test.js)

- Implement component-level tests for sender-based styling, signature color resolution, and action button visibility.

#### [MODIFY] [StorymodeFeed.svelte](file:///c:/Users/johng/source/repos/RPGlitch/src/ui/storymode/StorymodeFeed.svelte)

- **CSS**: Replace `12.5rem` and `25rem` with semantic tokens or CSS variables.
- **Logic**: Review auto-scroll implementation for potential Svelte 5 optimizations.

#### [MODIFY] [InputBar.svelte](file:///c:/Users/johng/source/repos/RPGlitch/src/ui/storymode/InputBar.svelte)

- **Flattening**: Ensure the `GlassPill` usage is optimal.
- **CSS**: Replace hardcoded `1.25rem` and `12.5rem` with design tokens.

---

## Verification Plan

### Automated Tests

- `npm run test:unit` (specifically `StorymodeFeed.test.js`).
- `npm run deploy:prepare` (Lint/Audit/Build).

### Manual Verification (The Proving Grounds)

- **Visual Audit**: Verify glassmorphism, signature colors, and holographic borders in the story feed.
- **Interaction Audit**: Test hover states, focus behavior, and action button visibility.
- **Responsive Audit**: Check centering for Fractal messages and alignment for User/AI messages.
- **Scroll Audit**: Ensure auto-scroll remains fluid during streaming.
