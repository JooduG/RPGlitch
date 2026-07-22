---
id: feature-2026-07-22-storymode-enhancements
title: Storymode & UI Feature Enhancements
status: in_progress
created: 2026-07-22
---

# ETERNAL (The Spec)

## Objective
Implement core UI refinements, dual entity import, Ghostwriter prompt assistance, dynamic peak & prologue/epilogue inline image generation, Prologue/Epilogue layout, and Fractal premade female voice defaults.

## Success Criteria
- [ ] UnifiedConsole "advanced" accordion fits cleanly on 1 row.
- [ ] Cog wheel settings button remains unlocked during turn generation STASIS.
- [ ] DevWing "view json data" is left-aligned and `DynamicsMeter.svelte` updates reactively on Director dynamics update.
- [ ] Storyboard button text renamed to "Return to Storyboard".
- [ ] DevMode and Grid overlay toggles merged in settings.
- [ ] Dual import: importing JSON containing both Character & Fractal populates both entity pools.
- [ ] Import modal UI cleaned up ('X', 'raw data', 'import entities' elements removed) and cardhand click animation smoothed out.
- [ ] Storymode profile modal opening uses horizontal 3D card-flip transition matching Storyboard.
- [ ] Ghostwriter feature added to UnifiedConsole: generates prompt draft if input empty, enhances text if draft present (using inverse identity/persona prompts).
- [ ] Director AI kernel instructs inline image generation on substantial/cinematic turns.
- [ ] Prologue & Epilogue messages rendered in special Fractal Message layout: 3 entity cards on top row, narrative prose, and generated image at bottom.
- [ ] Default premade Fractal entities configured with female Kokoro voices.

## Boundaries & Constraints
- Keep components modular following Svelte 5 Rune principles (`$state`, `$derived`, `$effect`).
- Local-first IndexedDB persistence via Dexie.
- Respect aesthetics in `DESIGN.md`.

# FUTURE (The Muscle)

## Phase 1: Quick Console & Dev Tool Refinements
- [ ] **RED**: Write UI & reactivity state test assertions for UnifiedConsole, DevWing, and DynamicsMeter.
- [ ] **GREEN**: Implement UnifiedConsole 1-row accordion layout, STASIS cog wheel unlock, button renaming, left-aligned JSON link, and `DynamicsMeter.svelte` reactive `$effect` binding.
- [ ] **GREEN**: Merge DevMode and Grid overlay toggles in `AppStore`.
- [ ] **REFACTOR**: Verify test suite passes (`npm test`).

## Phase 2: Entity Import Flow & Profile Animation Consistency
- [ ] **RED**: Write dual entity normalizer unit test for combined Character + Fractal JSON payload.
- [ ] **GREEN**: Update `normalizer.js` to process and extract both Character and Fractal from single imported data payloads.
- [ ] **GREEN**: Clean up import card animation in `CardHand.svelte` and streamline Import Modal UI.
- [ ] **GREEN**: Synchronize Storymode profile modal opening with Storyboard 3D card-flip transition.
- [ ] **REFACTOR**: Verify import & transition tests pass.

## Phase 3: Advanced Storymode Features & Ghostwriter
- [ ] **RED**: Write unit tests for Ghostwriter prompt compiler (`render_ghostwriter`) and Director image trigger flag (`<TRIGGER_IMAGE>`).
- [ ] **GREEN**: Implement `render_ghostwriter` in `src/intelligence/prompts.js` swapping `<YOUR_IDENTITY>` and `<USER_PERSONA>`, and integrate Ghostwriter trigger in UnifiedConsole.
- [ ] **GREEN**: Update Director prompt to trigger `<TRIGGER_IMAGE>true</TRIGGER_IMAGE>` on substantial/cinematic events.
- [ ] **GREEN**: Build Prologue & Epilogue Fractal Message component layout (3 entity cards top row, epilogue narrative, and generated image bottom).
- [ ] **REFACTOR**: Verify prompt pipeline and layout tests pass.

## Phase 4: Audio & Voice Expansion
- [ ] **RED**: Write unit test verifying premade Fractal entities have valid female voice configurations.
- [ ] **GREEN**: Add default female Kokoro voice presets (`bf_emma`, `af_bella`, `af_sarah`) to `src/data/premades.js` for `Nova City`, `Ashenweald`, and `Project Tartarus`.
- [ ] **REFACTOR**: Verify full test suite passes cleanly (`npm test`).
