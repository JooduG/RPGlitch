# Audio Skill Pitfalls

> Empirical scar tissue for RPGlitch Web Audio synthesis, Web Speech API streaming, and audio state management. Read this file before modifying `src/media/audio.svelte.js` or UI audio controls.

---

## Pitfall 1: Module-Load `AudioContext` Instantiation or Unbounded `resume()` Awaits

- **Trigger**: Adding audio initialization logic, boot hooks, or early UI sound cues.
- **Wrong Behavior**: Calling `new AudioContext()` at module evaluation time, awaiting `context.resume()` without a timeout when the browser blocks autoplay, or leaving open contexts behind on teardown.
- **Correct Behavior**: Let `get_audio_context()` construct the shared `AudioContext` lazily on demand, use `init_audio_on_gesture()` (which pairs `["click", "touchstart", "keydown"]` `{ once: true }` unlock listeners with a `1500ms` `Promise.race` timeout so boot in [main.js](../../../src/main.js#L100) cannot deadlock), and invoke `Audio.destroy()` on unmount and `pagehide` ([App.svelte](../../../src/App.svelte#L74-L81)).

## Pitfall 2: Hallucinating Excised `Kokoro-82M` (`speech.js`), `getRpgList("sounds")`, or `AudioEffectsEngine`

- **Trigger**: Implementing TTS playback, voice selection defaults, or UI sound effects in the engine or components.
- **Wrong Behavior**: Importing nonexistent `src/media/speech.js`, `KOKORO_VOICES`, `split_speech_sentences`, `AudioEffectsEngine`, or `getRpgList("sounds")`, adding ONNX/WebGPU models, or copying legacy Kokoro remnants still present in app files ([main.js](../../../src/main.js#L97) `Audio?.voice?.load_model?.()`, [AudioWing.svelte](../../../src/ui/AudioWing.svelte#L25) / [Profile.svelte.js](../../../src/ui/Profile.svelte.js#L147) `"Cinematic Narrator"` / `"am_adam"`, or unused `"kokoro-js"` in [package.json](../../../package.json#L84)).
- **Correct Behavior**: All TTS uses native browser `window.speechSynthesis` via `VoiceEngine` in [audio.svelte.js](../../../src/media/audio.svelte.js#L317-L556) (`src/media/README.md` documents the excised Kokoro stack to stay within the 4.00 MB bundle and 50 MiB iframe caps), and all UI sound effects are procedurally synthesized in `play_sfx(type, options)`.

## Pitfall 3: Assuming `db.audio_prefs` Sync, Universal `$state` Reactivity, or Unmuted Boot

- **Trigger**: Reading or mutating audio preferences, binding UI toggles, or expecting persisted audio defaults across reloads.
- **Wrong Behavior**: Importing `@data` / Dexie from `src/media/`, expecting writes to sync automatically to `db.audio_prefs` ([db.js](../../../src/data/db.js#L38) defines an unused schema store with zero readers/writers), assuming `Audio.voice.rate`, `Audio.voice.selected_voice`, `is_muted`, or `current_master_volume` are Svelte `$state` runes, or assuming sound starts enabled.
- **Correct Behavior**: Respect Rank 1 leaf boundaries (`src/media/` imports only `@config` and `@utils`). Treat master audio controls as volatile in-memory state booting silent (`is_muted = true`, `current_master_volume = 1.0`, `VoiceEngine.enabled = false`, `Audio.notifications_enabled = false`, `entity_voice = { ai: false, user: false, fractal: false }`). Track UI reactivity explicitly where needed (as [Console.svelte](../../../src/ui/Console.svelte#L47-L48) does with `explicitly_muted = $state(true)`), and store per-character `{ name, uri, cadence }` preferences on entity profiles via [AudioWing.svelte](../../../src/ui/AudioWing.svelte#L24-L75).

## Pitfall 4: Expecting `master_gain_node` or `Audio.is_muted` to Mute Web Speech TTS

- **Trigger**: Implementing global mute switches, volume sliders, or voice selection in `VoiceEngine`.
- **Wrong Behavior**: Setting `Audio.is_muted = true` alone and assuming ongoing or newly queued `SpeechSynthesisUtterance` playback is silenced, or assigning a mapped plain object from `Audio.voice.voices` directly to `utterance.voice` (`TypeError: Failed to convert value to 'SpeechSynthesisVoice'`).
- **Correct Behavior**: Understand that `master_gain_node` and `is_muted` only gate procedural Web Audio `play_sfx()` (`Audio.play()`); `VoiceEngine.speak()` sets `utterance.volume = this.volume` directly on `SpeechSynthesisUtterance`. Global mute handlers must set `Audio.is_muted = true`, zero `Audio.volume = 0`, and call `Audio.voice.stop()` ([Console.svelte](../../../src/ui/Console.svelte#L306-L308)). Internally resolve `utterance.voice` exclusively via `#native_voices` (`#pick_voice()`).

## Pitfall 5: Leaking Web Audio Nodes or Skipping `reset_stream()` / `stop()` on Stream Interrupts

- **Trigger**: Adding procedural SFX cues or wiring LLM streaming deltas into `VoiceEngine`.
- **Wrong Behavior**: Leaving `OscillatorNode`, `AudioBufferSourceNode`, or `GainNode` connected after playback ends, failing to call `reset_stream()` when a turn finishes, or leaving queued utterances speaking after user abort.
- **Correct Behavior**: Mirror `play_sfx()`'s `cleanup(source, gain)` handler (`source.onended = null`, `source.disconnect()`, `gain.disconnect()`), flush trailing text and reset `_stream_role` / `_stream_emitted_length` via `flush_stream_remainder()` + `reset_stream()` at stream end, and invoke `Audio.voice.stop()` on interrupt ([status.svelte.js](../../../src/engine/status.svelte.js#L361-L385)).

## Pitfall 6: Known Codebase & Barrel Quirks (`is_paused`, `"notification"`, `CADENCE_RATES`, `normalize_role`)

- **Trigger**: Calling role normalizers, importing cadence constants from `@media`, or reading existing playback/notification bindings in `src/ui/`.
- **Wrong Behavior**: Assuming `Audio.voice.is_paused` exists on `VoiceEngine` (UI reads it in [ChatBubble.svelte](../../../src/ui/ChatBubble.svelte#L741), though `VoiceEngine` only inspects `#speech_synth.paused` inside `toggle_pause()`), assuming `Audio.play("notification")` has a bespoke SFX cue or checks `Audio.notifications_enabled` (currently falls through to the `440Hz` default beep regardless of `notifications_enabled`), importing `CADENCE_RATES` or `audio_engine` from `@media` (only exported directly from `audio.svelte.js`), or calling bare `normalize_role("fractal")` when independent role gating is desired.
- **Correct Behavior**: Always pass `voice_role_key(role)` (which uses `normalize_role(role, { preserve_npc: true })`) for per-role speech gating so `"fractal"` and `"user"` stay distinct while `"npc"` maps to `"ai"`. Import `VOICE_CADENCES` or `get_cadence_rate` from `@media` ([index.js](../../../src/media/index.js#L40-L58)), or `VOICE_CADENCE` from `@config` ([config.js](../../../src/config.js#L145-L158)).
