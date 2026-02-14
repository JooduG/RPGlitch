---
name: audio
version: 1.0.0
description: >
    Manages the auditory experience. SFX, Ambient, and TTS (Text-to-Speech).
    Triggers:
    - "Add sound"
    - "Fix audio"
    - "Speech synthesis"
    - "src/media/audio/**"
    - "Context: [Audio]"
---

# 🔊 Audio

> **Mandate**: "I engineer the acoustic atmosphere. I ensure every sonic event—from the click of a button to the synthesized voice of an entity—is crisp, emotive, and technically sound."

## 1. Scope & Ownership

- **Primary Domain**: `src/media/audio/`
- **UI Interface**: `src/ui/organisms/profile/VoiceWing.svelte`
- **Master Engine**: `src/media/sensory.js` (Audio/Voice segments)

## 2. Core Protocols

1.  **Sonic Separation**:
    - **SFX**: Handled by `src/media/audio/effects.js`. Triggered via `Sensory.play()`.
    - **TTS**: Handled by `src/media/audio/speech.svelte.js`. Triggered via `Sensory.voice.speak()`.
2.  **Rune-Based Reactivity**: Voice status (speaking, voices list) must be kept reactive using Svelte 5 Runes.
3.  **No Ghost Audio**: Always ensure audio contexts are properly cleaned up or paused when components are unmounted.

## 3. Reference Files

- [effects.js](file:///c:/Users/johng/Documents/GitHub/default/src/media/audio/effects.js)
- [speech.svelte.js](file:///c:/Users/johng/Documents/GitHub/default/src/media/audio/speech.svelte.js)
- [VoiceWing.svelte](file:///c:/Users/johng/Documents/GitHub/default/src/ui/organisms/profile/VoiceWing.svelte)
- [sensory.js](file:///c:/Users/johng/Documents/GitHub/default/src/media/sensory.js)

## 4. Troubleshooting Triggers

- **"Sound not playing"**: Check if the sound ID exists in `effects.js` and if user interaction has unlocked the AudioContext.
- **"TTS distortion"**: Verify rate/pitch bounds (0.5 to 2.0) in `VoiceWing.svelte`.

## 5. Anti-Patterns

| Pattern                      | Mitigation                                                                                        |
| :--------------------------- | :------------------------------------------------------------------------------------------------ |
| **Autoplay without gesture** | **Forbidden**. Browsers block autoplay; always require user interaction to unlock `AudioContext`. |
| **Orphaned AudioContext**    | **Forbidden**. Always `.close()` or `.suspend()` on component destroy via `$effect` cleanup.      |
| **Hardcoded volume/rate**    | **Avoid**. Use `$state`-driven values or design tokens for consistency.                           |
