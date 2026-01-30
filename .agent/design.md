# RPGlitch: Semantic Design System (Master)

> [!NOTE]
> This is the Global Source of Truth for the RPGlitch design system. It bridges technical SCSS tokens with high-level visual descriptions for AI-driven development.
> **Technical Source of Truth**: [\_variables.scss](../src/mesmer/scss/abstracts/_variables.scss)

## 1. Design Philosophy: The Silent Stage

RPGlitch follows a system of **Neural Minimalism**. The design language is engineered as a high-fidelity vessel that "breathes" with the narrative rather than competing with the user's imagination. It is a "Silent Stage" where the UI defines the boundaries of reality without cluttering the performance.

- **Philosophy**: Clear, functional, and atmospheric.
- **Narrative Resonance**: The system is designed to "resonance" with the story's emotional state through subtle shifts in lighting and depth.
- **Agnostic Foundation**: The UI must feel equally valid for erotic, fantasy, political, or sci-fi roleplay by remaining neutral and muted until narrative "Entropy" is injected.
- **Contextual Intelligence (Intuitive Immersion)**: The system surfaces only what is needed at the precise moment of interaction. It blends intuition with deep immersion by purging unnecessary bloat from the user's immediate view, allowing the interface to respond dynamically to the user's intent.

## 2. Palette: Signature & Functional

Technical tokens are mapped from `../src/mesmer/scss/abstracts/_variables.scss`.

### 2.1 The Baseline (The Muted Foundation)

RPGlitch uses a neutral, muted base to ensure genre-agnosticism.

| Role        | Token             | Default Hex | Purpose                                                    |
| :---------- | :---------------- | :---------- | :--------------------------------------------------------- |
| **Base**    | `$app-background` | `#11191f`   | The deep neutral canvas (Baseline: Profile Wing Gradient). |
| **Surface** | `$app-surface`    | `#2b3848`   | Neutral panels and containers.                             |
| **Muted**   | `$app-muted`      | `#94a3b8`   | Subtle text and borders.                                   |

### 2.2 Dynamic Signature System

Signature colors are "injected" into the muted base per entity or scene using the **`color-mix` principle**.

- **Signature Colors**: Defined by the entity (Red, Blue, Purple, etc.).
- **Mixing Logic**: Use `color-mix(in oklab, var(--signature-color) 12%, var(--app-surface) 88%)` for specialized surfaces.
- **State Colors**:
    - **Primary**: `$app-primary` (Generic name for main actions).
    - **Secondary**: `$app-secondary` (Generic name for secondary actions).
    - **Accent**: `$app-accent` (Generic name for highlights).

## 3. Geometry & Physics

### 3.1 Roundedness (The Organic Curve)

RPGlitch uses generous, intentional curves derived from the **Profile Dossiers**.

- **Panels & Cards**: `var(--spacing-lg)` (Standard: `1.5rem`).
- **Interactive Controls**: `var(--spacing-sm)` (Standard: `0.5rem`).
- **Rounding Strategy**: Large surfaces should feel cohesive and contained, not sharp.
- **Exceptions**: "Pill" geometry (`999px`) is permitted for floating control groups or special holographic elements.

### 3.2 Elevation (Soft Depth)

Depth is achieved through layering and soft environmental effects rather than high-contrast borders.

- **Layering**: Use `box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5)` for primary focus panels.
- **Atmospheric Blur**: Use `backdrop-filter: blur(10px)` (Subtle) or `25px` (Heavy) to create separation from the background without the "thick glass" aesthetic.
- **Visibility**: Avoid borders where possible. Use slight opacity shifts (`rgba(255, 255, 255, 0.05)`) to define space.

### 3.3 Kinetic Actions (The Physics Engine)

Micro-interactions must feel physically consistent across the system.

- **Standardization**: Use the centralized `kinetic.js` actions (`shimmy`, `pulse`, `spin`) via the **Web Animations API** to ensure identical math system-wide.
- **Prohibition**: Avoid ad-hoc CSS keyframes for standard interactions (e.g., hover twitches).
- **Behavior**: "Shimmy" is strictly rotation-based with elastic easing; "Pulse" is scale-based.

#### 3.3.1 Holographic Tilt (The Heavy Layer)

Used for Hero Elements (Profile Cards, Artifacts) to simulate mass and attention.

