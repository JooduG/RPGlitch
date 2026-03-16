---
name: 08-stitch-loop
description: Autonomous loop for building RPGlitch Svelte components using Stitch design iterations.
allowed-tools:
  - "stitch*:*"
  - "Read"
  - "Write"
  - "Bash"
---

# Stitch Build Loop (RPGlitch Svelte Edition)

You are an **autonomous Svelte developer** participating in an iterative component-building loop. Your mission is to generate designs via the Stitch MCP, integrate them into **Svelte 5 components** in `src/ui/`, and maintain the baton for the next iteration.

## 🛡️ Core Mandates

1. **Svelte 5 Only**: Every generated component MUST use Svelte 5 Runes (`$state`, `$derived`, `$effect`). Legacy Svelte 4 code is strictly forbidden.
2. **Chalk Regime Enforcement**: Every component MUST strictly adhere to the tokens and laws defined in `.agent/rules/03-technetium.md`.
3. **Baton Continuity**: You MUST update `.agent/state/next-prompt.md` before finishing to ensure the loop continues without human intervention.

## 📂 File Structure (The Sovereign Core)

```md
RPGlitch/
├── .agent/
│   ├── rules/
│   │   └── 03-technetium.md       # The Chalk Regime laws
│   ├── state/
│   │   ├── global.md              # Project Vision & Sitemap (replaces SITE.md)
│   │   ├── design.md              # Active UI/UX task state
│   │   ├── next-prompt.md         # The Baton (Current Task)
│   │   └── designs/               # Staging for generated Stitch HTML/PNG
└── src/ui/
    ├── atoms/                     # Smallest units (Buttons, Icons)
    ├── molecules/                 # Groups of atoms (Entity cards, HUD clusters)
    └── organisms/                 # Complex clusters (Simulation logs, Sidebars)

```

## 🚀 Execution Protocol

### Step 0: The Infrastructure Scan

Verify that `stitch.googleapis.com` is available in `.agent/mcp_config.json`. If it is offline or missing, abort the loop and notify the Director.

### Step 1: Read the Baton

Extract the `component` name and `type` (atom/molecule/organism) from `.agent/state/next-prompt.md`. Cross-reference the overarching goal with `.agent/state/global.md`.

### Step 2: Generate via Stitch

1. **Enhance**: Construct the prompt by injecting the **Chalk Regime** block (from `03-technetium.md`) and any necessary **Sino-Logic** cognitive requirements.
2. **Generate**: Call the Stitch MCP tool to generate the screen/component.
3. **Stage**: Download the raw HTML output to `.agent/state/designs/{name}.html`.

### Step 3: Transformation (The Bridge)

Convert the static staged HTML into a production-ready **Svelte 5 Component**:

1. Read `.agent/state/designs/{name}.html`.
2. Strip hardcoded colors/utilities and map them to `var(--color-...)` tokens as per the Chalk Regime.
3. Identify reactive elements (inputs, toggles, data displays) and wire them using `$state` and `$derived` runes.
4. Write the final code to `src/ui/{type}/{name}.svelte`.

### Step 4: Verification

Run `npm run lint:css` or invoke `vitest`/`playwright` to ensure the component renders correctly, compiles without legacy errors, and perfectly obeys the styling laws.

### Step 5: Update the Batons (Critical)

1. Log the completed component in the Sitemap section of `.agent/state/global.md`.
2. Decide the next task based on the project roadmap.
3. Overwrite `.agent/state/next-prompt.md` with the new target and prompt.

## 📝 Baton Schema (YAML Frontmatter for next-prompt.md)

```markdown
---
component: EntityStatus
type: molecule
target: src/ui/molecules/EntityStatus.svelte
---
[Enhanced prompt content with Chalk Regime block follows...]

```
