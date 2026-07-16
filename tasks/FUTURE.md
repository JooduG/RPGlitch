# Implementation Plan: Clean & Solid View Transitions

## Goal

Fix visual jitter, snapping, ghostly cross-fading, and disjointed button morphing when transitioning between Storyboard and Storymode by:

1. Decoupling nested parent/child `view-transition-name` properties.
2. Overriding default cross-fade animations to make the persistent console and cards transition as solid blocks of machinery.

## Steps

- [x] Edit Storyboard.svelte to update the wrapper div view-transition-name properties.
- [x] Edit Storymode.svelte to update the wrapper div view-transition-name properties.
- [x] Edit UnifiedConsole.svelte to assign view-transition-name: unified-console to the console inner chassis.
- [x] Remove individual view-transition-names from UnifiedConsole.svelte inner buttons/controls.
- [x] Edit DESIGN.md to add base overrides that disable cross-fade for card-slot-ai, card-slot-user, and unified-console.
- [x] Run design token synchronization (npm run sync).
- [x] Verify changes using npm run verify.
