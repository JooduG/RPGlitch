# 🎯 Spec: StoryMode Restoration

> **Goal:** Restore the "Cinematic" StoryMode UI with full-bleed character panels, dynamic signature colors, and a mobile-optimized layout.

## 1. Core Requirements

### 📱 Layout Architecture

- **Desktop:** Standard 3-column "Winged" layout (2-8-2 or 3-6-3).
    - Left: AI Profile (Full Height)
    - Center: Story Feed & Input
    - Right: User Profile (Full Height)
- **Mobile:** "Stacked Header" layout.
    - Top Row: [AI Profile] [User Profile] (50% width each, fixed height).
    - Bottom Row: Story Feed (Full width).
    - **Constraint:** Side panels must NOT be hidden on mobile.

### 🎨 Visuals (The Mesmer Layer)

- **Panels**: Full-bleed background images (cover).
- **Overlays**: Gradient overlays using the entity's `signature-color`.
    - Opacity/Intensity should match the reference style (vibrant but readable).
- **Typography**: "Cinematic" headers for character names (e.g. `font-family: var(--font-heading)`).

### ⚡ State Integration

- **Colors**: Must derive from `app.selectedAi.visuals.signatureColor` and `app.selectedUser.visuals.signatureColor`.
- **Images**: Fallback handling if no image is present (placeholder with color).

## 2. Technical Constraints

- **Component**: `src/ui/organisms/Layout.svelte` must be updated to support the mobile stack.
- **Component**: `src/ui/organisms/storymode/StorymodePanel.svelte` needs CSS updates for the overlay.
- **CSS**: Use `kebab-case` class names. No Tailwind.

## 3. Success Criteria

- [ ] Mobile view shows both characters at top.
- [ ] Desktop view shows winged layout.
- [ ] Panels glow with correct signature colors.
- [ ] Images are full-bleed.
