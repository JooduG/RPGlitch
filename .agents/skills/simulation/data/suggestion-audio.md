# 🎙️ RPGlitch Audio & Voice Roadmap — Technical Specifications & Status

> **Status**: Reviewed & Approved — Ready for Phase 2 Spec & Tier 1 Implementation Planning.
> **Owner**: Voice/Audio subsystem (`src/media/audio.svelte.js` + UI consumers).

---

## Executive Summary & Decisions

| Feature                               | Status          | Priority / Target | Key Architectural Decisions                                                                                       |
| :------------------------------------ | :-------------- | :---------------- | :---------------------------------------------------------------------------------------------------------------- |
| **1. Emotional Cadence Modulation**   | 🟢 **APPROVED** | Tier 1 (Active)   | Invisible drift in engine; AI Character driven by `intensity`, Fractal by `velocity`; User Persona remains fixed. |
| **2. Multi-Voice Scenes**             | 🟡 **DEFERRED** | Future NPC Track  | Shelved for a dedicated NPC system expansion track.                                                               |
| **3. Spatial Presence (Panning)**     | 🔴 **SHELVED**  | N/A               | Low value-to-complexity ratio; removed from active roadmap.                                                       |
| **4. Ambience Layer (Soundscapes)**   | 🔴 **SHELVED**  | N/A               | High overhead for location pre-determination & audio assets; removed.                                             |
| **5. "Previously On..." Recap**       | 🟡 **DEFERRED** | Storymode Track   | Will be integrated alongside Storymode feed expansion (Perchance API is free).                                    |
| **6. Intonation Micro-Perturbations** | 🟢 **APPROVED** | Tier 1 (Active)   | Controlled via Strength Dial ("Off / Subtle / Expressive"); honors `**bold**`, `*italics*`, and ALL-CAPS.         |

---

## 1. Emotional Cadence Modulation (Dynamic Tempo)

> **Status**: 🟢 APPROVED (Tier 1)

**The Concept**:
Allow a character's spoken cadence to breathe naturally with their internal state. Instead of static cadence settings, the tempo dynamically drifts between `drawl → measured → standard → brisk → rapid` based on real-time dynamics deltas.

**Final Decisions & Technical Requirements**:

- **Baseline Anchor Principle**: The character's selected profile cadence (`drawl` = 0.85, `measured` = 0.95, `standard` = 1.00, `brisk` = 1.10, `rapid` = 1.20) acts as the baseline center rate at neutral dynamics (50).
- **Linear ±5% Dynamics Mapping**:
  - Dynamics range `0` to `100` (centered at `50`) maps linearly to a `−5%` to `+5%` rate offset (`offset = (dynamics - 50) * 0.001`).
  - `effective_rate = base_cadence_rate + (dynamics - 50) * 0.001`
  - **Exact Rate Scale**:
    - `drawl` (0.85): 0.80 (at 0 intensity) → 0.85 (at 50) → 0.90 (at 100 intensity).
    - `measured` (0.95): 0.90 (at 0 intensity) → 0.95 (at 50) → 1.00 (at 100 intensity).
    - `standard` (1.00): 0.95 (at 0 intensity) → 1.00 (at 50) → 1.05 (at 100 intensity).
    - `brisk` (1.10): 1.05 (at 0 intensity) → 1.10 (at 50) → 1.15 (at 100 intensity).
    - `rapid` (1.20): 1.15 (at 0 intensity) → 1.20 (at 50) → 1.25 (at 100 intensity).
- **Invisible Magic**: Cadence modulation happens internal to the audio processing pipeline and is not shown on the character profile.
- **Dynamics Mapping**:
  - **AI Character**: Speech rate modulates with settled turn `intensity` (0-100).
  - **Fractal (Environment/Narrator)**: Speech rate modulates with settled `velocity` (0-100).
  - **User Persona**: Fixed strictly to selected profile cadence (no automated drift).
- **Implementation Point**: Computed inside `get_cadence_rate(cadence, dynamics_val)` when enqueuing speech (`VoiceEngine.speak` / `start_stream`).

---

## 2. Multi-Voice Scenes (Dialogue Switching)

> **Status**: 🟡 DEFERRED (Reserved for NPC System Expansion)

**The Concept**:
Switch active Kokoro TTS voices mid-narration when dialogue transitions between the narrator, NPCs, and player character.

**Final Decisions**:

- Deferred until a broader NPC / multi-character system track is initialized.

---

## 3. Spatial Presence (Panning)

> **Status**: 🔴 SHELVED

**The Concept**:
Using Web Audio `StereoPannerNode` to pan character voices left/right across a virtual stage.

**Final Decisions**:

- Shelved per user feedback (adds minor aesthetic value relative to UI/audio pipeline complexity).

---

## 4. Ambience Layer (Ducking Soundscapes)

> **Status**: 🔴 SHELVED

**The Concept**:
Looping environmental audio tied to locations with automatic volume ducking during speech.

**Final Decisions**:

- Shelved due to the heavy overhead required to pre-determine locations and curate ambient audio assets.

---

## 5. "Previously On..." Recap

> **Status**: 🟡 DEFERRED (Reserved for Storymode Feed Expansion)

**The Concept**:
Narrate a short 1–2 line recap when resuming long-form RPG sessions.

**Final Decisions**:

- Deferred for inclusion in future Storymode UI feed features. Unlimited free Perchance API calls make generation cost negligible.

---

## 6. Intonation Micro-Perturbations (Typographic Performance)

> **Status**: 🟢 APPROVED (Tier 1)

**The Concept**:
Teach the TTS engine to "perform" text emphasis by applying local rate and volume micro-envelopes to Markdown typography (`*italics*`, `**bold**`, ALL-CAPS).

**Final Decisions & Technical Requirements**:

- **Supported Formatting**:
  - `*italics*`: Whisper / lower volume (−2 dB to −3 dB), slightly slower rate.
  - `**bold**`: Sharpened stress / elevated volume (+2 dB to +4 dB).
  - `ALL-CAPS`: Elevated stress & volume boost.
- **100% Invisible Magic**: No user-facing dials, sliders, or UI controls. Typographic intonation is automatically applied by the TTS engine.
- **Composition**: Local typographic micro-envelopes compose additively with global character cadence.

---

## Tier 1 Implementation Strategy (Next Steps)

1. **Track Scope**: Group Feature 1 (_Emotional Cadence Modulation_) and Feature 6 (_Intonation Micro-Perturbations_) into a single cohesive Tier 1 track: **`track-audio-expressiveness`**.
2. **Execution Sequence**:
   - Extended sentence segmenter (`split_speech_sentences` → styled segments).
   - AudioParam volume ramp envelopes (`gain.setValueAtTime` / rate scaling).
   - Dynamics-to-tempo easing curves (`intensity` for AI, `velocity` for Fractal).
   - AudioWing / Audio Controls strength setting UI.
