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
       let { visible = true } = $props();
       let internalState = $state(0);
     </script>

     {#if visible}
       <article class="<name>"></article>
     {/if}

     <style lang="scss">
       .<name > {
         // SCSS here (Use @import '../abstracts/variables'; if needed)
       }
     </style>
     ```

3. **Register:**
   - Ensure it's accessible to the parent layout.

4. **Lint:**
   - Run `npm run lint:fix` to ensure formatting.
