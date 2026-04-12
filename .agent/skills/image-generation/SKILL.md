---
name: image-generation
description: Triggered by any task involving prompt engineering, visual asset requests, or image generation via Perchance.
---

# Image Synthesis & Vision

> "I am the Visionary. I synthesize Narrative Context into Visual Reality via Prompt Engineering and Image Processing. Precision is the baseline of sovereignty."

## Overview

The `image-generation` skill manages the visual library of the RPGlitch Engine. It translates diegetic character descriptions and world-building cues into high-fidelity visual assets using generative AI tools. This skill ensures that every image adheres to the "Nordic Collection" aesthetic and is properly indexed for local-first simulation performance.

### Strategic Context

- **Nordic Consistency**: Maintain the subterranean research terminal vibe (Gunmetal, Chalk, Frozen tones).
- **High-Fidelity Voids**: Never use generic placeholders. Every image must be a final, ship-quality asset.
- **Sovereign Registry**: Every asset must be tracked in the `ImageRegistry` to prevent aesthetic drift.

## When to Use

- **Positive Triggers**: Generating character portraits, world fractals, UI assets (icons, loaders), or world-building mood boards.
- **Update Triggers**: Refreshing existing assets or refining prompts for better stylistic alignment.
- **EXCLUSIONS**: Do not use for simple CSS styling or logic work; dedicate those to `css` or `javascript`.

## How It Works

1. **Prompt Engineering**: Synthesize character/fractal metadata into a high-fidelity, stylistically-aligned prompt.
2. **Generation**: Invoke the `generate_image` tool to create the asset.
3. **Registry Integration**: Save the image to `src/media/images/` and update the `ImageRegistry` for state-driven recall.
4. **Metadata Archival**: Store the successful prompt for iterative refinement or future consistency checks.

### Asset Management

Maintain a strict directory structure for characters, environments, and UI components. Ensure all assets are hardware-optimized for the Perchance output panel.

## Usage

```bash
# Generate a new character portrait
mcp_generate_image prompt="[High-fidelity Nordic prompt]"

# Update the ImageRegistry after asset creation
# (Manual step in src/media/registry.js)
```

## Present Results

Present the generated image and the prompt used for synthesis.

- **Evidence**: The rendered image asset and a link to its registry entry.
- **Validation**: Demonstrate stylistic alignment with the Nordic Collection (Rule 04).

## Common Rationalizations

| Agent Excuse                                  | The Reality                                                              |
| :-------------------------------------------- | :----------------------------------------------------------------------- |
| "A generic prompt is fine for basic NPCs."    | Placeholders are forbidden. Every entity deserves high-fidelity visuals. |
| "I'll save it without updating the registry." | Orphaned assets cause technical debt and visual drift. Always index.     |
| "The style is 'close enough' to Nordic."      | Rule 04 is absolute. Purity is required for immersion.                   |

## Red Flags

- **Aesthetic Drift**: Using warm/vibrant palettes that clash with the cool, deep tones of Rule 04.
- **Orphaned Assets**: Images living in the filesystem without corresponding state-driven pointers.
- **Low-Entropy Prompts**: Using "a man in a suit" instead of "hyper-realistic subterranean officer profile, gunmetal palette, dramatic chalk lighting".

## Troubleshooting

- **Style Mismatch**: Refine the negative prompt to exclude "vibrant", "warm", "neon", or "over-lit" elements.
- **Registry Desync**: Run a cleanup script to reconcile the `src/media/` folder with the `ImageRegistry`.

## Verification

- [ ] High-fidelity asset generated and stored in the correct directory.
- [ ] Asset registered in `ImageRegistry` or corresponding entity state.
- [ ] Prompt metadata archived for future consistency.
- [ ] **Hard Evidence Recorded**: A successful `generate_image` result and verified registry entry.
