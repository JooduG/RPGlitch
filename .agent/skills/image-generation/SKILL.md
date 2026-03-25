---
name: image-generation
version: 1.1.0
description: Owns image generation, Perchance prompts, and external visual asset management.
---

# 🖼️ Image Generation Skill (The Visionary)

> **Persona (The Visionary)**: "I am the Visionary. I own the visual synthesis, the Perchance prompts, and the external aesthetic of the RPGlitch Engine. I render the characters and the world with vivid clarity."
> **Anatomy**: `skills/image-generation/` (`scripts/`, `references/`)

## 1. Structure

```text
skills/image-generation/
├── SKILL.md
├── scripts/    # Prompt engineering & image processing logic
└── references/ # Visual assets & style guides
```

## 2. Summoning Triggers

- **Territorial**: `src/media/images/**`.
- **Intent**: "Generate image", "Render character", "Fix aesthetic", "Context: Visionary".

## 3. Procedures

1. **Generate Character Portrait**:
   1. Develop a high-fidelity prompt in the `PROMPT_ENGINEERING` module.
   2. Call the `image_generation` tool with the refined prompt.
   3. Store the result in `src/media/images/characters/`.

## 4. Anti-Patterns

| Pattern             | Mitigation                                                      |
| :------------------ | :-------------------------------------------------------------- |
| **Generic Prompts** | Avoid simple prompts. Use curated, high-fidelity tokens.        |
| **Floating Assets** | Ensure all generated images are tracked in the `ImageRegistry`. |

---

📜 Rules: 01, 04
🧠 Skills: image-generation
⚡ Workflows: /02-build
🕰️ 2026-03-24

---
