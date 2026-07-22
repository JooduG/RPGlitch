# 📜 FUTURE (The Muscle)

> **Role**: Active implementation blueprint for the _current_ track.
> **Status**: Completed (`feature-2026-07-22-storymode-enhancements`).

This file mirrors the completed implementation plan from [`tasks/tracks/feature-2026-07-22-storymode-enhancements.md`](./tracks/feature-2026-07-22-storymode-enhancements.md).

## ✅ Completed Mission: Storymode & UI Feature Enhancements

Track ID: `feature-2026-07-22-storymode-enhancements`

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

## 🗺️ Roadmap (Tracks)

The canonical roadmap lives in [`PRESENT.md`](./PRESENT.md).
