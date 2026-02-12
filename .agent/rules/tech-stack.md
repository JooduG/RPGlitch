# Technical Stack & Constraints

## Core Framework: Svelte 5 (Runes Mode)

**STRICT ENFORCEMENT:** You are operating in a Svelte 5 Runes-only environment. Svelte 4 legacy syntax is strictly prohibited.

### ✅ APPROVED PATTERNS (Runes)

- **State:** Use `$state(val)` for all reactive variables.
- **Computed:** Use `$derived(expr)` for values dependent on state.
- **Side Effects:** Use `$effect(() => { ... })` for logic that runs on state change.
- **Props:** Use `let { propName }: Props = $props()` for component inputs.
- **Binding:** Use `$bindable()` for two-way data flow.
- **Snippets:** Use `{#snippet name()}` for reusable UI blocks instead of slots.
- **Ref:** Use `use` actions or bindings.

## Language: TypeScript (Strict)

- **No Any:** The usage of `any` is strictly forbidden.
- **Interfaces:** Prefer `interface` over `type` for object definitions.
- **Typing:** All props must be typed via a distinct `interface Props` definition.

## Architecture: Skeleton & Skin

- **Logic Separation:** Logic and State must be defined in the `<script lang="ts">` block.
- **Style Separation:** Visuals must be delegated to SCSS files or `<style lang="scss">`.
- **Structure:** Use semantic HTML (`article`, `section`, `nav`, `aside`) to house the data.

## Styling: SCSS (Neural Minimalism)

- **Tokens:** Use CSS variables (e.g., `var(--color-surface-1)`) for all colors and spacing.
- **No Hardcoded Values:** Do not use hex codes or pixel values directly in components.
- **Scoping:** Use Svelte's scoped styles for component-specific visuals.
