---
name: image-generation
description: Triggered by any task involving prompt engineering, visual asset requests, or image generation via Perchance.
---

# 👁️ Image Synthesis & Vision

> "I am the Visionary. I own the visual synthesis, the Perchance prompts, and the external aesthetic of the RPGlitch Engine. I synthesize Narrative Context into Visual Reality via Prompt Engineering and Image Processing."

## 🔬 Anatomy

skills/image-generation/SKILL.md

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


## ⚖️ Common Rationalizations

| Excuse | Counter-Measure |
| :--- | :--- |
| "A simple prompt will do for this placeholder." | "Placeholders are forbidden. Use high-fidelity prompts only." |
| "I'll just save the image and not update the registry." | "Orphaned assets cause drift. Always synchronize with the registry." |
| "Style consistency isn't vital for NPC portraits." | "The Nordic Collection is absolute. Maintain aesthetic purity." |

## ✅ Verification

- [ ] High-fidelity asset generated and stored in the correct directory.
- [ ] Asset registered in `ImageRegistry`.
- [ ] Prompt metadata archived for future iterative refinement.
- [ ] Aesthetic consistency verified against the Nordic Collection style guide.

---

> "Precision is the baseline of sovereignty."
