---
id: feature-2026-07-22-storymode-enhancements
status: completed
created: 2026-07-22
completed: 2026-07-22
---

# Track: Storymode & UI Feature Enhancements

## ETERNAL (The Spec)

### Objective

Implement core UI refinements, dual entity import, Ghostwriter prompt assistance, dynamic peak & prologue/epilogue inline image generation, Prologue/Epilogue layout, and Fractal premade female voice defaults.

### Success Criteria

- [x] 8d4605b1 UnifiedConsole "advanced" accordion fits cleanly on 1 row.
- [x] 8d4605b1 Cog wheel settings button remains unlocked during turn generation STASIS.
- [x] 8d4605b1 DevWing "view json data" is left-aligned and `DynamicsMeter.svelte` updates reactively on Director dynamics update.
- [x] 8d4605b1 Storyboard button text renamed to "Return to Storyboard".
- [x] 8d4605b1 DevMode and Grid overlay toggles merged in settings.
- [x] 8d4605b1 Dual import: importing JSON containing both Character & Fractal populates both entity pools.
- [x] 8d4605b1 Import modal UI cleaned up ('X', 'raw data', 'import entities' elements removed) and cardhand click animation smoothed out.
- [x] 8d4605b1 Storymode profile modal opening uses horizontal 3D card-flip transition matching Storyboard.
- [x] 8d4605b1 Ghostwriter feature added to UnifiedConsole: generates prompt draft if input empty, enhances text if draft present (using inverse identity/persona prompts).
- [x] 8d4605b1 Director AI kernel instructs inline image generation on substantial/cinematic turns.
- [x] 8d4605b1 Prologue & Epilogue messages rendered in special Fractal Message layout: 3 entity cards on top row, narrative prose, and generated image at bottom.
- [x] 8d4605b1 Default premade Fractal entities configured with female Kokoro voices.

### Boundaries & Constraints

- Keep components modular following Svelte 5 Rune principles (`$state`, `$derived`, `$effect`).
- Local-first IndexedDB persistence via Dexie.
- Respect aesthetics in `DESIGN.md`.

## FUTURE (The Muscle)

### Phase 1: Quick Console & Dev Tool Refinements

- [x] 8d4605b1 **RED**: Write UI & reactivity state test assertions for UnifiedConsole, DevWing, and DynamicsMeter.
- [x] 8d4605b1 **GREEN**: Implement UnifiedConsole 1-row accordion layout, STASIS cog wheel unlock, button renaming, left-aligned JSON link, and `DynamicsMeter.svelte` reactive `$effect` binding.
- [x] 8d4605b1 **GREEN**: Merge DevMode and Grid overlay toggles in `AppStore`.
- [x] 8d4605b1 **REFACTOR**: Verify test suite passes (`npm test`).

### Phase 2: Entity Import Flow & Profile Animation Consistency

- [x] 8d4605b1 **RED**: Write dual entity normalizer unit test for combined Character + Fractal JSON payload.
- [x] 8d4605b1 **GREEN**: Update `normalizer.js` to process and extract both Character and Fractal from single imported data payloads.
- [x] 8d4605b1 **GREEN**: Clean up import card animation in `CardHand.svelte` and streamline Import Modal UI.
- [x] 8d4605b1 **GREEN**: Synchronize Storymode profile modal opening with Storyboard 3D card-flip transition.
- [x] 8d4605b1 **REFACTOR**: Verify import & transition tests pass.

### Phase 3: Advanced Storymode Features & Ghostwriter

- [x] 8d4605b1 **RED**: Write unit tests for Ghostwriter prompt compiler (`render_ghostwriter`) and Director image trigger flag (`<TRIGGER_IMAGE>`).
- [x] 8d4605b1 **GREEN**: Implement `render_ghostwriter` in `src/intelligence/prompts.js` swapping `<YOUR_IDENTITY>` and `<USER_PERSONA>`, and integrate Ghostwriter trigger in UnifiedConsole.
- [x] 8d4605b1 **GREEN**: Update Director prompt to trigger `<TRIGGER_IMAGE>true</TRIGGER_IMAGE>` on substantial/cinematic events.
- [x] 8d4605b1 **GREEN**: Build Prologue & Epilogue Fractal Message component layout (3 entity cards top row, epilogue narrative, and generated image bottom).
- [x] 8d4605b1 **REFACTOR**: Verify prompt pipeline and layout tests pass.

### Phase 4: Audio & Voice Expansion

- [x] 8d4605b1 **RED**: Write unit test verifying premade Fractal entities have valid female voice configurations.
- [x] 8d4605b1 **GREEN**: Add default female Kokoro voice presets (`bf_emma`, `af_bella`, `af_sarah`) to `src/data/premades.js` for `Nova City`, `Ashenweald`, and `Project Tartarus`.
- [x] 8d4605b1 **REFACTOR**: Verify full test suite passes cleanly (`npm test`).
