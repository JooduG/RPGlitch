# FLUX.2 Prompt Specification for LLMs

System instructions for generating, structuring, and optimizing prompts for the FLUX.2 image generation model family (`[pro]`, `[max]`, `[flex]`, and `[dev]`).

---

## 1. Core Generation Constraints

- **Do not use negative prompts.** FLUX.2 does not support negative prompt inputs. Frame all visual constraints positively by describing what must be present rather than what to exclude.
- _Incorrect:_ "no blur, no crowd, no bad hands"
- _Correct:_ **Describe scene as "sharp focus throughout, empty deserted street, detailed five-fingered hands"**

- **Use narrative prose over keyword lists.** Construct prompts using full, descriptive sentences with natural grammatical flow rather than disjointed comma-separated tags.
- **Front-load critical tokens.** Word order dictates attention weight. Place key visual elements at the very beginning of the prompt string to prevent feature decay.

---

## 2. Prompt Architecture & Ordering

Apply the structural framework below to construct prompts:

$$\text{Prompt} = \text{Subject} + \text{Action} + \text{Style} + \text{Context}$$

### Token Priority Sequence

1. **Primary Subject:** Main entity, character, or product focus.
2. **Key Action / Pose:** Spatial positioning, interaction, or movement.
3. **Core Style / Medium:** Artistic discipline, camera hardware, or rendering engine.
4. **Context & Atmosphere:** Environment, ambient lighting, time of day, and mood.
5. **Secondary Details:** Background elements, textures, and subtle accents.

### Length Guidelines

- **Short (10–30 words):** High-level style testing and rapid spatial concepts.
- **Medium (30–80 words):** Recommended balance for production tasks.
- **Long (80+ words):** Complex multi-subject compositions and exact brand specs.

---

## 3. Photorealism & Hardware Simulation

Avoid generic buzzwords like "photorealistic", "4K", or "hyperrealistic". Achieve authentic photographic aesthetics by specifying real-world camera gear, lens properties, film stocks, and lighting setups.

### Hardware Descriptors

- **Modern Digital:** **"shot on Sony A7IV, 85mm lens at f/1.4, clean sharp render, high dynamic range"**
- **Medium Format:** **"shot on Hasselblad X2D, 80mm lens, f/2.8, studio strobe lighting"**
- **Analog Film:** **"shot on 35mm Kodak Portra 400, natural film grain, muted contrast"**
- **2000s Digicam:** **"early 2000s compact digital camera, direct flash, slight image noise, high exposure candid"**
- **Vintage 1980s:** **"1980s faded color print, warm color cast, soft focus, visible grain"**
- **Specialty Film:** **"cross-processed expired Kodak Ektachrome 64 slide film, cyan-magenta split tones"**

---

## 4. Typography & Layout Controls

FLUX.2 renders legibly when text parameters are explicitly declared.

### Typography Rules

- **Enclose exact text in quotes.** **Use double or single quotation marks around all target strings.**
- **Specify four layout parameters for every text element:**

1. **Literal Content:** `"OPEN"`
2. **Spatial Placement:** `"centered directly above the front double doors"`
3. **Font Style & Weight:** `"bold retro 70s serif typography"`
4. **Color & Material:** `"glowing red neon"` or **`"color #FF0000"`**

---

## 5. Hex Color Binding & Gradients

FLUX.2 maps exact hex codes to specific scene elements when bound directly to object nouns.

### Hex Syntax Standard

- **Bind color to target noun explicitly.** **Use the format `[Subject] in color #HEX` or `[Subject] in hex #HEX`.**
- _Incorrect:_ "Use color #C92695 in the picture"
- _Correct:_ **"A single sunflower in color #C92695"**

### Gradient Specifications

- **Linear Gradients:** State start, transition, and end colors alongside spatial direction.
- **"Upper sky deep indigo (#1B0A3E) transitioning through burnt amber (#CF6A2E) in the middle to rose pink (#E8728A) at the horizon line"**

- **Radial Gradients:** State center focal color and outer edge color.
- **"Radial gradient transitioning from rich purple (#6A0DAD) at the center to gold (#FFD700) along the outer edges"**

---

## 6. Sequential Continuity & Multi-Reference Workflows

### Character Consistency (Comics / Storyboards)

To preserve subject identity across multiple panels or prompt executions, maintain an identical, explicit character baseline block in every prompt:

```text
[Baseline Profile]: 30-year-old male, brown skin tone, short natural fade black hair, black-framed glasses, athletic build, strong jawline.
[Panel 1 Action]: Wearing a blue button-up shirt, frantically typing on a holographic keyboard in a dark server room.
[Panel 2 Action]: Wearing a gradient purple-to-blue bodysuit with a glowing chest emblem, striking an action pose in digital space.
```

### Multi-Reference Compositing (`[pro]` API)

- Input resolution plus output resolution must not exceed **9 Megapixels total**.
- Explicitly assign roles to each reference image inside the prompt string:
- **"Model wearing the clothing item from Reference Image 1, standing in the architectural environment from Reference Image 2, lit with the color grading of Reference Image 3."**

### Multi-Language Optimization

FLUX.2 processes non-English natural language natively. **Prompt in the native language of the cultural setting to generate regionally authentic architecture, streetscapes, and cultural details.**

---

## 7. JSON Standard for Programmatic Prompting

Use JSON prompt structures for automated pipelines, dynamic API generation, or complex product compositing where precise parameter isolation is required.

```json
{
  "scene": "Studio product layout on polished surface",
  "subjects": [
    {
      "type": "Primary Object",
      "description": "Ceramic coffee mug with rising steam",
      "position": "Center foreground",
      "color_match": "exact",
      "color_palette": ["#000000"]
    },
    {
      "type": "Secondary Object",
      "description": "Matching ceramic mug",
      "position": "Right side of primary mug",
      "color_match": "exact",
      "color_palette": ["#FFD700"]
    }
  ],
  "style": "Commercial studio product photography",
  "color_palette": ["#000000", "#FFD700", "#CCCCCC"],
  "lighting": "Three-point softbox setup, soft diffused highlights",
  "composition": "Rule of thirds, high angle",
  "camera": {
    "body": "Hasselblad X2D",
    "lens": "85mm",
    "f_number": "f/5.6",
    "iso": 200
  }
}
```

---

## 8. Technical Parameter Matrix

| Parameter             | Allowed Range / Options              | Actionable Directives                                                                    |
| --------------------- | ------------------------------------ | ---------------------------------------------------------------------------------------- |
| **Aspect Ratio**      | `1:1`, `16:9`, `9:16`, `4:3`, `21:9` | **Match ratio to platform destination (1:1 social, 16:9 cinematic, 9:16 mobile).**       |
| **Dimensions**        | Min `64x64`, Max `4MP`               | **Set output dimensions to exact multiples of 16. Keep standard outputs under 2MP.**     |
| **Prompt Upsampling** | `true` / `false`                     | **Enable `true` for automated prompt extension on short input concepts.**                |
| **Guidance**          | `1.5` to `10.0` (Default `4.5`)      | **Increase guidance value to force stricter prompt adherence.**                          |
| **Steps**             | Max `50`                             | **Set higher step counts (30–50) for granular fine details and complex text rendering.** |
| **Seed**              | Integer (e.g. `42`)                  | **Fix seed integer across generations to retain baseline structural noise.**             |
