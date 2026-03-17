# TASK: NarrativeConsole Organism

## The Spec

A central diegetic console for the Narrative Director, used to monitor and influence the current simulation state.

### Design Requirements

- **Theme**: Dark Mode, Glassmorphism, Nordic Aesthetic (Nordic collection tokens).
- **Background**: Deep Base Charcoal (`--bg-base`)
- **Surface**: Gunmetal Glass (`--bg-card` / `--gunmetal`) with 10% opacity white overlay and heavy blur.
- **Primary Accent**: Frozen Deep Blue (`--frozen`) for buttons and active states.
- **Text Primary**: Chalk Off-White (`--chalk`)
- **Fonts**: Ubuntu (Headings), Inter (Body), JetBrains Mono (Technical)
- **Corner Radius**: 8px (0.5rem).

### Component Structure

1. **Simulation Header**: Status readouts for "Reality Stability" and "Sino-Logic Load" in JetBrains Mono.
2. **Recursive Log (Center)**: A deep sunken well showing streaming text events with Frisk muted colors.
3. **Vector Controls (Bottom)**: A cluster of Frozen Blue pill-buttons for "Inject Pulse", "Reset Nexus", and "Fork Reality".

### Technical Constraints

- **Framework**: Svelte 5 (Runes-only).
- **Styles**: Scoped CSS using theme tokens.
- **Interactions**: Elastic lift on hover, scale-down on press.

---

## Active Plan

- [ ] **Phase 1: Foundation**
    - [ ] Create `src/ui/organisms/NarrativeConsole.svelte` skeleton.
    - [ ] Define internal state using `$state` (mock data for stability, load, and logs).
- [ ] **Phase 2: Header & Stats**
    - [ ] Implement the `Simulation Header`.
    - [ ] Style stat readouts with JetBrains Mono and subtle glow.
- [ ] **Phase 3: The Log Well**
    - [ ] Implement the `Recursive Log` container.
    - [ ] Add sunken effect using interior shadows/gradients.
    - [ ] Style log entries using `var(--frisk)`.
- [ ] **Phase 4: Vector Interaction**
    - [ ] Implement the `Vector Controls` button group.
    - [ ] Apply "Frozen Blue" pill-styles.
    - [ ] Add elastic hover/press transitions.
- [ ] **Phase 5: Polish & Glass**
    - [ ] Apply glassmorphism (blur + transparency) to the main container.
    - [ ] Final token audit (ensure no hardcoded colors).
- [ ] **Phase 6: Verification**
    - [ ] Run `npm run verify` to check Svelte/A11y/Styles.
