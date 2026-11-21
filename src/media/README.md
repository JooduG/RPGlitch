# RPGlitch Sensory Cortex (`src/media/`)

## Overview

Sensory presentation layer for **RPGlitch** (Rank 2 `rank2-media` in `graphit.architecture.json`). Encapsulates procedural Web Audio sound effect synthesis, a swappable Web Speech API voice controller, unified Svelte 5 kinetic motion and card-flight physics, stateless Perchance image generation dispatching, and the synchronized stylesheet (`design.css`).

### Architectural Boundaries

- **Strictly Downward Imports**: Modules in `src/media/` import only from `@config`, `@utils`, `@definitions`, `@simulation`, and `svelte/*`. Never import from `@data`, `@state`, `@engine`, or `@ui`.
- **Procedural SFX (Zero Remote Audio Assets)**: All UI sound effects are synthesized at runtime via Web Audio oscillators (`OscillatorNode`), noise buffers (`AudioBufferSourceNode`), and gain envelopes (`GainNode`).
- **Swappable Speech Interface**: `VoiceEngine` wraps `window.speechSynthesis` behind a clean, swappable controller contract so a future TTS backend can replace it without touching UI or state callers. Kokoro-82M / ONNX TTS has been excised.

## Interface

Public exports are exposed via [`index.js`](./index.js), plus [`design.css`](./design.css):

### 1. Procedural Web Audio SFX & Speech (`audio.svelte.js`)

- `play_sfx(type, options = {})`: Synthesizes `"click"`, `"pop"`, `"glitch"`, `"alert"`, `"subtle_hum"`, `"notification"`, and default fallback cues, disconnecting and clearing `onended` on completion.
- `init_audio_on_gesture()`, `suspend_audio()`, `close_audio_context()`, `get_audio_context()`, `get_master_gain()`: Hardware `AudioContext` and `GainNode` lifecycle management.
- `VOICE_CADENCES`, `voice_role_key(role)`, `resolve_voice_uri(name_or_uri)`, `resolve_voice_name(name_or_uri)`, `get_cadence_rate(cadence, dynamics_value = 50)`.
- `VoiceEngine`: Reactive speech controller (`enabled`, `selected_voice`, `rate`, `volume`, `is_speaking`, `is_paused`, `active_message_id`, `entity_voice`, `voices`, `_stream_role`, `_stream_emitted_length`) with `is_role_enabled()`, `load_voices()`, `preview()`, `resume_context()`, `set_volume()`, `speak()`, `stop()`, `pause()`, `resume()`, `toggle_pause()`, `destroy()`, `apply_stream_role()`, `queue_stream_sentence()`, `flush_stream_remainder()`, and `reset_stream()`.
- `AudioEngine` / `Audio`: Singleton facade exposing `voice`, `notifications_enabled`, `volume`, `is_muted`, `voice_enabled`, `entity_voice`, `is_role_enabled(role)`, `set_entity_voice(role, is_enabled)`, `toggle_entity_voice(role)`, `play(sound_key)`, `init()`, and `destroy()`.

### 2. Unified Kinetic & Motion Physics (`motion.svelte.js`)

- `motion`: Reactive `$state` namespace tracking `intensity` (`0.0`–`1.0`) and `is_reduced` (`prefers-reduced-motion`).
- Kinetic Svelte Actions: `pulse(node)`, `roll(node)`, `shimmy(node)`, `stab(node)`.
- Svelte Transitions: `overlay_in(_node, options)`, `overlay_out(_node, options)`, `item_in(_node, options)`.
- Card Flight & Scrub Primitives: `fly_card_in(source_el, from_rect, to_rect, options)`, `fly_card_out(source_el, to_rect, options)`, `make_card_clone(el, tag, z)`, `rect_of(el)`, `strip_card_text(el)`, `capture_storyboard_flight(enabled)`, `fly_storyboard_cards_into_prologue(assets, dst_rects)`, `update_card_scrub()`, `clear_card_location()`.

### 3. Stateless Perchance Visual Dispatcher (`image-generation.js`)

- `dispatch_visual_generation(payload, options = {})`: Dispatches visual generation to the host Perchance image plugin with `AbortSignal` cancellation, `CircuitBreaker` insulation, `ExponentialBackoffRetryer` retries, or offline SVG fallback.
- In-Flight & Queue Bookkeeping: `_in_flight_image_generations`, `_image_generation_queue`, `mark_generation_in_flight()`, `clear_generation_in_flight()`, `is_generation_in_flight()`, `reset_generation_in_flight()`, `get_image_generation_queue()`, `reset_image_generation_queue()`, `_remove_from_image_generation_queue()`.
- Ghost & Beat Lifecycle: `spawn_image_beat(tier, options = {}, ctx)`, `sweep_stale_ghosts(ctx)`, `count_pending_ghosts(ctx)`, `mark_placeholder_failed(id, metadata = {}, ctx)`.
- Host Plugin Discovery & Facade: `find_image_engine()`, `reset_cached_image_engine()`, `VisualEngine` (`generate`, `visualize`, `generate_candidates`), `visual_engine`.

### 4. Synchronized Stylesheet (`design.css`)

- Generated from `DESIGN.md` via `npm run sync:css` (`.agents/skills/design/scripts/sync-css.js`). Never hand-edit `design.css`.

## Invariants

- **Zero Upward Layer Violations**: Runtime modules in `src/media/` never import from `@data`, `@state`, `@engine`, or `@ui`.
- **Silent Boot & User Gesture Audio**: `AudioContext` is constructed lazily on demand, `is_muted` and `VoiceEngine.enabled` boot disabled, `init_audio_on_gesture()` races `context.resume()` against a 1500ms timeout, and `Audio.play("notification")` is gated by `Audio.notifications_enabled`.
- **Accessibility & Card-Flight Locking**: `motion.is_reduced` suppresses kinetic actions, collapses Svelte transition durations to `0`, and short-circuits `fly_card_in`, `fly_card_out`, and `fly_storyboard_cards_into_prologue`.
- **Bounded Queue & Stale Ghost Sweep**: Pending image beats and queue depth are capped at `IMAGE_POLICY.MAX_PENDING_IMAGES` (`5`), and `sweep_stale_ghosts(ctx)` sweeps unresolved entries older than `TIMING_MS.CEILING` (`120000` ms) while sparing `_in_flight_image_generations`.
- **P4 Snake-Case Purity**: `VisualEngine.generate()` and `VisualEngine.visualize()` return `snake_case` fields (`image_url`, `refined_prompt`, `seed`, `metadata`) without camelCase compatibility aliases.

## Verification

- Run: `npx vitest run src/media/` (runs `audio.test.js`, `motion.test.js`, `image-generation.test.js`)
