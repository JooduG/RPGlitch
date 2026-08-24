# 🎯 Active Track Implementation Plan: Track 3 — Decoupled Image Cooldowns, Round Ceiling, Cinematic Framing & Image Card Harmonization

**Track ID**: `track-3-decoupled-image-cooldowns-2026-08-24`  
**Dependencies**: `track-1-director-quick-shot-2026-08-24`, `track-2-back-shot-rolling-worker-2026-08-24`  
**Status**: `[~]` In Progress

---

## 1. Goal & Architectural Overview

Establish decoupled cooldown timers for Director narrative beats (2 rounds) and Dynamics physics shifts (3 rounds), guarantee a strict 1-image-per-round ceiling with Director priority resolution, inject dynamic photographic camera framing lenses (`Intimate Close-Up`, `Medium Action`, `Wide Environmental`, `Dutch / Low-Angle`), and harmonize image card presentation across `Prologue.svelte` and `Attachments.svelte`.

---

## 2. Technical Alignments & Design Rules

1. **Dual Cooldown Timers**:
   - `IMAGE_TRIGGER.director_cooldown_rounds = 2`
   - `IMAGE_TRIGGER.dynamics_cooldown_rounds = 3`
   - Dual timestamp tracking in session/story metadata: `last_director_beat_round` and `last_dynamics_beat_round`.
2. **Ceiling & Priority Resolution**:
   - Max 1 automatic image per turn/round.
   - Director explicit visual beat (Priority 1) wins over Dynamics threshold crossing (Priority 2).
   - If Priority 1 triggers, Priority 2 timer is unconsumed.
3. **Subject Focus & Camera Lenses**:
   - Character/NPC focused if speaker/delegator is specified; Environmental if scene/fractal is focus.
   - Default lens: `Medium Action` (waist-up, clear wardrobe & props).
   - Elevate to `Intimate Close-Up` when `intensity >= 75` or `affinity >= 75`.
   - Elevate to `Dutch / Low-Angle` when `chaos >= 75` or `conclusion_status === "COLLAPSED"`.
   - `Wide Environmental` for Prologue, Epilogue, or Fractal world shifts.
4. **Shimmer Restraint**:
   - All shimmer-related refactors remain untouched across all 4 tracks.
5. **Unified Card Chassis**:
   - Shared `VisualAttachmentCard.svelte` chassis for consistent border glow (`border-(--signature-color)`), hover lightbox preview, and aspect-ratio handling.

---

## 3. Tactical Phases

### Phase 1: Dual-Source Cooldown Architecture & Stale Comment Fixes

- [ ] `task-1.1`: **`RED`** Write unit tests in `src/media/image-trigger.test.js` covering independent timers for `director_cooldown_rounds` (2) and `dynamics_cooldown_rounds` (3).
- [ ] `task-1.2`: **`GREEN`** Refactor `src/media/image-trigger.js` config and `resolve_image_trigger()` to accept per-source timestamps (`last_director_beat_round`, `last_dynamics_beat_round`).
- [ ] `task-1.3`: **`GREEN`** Fix misleading comments at `image-trigger.js:21-22` and document exact priority rules.

### Phase 2: Priority Arbitration & Kernel Integration

- [ ] `task-2.1`: **`RED`** Add test cases for single-round collisions (Director beat wins, dynamics timer does not advance, max 1 auto-image emitted).
- [ ] `task-2.2`: **`GREEN`** Implement tie-breaking priority in `src/media/image-trigger.js` and pass dual timestamps from `src/intelligence/kernel.js`.
- [ ] `task-2.3`: **`GREEN`** Verify prologue open-gate sentinel behavior is maintained independently per source.

### Phase 3: Cinematic Photographic Framing Modes & Delta Optics

- [ ] `task-3.1`: **`RED`** Write unit tests in `src/media/image-prompts.test.js` asserting camera perspective token injection (`Intimate Close-Up`, `Medium Action`, `Wide Environmental`, `Dutch Angle`) based on emotional tension ($\text{intensity} \ge 75$, $\text{chaos} \ge 75$).
- [ ] `task-3.2`: **`GREEN`** Implement photographic framing catalog in `src/media/image-prompts.js` injecting perspective directives into diffusion prompts alongside permanent baselines and dynamic present state deltas.

### Phase 4: Image Card Chassis Harmonization

- [ ] `task-4.1`: **`RED`** Component test asserting unified layout container across prologue and mid-story turn attachments.
- [ ] `task-4.2`: **`GREEN`** Refactor `Prologue.svelte` and `Attachments.svelte` to share a standardized image card component with consistent border glow and zoom lightbox.

---

## 4. Definition of Done

- [ ] Independent cooldowns proven via unit tests (`npm run test:unit`).
- [ ] Max 1 auto-image per round with Director priority.
- [ ] Photographic lens injection active and verified across intensity bands.
- [ ] Card chassis unified with 0 regression in prologue/turn layouts.
- [ ] Clean build and 0 lints (`npm run deploy:prepare`).
