# 🎙️ RPGlitch Audio & Voice Roadmap — Conceptual Feature Proposals

> **Status**: Proposal stage — for discussion, not yet scheduled.
> **Owner**: Voice/Audio subsystem (`src/media/audio.svelte.js` + UI consumers).
> These are intentionally ambitious; each is written up with the _why_, the _shape_, and the _open questions_ so they can be scoped, merged, or trimmed without losing the original intent.

---

## 1. Emotional Cadence Modulation

**The idea.** Let a character's spoken cadence breathe with their internal state. Instead of a fixed cadence stored on the profile, cadence becomes _dynamic_: it drifts between `drawl → measured → standard → brisk → rapid` in response to the entity's live dynamics (`intensity`, `velocity`, etc.) each turn.

**Why it matters.** Right now a voice is a static "character card" property. But the engine already computes emotional dynamics every turn — `intensity` spiking during a fight, cratering during a quiet scene. Tying speech tempo to that curve makes characters _feel_ alive without the model having to do anything extra. It's free expressiveness: zero new LLM calls, zero new prompts.

**Shape.**

- New derived value on the entity, e.g. `voice.cadence_drift` — computed from dynamics deltas at settlement time (`dynamics.js`), mapped through a small easing curve.
- Effective cadence = profile cadence blended toward the dynamic target (`blend = 0.5 + 0.5 * normalized_intensity`).
- Apply at the same place `get_cadence_rate()` is consumed today (`start_stream` / `handle_speak` / preview), so no audio-pipeline changes are needed.
- The AudioWing UI gains a toggle: "React to state" (off = today's fixed cadence).

**Open questions.**

- Should the drift be _visible_ in the profile (a live-readout of "current tempo") or stay invisible magic?
- Which dynamics feed it — `intensity` only, or a weighted mix with `velocity`/`affinity`?
- Does the user persona deserve the same treatment, or is it AI/fractal only?

---

## 2. Multi-Voice Scenes

**The idea.** During streaming narration, if the generated text contains dialogue from _more than one_ character, switch the active Kokoro voice mid-message. The narrator reads narrative prose in the speaker's voice; quoted dialogue from an NPC switches to that NPC's voice; quotes from the player character switch to the user persona's voice.

**Why it matters.** Group scenes are currently flattened into a single voice. Multi-voice is the single biggest immersion jump available to the audio system — it turns a "radio play with one actor" into a real cast. The character voices already exist on the entity profiles, so this is mostly _routing_ work.

**Shape.**

- Extend the chunking pipeline (`split_speech_sentences`) with a _voice tag per sentence_: parse `"..."` dialogue and its attribution (`said X`, or a following quote after a colon) to decide who is speaking.
- For streamed text, the tag is resolved lazily — a sentence is only enqueued with a voice once its attribution is known (the current cursor/commit machinery already supports this pattern).
- Cache key (`#cached_generate`) already includes the voice id, so switching voices is free at the cache level.

**Open questions.**

- Attribution parsing is fuzzy ("he said", "the baron snapped", or no tag at all). How aggressive should guessing be? Wrong guesses sound worse than no switch.
- Should _unattributed_ dialogue default to the narrator's voice or the most recent speaker?
- User-persona dialogue during an AI stream: read it aloud, or skip it (it's _their_ line)?

---

## 3. Spatial Presence (Panning)

**The idea.** Give characters a position on a virtual stage. Using the Web Audio `StereoPannerNode` (a few lines on top of the shared graph), narrate with the AI character panned slightly right, the fractal left, the user persona center — or pan per-scene as the narrative describes movement.

**Why it matters.** Directionality is the cheapest, most reliable "audio 3D" trick in the book. Even a subtle static pan (15–25%) makes two speakers in a scene feel like two _places_, and it costs microseconds of CPU.

**Shape.**

- Per-entity `voice.pan` (−1…1), defaulting by role (AI +0.3, fractal −0.3, user 0).
- A `StereoPannerNode` per active voice inserted into the shared graph between the source and the master gain.
- Optional: a per-message "camera" that nudges pans during streaming based on who is speaking (tie-in with Feature 2).

**Open questions.**

- Static role panning vs. dynamic per-scene camera? Dynamic is cooler but needs a source of "who is where" — probably the director's scene description (an extra parse).
- Does the effect survive headphones/desktop/mobile equally? (It does — pan is fully supported everywhere StereoPannerNode exists.)

---

## 4. Ambience Layer (Ducking Soundscapes)

**The idea.** Persistent, low-level environmental audio tied to the scene/fractal — rain in the Sector 4 conduit, crowd murmur in the Nova City plaza, engine hum aboard a ship. A short looping ambience plays at low volume and automatically _ducks_ (sidechain-compresses) whenever a character speaks, so voices always cut through.

**Why it matters.** Atmosphere is currently 100% visual. Audio ambience is the difference between watching a city and _being_ in it — and Perchance's runtime image generation can even produce matching _visual_ backdrops while we synthesize matching _sonic_ ones.

**Shape.**

- An `AmbienceEngine` alongside `AudioEffectsEngine`: per-fractal loop selection, Web Audio `GainNode` ducking driven by `VoiceEngine.is_speaking` (attack/release envelopes so it breathes rather than snaps).
- Ambient loops can be short synthesized tones/noise beds (rain = filtered noise; murmur = filtered noise + random speech-like envelopes) — no external assets needed, or optionally user-uploaded loops.
- A master "Ambience" volume slider + per-fractal toggle in AudioControls / the Fractal profile.

**Open questions.**

- Procedurally synthesized noise beds (zero assets, always ship) vs. curated uploaded loops (higher quality, handoff cost)?
- Should ambience duck, or should _speech_ be sidechained _up_ (compression is fine, but ducking is the standard)?
- Battery/CPU: a running AudioContext loop is cheap, but WebGL/WebGPU rendering isn't — do we tie ambience to "audio engaged" so it never runs silently?

---

## 5. "Previously on…" Recap

**The idea.** When a session resumes from a checkpoint (or a Storyboard story is reopened), the engine narrates a 1–2 line recap — the last few narrative beats condensed — spoken in the narrator's voice before the player re-enters the scene.

**Why it matters.** Long-form roleplay sessions are restarted all the time (reloads, tab crashes, checkpoint restoration — which the engine already supports). A voiced recap closes the loop that a text summary can't: it re-establishes tone, rhythm, and voice continuity _in the ear_, so the player is back in the scene before they read a single line.

**Shape.**

- Reuse the existing Memory Forge output: the most recent `past` vectors or the last message's prose, condensed by the LLM forge to a single paragraph (there is already consolidation machinery; this is a new output _mode_).
- Spoken once via the existing `speak()` pipeline, with the "skip" affordance of the standard stop button.
- Stored/generated lazily at resume — never persisted to the transcript.

**Open questions.**

- Should the recap be _spoken only_, or also written into the feed as a faint "previously…" line?
- Generation cost: one small LLM call per resume. Worth gating behind a setting ("Recap on resume")?

---

## 6. Intonation Micro-Perturbations

**The idea.** Teach the TTS layer to _read_ typography. Map `*emphasized words*`, ALL-CAPS, `—dashed asides—`, and ellipses to small, deliberate micro-variations in rate and volume: a whisper-soft aside, a sharpened stress on an emphasized word, a beat of hesitation at an ellipsis.

**Why it matters.** Kokoro (like most neural TTS) reads punctuation but not Markdown _emphasis_. The prose the engine generates is already richly styled — `*she whispered*`, **HE SHOUTED** — and right now every one of those signals is flattened. This is the difference between "spoken text" and "performed text," and it's achievable with zero model changes: just segment-aware rate/volume envelopes around the existing chunk pipeline.

**Shape.**

- Extend `split_speech_sentences` to also emit _segments_ (word runs with style metadata) instead of bare sentences.
- Apply micro-envelopes at the AudioParam level (`gain.setValueAtTime` ramps) per segment — volume +2–4 dB on emphasized words, −2–3 dB on asides, a 200–400ms gap at ellipses, slightly slower on dashes.
- Fallback (Web Speech) gets the same via per-word `SpeechSynthesisUtterance` boundaries (approximate).

**Open questions.**

- Risk of _over_-performance (cheesy emphasis). A strength dial ("Neutral / Subtle / Expressive") feels right — or a simple on/off.
- Which markers to honor: `*…*`, `**…**`, ALL-CAPS, `—…—`, `…`? Markdown semantics get ambiguous fast.
- Interaction with cadence: micro-perturbations are _local_, cadence is _global_ — they should compose, not fight.

---

## Cross-cutting notes

- **Features 2, 3, and 6 all touch the chunking/queue layer** (`split_speech_sentences` → queue items → playback). If multiple are approved, they should be designed as one "vocal staging" refactor rather than three stacked band-aids.
- **Features 1 and 6 are "free"** (no new LLM/audio calls); **2 and 3 are cheap**; **4 is cheap in code but has an asset question**; **5 is the only one with an ongoing per-use cost (one LLM call per resume)**.
- Every feature degrades gracefully to the Web Speech fallback path.
