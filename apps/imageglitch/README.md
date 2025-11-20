# ImageGlitch

A minimalist Perchance application for AI-powered text-to-image generation with intelligent prompt refinement.

## Overview

ImageGlitch provides a clean interface for generating images from text prompts using a **custom multi-stage pipeline**:

**User Prompt** → **AI Refine (Scribe)** → **AI Chaos/Transfigure** → **Pollinations.ai API** → **Generated Image**

⚠️ **Important:** ImageGlitch does **NOT** use Perchance's standard `text-to-image-plugin`. Instead, it implements a custom pipeline with three AI-powered prompt refinement stages and direct integration with the Pollinations.ai Stable Diffusion backend.

## Architecture

### Two-Panel Structure (Perchance)

- **Left Panel:** `ImageGlitch-left-panel.txt`
  - Perchance engine logic
  - **Plugin Imports:**
    * `ai-text-plugin` → Used for the three AI Personas (Scribe/Chaos/Transfigure)
    * `remember-plugin` → Stores category lists and user preferences
  - Core setup and configuration
  - ⚠️ **Note:** Does **NOT** import `text-to-image-plugin` (uses Pollinations.ai API instead)

- **Right Panel:** Source in `html/index.html`
  - Main application UI and logic
  - Image generation pipeline implementation
  - Calls to Pollinations.ai API directly
  - JavaScript modules in `js/`
  - Styles in `scss/`
  - Compiled into single inlined HTML output

## Build

```bash
# Build ImageGlitch
npm run build:imageglitch

# Output location
build/output/ImageGlitch.html
```

## Source Structure

```text
apps/imageglitch/
├── ImageGlitch-left-panel.txt  # Perchance engine (plugin imports, setup)
├── html/
│   └── index.html               # Main UI template
├── js/
│   └── (application modules)    # Image generation logic
└── scss/
    └── (style modules)          # Styles (compiled and inlined)
```

## Key Features

- **Multi-Stage Prompt Refinement:** Three AI personas intelligently enhance user prompts
- **Pollinations.ai Backend:** Direct integration with Stable Diffusion for high-quality image generation
- **Creativity Control:** Slider (0-10) that maps to Stable Diffusion parameters (`gScale` and AI temperature)
- **Minimalist Design:** Clean, focused interface for quick image generation
- **Persistent Settings:** Category lists stored in Perchance `remember-plugin`

## The Custom Image Generation Pipeline

ImageGlitch's image generation process consists of **four stages**:

### Stage 1: User Input
User enters a simple prompt (e.g., "a knight")

### Stage 2: AI Prompt Refinement (Three Personas)

**AI Scribe** (Refine) - "Holistic Prompt Architect"
* Analyzes the base prompt and identifies gaps in creative categories
* Intelligently fills gaps (artistic style, composition, lighting, color, mood, etc.)
* Preserves the user's original subject/setting as the "master vision"
* Injects baseline quality keywords (`masterpiece`, `8K`, `cinematic`)
* Returns a refined, comma-separated prompt string

**AI Chaos** (Mutation) - "Mad Prompt Scientist"
* Takes the prompt and adds creative **serendipity**
* Randomly mutates at least one creative category (even if well-described)
* Fills "lacking" categories with random keywords
* Adds a random set of quality enhancers
* Returns a mutated, divergent prompt

**AI Transfigure** (Modification) - "Prompt Modification Specialist"
* Allows precise user-directed edits to the current prompt
* Takes instructions like "make the car blue and add a spoiler"
* Surgically modifies the prompt exactly as instructed
* Converts negations to affirmative descriptions
* Returns the modified prompt

### Stage 3: Backend Image Generation

```javascript
const BASE_IMAGE_URL = "https://image.pollinations.ai/prompt/";
```

* Direct API call to **Pollinations.ai** (not Perchance's plugin)
* Uses Stable Diffusion backend
* Accepts custom Stable Diffusion parameters via `creativity` mapping

### Stage 4: Creativity Mapping

Custom mapping from ImageGlitch's 0-10 creativity slider to Stable Diffusion parameters:

```javascript
const creativityMap = {
  0: { gScale: 1, aiTemp: 1.9 },     // Conservative (low guidance)
  4: { gScale: 7, aiTemp: 1.0 },     // Default (moderate guidance)
  10: { gScale: 20, aiTemp: 0.1 }    // Adventurous (high guidance)
};
```

* **gScale** = Stable Diffusion guidance scale (1-20)
* **aiTemp** = AI temperature for prompt refinement (0.1-1.9)

### Category Lists (Stored in remember-plugin)

ImageGlitch maintains extensive category lists for AI refinement:
* `artisticStyles`, `composition`, `lighting`, `colorPalettes`
* `mood`, `technicalDetails`, `additionalElements`
* `aiCoreQuality`, `aiFlavorEnhancers`

These lists are dynamically updated and stored in `remember-plugin` for persistence.

---

## Technology Stack

- **UI Framework:** Custom components built on Pico.css
- **JavaScript:** ES6+ modules (vanilla, no framework)
- **Styling:** SCSS compiled to CSS, inlined in build
- **Image Generation Backend:** Pollinations.ai (direct API, not Perchance plugin)
- **AI Prompt Refinement:** Three Personas via `ai-text-plugin`
- **Persistent Storage:** `remember-plugin` (for category lists and settings)

## Development

See the main repository README.md and GEMINI.md for:

- Complete development protocol and rules
- Coding standards
- Build process details
- Testing guidelines
- Deployment workflow

## Troubleshooting

### Plugin Loading Issues

If the application fails to load and the browser console shows errors related to plugins not being available (e.g., `TypeError: image is not a function`), it is likely that the Perchance plugins are not being correctly exposed to the application's JavaScript environment.

This can happen if the script in `html/index.html` that exposes the plugins is missing or incorrect. The plugins should be assigned directly to the `window` object, not as arrays. For example:

```html
<script>
  window.pluginTextToImage = image;
  window.pluginAi = ai;
  window.pluginRememberPlugin = r;
</script>
```

If the plugins are wrapped in arrays (e.g., `window.pluginAi = [ai];`), they will be loaded as objects instead of functions, which will cause `TypeError` exceptions when the application tries to call them.

## Related Documentation

- [GEMINI.md](../../GEMINI.md) - Complete protocol and development guidelines
- [design-system.md](../../design-system.md) - UI/UX guidelines and components
- [plan.md](../../plan.md) - Project roadmap and feature backlog
