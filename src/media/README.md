# RPGlitch Sensory Cortex (`src/media/`)

## Overview

Sensory presentation layer for **RPGlitch** (Rank 1 Sensory / Platform Sibling).
This package encapsulates procedural Web Audio sound effect synthesis, browser Web Speech voice fallback, unified Svelte 5 kinetic motion and card-flight physics, pure optics tier taxonomy, Perchance stateless image generation dispatching, design tokens, and transitional compatibility facades.

### Parallel Coexistence & Migration Architecture

`src/media/` is built as the **sovereign sensory presentation layer** running alongside legacy consumers:

- **Zero Upward Dependencies**: Imports downward strictly from `@utils`, `@config`, `../definitions/visual-styles.js`, and `svelte/easing` / `svelte/motion`. Never imports from `@data`, `@engine`, `@intelligence`, `@state`, or `@ui`.
- **Procedural SFX (Zero Remote Audio Assets)**: All UI sound effects are procedurally synthesized using Web Audio oscillators (`OscillatorNode`), noise buffers (`AudioBufferSourceNode`), and gain envelopes (`GainNode`). Zero remote `.wav` file downloads or network dependencies.
- **Excised Kokoro Neural Stack**: In-browser speech synthesis is handled cleanly via the standard Web Speech API (`window.speechSynthesis`) rather than an ONNX/WebGPU neural voice pipeline, protecting the 4.00 MB bundle ceiling and 50 MiB iframe memory boundary.
- **Unified Kinetic Engine & Transitional Facades**: [`motion.svelte.js`](./motion.svelte.js) unifies reduced-motion detection, kinetic hover actions, Svelte transitions, and storyboard card flights, while [`audio.svelte.js`](./audio.svelte.js) (`Audio`, `AudioEngine`, `audio_engine`) and [`visual.svelte.js`](./visual.svelte.js) (`visual_engine`, `VisualEngine`) preserve facade compatibility.

## Interface

The package exposes its public interface via [`index.js`](./index.js):

### 1. Procedural Web Audio SFX & Web Speech API Voice (`audio.svelte.js`)

- [`audio.svelte.js`](./audio.svelte.js):
  - `play_sfx(type, options = {})`: Plays procedurally synthesized sound effects (`"click"`, `"pop"`, `"glitch"`, `"alert"`, `"subtle_hum"`, fallback tone) and cleans up audio nodes on `onended`.
  - `init_audio_on_gesture()`, `suspend_audio()`, `close_audio_context()`, `get_audio_context()`, `get_master_gain()`: Hardware `AudioContext` and `GainNode` lifecycle management.
  - `set_master_volume(level)`, `toggle_mute()`: Master gain and mute controls.
  - `VoiceEngine`: Web Speech API voice synthesis controller exposing `is_role_enabled()`, `load_voices()`, `preview()`, `resume_context()`, `set_volume()`, `speak()`, `stop()`, `pause()`, `resume()`, `toggle_pause()`, `destroy()`, `apply_stream_role()`, `queue_stream_sentence()`, `flush_stream_remainder()`, and `reset_stream()`.
  - Pure Voice Helpers & Cadences: `VOICE_CADENCES`, `CADENCE_RATES` (direct export in `audio.svelte.js`, not re-exported by `index.js`), `voice_role_key(role)`, `normalize_role(role, options)`, `resolve_voice_uri(name_or_uri)`, `resolve_voice_name(name_or_uri)`, `get_cadence_rate(cadence, dynamics_value = 50)`.
  - Transitional Facades: `AudioEngine`, `Audio`, and `audio_engine` (direct export in `audio.svelte.js`, aliased as `Audio` in `index.js`).

### 2. Unified Kinetic & Motion Physics Engine (`motion.svelte.js`)

