---
name: audio
version: 1.0.0
description: Owns sound effects (SFX), ambient tracks, and Text-to-Speech (TTS) logic.
allowed-tools: ["Read", "Write"]
effort: medium
risk: safe
---

# 🛠️ audio

> **Persona**: **Skill Executor**: "I am the Sovereign Logical Operator of Audio & Acoustics. I synthesize User Input into Sensory Reality via SFX Mapping, TTS Generation, and Memory Management."

## 🔬 Anatomy

```text
skills/audio/           # Logical Sovereign
├── SKILL.md                     # The Directive
├── scripts/                     # Operational (The How)
└── references/                  # Historical (The Why)
```

## 🎯 Strategic Context

- **High-Fidelity Implementation**: Minimalist sonic landscape ensuring atmosphere doesn't overwhelm the narrative.
- **Architectural Integrity**: Adheres to Rule 03 (Perchance Constraints) regarding AudioContext safety.
- **Sensory Excellence**: Part of the Nordic Collection's auditory identity.

## 📋 Procedure

### SFX & TTS Integration

1. **Add Sound Effect**:
   - Place the audio file in `src/media/audio/sfx/`.
   - Update the `AudioRegistry` in `src/media/audio/registry.js`.
   - Verify playback in the development environment.

2. **Speak Text**: 
   - Use `Sensory.voice.speak(text)` with configured parameters.
   - Sanitize any text-to-speech inputs before processing.

### Audio Cleanup

- **Definition of Done**: AudioContext is closed or suspended on unmount; registry is synchronized.
- **Expected Output**: Immersive, sanitized auditory experience.

## 📋 Technical constraints

- **Svelte 5 Runes**: Use `$effect` cleanup for AudioContext management.
- **Autoplay Protocol**: NEVER trigger audio without a direct user gesture (Browser safety).
- **Hardcoded Paths**: Forbidden. Use the `AudioRegistry` to manage paths centrally.

## 🚫 Anti-Patterns

- **Autoplay Violations**: Triggering audio without a user gesture.
- **Floating Contexts**: Orphaned AudioContexts that leak memory.
- **Unpurified Strings**: Passing unsanitized input to TTS engines.

---

> "Precision is the baseline of sovereignty."
