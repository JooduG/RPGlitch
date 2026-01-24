# RPGlitch: Semantic Design System (Master)

> [!NOTE]
> This is the Global Source of Truth for the RPGlitch design system. It bridges technical SCSS tokens with high-level visual descriptions for AI-driven development.
> **Technical Source of Truth**: [\_variables.scss](../src/mesmer/scss/abstracts/_variables.scss)

## 1. Core Atmosphere

RPGlitch uses a **Rich Atmospheric Cyber-Fantasy** aesthetic.

- **Mood**: Immersive, moody, and sleek.
- **Surface Strategy**: Heavy use of **Glassmorphism** to create depth and focus.
- **Backgrounds**: Deep, multi-layered gradients providing a sense of endless space.

## 2. Palette: Signature & Functional

Technical tokens are mapped from `src/mesmer/scss/abstracts/_variables.scss`.

| Role           | Descriptive Name | Hex Code  | Purpose                                              |
| :------------- | :--------------- | :-------- | :--------------------------------------------------- |
| **Primary**    | Deep Soul Purple | `#a855f7` | Main action buttons and focus states.                |
| **Secondary**  | Glitch Blue      | `#3b82f6` | Supporting actions and navigation accents.           |
| **Accent**     | Neon Pulse Pink  | `#ff7ad5` | Highlights, notifications, and critical UI feedback. |
| **Background** | Void Canvas      | `#11191f` | The dominant dark canvas for the application.        |
| **Surface**    | Dark Alloy       | `#2b3848` | Card and panel backgrounds.                          |

## 3. Geometry & Physics

- **Roundedness**: Standard components use `0.25rem` (Subtly squared). Specialized controls use `pill-shaped` (Rounded-full).
- **Elevation**: Depth is achieved via **Glass Levels** rather than traditional drop shadows.
    - **Standard**: 16px Blur, 60% Opacity (`%material-glass`).
    - **Heavy**: 20px Blur, 85% Opacity.
- **Interactions**: Subtle elastic transforms on hover (`cubic-bezier(0.34, 1.56, 0.64, 1)`).

## 4. Typography Hierarchy

- **Headings**: `Ubuntu`. Bold, spacious, and authoritative.
- **Body**: `Inter`. Clean, high-legibility sans-serif.
- **Code**: `Roboto Mono`. For system feedback and lore data blocks.

## 5. Stitch Prompting Block (Stitch-Ready)

> Copy and paste this into any Stitch generation prompt:
>
> "Design for RPGlitch: A dark-themed cyber-fantasy interface using glassmorphism. Atmosphere is immersive and sleek. Colors: Deep Soul Purple (#a855f7) for primary actions, Glitch Blue (#3b82f6) for secondary, and Neon Pulse Pink (#ff7ad5) for accents. Background is Void Canvas (#11191f). Use subtly rounded corners (0.25rem) and heavy glass blurs (16px+). Typography: Ubuntu for headings, Inter for body."

## 6. Process Hooks

- **Design Review**: See `review-design.md` workflow for auditing against these standards.
- **Component Generation**: Use the `stitch-svelte` skill to ensure $state and run_command usage follows the Prime Directive.
