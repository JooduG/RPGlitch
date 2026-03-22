---
description: To reverse-engineer remote Stitch projects.
---

# Style Extraction

1. **Fetch**: Use `list_projects` and `get_screen` to pull the target Stitch metadata.
2. **Translate**: Strip out all Tailwind classes. Convert them into descriptive semantic language ("pill-shaped", "whisper-soft shadows").
3. **Map**: Assign those semantic descriptions to our Svelte 5 / Chalk framework mapping to `var(--color-chalk-...)` tokens whenever possible.
4. **Format**: You MUST format `DESIGN.md` strictly according to the Stitch documentation guidelines, adhering to exact H2 headings in this exact order: `## Overview`, `## Colors`, `## Typography`, `## Elevation`, `## Components`, `## Do's and Don'ts`.
5. **Write**: Output the formatted markdown to the root `DESIGN.md`. All output must exclusively go to this file, nowhere else.