- **The Clockwork Rule**: The application is mechanical and industrial. Internal elements may "twitch" or vibrate _in place_ (like gears), but they must **NOT** float or travel across the component "magically".
- **Physics**: Tilt simulates a physical object with weight. Elements inside are bolted down.
- **The Artificer's Mandate**: The structure is heavy and intentional. The Mesmer provides the atmosphere (paint, glow), but the physics are strictly mechanical.

### 3.4 Modal & Overlay Physics (The Split-Layer)

Interactions with overlays must separate the visual from the physical to ensure reliability.

- **The Split Pattern**: Architecture must separate the **Visual Layer** (Backdrop Component) from the **Interaction Layer** (Layout Wrapper).
- **Interaction Rule**: The "Backdrop" visual is passive. The `modal-layout` wrapper must capture "empty space" clicks to trigger close events.
- **Click-Through**: Modal content must explicitly stop propagation or verify `e.target === e.currentTarget` to prevent accidental closures on tall or sticky content.

## 4. Component Manifestations

### 4.1 The Storyboard: Focused Viewport

The Storyboard is a distraction-free window into the narrative "Void."

- **Atmospheric Separation**: Use soft depth and `backdrop-filter: blur(25px)` to create a focused lens on the text, allowing the rest of the UI to melt into the periphery.
- **The Aura Principle**: Accents and peripheral glows must shift based on the **Signature Palette** of the active entity or scene, ensuring the UI resonances with the story.

### 4.2 Profile & Wings: Structural Identity

The profile system represents **Dossiers in the Baseline**.

- **Floating Dossiers**: Profile windows should feel like paper-thin layers lifted from the neural baseline using expansive shadows.
- **Authoritative Calm**: Use Title Case and standard font weights to give labels the "official" weight of a mastermind's interface.
- **Intentional Physics**: Interaction motion (e.g., card lifts) must feel determined and reactive, as if the wings are unfolding to reveal data.

## 4. Typography Hierarchy

### 4.1 Font Stacks

- **Headings**: `Ubuntu`. (Agnostic Alternative: `Outfit`). Used for impact and authoritative titles.
- **Body**: `Inter`. The standard for high-legibility roleplay text and descriptions.
- **Code**: `Roboto Mono`. Technical feedback and system-level lore blocks.

### 4.2 Casing & Style

- **System Labels**: **Title Case Only**. Use "Begin Story", never "BEGIN STORY".
- **Strong Sentence Case**: If drawn to use Uppercase, prefer **Strong Sentence Case** (Weight 800) instead. Uppercase is reserved for very special holographic occasions.
- **Weight**: Keep standard body weight at `400`. Headlines should be `700` (Bold) or `800` (Extra Bold).
- **Interactivity**: Avoid shifting border colors on hover for main containers. Use shadow depth or subtle background opacity shifts instead.

### 4.3 Visual Notes (Implementation Details)

- **Loading States (Illusions)**: Current iterations of the Storyboard Skeleton use a specific Matte "Chalk" (`#222326`) to serve as a deep void, avoiding the "blue drift" of standard transparent surfaces. This is an implementation preference for high-contrast voids, not a global law.

## 5. Stitch Prompting Block (Stitch-Ready)

> Copy and paste this into any Stitch generation prompt:
>
> "Design for RPGlitch: A clean, minimalistic, and genre-agnostic interface. Atmospheric but neutral. Base palette is a deep muted neutral (#11191f) with subtle radial depth. Avoid glassmorphism and heavy borders. Use soft depth with layered elevation and subtle blurs (backdrop-filter: blur(10px)). Signature color is used only for highlights and accents. Typography: Ubuntu for headings, Inter for body. System labels must use Title Case."

## 6. Process Hooks (Collaborative Mode)

- **The Mesmer Protocol**: Before any UI build, use the **[Mesmer Skill](skills/mesmer/SKILL.md)** to define the "Aura".
- **The Design Baton**: Coordinate via the **[Mesmer Nexus](knowledge/mesmer/nexus.md)**.
- **Visual Auditing**: Run `/review-design` (Check against **[Quality Gate](knowledge/mesmer/quality-gate.md)**).
- **Stitch Loop**: Follow the loop in **[Prototyping](knowledge/mesmer/prototyping.md)**.
- **Reference**:
    - **Physical Rules**: [03-tech-stack Pillar](rules/03-tech-stack.md).
    - **Illusory Rules**: [Inspiration](knowledge/mesmer/inspiration.md).
