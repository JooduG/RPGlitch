---
id: storyboard-card-bleed-remediation-2026-05-18
type: bug
status: completed
created_at: 2026-05-18T09:37:00Z
updated_at: 2026-05-18T20:40:00Z
description: Remediate signature color bleed and text legibility in storyboard cards.
---

# Storyboard Card Bleed Remediation

## ETERNAL

### 🎯 Objective

Remediate visual anomalies in the `StoryboardCard` component where:

1. The background of the card (especially the placeholder initials view) is fully filled with bright signature colors.
2. The dynamic overlay backdrop gradient (the linear scrim) is too shallow, skewed diagonally at `-15deg`, and extremely transparent (only 30% opacity at 35% height), allowing signature color to bleed upward and overwhelm the text block.
3. The card title `.header .primary` is styled with `var(--signature-color)`, leading to poor legibility and contrast clash.

### 📊 Success Criteria

- [x] **Robust Scrim Overlay**: Replace the `-15deg` angled gradient with a vertical `to top` linear gradient with deeper backdrop coverage.
- [x] **High-Contrast Typography**: Change the card title color from `var(--signature-color)` to `var(--frisk)`.
- [x] **Zero Signature Bleed**: Ensure vibrant signature colors do not leak through the backdrop gradient.

## FUTURE

### Phase 1: Design Review & Target Identification

- [x] Analyze exact lines of CSS in `StoryboardCard.svelte`.
- [x] Identify optimal gradient scrim values using Nordic tokens in `DESIGN.md`.

### Phase 2: Code Refactoring & Implementation

- [x] Refactor `.header` gradient scrim in `StoryboardCard.svelte`.
- [x] Refactor `.header .primary` typography styling for superb readability.

### Phase 3: Quality Gates & Verification

- [x] Run `npm run verify` to ensure CSS stylelint compliance and test success.
- [x] Perform browser verification using the DevTools/browser subagent to audit the result.

## PRESENT

- **Current Status**: ✅ Completed
- **Active Task**: All phases completed and verified via quality suite.
- **Pulse**:
  - 2026-05-18T09:37:00Z: Initialize track and specs (planning)
  - 2026-05-18T20:40:00Z: Refactored ProfilePicture.svelte initials placeholder background to use custom radial signature glow over var(--chalk); refactored StoryboardCard hover state background-color to use ghost signature color. Verified with a full verify cycle.
