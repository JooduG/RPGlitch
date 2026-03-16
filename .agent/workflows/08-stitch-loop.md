# Workflow: 08-stitch-loop (The Feedback Cycle)

> **Context:** Reverse-engineered from the Stitch SDK `component-validator.ts`.

## Phase 1: Generation

1. Trigger the `stitch-design` skill to generate the Svelte 5 component.

## Phase 2: The Validation Gate (SDK Extraction)

Before accepting the Stitch output, you MUST act as the Component Validator:

1. **Syntax Check:** Does the `<script lang="ts">` block close properly?
2. **Prop Check:** Are all `$props()` destructured correctly according to Svelte 5?
3. **CSS Bleed Check:** Are there any `class="bg-..."` or Tailwind strings? If so, REJECT.

## Phase 3: The Critique Loop

If the Validation Gate fails:

1. Do not ask the user for help.
2. Send a specific critique back to the Stitch engine (e.g., "You used Tailwind. Rewrite using var(--chalk-surface)").
3. Repeat Phase 1 until the Validation Gate passes.
