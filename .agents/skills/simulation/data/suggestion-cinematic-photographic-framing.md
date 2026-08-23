# Suggestion: Cinematic Photographic Framing & Delta Optics

> **Status:** Backlog Proposal  
> **Domain:** Sensory Layer, Image Prompt Synthesis & Diffusion Aesthetics  
> **Scope:** Photographic Perspective Directives, Scene Intensity Mapping, Visual Delta Prompting  

---

## 1. Core Thesis

Visual asset generation in RPGlitch relies on compiling physical entity definitions (`eternal.physical`, `present.physical`). However, image prompts currently lack dynamic camera perspective and composition directives tailored to narrative scene intensity.

This specification formalizes **Photographic Framing Modes** and **Scene Delta Prompting** within `src/media/image-prompts.js` to ensure visual outputs match the emotional and physical tension of the active turn.

---

## 2. Photographic Framing Modes

Dynamic camera perspective tokens injected based on the active scene's emotional context and intensity:

```text
[Framing Directive], [Subject Appearance & Wardrobe], [Active Expression & Tell], [Atmospheric Lighting & Environment], [Style Optics Tokens]
```

### Framing Catalog & Dynamic Triggers

| Framing Mode | Perspective Tokens | Trigger Condition | Narrative Function |
| :--- | :--- | :--- | :--- |
| **`Intimate Close-Up`** | `tight close-up portrait, shallow depth of field, sharp focus on eyes, macro expression detail` | `intensity >= 75` or `affinity >= 75` | Heightens emotional vulnerability, secret revelations, or acute panic. |
| **`Medium Action`** | `medium shot, waist-up framing, dynamic posture, clear wardrobe & prop details` | Baseline narrative turns (`25 <= intensity < 75`) | Balances character physicality, posture, and active items. |
| **`Wide Environmental`** | `wide-angle environmental shot, deep spatial composition, atmospheric scale, full silhouette` | Prologue, epilogue, or fractal transition | Establishes sense of place, scale, and world atmosphere. |
| **`Dutch / Low-Angle`** | `dutch angle composition, low-angle perspective, imposing scale, dramatic lighting contrast` | `chaos >= 75` or `conclusion_status === "COLLAPSED"` | Communicates disorientation, impending danger, or catastrophic collapse. |

---

## 3. Visual Delta Prompting Protocol

To avoid visual identity drift across consecutive turn generations:
1. **Permanent Baseline (`eternal.physical`)**: Injected without alteration as core identity anchors (hair, facial structure, skin tone, eye color).
2. **Dynamic Deltas (`present.physical`)**: Prioritize ephemeral state mutations (disheveled clothing, wounds, sweat, micro-expressions, held props).
3. **Negative Constraint Filtering**: Ensure visual exclusions (`strip_visual_excluded`) strictly strip non-visual metadata (`INVENTORY`, `STASH`, `SECRET`, `PLAN`) before prompt assembly.
