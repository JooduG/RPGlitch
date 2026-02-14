---
name: visuals
version: 1.0.0
description: >
    Manages Perchance image generation, asset caching, and RPGlitch aesthetic engineering.
    Triggers:
    - "Generate image"
    - "Fix aesthetic"
    - "Render character"
    - "Context: [Visuals]"
---

# 🎨 Visuals

> "The image is not just a decoration; it is a recursive echo of the simulation's state."

## 1. Capabilities

### ⚡ Perchance Integration

Handles high-level abstraction for the Perchance `text-to-image-plugin`.

- **Action**: Converts character state (Eternal/Present/Timeline) into descriptive prompts.
- **Parameters**:
    - `prompt`: The core visual description.
    - `negativePrompt`: "text, watermark, blurry, low quality, deformed, cartoon".
    - `seed`: Derived from `runtime.character.visuals.profilePictureSeed`.

### ⚡ Aesthetic Engineering (RPGlitch)

Enforces the "Neural Minimalism" style:

- **Style Keywords**: "cybernetic realism, hyper-detailed, high contrast, obsidian surfaces, neon glitch, anamorphic flare".
- **Color Palette**: Strictly follows `var(--app-token)` mappings. Default is Lime/Slate.

## 2. Procedures

### 🎬 Asset Generation Workflow

1. **Synthesize**: Read `runtime.character` state.
2. **Prompter**: Construct prompt using the **Aesthetic Matrix**:
    - `(Subject) + (Action/Environment) + (RPGlitch Style Tags)`.
3. **Dispatch**: Call `t2i` plugin via the Bridge.
4. **Cache**: Store result in IndexedDB (`db.entities`) to avoid redundant API calls.

### 💾 Caching Strategy

- **Key**: `image_cache:[seed]`.
- **Bust**: If the character's `visuals` object version increments, force a re-render.

## 3. Anti-Patterns

| Pattern                      | Mitigation                                                                           |
| :--------------------------- | :----------------------------------------------------------------------------------- |
| **Generic/Cartoon prompts**  | **Forbidden**. Use "cybernetic realism" and high-contrast tags.                      |
| **Hardcoded hex in prompts** | **Avoid**. Use color names matching the design tokens (e.g., "Neon Lime").           |
| **Redundant generation**     | **Check Cache First**. Always verify if a seed/prompt combo exists in `db.entities`. |

---

📜 Rules: [manifesto, standards, stack, security, workflow]
🧠 Skills: [data, visuals, svelte]
📚 Knowledge: [Perchance API, RPGlitch Aesthetic]
🤖 Tools: [write_to_file, replace_file_content]

---
