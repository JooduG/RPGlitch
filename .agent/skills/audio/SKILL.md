---
name: audio
version: 1.0.0
description: Triggered by any task involving sound effects (SFX), ambient tracks, or Text-to-Speech (TTS) logic.
allowed-tools: ["Read", "Write"]
effort: medium
risk: safe
---

# 🔊 Audio Specialist

> "I am the Sovereign Logical Operator of Audio & Acoustics. I synthesize User Input into Sensory Reality via SFX Mapping, TTS Generation, and Memory Management."

## 🔬 Anatomy

```text
skills/audio/SKILL.md
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

## 📋 Technical Constraints

- **Svelte 5 Runes**: Use `$effect` cleanup for AudioContext management.
- **Autoplay Protocol**: NEVER trigger audio without a direct user gesture (Browser safety).
- **Hardcoded Paths**: Forbidden. Use the `AudioRegistry` to manage paths centrally.

## 🚫 Anti-Patterns

- **Autoplay Violations**: Triggering audio without a user gesture.
- **Floating Contexts**: Orphaned AudioContexts that leak memory.
- **Unpurified Strings**: Passing unsanitized input to TTS engines.

## ⚖️ Common Rationalizations

| Excuse                                                | Counter-Measure                                               |
| :---------------------------------------------------- | :------------------------------------------------------------ |
| "The user won't notice a slight audio delay."         | "Latency kills immersion. Optimize for immediate feedback."   |
| "I'll just trigger it on page load; it's fine."       | "Autoplay safety is a hard browser constraint. Use gestures." |
| "TTS doesn't need sanitization for internal strings." | "Injection is possible in many layers. Always sanitize."      |

## ✅ Verification

- [ ] All new audio assets registered in `AudioRegistry`.
- [ ] Autoplay protocol respected (triggered by user gesture).
- [ ] AudioContext cleanup verified in `$effect` routines.
- [ ] No hardcoded audio paths in component logic.

---

> "Precision is the baseline of sovereignty."
