# 📜 FUTURE (The Muscle)

> **Role**: Active implementation blueprint for the _current_ track.
> **Status**: Active

---

## 🎯 Active Goal

### `feature-2026-07-30-visual-styles-expansion`

Expand and differentiate RPGlitch's visual style presets in `src/data/presets/visual-styles.js` for FLUX.1 and T5 text encoders:

1. **`lego_bricks` (New Style)**: LEGO® construction toy aesthetic featuring minifigure characters, brick-built background architecture with visible interlocking studs, injection-molded ABS plastic glossy texture, and tilt-shift macro lens depth.
2. **`concept_art` (New Style)**: Professional digital speedpainting and key art aesthetic featuring painterly digital brushwork, dynamic value grouping, atmospheric lighting, focal detail emphasis, and ArtStation pre-visualization studio quality.
3. **`surveillance_footage` (CCTV Refinement)**: Transition from monochromatic green night-vision toward glitchy visual artifacts — horizontal scanline stripes, video interlacing tear lines, digital compression glitch artifacts, corrupt pixel striping, timestamp overlay, and fisheye lens distortion.
4. **`amateur_snap` (iPhone Camera Refinement)**: Shift toward casual, unprepared, "extremely unremarkable" everyday realism with candid mirror selfie framing, handheld angles, direct flash glare, and added `"mirror_selfie"` tag.
5. **`steampunk` (Steampunk Refinement)**: Elevate from generic anime-with-pipes to authentic Victorian industrial clockwork machinery — intricate brass gears, copper boilers, pressure gauges, iron rivets, steam vents, and negative prompts penalizing generic anime cel-shading.
6. **System-wide Visual Style Differentiation**: Audit and deepen all visual style presets in `src/data/presets/visual-styles.js` to ensure maximum visual contrast and distinct visual tokens across all presets.

---

## 📐 Audit Summary

### Current Preset Registry (`src/data/presets/visual-styles.js`)

- `VISUAL_STYLES` dictionary contains 37 presets.
- Presets are consumed dynamically by `src/media/optics.js`, `src/ui/molecules/VisualWing.svelte`, `src/ui/organisms/Profile.svelte`, `src/ui/organisms/UnifiedConsole.svelte`, and `src/ui/atoms/StyleBadge.svelte`.
- XML structure in `visual_engine`: `<medium>`, `<palette>`, `<camera>` or `<composition>`, `<texture>`.
- Root `negative_prompt` prevents T5-XXL text encoder lexical contamination.

---

## 📋 Execution Plan

### Phase 1: Add New Visual Styles (`lego_bricks` & `concept_art`)

- Add `lego_bricks` with blocky plastic construction toy tokens, minifigure proportions, plastic studs, and ABS plastic textures.
- Add `concept_art` with digital speedpaint, key art, ArtStation studio painting tokens, painterly brushwork, and dynamic values.

### Phase 2: Refine Target Visual Styles (`surveillance_footage`, `amateur_snap`, `steampunk`)

- Update `surveillance_footage` for scanline stripes, interlacing tears, pixel compression glitches, washed-out desaturated colors, and fisheye security optics.
- Update `amateur_snap` for casual unpreparedness, extremely unremarkable framing, mirror selfie tag & medium tokens.
- Update `steampunk` for authentic Victorian clockwork machinery, brass cogs, copper boilers, iron rivets, steam vents, and strong negative prompts against generic anime.

### Phase 3: Deepen Visual Contrast Across Entire Registry

- Enhance tokens across all remaining styles in `src/data/presets/visual-styles.js` to ensure sharp differentiation.

### Phase 4: Verification & Audit

- Run unit tests, linting, and verify preset parsing via `src/media/optics.js`.
