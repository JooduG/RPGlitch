---
name: audio
description: Triggered by any task involving sound effects (SFX), ambient tracks, or Text-to-Speech (TTS) logic.
---

# Audio Specialist

> "I am the Sovereign Logical Operator of Audio & Acoustics. I synthesize user input into sensory reality via SFX mapping and memory management."

## Overview

The `audio` skill manages the minimalist sonic landscape of the RPGlitch Engine. It ensures that auditory atmosphere enhances the narrative without overwhelming it, while strictly adhering to browser safety protocols and memory management best practices.

### Strategic Context

- **Nordic Auditory Identity**: Cool, elegant, and non-intrusive soundscapes.
- **Perchance Integrity**: Adheres to hard browser constraints regarding `AudioContext`.
- **Sensory Excellence**: High-fidelity SFX and TTS integration.

## When to Use

- **Positive Triggers**: Adding SFX, configuring ambient loops, implementing TTS triggers, or managing the global audio registry.
- **Memory Hygiene**: Debugging audio context leaks or performance issues.
- **EXCLUSIONS**: Do not use for pure visual or logic changes; use `motion` or `javascript` instead.

## How It Works

1. **Asset Registration**: Add new audio files to `src/media/audio/sfx/` and record them in the `AudioRegistry`.
2. **Gesture Protocol**: Ensure all audio is triggered behind a direct user gesture to prevent autoplay blocks.
3. **Context Management**: Use Svelte 5 `$effect` cleanups to close or suspend `AudioContext` on unmount.
4. **TTS Synthesis**: Sanitize all text before passing to the `Sensory.voice` engine.

### Technical Constraints

- **Single Registry**: All paths must be managed centrally via `src/media/audio/registry.js`.
- **Memory Safety**: Never leave orphaned contexts that can accumulate and cause performance degradation.
- **Browser Compliance**: Auto-suspend inactive contexts to save resources.

## Usage

```bash
# Verify audio asset availability
ls src/media/audio/sfx/

# Audit audio context leaks
npm run audit:audio
```

## Present Results

Present the updated audio configuration and verify playback functionality.

- **Evidence**: Links to the updated `AudioRegistry` and confirmation of successful asset loading.
- **Validation**: Proof that audio triggers correctly after user interaction and cleans up on unmount.

## Common Rationalizations

| Agent Excuse               | The Reality                                                              |
| :------------------------- | :----------------------------------------------------------------------- |
| "A slight delay is fine."  | Latency destroys immersion. Optimize for immediate feedback responses.   |
| "I'll trigger it on load." | Autoplay is blocked without interaction. Always bind to gestures.        |
| "It doesn't need cleanup." | Small leaks in SPAs eventually crash the browser or degrade performance. |

## Red Flags

- **Autoplay Violations**: Attempting to play sound without an explicit user gesture.
- **Floating Contexts**: `AudioContext` instances created outside of a controlled lifecycle.
- **Hardcoded Paths**: Relative or absolute strings for audio files outside of the registry.

## Troubleshooting

- **No Sound Output**: Check if the browser has "Audio Blocked" notifications or check `AudioContext.state`.
- **Muffled Audio**: Verify file format compatibility (favor `.mp3` or `.webm`).

## Verification

- [ ] All new audio assets registered in `AudioRegistry`.
- [ ] Autoplay protocol respected (triggered by user gesture).
- [ ] AudioContext cleanup verified in `$effect` routines.
- [ ] **Hard Evidence Recorded**: Console log verification that AudioContext is successfully initialized and suspended.
