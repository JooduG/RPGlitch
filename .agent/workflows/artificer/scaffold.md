---
description: Generates new Svelte 5 components with correct boilerplate, styles, and tests.
---

# 🏗️ Component Scaffolder

> **Goal:** Create a new UI component that adheres to Artificer standards immediately.

1. **Define Specs:**
    - Ask user: "Name?" (e.g., `UserCard`), "Domain?" (e.g., `storyboard`, `chat`, `common`).

2. **Generate File (`src/artificer/<domain>/<Name>.svelte`):**
    - **Template:**

        ```svelte
        <script>
            /** @type {{ visible?: boolean }} */
            let { visible = true } = $props()
            let internalState = $state(0)
        </script>

        {#if visible}
            <article class="<name>"></article>
        {/if}

        <style lang="scss">
            @use "../abstracts/variables" as *; // Import Design Tokens

            .<name > {
                // Structure (Artificer)
                display: block;

                // Vibe (Mesmer) - MUST use variables
                background: var(--surface-1);
                color: var(--text-1);
            }
        </style>
        ```

3. **Style Enforcement** (Mesmer):
    - **Rule**: You MUST use CSS variables (tokens) for all colors, spacing, and typography.
    - **Banned**: Raw hex codes (e.g., `#000`), hardcoded pixels for layout (e.g., `20px` padding - use `var(--spacing-4)`).

4. **Register:**
    - Ensure it's accessible to the parent layout.

5. **Lint:**
    - Run `npm run lint:fix` to ensure formatting.
