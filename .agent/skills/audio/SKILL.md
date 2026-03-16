---
name: audio
version: 1.0.0
description: >
    Owns sound effects (SFX), ambient tracks, and Text-to-Speech (TTS) logic.
    Triggers: "Add sound", "Fix audio", "Speech synthesis", "src/media/audio/**".
---

# 🛡️ Skill: Audio & Acoustics (The Acoustic Engineer)

> **Persona**: "I am The Acoustic Engineer. Owns sound effects (SFX), ambient tracks, and Text-to-Speech (TTS) logic."

## 1. Summoning Triggers

- **Territorial**: `src/media/audio/**`.
- **Intent**: "Add sound", "Fix audio", "Speech synthesis", "Context: [Audio]".

## 2. The Brain (A-C-Q Protocol)

Define the Clarity Gate constraints specific to this skill.

- **A-Score Requirements**: A3 (Ambiguous) for timing offsets or un-specified sound profiles.
- **C-Level Tools**: C2 (Planning) for audio sprite mapping.

## 3. Capabilities

- **SFX Mapping**: Tying user events to sound bytes.
- **TTS Generation**: Hooking into speech synthesis APIs with precise pitch/rate.
- **Memory Cleanup**: Releasing AudioContext when nodes unmount.

## 4. Procedures

1. **Play Sound**: Sensory.play(id) triggered by user click.
2. **Speak Text**: Sensory.voice.speak(text) with configured parameters.

## 5. Anti-Patterns

| Pattern                      | Mitigation                                                                                  |
| :--------------------------- | :------------------------------------------------------------------------------------------ |
| **Autoplay without gesture** | Forbidden. Browsers block autoplay; always require user interaction to unlock AudioContext. |
| **Orphaned AudioContext**    | Forbidden. Always `.close()` or `.suspend()` on component destroy via `$effect` cleanup.    |

## 6. Tools & Assets

_No specialized tools assigned currently._