- [`motion.svelte.js`](./motion.svelte.js):
  - `motion`: Reactive `$state` namespace tracking `intensity` (`0.0`–`1.0`) and `is_reduced` (`prefers-reduced-motion`).
  - Kinetic Svelte Actions: `pulse(node)`, `roll(node)`, `shimmy(node)`, `stab(node)`.
  - Svelte Transitions: `overlay_in(_node, options)`, `overlay_out(_node, options)`, `item_in(_node, options)`.
  - Card Flight & Scrub Primitives: `fly_card_in(source_el, from_rect, to_rect, options)`, `fly_card_out(source_el, to_rect, options)`, `make_card_clone(el, tag, z)`, `rect_of(el)`, `strip_card_text(el)`, `capture_storyboard_flight(enabled)`, `fly_storyboard_cards_into_prologue(assets, dst_rects)`, `update_card_scrub()`, `clear_card_location()`.

### 3. Stateless Perchance Visual Dispatcher & Queue Bookkeeping (`visual.svelte.js`)

- [`visual.svelte.js`](./visual.svelte.js):
  - `dispatch_visual_generation(payload, options = {})`: Dispatches visual generation to the host Perchance image plugin with `AbortSignal` cancellation, `CircuitBreaker` insulation, `ExponentialBackoffRetryer` retries, or offline SVG fallback.
  - Visual Prompt Hygiene: `rescue_visual_prose(text)`, `sanitize_visual_text(text)`, `resolve_story_beat_style(options)`, `compose_story_beat_prompt(prompt_text, style_key, base_negative = "")`.
  - In-Flight Set & Queue Bookkeeping: `_in_flight_image_generations`, `_image_generation_queue`, `mark_generation_in_flight(id, attachment_index = 0)`, `clear_generation_in_flight(id, attachment_index = 0)`, `is_generation_in_flight(id, attachment_index = 0)`, `reset_generation_in_flight()`, `get_image_generation_queue()`, `reset_image_generation_queue()`, `_remove_from_image_generation_queue(id)` (direct export in `visual.svelte.js`, not re-exported by `index.js`).
  - Ghost & Beat Lifecycle: `spawn_image_beat(tier, options = {})`, `sweep_stale_ghosts()`, `count_pending_ghosts()`, `mark_placeholder_failed(id, metadata = {})`.
  - Host Plugin Discovery & Facades: `find_image_engine()`, `reset_cached_image_engine()`, `VisualEngine`, `visual_engine`, `set_visualizer_envision_impl(fn)`.

### 4. Pure Optics Taxonomy & Guidance Scale (`optics.js`)

- [`optics.js`](./optics.js):
  - `IMAGE_TIERS`: Canonical frozen tuple `["story_entities", "story_character", "solo_entity", "story_scene"]`.
  - `ORDERED_VISUAL_STYLE_KEYS`: Frozen tuple of `_visual_style_*` trait keys (`medium`, `palette`, `camera`, `composition`, `texture`, `tags`).
  - `normalize_image_tier(target_type)`, `get_resolution(mode)`, `get_resolution_string(mode)`, `get_tier_guidance_scale(mode)`, `resolve_image_trigger(parameters)`.
  - `resolve_visual_engine_tokens(visual_style_key)`, `build_aesthetic_map(entity = {})`, `flatten_aesthetic_map(entity = {})`, `extract_aesthetic_traits(entity = {})`, `render_optics_fallback(parameters)`.

### 5. Visual Color Palettes & Signature Tokens (`palette.js`, `tokens.js`)

- [`palette.js`](./palette.js):
  - `get_signature_color(entity, fallback = "var(--color-frozen)")`, `get_signature_label(entity)`, `ensure_theme_tokens()`.
  - Direct module exports not in `index.js`: `resolve_token(color)`, `get_deterministic_color(seed = "default")`, `get_color_name(color_value)`.
- [`tokens.js`](./tokens.js):
  - `SIGNATURE_COLORS` (15 labels), `PALETTE` (28 frozen color-to-hex entries), `PALETTE_CSS_VARIABLES` (28 frozen hex-to-CSS-var entries), `TOKENS` (90 frozen design-system tokens generated from `DESIGN.md`).

## Invariants

