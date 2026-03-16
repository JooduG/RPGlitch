# Workflow: Text to Design

1. **Analyze Intent**: What is the user asking for?
2. **Apply Physics**: Translate all visual requests into Chalk variables (see `03-technetium.md`). If they ask for "blue," use `var(--chalk-accent)`.
3. **Component Breakdown**: Define the Svelte 5 component structure. Ensure interactive state uses `$state()` runes.
4. **Handoff**: Pass the blueprint to `generate-design-md.md`.
