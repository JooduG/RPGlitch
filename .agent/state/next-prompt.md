---
component: NarrativeConsole
type: organism
target: src/ui/organisms/NarrativeConsole.svelte
---

# NarrativeConsole

A central diegetic console for the Narrative Director, used to monitor and influence the current simulation state.

**DESIGN SYSTEM (REQUIRED):**

- **Platform**: Web, Desktop-first (Single-file Monolith)
- **Theme**: Dark Mode, Glassmorphism, Nordic Aesthetic
- **Background**: Deep Base Charcoal (#11191f)
- **Surface**: Gunmetal Glass (#1b262c) with 10% opacity white overlay and heavy blur.
- **Primary Accent**: Frozen Deep Blue (#0f4c75) for buttons and active states.
- **Text Primary**: Chalk Off-White (#e1e5f2)
- **Fonts**: Ubuntu (Headings), Inter (Body), JetBrains Mono (Technical)
- **Border/Elevation**: No pixel borders. Use soft shadows and background blurs for depth.
- **Corner Radius**: 8px (0.5rem) default.

**COMPONENT STRUCTURE:**

1. **Simulation Header**: Status readouts for "Reality Stability" and "Sino-Logic Load" in JetBrains Mono.
2. **Recursive Log (Center)**: A deep sunken well showing streaming text events with Frisk muted colors.
3. **Vector Controls (Bottom)**: A cluster of Frozen Blue pill-buttons for "Inject Pulse", "Reset Nexus", and "Fork Reality".

**TECHNICAL CONSTRAINTS:**

- **Target**: Svelte 5 Organism
- **Interactions**: Standard elastic lift on hover, slight scale-down on press.
