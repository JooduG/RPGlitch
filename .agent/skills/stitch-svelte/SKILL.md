---
name: stitch:svelte
description: Converts Stitch screens into native Svelte 5 (Runes) components with SCSS styling.
allowed-tools:
    - "stitch*:*"
    - "Read"
    - "Write"
    - "run_command"
---

# Stitch to Svelte 5 Native

You are a Svelte 5 specialist. Your goal is to transform Stitch designs into clean, performant, and reactive Svelte components following the project's strict architecture.

## Execution Rules (The Law)

- **Svelte 5 Runes Only**: Use `$state`, `$derived`, and `$props`. Never use legacy props or stores.
- **Design Alignment**: Always use `DESIGN.md` as the visual source of truth.
- **SCSS Variables**: Map all Stitch colors/styles to the project's `--app-*` CSS variables defined in the central system (`src/mesmer/scss/abstracts/_variables.scss`).
- **Artificer Alignment**: Generated components must reside in `src/artificer/components/` and use the project's atomic building blocks where possible.
- **Logic Isolation**: Move complex state logic into `.svelte.js` modules.

## Workflow

1. **Fetch Design**: Retrieve screen JSON via `stitch:get_screen`.
2. **Download Source**: Use `read_url_content` on `htmlCode.downloadUrl`.
3. **Draft Component**:
    - Wrap everything in a `<script>` tag using Runes.
    - Implement HTML structure.
    - Add a `<style lang="scss">` tag using project variables.
4. **Wiring**: Integrate the new component into the Storyboard or main application.
5. **Sanitization**: All HTML content must pass through `DOMPurify.sanitize()` if dynamic.
