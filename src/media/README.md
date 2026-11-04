# RPGlitch Sensory Cortex (`src/media/`)

## Overview

Sensory presentation layer for **RPGlitch** (Rank 1 Sensory / Platform Sibling).
This package encapsulates procedural Web Audio sound effect synthesis, browser Web Speech voice fallback, pure optics tier taxonomy, Perchance stateless image generation dispatching, design tokens, and transitional compatibility facades.

### Parallel Coexistence & Migration Architecture

`src/media/` is built as the **sovereign sensory presentation layer** running alongside legacy consumers until Phase 4 (Gate 4) atomic cutover:

- **Zero Upward Dependencies**: Imports downward strictly from `@utils`, `@config`, and `@platform`. Never imports from `@storage`, `@data`, `@engine`, `@intelligence`, `@state`, or `@ui`.
- **Procedural SFX (Zero Remote Audio Assets)**: All UI sound effects are procedurally synthesized using Web Audio oscillators, biquad filters, and noise envelopes. Zero remote `.wav` file downloads or network dependencies.
- **Excised Kokoro Neural Stack**: The legacy 1,248-line ONNX/WebGPU Kokoro neural voice pipeline and 373-line `speech.js` have been purged to protect the 4.00 MB bundle ceiling and 50 MiB iframe memory boundary. In-browser speech synthesis is handled cleanly via the standard Web Speech API.
- **Transitional Facade Shims**: Re-export shims [`audio.svelte.js`](./audio.svelte.js) and [`visual.svelte.js`](./visual.svelte.js) preserve parallel operation for legacy consumers (`Feed.svelte`, `Message.svelte`, `story.js`, and unit test mocks) without breaking imports.

## Interface

The package exposes its public interface via [`src/media/index.js`](./index.js):

### 1. Procedural Web Audio SFX & Web Speech API Voice

- [`play_sfx(type, options)`](./audio.js): Plays procedurally synthesized sound effects (`"click"`, `"pop"`, `"glitch"`, `"alert"`, `"subtle_hum"`). Cleans up audio nodes immediately on ended to prevent memory leaks.
- [`init_audio_on_gesture()`](./audio.js): Unlocks and resumes the shared hardware `AudioContext` on first verified user interaction.
- [`suspend_audio()`](./audio.js): Suspends hardware `AudioContext` when idle or tab is hidden.
- [`close_audio_context()`](./audio.js): Closes and resets the audio graph.
- [`get_audio_context()`](./audio.js), [`get_master_gain()`](./audio.js): Returns shared Web Audio instances.
- [`set_master_volume(level)`](./audio.js): Sets master volume `[0.0 - 1.0]` in memory.
- [`toggle_mute()`](./audio.js): Toggles audio mute state.
- [`VoiceEngine`](./audio.js): Web Speech API voice synthesis controller exposing `speak(text, should_clear_queue, force)`, `stop()`, `pause()`, and `toggle_pause()`.
- Pure Voice Helpers: [`get_cadence_rate(role, dynamics)`](./audio.js), [`resolve_voice_uri(role, character)`](./audio.js), [`resolve_voice_name(name)`](./audio.js), [`normalize_role(role, options)`](./audio.js).
- Transitional Facades: [`Audio`](./audio.js) / `audio_engine`, `AudioEngine`.

### 2. Stateless Perchance Visual Dispatcher & Queue Bookkeeping

