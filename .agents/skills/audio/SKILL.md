---
name: audio
description: >-
  Procedural Web Audio SFX synthesis, hardware AudioContext lifecycle, and browser Web Speech API controller in `@media` (`src/media/audio.svelte.js`). Use when implementing or refactoring `play_sfx`, `AudioEngine`, `VoiceEngine`, `VOICE_CADENCES`, `get_cadence_rate`, user-gesture `AudioContext` unlock/teardown, or `src/ui/AudioWing.svelte` voice controls. Do NOT use for interactive animations, easing curves, or View Transitions (use motion), static visual tokens or layouts (use design), turn orchestration (use simulation), or general Svelte 5 component runes (use svelte).
---

# Audio & Speech Synthesis

**Role**: Web Audio Procedural Synthesizer & Web Speech Controller  
**Objective**: Manage lazy hardware `AudioContext` lifecycles, zero-asset procedural UI sound effects, and browser Web Speech API synthesis with silent boot defaults and strict Rank 1 media-layer isolation.

## 1. Mandatory Pre-Flight & Pitfalls Check

> **CRITICAL**: Before modifying [audio.svelte.js](../../../src/media/audio.svelte.js), [AudioWing.svelte](../../../src/ui/AudioWing.svelte), or audio triggers in `src/ui/`, read [PITFALLS.md](./PITFALLS.md) to avoid known regressions.

### Reference Map

