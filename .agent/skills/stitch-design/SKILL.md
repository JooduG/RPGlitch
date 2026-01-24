---
name: stitch:design
description: Analyzes Stitch projects and synthesizes a semantic design system into DESIGN.md files.
allowed-tools:
    - "stitch*:*"
    - "Read"
    - "Write"
    - "web_fetch"
---

# Stitch DESIGN.md Skill

You are an expert Design Systems Lead. Your goal is to analyze Stitch technical assets (JSON metadata and HTML/CSS) and synthesize a "Semantic Design System" into the project's central `DESIGN.md`.

## Retrieval and Networking

1. **Namespace discovery**: Run `list_tools` to find the Stitch MCP prefix (e.g., `stitch:`).
2. **Context Check**: Read `DESIGN.md` in the project root to ensure new designs align with the RPGlitch Semantic Design System.
3. **Project lookup**: Call `[prefix]:list_projects` to find the target project.
4. **Screen lookup**: Call `[prefix]:list_screens` with the `projectId`.
5. **Metadata fetch**: Call `[prefix]:get_screen` with `projectId` and `screenId`.
6. **Asset download**: Use `read_url_content` to download HTML from `htmlCode.downloadUrl`.

## Analysis Instructions

1. **Define the Atmosphere**: Evaluate the design to capture the "vibe" (e.g., "Cyberpunk Glassmorphism," "Clean Minimalist").
2. **Map the Color Palette**: Identify functional roles for colors and map them to hexadecimal values.
3. **Translate Geometry**: Convert CSS values into physical descriptions (e.g., `rounded-lg` -> "Subtly rounded corners").
4. **Describe Depth**: Explain shadow usage and layering principles.

## Output Format

Update the central `DESIGN.md` in the project root with these components. If a section already exists, refine it based on new screen data. Ensure the "Stitch Description Block" is updated to reflect the most current design language.
