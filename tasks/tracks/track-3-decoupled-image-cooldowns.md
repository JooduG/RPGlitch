---
id: track-3-decoupled-image-cooldowns-2026-08-24
title: "Track 3: Decoupled Image Trigger Cooldowns, Round Ceiling, Cinematic Framing & Image Card Harmonization"
type: feature
status: proposed
created_at: 2026-08-24
author: Strategy Architect
dependencies:
  - track-1-director-quick-shot-2026-08-24
---

## Track 3 — Decoupled Image Trigger Cooldowns, Round Ceiling, Cinematic Framing & Image Card Harmonization

> **Goal**: Prevent cinematic Director visual beats from being blocked by routine physics slider movements by establishing independent cooldowns, an explicit 1-image-per-round ceiling, dynamic photographic camera framing modes, and a unified visual card layout for both prologue and mid-story turn generations.

---

## 1. Context & Architectural Rationale

Visual generation is a high-impact narrative beat. Currently:

1. **Coupled Timers**: A dramatic, deliberate Director visual beat can be suppressed simply because an emotional slider crossed a threshold 2 turns ago on a routine conversational exchange.
2. **Missing Photographic Perspective**: Image prompts assemble physical attributes (`eternal.physical`, `present.physical`) but lack dynamic camera composition directives tailored to narrative scene intensity.
3. **Inconsistent Visual Presentation**: Prologue images render in a different layout structure compared to mid-story turn attachments, creating visual fragmentation across the feed.

By decoupling cooldown timers, enforcing an explicit priority resolver, adding **Cinematic Photographic Framing Modes**, and **Harmonizing Image Card Layouts**, we ensure visuals generate with calibrated perspective and consistent aesthetics.

---

## 2. Current Verified State

- **Trigger Engine**: [`src/media/image-trigger.js:47-97`](../../src/media/image-trigger.js)
  - Single shared `IMAGE_TRIGGER.cooldown_rounds = 3` and single `last_auto` timestamp.
  - Both Source A (Dynamics gate: band $\ge 85$/$\le 15$ or displacement $\ge 60$) and Source B (Director explicit `keywords` visual beat) share the same timer.
  - Stale comment in `image-trigger.js:21-22` claims Director triggers bypass the check, but code at `:63` enforces shared gating.
- **Image Prompt Compiler**: [`src/media/image-prompts.js`](../../src/media/image-prompts.js)
  - Compiles physical descriptors, visual style tokens, and excluded keyword filtering (`strip_visual_excluded`).
  - Lacks dynamic camera framing tokens mapped to scene intensity.
- **UI Inconsistency**: `Prologue.svelte` and `Attachments.svelte` render image containers with slightly different aspect ratios and framing styles.

---

## 3. Deep-Dive Technical Design

### 3.1 Dual-Source Configuration & Timers

- **Independent Cooldowns**:
  - `director_cooldown_rounds`: **2 rounds** (Explicit narrative beats).
  - `dynamics_cooldown_rounds`: **3 rounds** (Physics displacement / band crossings).
- **Distinct Runtime Timestamps**:
  - `last_director_beat_round`
  - `last_dynamics_beat_round`

### 3.2 Priority Resolver & Round Ceiling

- **Ceiling Rule**: Maximum of **1** automatic image generated per round.
- **Priority Resolution**:
  - **Priority 1**: Director explicit visual beat (from `keywords`).
  - **Priority 2**: Dynamics / physical appearance change.
- If Priority 1 fires, Priority 2 is suppressed for that round and its cooldown timer is **not** consumed.
- Correct all stale comments in `image-trigger.js`.

### 3.3 Photographic Framing Modes & Delta Optics

- Dynamic camera perspective tokens injected based on emotional context and physics intensity:

```text
[Framing Directive], [Subject Appearance & Wardrobe], [Active Expression & Tell], [Atmospheric Lighting & Environment], [Style Optics Tokens]
```

#### Framing Catalog & Dynamic Triggers

| Framing Mode             | Perspective Tokens                                                                              | Trigger Condition                                    | Narrative Function                                                       |
| :----------------------- | :---------------------------------------------------------------------------------------------- | :--------------------------------------------------- | :----------------------------------------------------------------------- |
| **`Intimate Close-Up`**  | `tight close-up portrait, shallow depth of field, sharp focus on eyes, macro expression detail` | `intensity >= 75` or `affinity >= 75`                | Heightens emotional vulnerability, secret revelations, or acute panic.   |
| **`Medium Action`**      | `medium shot, waist-up framing, dynamic posture, clear wardrobe & prop details`                 | Baseline narrative turns (`25 <= intensity < 75`)    | Balances character physicality, posture, and active items.               |
| **`Wide Environmental`** | `wide-angle environmental shot, deep spatial composition, atmospheric scale, full silhouette`   | Prologue, epilogue, or fractal transition            | Establishes sense of place, scale, and world atmosphere.                 |
| **`Dutch / Low-Angle`**  | `dutch angle composition, low-angle perspective, imposing scale, dramatic lighting contrast`    | `chaos >= 75` or `conclusion_status === "COLLAPSED"` | Communicates disorientation, impending danger, or catastrophic collapse. |

### 3.4 Harmonized Image Card Chassis

- Unify prologue banner layouts in `Prologue.svelte` and mid-story narrative attachments in `Attachments.svelte` into a shared `VisualAttachmentCard.svelte` container.
- Consistent border glow (`border-(--signature-color)`), hover zoom lightbox, and aspect-ratio standard.

---

## 4. Tactical Blueprint & Phasing

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

## 5. File Changes

- [`src/media/image-trigger.js`](../../src/media/image-trigger.js) — Independent timers, priority resolver, ceiling logic, comment cleanups.
- [`src/media/image-trigger.test.js`](../../src/media/image-trigger.test.js) — Dual cooldown and tiebreaker test coverage.
- [`src/media/image-prompts.js`](../../src/media/image-prompts.js) — Framing catalog, perspective tokens, intensity-to-lens mapping.
- [`src/media/image-prompts.test.js`](../../src/media/image-prompts.test.js) — Camera directive prompt synthesis tests.
- [`src/ui/message/Attachments.svelte`](../../src/ui/message/Attachments.svelte) & [`src/ui/message/Prologue.svelte`](../../src/ui/message/Prologue.svelte) — Unified image card chassis.
- [`src/intelligence/kernel.js`](../../src/intelligence/kernel.js) — Passing dual timestamps into trigger evaluator.

---

## 6. Verification Gate & Acceptance Criteria

- [ ] Dynamics beat fires while Director is on cooldown, and vice-versa.
- [ ] When both qualify in the same round, exactly **1** image generates (Director priority).
- [ ] High intensity ($\ge 75$) prompts contain `tight close-up portrait` perspective directives.
- [ ] Prologue and turn images share identical card chassis and visual styling.
- [ ] Automated tests: `npm run test:unit` passing with 0 regressions.
- [ ] Production build: `npm run build`
