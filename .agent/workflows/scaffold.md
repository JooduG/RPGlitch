---
description: Generates new Svelte 5 components with correct boilerplate, styles, and tests.
---

# 🏗️ Component Scaffolder

> **Goal:** Create a new UI component that adheres to Mesmer standards immediately.

1. **Define Specs:**
   - Ask user: "Name?" (e.g., `user-card`), "Purpose?".

2. **Generate File (`src/js/mesmer/ui/components/<name>.svelte`):**
   - **Template:**

     ```svelte
     <script>
       let { visible = true } = $props();
       let internalState = $state(0);
     </script>

     {#if visible}
       <article class="<name>">
         <!-- Content -->
       </article>
     {/if}

     <style lang="scss">
       .<name> {
         // SCSS here
       }
     </style>
     ```

3. **Register:**
   - Ensure it's exported/imported where needed (e.g., `index.js`).

4. **Lint:**

   ```bash
   // turbo
   npm run lint:fix
   ```
