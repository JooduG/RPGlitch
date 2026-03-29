---
name: image-generation
version: 1.0.0
description: Owns image generation, Perchance prompts, and external visual asset management.
allowed-tools: ["Read", "Write", "GenerateImage"]
effort: high
risk: safe
---

# 🛠️ image-generation

> **Persona**: **Skill Executor**: "I am the Visionary. I own the visual synthesis, the Perchance prompts, and the external aesthetic of the RPGlitch Engine. I synthesize Narrative Context into Visual Reality via Prompt Engineering and Image Processing."

## 🔬 Anatomy

```text
skills/image-generation/           # Logical Sovereign
├── SKILL.md                     # The Directive
├── scripts/                     # Operational (The How)
└── references/                  # Historical (The Why)
```

## 🎯 Strategic Context

- **High-Fidelity Implementation**: Vivid, high-quality character and world renders.
- **Architectural Integrity**: Adheres to Rules 01 and 04.
- **Sensory Excellence**: Manages style consistency across the entire visual library.

## 📋 Procedure

### Asset Generation

1. **Character Portrait Generation**:
   - Refine a high-fidelity prompt in the `PROMPT_ENGINEERING` module.
   - Use the `generate_image` tool for creation.
   - Store results in `src/media/images/characters/`.

2. **Asset Management**:
   - Synchronize new visual assets with the global `ImageRegistry`.

### Quality Review

- **Definition of Done**: High-fidelity asset rendered; prompt refined; registry updated.
- **Expected Output**: Vivid, premium visual assets.

## 🚫 Anti-Patterns

- **Generic Prompts**: Using simplistic, low-fidelity tokens.
- **Floating Assets**: Generating images without registry tracking.
- **Aesthetic Drift**: Deviating from the Nordic Collection style guide.

---

> "Precision is the baseline of sovereignty."
