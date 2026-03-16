# Design System: RPGlitch (The Chalk Regime)

**Project ID:** RPGlitch-Core

## 1. Visual Theme & Atmosphere

RPGlitch utilizes the **"Chalk Regime"**—a high-contrast, immersive, and diegetic aesthetic inspired by Nordic noir and glassmorphism. The UI feels like a physical layer resting over a dark, shifting reality. It prioritizes sensory depth, utilizing blurs and soft shadows instead of hard borders.

**Key Characteristics:**

- **Immersive/Diegetic**: The UI should feel like it exists within the game world.
- **Glassmorphism**: Extensive use of semi-transparent surfaces with background blurs.
- **High Contrast**: "Chalk" white text and highlights on "Gunmetal" and "Base" dark backgrounds.
- **Nordic Palette**: A restricted, cold palette of deep blues, grays, and cyans.

## 2. Color Palette & Roles

### Core Foundation (The Nordic Collection)

- **Chalk (#e1e5f2)**: Primary text color and extreme highlights. Represents "mechanical truth."
- **Gunmetal (#1b262c)**: Primary surface color for cards and containers.
- **Frozen (#0f4c75)**: Main accent color for interactive elements and brand identity.
- **Frisk (#3282b8)**: Secondary accent and muted text color.
- **Base Background (#11191f)**: The deepest layer of the application.

### Identity Roles

- **User Tone (#aecbfa)**: Soft blue for user-originated content.
- **AI/Intelligence Tone (#fde293)**: Warm yellow for agent and engine responses.
- **System Tone (#f28b82)**: Soft red for system logs and mechanics.
- **Fractal Tone (#e8eaed)**: Neutral gray for environmental simulation data.

### Signature Highlights

- **Action Cyan (#11aecc)**: Primary interactive success/progression.
- **Danger Red (#ef4444)**: Alerts, hazards, and destructive actions.
- **Warning Amber (#fbbf24)**: Intermediate states and cautions.

## 3. Typography Rules

- **Display/Headings**: "Ubuntu" - Bold, authoritative, and modern. (Line-height: 1.2)
- **Body Text**: "Inter" - Clean, highly legible sans-serif. (Line-height: 1.5)
- **Technical/Engine**: "JetBrains Mono" - Used for simulation logs and Sino-Logic data.

## 4. Component Stylings

### Surfaces & Depth (Glassmorphism)

- **Glass Panels**: Semi-transparent white overlays (`rgba(255, 255, 255, 0.1)`) with significant background blur.
- **Shadows**: No hard borders. Use "Whisper-soft" shadows for depth.
- **Sunken Wells**: Deep, recessed areas using `rgba(0, 0, 0, 0.6)` for inputs and logs.

### Interaction Physics

- **Hover**: Subtle vertical lift (-0.25rem).
- **Active**: Scale-down effect (95%) to simulate physical pressing.
- **Transitions**: Smooth, elastic easing for all state changes.

### Shape & Geometry

- **Default Roundness**: Gently rounded corners (8px / 0.5rem).
- **Pill Shapes**: Used for tags, chips, and specific status indicators.

## 5. Design System Notes for Stitch Generation (REQUIRED)

**Copy this block into every Stitch prompt to ensure alignment with the Chalk Regime:**

**DESIGN SYSTEM (REQUIRED):**

- **Platform**: Web, Desktop-first (Single-file Monolith)
- **Theme**: Dark Mode, Glassmorphism, Nordic Aesthetic
- **Background**: Deep Base Charcoal (#11191f)
- **Surface**: Gunmetal Glass (#1b262c) with 10% opacity white overlay and heavy blur.
- **Primary Accent**: Frozen Deep Blue (#0f4c75) for buttons and active states.
- **Text Primary**: Chalk Off-White (#e1e5f2)
- **Text Muted**: Frisk Blue-Gray (#3282b8)
- **Fonts**: Ubuntu (Headings), Inter (Body), JetBrains Mono (Technical)
- **Border/Elevation**: No pixel borders. Use soft shadows and background blurs for depth.
- **Corner Radius**: 8px (0.5rem) default.
