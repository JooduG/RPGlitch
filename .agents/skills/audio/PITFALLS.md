# Audio Skill Pitfalls

> Empirical scar tissue for RPGlitch Web Audio synthesis, Web Speech API streaming, and audio state management. Read this file before modifying `src/media/audio.svelte.js` or UI audio controls.

---

## Pitfall 1: Module-Load `AudioContext` Instantiation or Unbounded `resume()` Awaits (Occurrences: 1)

- **Trigger**: Adding audio initialization logic, boot hooks, or early UI sound cues.
- **Wrong Behavior**: Calling `new AudioContext()` at module evaluation time, awaiting `context.resume()` without a timeout when the browser blocks autoplay, or leaving open contexts behind on teardown.
- **Correct Behavior**: Let `get_audio_context()` construct the shared `AudioContext` lazily on demand, use `init_audio_on_gesture()` (which pairs `["click", "touchstart", "keydown"]` `{ once: true }` unlock listeners with a `1500ms` `Promise.race` timeout so boot in [main.js](../../../src/main.js#L100) cannot deadlock), and invoke `Audio.destroy()` on unmount and `pagehide` ([App.svelte](../../../src/App.svelte#L74-L81)).

## Pitfall 2: Hallucinating Excised `Kokoro-82M` (`speech.js`), `getRpgList("sounds")`, or `AudioEffectsEngine` (Occurrences: 1)

- **Trigger**: Implementing TTS playback, voice selection defaults, or UI sound effects in the engine or components.
- **Wrong Behavior**: Importing nonexistent `src/media/speech.js`, `KOKORO_VOICES`, `split_speech_sentences`, `AudioEffectsEngine`, or `getRpgList("sounds")`, adding ONNX/WebGPU models, or copying legacy Kokoro remnants still present in app files ([main.js](../../../src/main.js#L97) `Audio?.voice?.load_model?.()`, [AudioWing.svelte](../../../src/ui/organisms/AudioWing.svelte#L25) / [Profile.svelte.js](../../../src/ui/Profile.svelte.js#L147) `"Cinematic Narrator"` / `"am_adam"`, or unused `"kokoro-js"` in [package.json](../../../package.json#L84)).
- **Correct Behavior**: All TTS uses native browser `window.speechSynthesis` via `VoiceEngine` in [audio.svelte.js](../../../src/media/audio.svelte.js#L317-L556) (`src/media/README.md` documents the excised Kokoro stack to stay within the 4.00 MB bundle and 50 MiB iframe caps), and all UI sound effects are procedurally synthesized in `play_sfx(type, options)`.

## Pitfall 3: Assuming `db.audio_prefs` Sync, Universal `$state` Reactivity, or Unmuted Boot (Occurrences: 1)

- **Trigger**: Reading or mutating audio preferences, binding UI toggles, or expecting persisted audio defaults across reloads.
- **Wrong Behavior**: Importing `@data` / Dexie from `src/media/`, expecting writes to sync automatically to `db.audio_prefs` ([db.js](../../../src/data/db.js#L38) defines an unused schema store with zero readers/writers), assuming `Audio.voice.rate`, `Audio.voice.selected_voice`, `is_muted`, or `current_master_volume` are Svelte `$state` runes, or assuming sound starts enabled.
- **Correct Behavior**: Respect Rank 2 media boundaries (`src/media/` imports only `@config`, `@definitions`, `@simulation`, `@utils` — never `@data`, `@state`, `@engine`, or `@ui`). Treat master audio controls as volatile in-memory state booting silent (`is_muted = true`, `current_master_volume = 1.0`, `VoiceEngine.enabled = false`, `Audio.notifications_enabled = false`, `entity_voice = { ai: false, user: false, fractal: false }`). Track UI reactivity explicitly where needed (as [Console.svelte](../../../src/ui/organisms/Console.svelte#L47-L48) does with `explicitly_muted = $state(true)`), and store per-character `{ name, uri, cadence }` preferences on entity profiles via [AudioWing.svelte](../../../src/ui/organisms/AudioWing.svelte#L24-L75).

## Pitfall 4: Expecting `master_gain_node` or `Audio.is_muted` to Mute Web Speech TTS (Occurrences: 1)

- **Trigger**: Implementing global mute switches, volume sliders, or voice selection in `VoiceEngine`.
- **Wrong Behavior**: Setting `Audio.is_muted = true` alone and assuming ongoing or newly queued `SpeechSynthesisUtterance` playback is silenced, or assigning a mapped plain object from `Audio.voice.voices` directly to `utterance.voice` (`TypeError: Failed to convert value to 'SpeechSynthesisVoice'`).
- **Correct Behavior**: Understand that `master_gain_node` and `is_muted` only gate procedural Web Audio `play_sfx()` (`Audio.play()`); `VoiceEngine.speak()` sets `utterance.volume = this.volume` directly on `SpeechSynthesisUtterance`. Global mute handlers must set `Audio.is_muted = true`, zero `Audio.volume = 0`, and call `Audio.voice.stop()` ([Console.svelte](../../../src/ui/organisms/Console.svelte#L306-L308)). Internally resolve `utterance.voice` exclusively via `#native_voices` (`#pick_voice()`).

## Pitfall 5: Leaking Web Audio Nodes or Skipping `reset_stream()` / `stop()` on Stream Interrupts (Occurrences: 1)

- **Trigger**: Adding procedural SFX cues or wiring LLM streaming deltas into `VoiceEngine`.
- **Wrong Behavior**: Leaving `OscillatorNode`, `AudioBufferSourceNode`, or `GainNode` connected after playback ends, failing to call `reset_stream()` when a turn finishes, or leaving queued utterances speaking after user abort.
- **Correct Behavior**: Mirror `play_sfx()`'s `cleanup(source, gain)` handler (`source.onended = null`, `source.disconnect()`, `gain.disconnect()`), flush trailing text and reset `_stream_role` / `_stream_emitted_length` via `flush_stream_remainder()` + `reset_stream()` at stream end, and invoke `Audio.voice.stop()` on interrupt ([execution.svelte.js](../../../src/state/execution.svelte.js#L172-L198)).

## Pitfall 6: Known Codebase Quirks (`is_paused`, `"notification"`, `voice_role_key`) (Occurrences: 1)

- **Trigger**: Calling role normalizers or reading playback/notification bindings in `src/ui/`.
- **Wrong Behavior**: Calling `Audio.play("notification")` expecting it to fire when `Audio.notifications_enabled` is `false`, or assuming `voice_role_key` preserves `"npc"` separately from `"ai"`.
- **Correct Behavior**: Always pass `voice_role_key(role)` for per-role speech gating (`"fractal"` and `"user"` stay distinct; `"npc"` and `"model"` fold into `"ai"`). `Audio.play("notification")` is gated by `Audio.notifications_enabled` and `VoiceEngine.is_paused` tracks reactive pause state for [ChatBubble.svelte](../../../src/ui/organisms/ChatBubble.svelte). Import `VOICE_CADENCES` or `get_cadence_rate` from `@media`, or `VOICE_CADENCE` from `@config` ([config.js](../../../src/config.js#L145-L158)).

## Pitfall 7: `Slider.svelte` `oninput` vs `onchange`, Notification Auto-Unmute & Suspended `AudioContext` (Occurrences: 1)

- **Trigger**: Wiring volume sliders or notification toggles in `Console.svelte` (`src/ui/organisms/Console.svelte`), or firing short `play_sfx()` cues right after page load/tab resume.
- **Wrong Behavior**: Binding `oninput` on `<Slider />` (which only emits `onchange`), leaving `Audio.is_muted = true` when the user enables `NOTIFICATIONS`, or calling `osc.start(context.currentTime)` synchronously while `context.state === "suspended"`.
- **Correct Behavior**: Use `onchange` on `<Slider />` to clear `explicitly_muted` / `Audio.is_muted`, unmute master SFX when `NOTIFICATIONS` is enabled from a muted state, and await `context.resume()` before scheduling short oscillators/buffers when `context.state === "suspended"`.

## Pitfall 8: Chromium Same-Tick `speechSynthesis.cancel()` + `speak()` Drop & `"default"` Voice Lockout (Occurrences: 1)

- **Trigger**: Replacing an active/pending `SpeechSynthesisUtterance` in `VoiceEngine.speak()`, or disabling `AudioWing` preview/cadence controls when `selected_voice` is `"default"`.
- **Wrong Behavior**: Calling `speechSynthesis.cancel()` and `speechSynthesis.speak()` synchronously in the same tick (Chromium silently drops the new utterance), or gating Preview/Cadence on a matched dropdown entry (`!selected_voice`).
- **Correct Behavior**: Defer `speechSynthesis.speak()` by ~20ms when `speechSynthesis.speaking || speechSynthesis.pending` was just cancelled, update `voices` on `voiceschanged` whenever `list.length !== this.voices.length`, and keep `AudioWing` Preview/Cadence enabled for the `"default"` browser voice.
