# 🚀 Implementation Blueprint — `track-audio-expressiveness`

> **Track Goal**: Implement 100% invisible dynamic vocal expressiveness in RPGlitch by combining **Emotional Cadence Modulation** (linear $\pm 5\%$ speech rate drift anchored to character profile cadence) and **Intonation Micro-Perturbations** (typographic performance of Markdown `*italics*`, `**bold**`, and `ALL-CAPS`). Zero new UI controls or settings — all behavior is automated engine magic.

---

## 🎯 Goal & Specifications

1. **Emotional Cadence Modulation (Invisible Engine Physics)**:
   - Baseline rate anchored to profile cadence (`drawl` = 0.85, `measured` = 0.95, `standard` = 1.00, `brisk` = 1.10, `rapid` = 1.20).
   - Rate formula: `effective_rate = base_cadence_rate + (dynamics_val - 50) * 0.001`
   - AI Character rate driven by settled turn `intensity` (0–100).
   - Fractal rate driven by settled `velocity` (0–100).
   - User Persona rate remains strictly fixed.

2. **Intonation Micro-Perturbations (Invisible Typographic Performance)**:
   - `*italics*`: Lower volume (−2 dB to −3 dB), slightly slower rate.
   - `**bold**`: Sharpened stress / volume boost (+2 dB to +4 dB).
   - `ALL-CAPS`: Elevated stress & volume boost.
   - Automatic execution in TTS audio segment generation — zero UI dials or user toggles.

---

## 📋 Task Checklist

- [ ] **Step 1: Dynamic Cadence Offset Calculation**
  - Implement dynamic calculation in `get_cadence_rate(cadence, dynamics_val)` in `src/media/audio.svelte.js`.
  - Add unit tests in `src/media/audio.test.js`.

- [ ] **Step 2: Typographic Speech Segmenter & Intonation Ramps**
  - Extend `split_speech_sentences()` to return styled text segments (`normal`, `italics`, `bold`, `all_caps`).
  - Apply volume/speed ramps per segment in `VoiceEngine`.
  - Add segmenter unit tests in `src/media/audio.test.js`.

- [ ] **Step 3: Verification & Quality Gate**
  - Run `npm run verify` and `npm run deploy:prepare`.