- [PITFALLS.md](./PITFALLS.md) — Empirical scar tissue covering mute boundaries, Web Speech native voice conversion, node cleanup, and codebase quirks.
- [src/media/README.md](../../../src/media/README.md) — Authoritative media-layer interface, Rank 1 zero-upward-import invariant, and excised-Kokoro architectural record.
- [audio.svelte.js](../../../src/media/audio.svelte.js) — Implementation of Web Audio lifecycle functions, `play_sfx`, cadence/role helpers, `VoiceEngine`, and `AudioEngine` / `Audio`.
- [src/media/index.js](../../../src/media/index.js) — `@media` barrel exports (note direct-only exports `CADENCE_RATES` and `audio_engine` stay on `audio.svelte.js`).
- [audio.test.js](../../../src/media/audio.test.js) — Unit test suite covering `normalize_role`, `get_cadence_rate`, `play_sfx`, and `Audio` facade behavior.
- [config.js](../../../src/config.js#L145-L158) — `VOICE_CADENCE.RATES` and `SHAPING` constants (`DYNAMICS_OFFSET`, `MIN_RATE`, `MAX_RATE`).
- UI & Lifecycle Callers: [AudioWing.svelte](../../../src/ui/AudioWing.svelte), [Console.svelte](../../../src/ui/Console.svelte), [ChatBubble.svelte](../../../src/ui/ChatBubble.svelte), [status.svelte.js](../../../src/engine/status.svelte.js#L335-L389), [App.svelte](../../../src/App.svelte#L72-L81), and root [README.md](../../../README.md).

## 2. Scope, When to Skip & Exclusivity Boundary

- **Audio Scope**: Lazy `AudioContext` initialization/suspend/teardown, user-gesture unlock handling, procedural SFX waveforms/envelopes via `play_sfx`, `VoiceEngine` speech queue/streaming/sanitization, cadence shaping (`VOICE_CADENCES`, `get_cadence_rate`), and `AudioEngine` state controls.
- **When to Skip**: Skip this skill when authoring CSS animations or View Transitions, designing static tokens/layouts, modifying simulation turn logic, or refactoring Svelte 5 UI wrappers outside audio controls.
- **Exclusions**:
  - [motion](../motion/SKILL.md): CSS transitions, animation duration budgets, easing curves, `wing-item-slide-down`, and View Transitions API choreography.
  - [design](../design/SKILL.md): `DESIGN.md` tokens, typography, glassmorphic surfaces, static component layouts, and `bits-ui` wrappers.
  - [simulation](../simulation/SKILL.md): Round/shot turn pipeline, `StreamingStore` turn execution outside TTS hooks, and state schemas.
  - [local-scripts](../local-scripts/SKILL.md): Repository verification wrappers and deployment scripts.
  - Global `svelte` & `javascript` skills: General Svelte 5 rune patterns and non-audio utilities.

## 3. Hardware `AudioContext` & Procedural SFX (`play_sfx`)

1. **Lazy Gesture Unlock & Teardown**:
   - `get_audio_context()` instantiates the shared `AudioContext` and connects `master_gain_node` lazily (never at module load time).
   - Module evaluation registers `{ once: true }` unlock listeners on `document` for `["click", "touchstart", "keydown"]`.
   - `init_audio_on_gesture()` (`Audio.init()`) races `context.resume()` against a `1500ms` timeout so boot awaits ([main.js](../../../src/main.js#L100)) cannot hang on autoplay-blocked pages.
   - Use `suspend_audio()` for temporary pauses and `close_audio_context()` / `Audio.destroy()` on teardown ([App.svelte](../../../src/App.svelte#L74-L81) invokes `Audio.destroy()` on `pagehide` and unmount).
2. **Zero-Asset Procedural SFX Cues**:
   - Every SFX is synthesized at runtime with `OscillatorNode`, noise `AudioBufferSourceNode`, and `GainNode` — never fetch remote `.wav`/audio files.
   - Supported cues in `play_sfx(type, options = {})` (and `Audio.play(sound_key)`): `"click"` (`800 -> 200Hz` sine, `0.03s`), `"pop"` (`300 -> 600Hz` sine, `0.05s`), `"glitch"` (white-noise buffer, `0.08s`), `"alert"` (`520 -> 660Hz` triangle, `0.2s`), `"subtle_hum"` (`60Hz` sine ramp, `0.4s`), and `default` fallback (`440Hz` sine, `0.04s`; [ChatBubble.svelte](../../../src/ui/ChatBubble.svelte#L364) passes `"notification"`, which hits this fallback).
   - All cues connect through `sfx_gain` to `master_gain_node` and clear `source.onended = null`, `source.disconnect()`, and `gain.disconnect()` on completion to avoid Web Audio node leaks.

## 4. Web Speech API Engine (`VoiceEngine`) & Cadence Shaping

1. **Browser-Native Speech Architecture**:
   - Kokoro-82M / ONNX / WebGPU synthesis (`src/media/speech.js`) was excised to stay below the `4.00 MB` single-file bundle cap and `50 MiB` iframe ceiling.
   - `VoiceEngine` wraps `window.speechSynthesis` and `SpeechSynthesisUtterance`, calling `load_voices()` at construction and listening once (`__rpglitch_voices_armed`) on `"voiceschanged"` to populate `voices = $state([])` alongside private `#native_voices`.
2. **Text Sanitization (`VoiceEngine.speak`)**:
   - Positional signature: `speak(text, should_clear_queue = true, force = false)`.
   - Before queueing an utterance, sanitize prose via:
     1. `strip_cognition_blocks(text)` from `@utils` (strips `<think>`, `<DYNAMICS>`, and `MODEL_ARTIFACT_PATTERNS`).
     2. ``.replace(/[*_#`~]/g, "")`` (strips inline Markdown tokens so symbols are not read aloud).
     3. `.replace(/\[\[(.*?)\]\]/g, "$1")` (unwraps `[[...]]` tokens to inner text).
     4. `.replace(/<[^>]*>/g, "").trim()` (strips HTML tags).
3. **Cadence Shaping (`VOICE_CADENCE` & `get_cadence_rate`)**:
   - `CADENCE_RATES` and `VOICE_CADENCES` mirror `VOICE_CADENCE.RATES` in [config.js](../../../src/config.js#L145-L158): `drawl: 0.85`, `measured: 0.95`, `standard: 1.0`, `brisk: 1.1`, `rapid: 1.2`.
   - `get_cadence_rate(cadence, dynamics_value = 50)` adds `(clamped_dynamics - 50) * 0.001` (`VOICE_CADENCE.SHAPING.DYNAMICS_OFFSET`) and clamps within `[0.5, 2.0]` (`MIN_RATE`..`MAX_RATE`).
   - Profile previews call `Audio.voice.preview(active_voice_name, get_cadence_rate(cadence))` ([AudioWing.svelte](../../../src/ui/AudioWing.svelte#L121), restoring previous `selected_voice` and `rate` in `finally`), whereas message replay in [ChatBubble.svelte](../../../src/ui/ChatBubble.svelte#L428-L435) sets `Audio.voice.selected_voice` and `Audio.voice.rate` before calling `Audio.voice.speak(clean_markdown, true, true)`.
4. **Streaming Sentence Queue**:
   - `StreamingStore` ([status.svelte.js](../../../src/engine/status.svelte.js#L335-L388)) calls `apply_stream_role(role, id)`, `queue_stream_sentence(content)` (matching `/[^.!?]+[.!?]+["']?/g` deltas past `_stream_emitted_length`), `flush_stream_remainder(content)`, `reset_stream()`, and `stop()` on interrupt.
   - Playback controls expose `pause()`, `resume()`, `toggle_pause()`, `stop()`, and `destroy()`.

## 5. State Sovereignty, Silent Boot & Role Gating

- **Rank 1 Layer Isolation**: `src/media/` imports strictly downward (`@config`, `@utils`). Never import Dexie/`@data` into `audio.svelte.js`; `db.audio_prefs` ([db.js](../../../src/data/db.js#L38)) is an unused frozen schema store with no active readers or writers. Per-entity `{ name, uri, cadence }` settings live on character records edited via [AudioWing.svelte](../../../src/ui/AudioWing.svelte#L24-L75).
- **Silent Boot & Reactivity Matrix**:

| Member / Variable | Boot Default | Reactivity | Scope / Notes |
| :-- | :-- | :-- | :-- |
| `is_muted` (`Audio.is_muted`) | `true` | Plain `let` | Gates `play_sfx()` / `master_gain_node` only; not TTS |
| `current_master_volume` | `1.0` | Plain `let` | Synced when `Audio.volume` / `set_volume()` changes |
| `Audio.notifications_enabled` | `false` | `$state(false)` | Bound in `Console.svelte`; not checked inside `Audio.play()` |
| `VoiceEngine.enabled` | `false` | `$state(false)` | Exposed as `Audio.voice_enabled`; flipped on by `set_entity_voice()` |
| `VoiceEngine.volume` (`Audio.volume`) | `1.0` | `$state(1.0)` | Applies to both `master_gain_node` and `utterance.volume` |
| `VoiceEngine.entity_voice` | `{ ai: false, user: false, fractal: false }` | `$state(...)` | Opt-in per-role gate; toggled via `toggle_entity_voice(role)` |
| `VoiceEngine.rate` / `selected_voice` | `1.0` / `"default"` | Plain fields | Non-reactive utterance defaults; read at `speak()` call time |
| `VoiceEngine.voices` / `is_speaking` / `active_message_id` | `[]` / `false` / `null` | `$state(...)` | Drives dropdown hydration and message speech indicator buttons |

- **SFX vs. TTS Mute Separation**: `master_gain_node` does **not** attenuate `window.speechSynthesis`. When muting audio globally, callers must set `Audio.is_muted = true`, zero `Audio.volume`, and call `Audio.voice.stop()` ([Console.svelte](../../../src/ui/Console.svelte#L304-L309)).
- **Role Key Distinction**: `voice_role_key(role)` calls `normalize_role(role, { preserve_npc: true })` and folds `"npc"` into `"ai"`, keeping `"ai"`, `"user"`, and `"fractal"` independently toggleable while returning `null` for `"system"`.

```javascript
import { Audio, get_cadence_rate, resolve_voice_uri } from "@media";

// Unmute procedural SFX and trigger feedback cue
Audio.is_muted = false;
Audio.volume = 0.8;
Audio.play("click");

// Opt in a speaker role, shape rate from dynamics, and speak
Audio.set_entity_voice("ai", true);
Audio.voice.selected_voice = resolve_voice_uri(character.voice?.uri);
Audio.voice.rate = get_cadence_rate(character.voice?.cadence || "standard", dynamics_intensity);
Audio.voice.speak("System diagnostics stabilized.");
```

## 6. Bright-Line Constraints & Verification Checklist

- **NEVER** construct `AudioContext` at module load time or leave unbounded `resume()` awaits on boot.
- **NEVER** reference excised `src/media/speech.js`, `KOKORO_VOICES`, `AudioEffectsEngine`, `getRpgList("sounds")`, or `db.audio_prefs` persistence.
- **NEVER** import `@data`, `@engine`, `@intelligence`, `@state`, or `@ui` inside `src/media/`, or use `localStorage`.
- **NEVER** assign mapped plain objects from `Audio.voice.voices` directly to `utterance.voice`.
- **ALWAYS** detach `source.onended = null` and `.disconnect()` procedural SFX nodes on completion, and call `Audio.destroy()` on teardown.
- **ALWAYS** use `voice_role_key(role)` for speech gating and pair `Audio.voice.stop()` with `Audio.is_muted = true` during global mutes.

### Counter-Rationalization Table

| Rationalization | Required Action |
| :-- | :-- |
| `"Quick .wav asset fetch or getRpgList helper is simpler"` | Synthesize procedurally in `play_sfx()` via Web Audio oscillators/noise buffers with `onended` cleanup. |
| `"Setting Audio.is_muted = true mutes everything"` | `is_muted` only silences `play_sfx()`; also zero `Audio.volume` and call `Audio.voice.stop()` for TTS. |
| `"Audio preferences save automatically to db.audio_prefs"` | Master state is volatile in memory (silent boot); only entity `char.voice` persists on entity records. |
| `"AudioWing has wing-item-slide-down animation to tweak"` | Hand visual transitions and easing curves to [motion/SKILL.md](../motion/SKILL.md). |

### Verification Checklist

- [ ] [PITFALLS.md](./PITFALLS.md) reviewed; no `AudioContext` created at module load and `Audio.destroy()` remains wired on unmount/`pagehide`.
- [ ] Zero remote audio asset fetches (`play_sfx` procedural synthesis only) and verified `onended` + `.disconnect()` cleanup.
- [ ] Silent boot defaults (`is_muted = true`, `VoiceEngine.enabled = false`, all `entity_voice` false) preserved.
- [ ] `VoiceEngine.speak()` strips `<think>`, `<DYNAMICS>`, `MODEL_ARTIFACT_PATTERNS`, ``[*_#`~]``, `[[...]]`, and HTML tags.
- [ ] `npx vitest run src/media/audio.test.js`, `npm run audit:layers`, and `npm run verify` pass with 0 errors.
