# Workflow: Text to Design

1. **Analyze Intent**: What is the user asking for?
2. **Apply Physics**: Translate all visual requests into Chalk variables (see `.agent/rules/03-specification.md`). If they ask for "blue," use `var(--color-chalk-accent)`.
3. **Component Breakdown**: Define the Svelte 5 component structure. Ensure interactive state uses `$state()` runes.
4. **Handoff**: Pass the plan to `generate-design-md.md`.
