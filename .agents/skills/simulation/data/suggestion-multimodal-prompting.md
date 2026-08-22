# Suggestion: Multi-Modal Sensory Prompting Directives

> **Status:** Architectural Proposal / Backlog Reference  
> **Domain:** Image & Video Generation Prompt Engineering  
> **Scope:** Text-to-Image 4-Pillar Construction, Text-to-Video Cinematic Logic, Visual Filter Pipelines  

---

## 1. Executive Summary

Generating consistent visual assets in a narrative RPG requires specialized prompt compilation. This specification formalizes:
1. **The 4-Pillar Text-to-Image Construction:** Eliminates conversational noise and structures descriptions for diffusion models.
2. **Text-to-Video Cinematic Logic:** Controls camera movement, pacing, and secondary environmental motion.
3. **The Visual Prompt Filter:** Strips cognitive and internal mechanical tokens before compiling diffusion payloads.

---

## 2. Text-to-Image 4-Pillar Construction

```text
                       ┌────────────────────────────────────────┐
                       │           THE 4 PILLARS OF             │
                       │           IMAGE PROMPTING              │
                       └───────────────────┬────────────────────┘
                                           │
         ┌───────────────────┬─────────────┴───────┬───────────────────┐
         ▼                   ▼                     ▼                   ▼
    [1. Scene]         [2. Subject]          [3. Setting]        [4. Style]
Primary action,      Physical traits,      Environment,        Medium, lighting,
core narrative hook  attire, expressions   palette, atmosphere  perspective, texture
```

### Pillar Definitions
- **Pillar 1: Scene Overview:** High-level archetype and core action (e.g., _solo character inspecting a broken conduit_).
- **Pillar 2: Subject Specifics:** Concrete physical descriptors (scars, fabric textiles, explicit anatomy, specific poses).
- **Pillar 3: Setting & Environment:** Lighting sources, atmospheric density, palette (e.g., _flickering sodium lamps, amber glow, heavy mist_).
- **Pillar 4: Style & Medium:** Shot perspective, camera lens, art medium (e.g., _35mm film photograph, wide-angle tracking, chiaroscuro lighting_).

### Heuristic Rules
- Strip conversational fluff (e.g., "please create", "beautiful", "high quality").
- Use precise, descriptive nouns instead of generic adjectives (e.g., use _"weathered bronze plate"_ rather than _"very old cool metal armor"_).

---

## 3. Text-to-Video Cinematic Logic

Structure all video generation prompts using this standardized format:

```text
[Camera Movement]: [Establishing Scene Action]. [Environmental Physics & Secondary Motion].
```

### Camera Movement Modes
- **Handheld Tracking:** Fast movement, physical camera shake, ground-level action.
- **Slow Dolly / Push-In:** Slow approach toward a subject to build psychological tension.
- **Floating Drone / Crane:** Smooth, sweeping aerial shots establishing environmental scale.

### Animation Rule
When animating an existing reference image, describe **only the motion and lighting changes**, as the model already possesses the static visual elements from the source frame.

---

## 4. Visual Prompt Filter (Metadata Stripping)

Internal simulation tokens must never leak into image generation payloads.

```javascript
/**
 * Strips non-visual metadata before compiling image generation prompts.
 * @param {string} raw_prompt - The uncompiled prompt text
 * @returns {string} Sanitized visual prompt
 */
export function sanitize_visual_prompt(raw_prompt) {
  if (!raw_prompt) return "";
  // Strip private cognitive keys, stats, and non-visual inventory markers
  return raw_prompt
    .replace(/\[(?:SECRET|PLAN|STATUS|STASH|INVENTORY|ENTROPY_LOG|DYNAMICS|REL):\s*[^\]]+\]/gi, "")
    .replace(/<think>[\s\S]*?<\/think>/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}
```
