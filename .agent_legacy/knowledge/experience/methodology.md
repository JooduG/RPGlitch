# 🏗️ Artificer: Design & Build Methodology

The internal "Playbook" for building and refining the RPGlitch sensory layer.

## 🏃 1. The Design-Baton Loop

The primary workflow for creating a new feature or scene.

1. **Draft (Scholar):** Define the data requirements. What state is being tracked?
2. **Aura (Mesmer):** Define the visual mood. What is the atmospheric anchor?
3. **Structure (Artificer):** Build the semantic HTML and layout.
4. **Resonance (Gamemaster):** Connect the Svelte Runes to the state.
5. **Polish (Warden):** Apply the Quality Gate audit.

## ⚡ 2. The Stitch Protocol (Rapid Prototyping)

When using AI assistance to build UI components:

- **Isolated Scoping:** Build the component in a single, self-contained file with inline SCSS.
- **Token Injection:** Force the AI to use `var(--app-...)` tokens from the very first prompt.
- **Fail Fast:** If the layout breaks, revert immediately to the "Neural Baseline" and rebuild the specific interaction.

## 🛡️ 3. The Quality Gate (Audit)

Every component must pass these four checks before completion:

1. **Visual:** Does it adhere to the **Chalk Regime**? (No hex codes, soft depth present).
2. **Interaction:** Does it use the **Snappy Curve**? Is there haptic feedback (scale shift)?
3. **Accessibility:** Are IDs unique? Is the contrast ratio high enough on the Zinc text?
4. **Adaptability:** Does it degrade gracefully on mobile?

## 🧪 4. The Sandbox

New UI ideas should be tested in the `Playground` before being integrated into the main `App.svelte` monolith.
