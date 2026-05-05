# 🎨 UI DESIGN WORKSHOP: TYPOGRAPHY & POLISH

This document tracks the refined specifications for the RPGlitch Engine UI components discussed during the "fitText" review.

## 🃏 StoryboardCard (Selection Tarot)
**Goal:** Modern Intuitive Immersive Minimalism.
- **Visuals:** Add `backdrop-filter: blur(12px)` to the `.card-info-scrim` to create a "Glass Stabilized" separation between text and artwork.
- **Name Scaling:** Set `fitText` floor (`minSize`) to **26px**. Line-height fixed at **1.0** for a dense, cinematic look.
- **Description:** 
  - Fix size at **14px** (no scaling) to maintain hierarchy.
  - Implement a "Clean Fade" truncation: Remove the hard 2-line clamp if possible, or refine the clamp to ensure it never feels "cut off" mid-sentence.
- **Aesthetic:** The name should feel like a cinematic title card superimposed over the visual.

## 🪪 EntityHeader (Identity Banner)
**Goal:** [PENDING USER UPDATE]
- **Current Idea:** Dual-depth identity (Foreground label + Background "Ghost" name).
- **Refinement Needs:** Determine exact placement and interaction (behind modal vs integrated).

## 🃏 LibraryCard (Archive Tarot)
**Goal:** [REJECTED - PENDING NEW DIRECTION]
- *Note: User rejected the Superimposed Hallmark idea.*

## 🖼️ ProfilePicture (Initials Placeholder)
**Goal:** Premium High-Contrast Density.
- **Scaling:** Preserve the massive scale (~300px ceiling) with a floor of **80px**.
- **Type Polish:** 
  - **Chrono-tracking:** Apply `letter-spacing: -0.05em` to make initials feel like a custom logo.
  - **Glow Rendering:** Replace basic shadows with a high-contrast white glow: `drop-shadow(0 0 10px rgb(255 255 255 / 40%))`.
- **Aesthetic:** Intentional and high-tech, moving past the "missing photo" vibe.
