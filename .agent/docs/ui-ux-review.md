# RPGlitch UI/UX Vibe Check

## High-level impression
The application feels like a high-end, futuristic terminal. The strict reliance on a dark, cohesive color palette, consistent spacing, and a global noise overlay gives it a distinct, premium, and slightly mysterious atmosphere.

However, the aggressive use of glassmorphism (translucency + background blur) combined with a dark, low-contrast palette creates significant readability issues. While the interface looks beautiful as a static piece of art, the "visual friction" when actually using it is high. Stacking multiple transparent layers (e.g., a modal over a drawer over a gradient background) quickly devolves into an illegible, muddy gray mess.

## Design system & visual language
**What works:**
- **Consistency:** The adherence to strict design tokens (e.g., spacing and border-radii) is excellent. The 12-column grid system in the layout provides a solid, predictable foundation.
- **Atmosphere:** The radial gradients and global noise overlay succeed in breaking up digital perfection, giving the app physical texture.
- **Kinetic Physics:** The use of CSS animations for hover states makes interactions feel snappy and hardware-accelerated.

**What doesn’t:**
- **The "Glass" effects are too dark:** Variables controlling translucency (like 15% black or 15% gray) rely too heavily on the underlying background being dark. When these glass surfaces overlap or sit over lighter parts of the gradient, contrast drops below accessible levels.
- **Low-Contrast Grays:** Relying on medium grays for primary accents and borders against dark slate backgrounds often lacks the necessary "pop" to guide the user's eye to primary actions.

## Components & patterns to fix
- **Global Tooltips:** The tooltip implementation uses a 30% opacity black background. This is nearly invisible against the dark theme, making the white text completely unreadable.
  - *Fix:* Use a solid, high-contrast background for tooltips to ensure they stand out as top-layer elements.
- **Storyboard Empty State (`StoryboardCard.svelte`):** When a card is empty, the container drops to 30% opacity, and the text uses an off-white color. This results in 30% opaque off-white text on a dark background—a severe contrast violation that is very hard to read.
  - *Fix:* Keep the text container at full opacity, or use a much brighter color if the container must remain translucent.
- **Library Drawer "Create New" Card:** The background uses a 30% black overlay while the icon wrap uses a 5% white overlay. It doesn't look like a distinct interactive element until hovered.
  - *Fix:* Increase the base opacity to at least 10% or use a dashed border to define the click target.
- **VectorCard Delete Button:** Stacking an inset shadow with a border-like shadow creates visual noise and looks cluttered.
  - *Fix:* Pick one. A clean 1px solid border looks more premium than complex shadow stacking.
- **Keyboard Navigation:** The app fails the "Keyboard-Only" test. While standard buttons have a focus ring, custom interactive elements (cards, lists, panels) lack clear focus states. The existing focus ring uses a medium gray which doesn't provide enough contrast against dark backgrounds.
- **Focus Trapping:** Modals and drawers do not trap focus. A keyboard user can tab right out of the drawer and interact with the blurred background elements.
- **Animation Conflicts:** The custom kinetic hover action for `spin` manually triggers a new animation on `mouseleave` to reset state, rather than reversing the existing animation. Rapid hovering causes these animations to overlap and stutter.
- **Kinetic Scroll:** The custom drag-to-scroll mechanic on mobile will cause severe jitter because it fails to prevent the browser's native scrolling behavior during touch movements.
- **Drawer Headers:** "Select AI Character" is good, but "Select User Persona" is a bit wordy. "Choose Your Persona" feels more direct and engaging.

## Concrete improvement suggestions
1. **Fix the Glass Contrast:** Immediately audit and bump the opacity or brightness of translucent backgrounds, especially for empty states and tooltips.
2. **Implement Global Focus Rings:** Define a high-contrast, globally accessible `:focus-visible` utility class (perhaps using a brighter, icy blue or pure white) and apply it to *all* interactive elements, not just buttons.
3. **Solidify Overlays:** Modals and tooltips at the highest z-index should abandon heavy glassmorphism in favor of solid, opaque backgrounds with subtle borders. This guarantees readability regardless of the complex gradients beneath them.
