# 🧵 Stitch Bridge (Technical Reference)

> **Role**: This resource bridges the gap between the Aesthetic Law (Chalk Regime) and the technical requirements of the Stitch MCP.

## 1. Specification Structure (DESIGN.md)

The root `DESIGN.md` MUST follow this hierarchy to be parsed correctly by the Stitch bridge:

1. **# Project Title**: One H1 heading.
2. **## Component Name**: High-level feature or page.
3. **### Element/ID**: Atomic descriptions using semantic language.

## 2. Design System Tokens (The Chalk Regime)

Always use these tokens instead of raw colors or generic descriptions in the specification:

| Semantic Goal          | Token                    | Technical Value |
| :--------------------- | :----------------------- | :-------------- |
| **High-Contrast Text** | `var(--color-chalk)`     | `#222326`       |
| **Icy Accent**         | `var(--color-frozen)`    | `#555d66`       |
| **Card Background**    | `var(--bg-card)`         | `#363840`       |
| **Rounded Corners**    | `var(--border-radius-m)` | `0.5rem`        |

## 3. Style Extraction Workflow

To reverse-engineer remote Stitch projects into the local spec:

1. **Fetch**: Use `list_projects` and `get_screen` to pull the target Stitch metadata.
2. **Translate**: Strip out all Tailwind classes. Convert them into descriptive semantic language ("pill-shaped", "whisper-soft shadows").
3. **Map**: Align the extracted patterns with the **Designer**'s `CHALK_REGIME` tokens.
4. **Write**: Output the final spec to the root `DESIGN.md`.

## 4. Generation Workflow

When creating a new design specification:

1. **Receive**: Receive the aesthetic truth from the **Designer**'s Persona.
2. **Weave**: Format the spec into strict Markdown with clear H1/H2/H3 hierarchies.
3. **Ground**: Write the final spec to the root `DESIGN.md`.

## 5. MCP Operation Logic

- **ID Integrity**: Every interactive element described in a screen spec MUST have a unique, descriptive ID (e.g., `#btn-inventory-open`).
- **projectId**: Must be the unique identifier for the Stitch cloud project.
- **prompt**: Should be a concise summary of the _change_ relative to the existing `DESIGN.md`.
- **selectedScreenIds**: Use only the IDs of the screens that require direct editing.

---

> "The spec is the bridge."
