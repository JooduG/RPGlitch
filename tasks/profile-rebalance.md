# Profile Layout Rebalance Plan

## Objective

Rebalance the `Profile.svelte` interface to achieve a stable, proportional, and aesthetically clean layout that adheres to the Nordic Collection and Grounded Policy. The current layout suffers from shifting when side panels ("wings") open, clunky typography, arbitrary spacing, and redundant layers on the avatar.

## Key Files & Context

- `src/ui/profile/Profile.svelte`: Main layout container, manages `.wings`, `.card`, `.avatar`, and `.body`.
- `src/ui/profile/EntityHeader.svelte`: Handles name and description fields, currently using hacky negative margins.
- `src/ui/atoms/ProfilePicture.svelte`: Renders the avatar, currently duplicating glass/noise effects.

## Implementation Steps

### 1. Clean Layers (ProfilePicture.svelte)

Although the image itself is opaque, the wrapper currently duplicates the glass effect and noise texture from its parent, which is architecturally unclean.

- **Change:** Remove the `.wrapper` background (`--glass-sunken`), backdrop-filter, and the `::before` pseudo-element (noise texture). The picture wrapper should rely entirely on its parent container for background effects.

### 2. Stabilize the Structural Anchor (Profile.svelte)

The main profile card must never shift horizontally when the wings toggle open/closed.

- **Change:** Set `.wrapper` to `position: relative`.
- **Change:** Set `.wings` to `position: absolute` so they float outside the normal document flow. Use `right: calc(100% + var(--spacing-4))` (or `left` depending on flex order) to float them beside the main card without altering its layout.
- **Change:** Update the internal `.card` grid from a percentage (`minmax(..., 30%) 1fr`) to a token-based split (e.g., `var(--avatar-medium-size) 1fr`) to prevent the avatar from warping based on text length.

### 3. Normalize Proportions and Typography (Profile.svelte)

The text hierarchy is broken because `.body` forces a massive font size onto all children.

- **Change in Profile.svelte:** Remove `font-size`, `font-weight`, `letter-spacing`, and `text-shadow` from the `.body` class.
- **Change in Profile.svelte (Mobile):** Change the `.avatar` mobile rule from `clamp(20rem, 20vh, var(--avatar-medium-size))` to a more stable structure (e.g., fixed token height or `aspect-ratio: 1/1`).

### 4. Clean up Header Spacing (EntityHeader.svelte)

The header is using negative margins to bleed into the parent's padding, which breaks the layout flow.

- **Change:** Remove the negative margin and `calc(100% + ...)` width from `header`.
- **Change:** Apply standard padding and align it within the normal grid structure of the card. Add `border-radius: 0 var(--radius-standard) 0 0` to fit the top-right corner perfectly.

## Verification & Testing

- **Visual Stability:** Open the profile. Toggle edit mode. The main card MUST NOT move horizontally.
- **Clean Code:** Inspect `ProfilePicture` to ensure no redundant backgrounds or filters exist.
- **Typography Check:** Verify that normal text reads at `font-size-base` and only the name uses `font-size-h3`.
- **Mobile Layout:** Shrink the viewport to mobile sizes. Ensure the avatar does not squash and the text is legible.
