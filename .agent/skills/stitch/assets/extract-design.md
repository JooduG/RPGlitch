---
description: To reverse-engineer remote Stitch projects.
---

# Style Extraction

1. **Fetch**: Use `list_projects` and `get_screen` to pull the target Stitch metadata.
2. **Translate**: Strip out all Tailwind classes. Convert them into descriptive semantic language ("pill-shaped", "whisper-soft shadows").
3. **Map**: Align the extracted patterns with the **Designer**'s `CHALK_REGIME` mapping (`var(--color-chalk-...)`).
4. **Format**: Format the summary as a `DESIGN.md` spec for the **Stitch MCP**, following the [Stitch Guidelines](../references/stitch-guidelines.md).
5. **Write**: Output the final spec to the root `DESIGN.md`.
