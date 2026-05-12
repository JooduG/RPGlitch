# 🧵 Stitch Guidelines (Technical Bridge)

> **Goal**: To ensure the root `DESIGN.md` translates perfectly into the Stitch MCP's technical structures.

## 1. Structure

The `DESIGN.md` MUST follow this hierarchy to be parsed correctly by the Stitch bridge:

1. **# Project Title**: One H1 heading.
2. **## Component Name**: High-level feature or page.
3. **### Element/ID**: Atomic descriptions.

## 2. Terminology (The Chalk Regime)

Always use these tokens instead of raw colors or generic descriptions:

| Semantic Goal          | Token                    | Technical Value |
| :--------------------- | :----------------------- | :-------------- |
| **High-Contrast Text** | `var(--color-chalk)`     | `#222326`       |
| **Icy Accent**         | `var(--color-frozen)`    | `#555d66`       |
| **Card Background**    | `var(--bg-card)`         | `#363840`       |
| **Rounded Corners**    | `var(--border-radius-m)` | `0.5rem`        |

## 3. Formatting Rules

- **No Ambiguity**: Instead of "Make it look professional", use "Apply elevation `var(--glass-elevated)` and glassmorphic blur `var(--blur-m)`".
- **ID Integrity**: Every interactive element described in a screen spec MUST have a unique, descriptive ID (e.g., `#btn-inventory-open`).
- **Responsive Logic**: Describe layout shifts using T-shirt sizes (e.g., "On `Mobile`, stack; on `Desktop`, grid").

## 4. MCP Operation Logic

When calling the Stitch MCP:

- **`projectId`**: Must be the unique identifier for the Stitch cloud project.
- **`prompt`**: Should be a concise summary of the _change_ relative to the existing `DESIGN.md`.
- **`selectedScreenIds`**: Use only the IDs of the screens that require direct editing.

---

> "The spec is the bridge."
