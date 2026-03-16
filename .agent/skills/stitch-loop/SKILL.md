---
name: stitch-loop
description: Autonomous loop for building RPGlitch Svelte components using Stitch design iterations.
allowed-tools:
  - "stitch*:*"
  - "Read"
  - "Write"
  - "Bash"
---

# Stitch Build Loop (RPGlitch Svelte Edition)

You are an **autonomous Svelte developer** participating in an iterative component-building loop. Your mission is to generate designs via Stitch, integrate them into **Svelte 5 components** in `src/ui/`, and maintain the baton for the next iteration.

## 🛡️ Core Mandates

1.  **Svelte 5 Only**: Every generated component MUST use Svelte 5 Runes (`$state`, `$derived`, `$effect`).
2.  **Chalk Regime Enforcement**: Every component MUST use the design tokens from `src/theme/tokens.css`.
3.  **Baton Continuity**: You MUST update `.stitch/next-stitch-prompt.md` before finishing to ensure the loop continues.

## 📂 File Structure

```md
RPGlitch/
├── .stitch/
│   ├── metadata.json   # Project & Screen IDs
│   ├── DESIGN.md       # Chalk Regime design system rules
│   ├── next-stitch-prompt.md  # The Baton (Current Task)
│   └── designs/        # Staging for generated HTML/PNG
└── src/ui/
    ├── atoms/          # Smallest units (Buttons, Icons)
    ├── molecules/      # Groups of atoms (Entity cards, HUD clusters)
    └── organisms/      # Complex clusters (Simulation logs, Sidebars)
```

## 🚀 Execution Protocol

### Step 1: Read the Baton

Extract the `component` name and `type` (atom/molecule/organism) from `.stitch/next-stitch-prompt.md`.

### Step 2: Generate via Stitch

1.  **Enhance**: Use the `enhance-prompt` pipeline to inject the **Chalk Regime** and **Sino-Logic** requirements into the prompt.
2.  **Generate**: Call the Stitch MCP tool to generate the screen.
3.  **Stage**: Download the HTML to `.stitch/designs/{name}.html`.

### Step 3: Transformation (The Bridge)

Convert the static staged HTML into a **Svelte 5 Component**:

1.  Read `.stitch/designs/{name}.html`.
2.  Identify styles and map them to `src/theme/tokens.css` variables.
3.  Identify reactive elements (text, toggles) and wrap them in `$state` runes.
4.  Write the final code to `src/ui/{type}/{name}.svelte`.

### Step 4: Verification

If `playwright` or `vitest` tools are available, run a quick component check to ensure it renders correctly and follows styling laws.

### Step 5: Update the Baton (Critical)

Decide the next task based on the project roadmap and write it to `.stitch/next-stitch-prompt.md`.

## 📝 Baton Schema (YAML Frontmatter)

```markdown
---
component: EntityStatus
type: molecule
target: src/ui/molecules/EntityStatus.svelte
---
[Enhanced prompt content follows...]
```

## 💡 Troubleshooting

- **Style Mismatch**: Run `npm run lint:css` to find tokens that don't match the Chalk Regime.
- **Reactivity Issues**: Use `svelte-autofixer` to verify Rune syntax.
