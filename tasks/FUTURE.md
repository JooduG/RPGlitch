# 📜 FUTURE (The Muscle)

> **Role**: Active implementation blueprint for the _current_ track.
> **Status**: Active (`feature-2026-07-22-storymode-enhancements`).

This file mirrors the active implementation plan from [`tasks/tracks/feature-2026-07-22-storymode-enhancements.md`](./tracks/feature-2026-07-22-storymode-enhancements.md).

## 🚀 Active Mission: Storymode & UI Feature Enhancements

Track ID: `feature-2026-07-22-storymode-enhancements`

### Phase 1: Quick Console & Dev Tool Refinements

- [ ] **RED**: Write UI & reactivity state test assertions for UnifiedConsole, DevWing, and DynamicsMeter.
- [ ] **GREEN**: Implement UnifiedConsole 1-row accordion layout, STASIS cog wheel unlock, button renaming, left-aligned JSON link, and `DynamicsMeter.svelte` reactive `$effect` binding.
- [ ] **GREEN**: Merge DevMode and Grid overlay toggles in `AppStore`.
- [ ] **REFACTOR**: Verify test suite passes (`npm test`).

### Phase 2: Entity Import Flow & Profile Animation Consistency

- [ ] **RED**: Write dual entity normalizer unit test for combined Character + Fractal JSON payload.
- [ ] **GREEN**: Update `normalizer.js` to process and extract both Character and Fractal from single imported data payloads.
- [ ] **GREEN**: Clean up import card animation in `CardHand.svelte` and streamline Import Modal UI.
- [ ] **GREEN**: Synchronize Storymode profile modal opening with Storyboard 3D card-flip transition.
- [ ] **REFACTOR**: Verify import & transition tests pass.

### Phase 3: Advanced Storymode Features & Ghostwriter

- [ ] **RED**: Write unit tests for Ghostwriter prompt compiler (`render_ghostwriter`) and Director image trigger flag (`<TRIGGER_IMAGE>`).
- [ ] **GREEN**: Implement `render_ghostwriter` in `src/intelligence/prompts.js` swapping `<YOUR_IDENTITY>` and `<USER_PERSONA>`, and integrate Ghostwriter trigger in UnifiedConsole.
- [ ] **GREEN**: Update Director prompt to trigger `<TRIGGER_IMAGE>true</TRIGGER_IMAGE>` on substantial/cinematic events.
- [ ] **GREEN**: Build Prologue & Epilogue Fractal Message component layout (3 entity cards top row, epilogue narrative, and generated image bottom).
- [ ] **REFACTOR**: Verify prompt pipeline and layout tests pass.

### Phase 4: Audio & Voice Expansion

- [ ] **RED**: Write unit test verifying premade Fractal entities have valid female voice configurations.
- [ ] **GREEN**: Add default female Kokoro voice presets (`bf_emma`, `af_bella`, `af_sarah`) to `src/data/premades.js` for `Nova City`, `Ashenweald`, and `Project Tartarus`.
- [ ] **REFACTOR**: Verify full test suite passes cleanly (`npm test`).

## 🗺️ Roadmap (Tracks)

The canonical roadmap lives in [`PRESENT.md`](./PRESENT.md).