- [`dispatch_visual_generation(payload, options)`](./visual.js): Dispatches visual generation to the host Perchance `generate_image` iframe plugin with exponential backoff (2500ms initial for 429/503), circuit breaker failure insulation, and `AbortSignal` cancellation. Returns deterministic SVG data URIs in offline/test environments.
- In-Flight Set Bookkeeping: [`mark_generation_in_flight(id, index)`](./visual.js), [`clear_generation_in_flight(id, index)`](./visual.js), [`is_generation_in_flight(id, index)`](./visual.js), [`reset_generation_in_flight()`](./visual.js).
- Queue & Ghost Lifecycle: [`spawn_image_beat(tier, options)`](./visual.js), [`sweep_stale_ghosts()`](./visual.js), [`count_pending_ghosts()`](./visual.js), [`mark_placeholder_failed(id, metadata)`](./visual.js), [`reset_image_generation_queue()`](./visual.js).
- Host Plugin Discovery: [`find_image_engine()`](./visual.js), [`reset_cached_image_engine()`](./visual.js).
- Transitional Facades: [`visual_engine`](./visual.js), `VisualEngine`.

### 3. Pure Optics Taxonomy & Guidance Scale

- `IMAGE_TIERS`: The 4 canonical image generation tiers `["story_entities", "story_character", "solo_entity", "story_scene"]`.
- `DEFAULT_IMAGE_TIER`: Default scene tier (`"story_scene"`).
- [`normalize_image_tier(target_type)`](./optics.js): Normalizes tier keys and colloquial aliases to canonical tier names.
- [`get_resolution(mode)`](./optics.js): Resolves `{ width, height }` dimensions from `IMAGE_RESOLUTIONS`.
- [`get_tier_guidance_scale(mode)`](./optics.js): Returns calibrated guidance scale (7 for `story_scene`, 9 for character/solo).
- [`resolve_image_trigger(parameters)`](./optics.js): Evaluates dual-source image trigger arbitration (Director explicit vs dynamics gate) with 3-round cooldown.

### 4. Visual Color Palettes & Signature Tokens

- [`get_signature_color(entity)`](./palette.js): Resolves hex color code for entity's signature color.
- [`get_signature_label(entity)`](./palette.js): Resolves uppercase label for entity signature color.
- [`ensure_theme_tokens()`](./palette.js): Injects design tokens into DOM.
- `SIGNATURE_COLORS`, `PALETTE`, `PALETTE_CSS_VARIABLES`, `TOKENS`: Authoritative Nordic visual tokens generated from `DESIGN.md`.

## Invariants

- **Zero Upward Layer Violations**: `src/media/` must never import from `@storage`, `@data`, `@engine`, `@intelligence`, `@state`, or `@ui`.
- **User Gesture Requirement**: `AudioContext` is never constructed during module evaluation. It is strictly instantiated or resumed on verified user interaction (`pointerdown`, `keydown`).
- **Memory Leak Protection**: Every procedural SFX node explicitly detaches event handlers (`source.onended = null`) and disconnects from the audio graph upon completion.
- **Bounded Queue**: Active background image generation queue is bounded to 5 slots (`IMAGE_GENERATION_QUEUE_CAPACITY = 5`). Overflows evict the oldest unresolved placeholder and mark it failed.
- **Ghost Card Limit**: Unresolved placeholders older than 2 minutes (`IMAGE_GHOST_MAX_AGE_MS = 120000`) are swept as stale. Hard cap of 5 pending ghosts (`IMAGE_PLACEHOLDER_HARD_CAP = 5`) halts new triggers.
- **Calibrated Guidance Scales**: Diffusion CFG guidance scales are strictly preserved at 7 for environmental scenes and 9 for character portraits.
- **Stateless Dispatch**: Greenfield generation calls are stateless functions taking payloads and options; no UI progress state is held at Rank 1.

## Side Effects

- **Web Audio Hardware**: Activates and modulates the browser hardware sound device.
- **Web Speech API**: Dispatches spoken dialogue utterances via `window.speechSynthesis`.
- **Perchance Iframe Messages**: Sends diffusion generation payloads across iframe boundaries to the host Perchance environment.
- **Session Driver Attachments**: Updates simulation feed log attachments via `state_bridge.session_driver` during background image resolution.

## Verification

- Run test suites:
  - `npx vitest run src/media/` (Runs `audio.test.js`, `visual.test.js`, `optics.test.js`, `tokens.test.js`)