- **Zero Upward Layer Violations**: `src/media/` must never import from `@data`, `@engine`, `@intelligence`, `@state`, or `@ui`; `VisualEngine.envision` requires runtime dependency injection via `set_visualizer_envision_impl(fn)`.
- **Silent Boot & User Gesture Audio (`audio.svelte.js`)**: `AudioContext` is never constructed at module evaluation, `is_muted` and `VoiceEngine.enabled` boot disabled, `init_audio_on_gesture()` races `context.resume()` against a 1500ms timeout, and every procedural SFX node detaches `source.onended = null` and disconnects on completion.
- **Accessibility & Card-Flight Locking (`motion.svelte.js`)**: `motion.is_reduced` tracks `(prefers-reduced-motion: reduce)`, suppressing kinetic actions (except `roll`), collapsing transition durations to `0`, and bypassing `fly_storyboard_cards_into_prologue`; `_begin_flight_running` prevents overlapping prologue flights.
- **Bounded Queue & Stale Ghost Sweep (`visual.svelte.js`)**: Active pending image beats and queue depth are capped at `IMAGE_POLICY.MAX_PENDING_IMAGES` (`5`), overflowing queues evict and fail the oldest placeholder, and `sweep_stale_ghosts()` sweeps unresolved entries older than `TIMING_MS.CEILING` (`120000` ms) while sparing `_in_flight_image_generations`.
- **Template Syntax Hygiene & Fault Insulation (`visual.svelte.js`)**: `sanitize_visual_text()` strips `{`, `}`, `[`, `]`, and `@` from `@TARGET` tokens before Perchance evaluation; `dispatch_visual_generation()` enforces `visual_circuit_breaker` (`failure_threshold: 3`, `success_threshold: 2`, `recovery_timeout: 30000` ms) and `visual_retryer` (`max_attempts: 3`, `initial_delay: 2500` ms, `max_delay: 15000` ms).
- **Calibrated Guidance Scales & Trigger Arbitration (`optics.js`)**: `get_tier_guidance_scale()` returns `IMAGE_POLICY.GUIDANCE.SCENE` (`7`) for `"story_scene"` and `IMAGE_POLICY.GUIDANCE.CHARACTER` (`9`) for character/group tiers; `resolve_image_trigger()` enforces at most 1 image beat per round with independent `IMAGE_POLICY.COOLDOWN_ROUNDS` (`3`) cooldowns and Director preemption over Dynamics.
- **Generated Token Artifacts (`tokens.js`)**: `tokens.js` is generated from `DESIGN.md` via `npm run sync:css`; edit `DESIGN.md` rather than hand-editing generated values.

## Side Effects

- **Web Audio & Web Speech Hardware (`audio.svelte.js`)**: Registers `{ once: true }` gesture-unlock listeners on `document`, queries `window.speechSynthesis.getVoices()` with a `"voiceschanged"` listener at module load, instantiates and resumes `AudioContext` / `GainNode` / oscillators, and dispatches `SpeechSynthesisUtterance` playback.
- **DOM Mutation, Listeners & Timers (`motion.svelte.js`, `palette.js`)**: Subscribes to `window.matchMedia("(prefers-reduced-motion: reduce)")`, injects `<style id="card-flight-scrub-style">` into `document.head`, clones and animates `document.body` nodes via Web Animations and `requestAnimationFrame`, toggles `data-scrub-hidden`/`tabindex` attributes, and injects missing `--*` CSS custom properties onto `document.documentElement.style` via `ensure_theme_tokens()`.
- **Perchance Host Messages & Bridge Persistence (`visual.svelte.js`)**: Invokes host/parent `pluginGenerateImage` or `generate_image`, mutates module-scoped `_in_flight_image_generations` / `_image_generation_queue` / `cached_image_engine`, writes placeholders and resolves attachments via `state_bridge.session_driver` / `state_bridge.simulation_log`, and logs warnings to `state_bridge.app?.log` and `console.warn`.

## Verification

- Run: `npx vitest run src/media/` (runs `audio.test.js`, `motion.test.js`, `optics.test.js`, `transitions.test.js`, `visual.test.js`)
