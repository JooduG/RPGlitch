# RPGlitch — Session Protocol & Handover Specification

> **System Designation**: Sovereign AI Roleplay Engine  
> **Core Architecture**: Svelte 5 Runes + Vite 8 (Single-File Distribution)  
> **Target Deployment**: Perchance (`perchance.org`)  
> **Source Repository**: `JooduG/RPGlitch`

---

## ⚡ Initial Setup & Execution Protocol

Execute these steps in strict chronological sequence upon session initialization:

1. 📥 **Synchronize Repository State**
   - Download the latest `main` branch archive: `https://github.com/JooduG/RPGlitch/archive/refs/heads/main.zip` to `scratch/repo.zip`.
   - Extract contents into `scratch/src/`.

2. 📜 **Audit Workspace & Shell State**
   - Review `README.md` and `AGENTS.md` (within `scratch/src/`) for active conventions.
   - **Critical Shell Constraint**: Re-read `index.html` in the workspace root prior to making edits. Shell markup/script updates occur between sessions — preserve all existing custom wrappers and scripts.

3. 🛡️ **Svelte 5 Sovereignty (Non-Negotiable)**
   - Utilize Svelte 5 **Runes exclusively** (`$state`, `$derived`, `$effect`, `{@render}`).
   - Legacy Svelte 4 primitives (`export let`, `$:`, `writable()`, `readable()`, `<slot />`) are strictly forbidden.

4. 📦 **File Modifications & Download Handoff**
   - Whenever any codebase file is modified or created during the session, **attach/provide the complete updated file** for the human user to download.
   - _Rationale_: The user executes the full build and bundling pipeline locally outside of the Perchance sandbox environment.

5. 🤝 **Session Acknowledgment & Kickoff**
   - Explicitly confirm full comprehension of the architecture, data schemas, and startup protocol.
   - Prompt the user to declare the primary task, feature track, or issue to address for the current session.

---

## 🏗️ Subsystem & Directory Topography

```
src/
├── intelligence/    # Turn loop, XML prompt engineering & temporal RAG
│   ├── fragments.js       # Entity taxonomy & field directives
│   ├── prompts.js         # XML prompt assembly (Character, Director, Narrator, Enhancement)
│   ├── kernel.js          # Synchronous Round & Turn simulation pipeline
│   ├── context.svelte.js  # Context broker, hydration & lexical filter
│   ├── temporal.js        # Past/Future vector scoring, memory consolidation & forging
│   ├── parser.js          # Pseudo-JSON extraction, <think> block stripping & prose merging
│   └── dynamics.js        # Gravity settlement math & slider metadata
├── media/           # Visual synthesis & sensory pipelines
│   └── optics.js          # System prompt builder & aesthetic dimension resolver for Perchance T2I
├── platform/        # External transport & LLM execution wrappers
│   └── transport.js       # Core generation & enhancement API handlers
├── ui/              # Sensory UI layer (Atomic Design Structure)
│   ├── organisms/         # Profile, ProfileArray, Storymode, Storyboard
│   ├── molecules/         # EntityCard, VisualWing, DevWing, AudioWing, DynamicsMeter
│   └── atoms/             # TextField, Button, Slider, Dropdown
├── data/            # Static datasets, authorial engines & schemas
│   ├── narrative-styles.js# XML authorial narrative engines
│   ├── visual-styles.js   # XML diffusion visual engines
│   ├── normalizer.js      # Entity schema sanitization & default assertions
│   └── lists.js / premades.js / data repositories
└── state/           # Centralized Svelte 5 Rune stores
    ├── app.svelte.js      # Application configuration & persistent preferences
    ├── runtime.svelte.js  # Active entity state, chronology & turn status
    └── status.svelte.js   # Phase state & simulation lock (STASIS)
```

---

## 📋 Data Model & Temporal Taxonomy

### 1. State Quadrants

- **Eternal & Present State** (Single-value properties: `state.eternal`, `state.present`)
  - `physical`: Pseudo-JSON key-value pairs (sanitized via `safeParsePseudoJson`).
  - `non_physical`: Dynamic prose paragraphs (Director mutations merged via `merge_prose_into_field`, capped at 2,000 characters).
- **Past & Future State** (Vector arrays)
  - Array of vector objects (`{ id, timestamp, directive, type, base_weight, tags, meta }`).
  - Managed by `temporal.js`, scored via RAG, and resolved from Future → Past during Director settlement ticks.

### 2. Entity Optics & Perspective

- **`visual_style`**: Controls diffusion prompt synthesis for character cards and story visuals.
- **`pov`**: Defines narrative perspective (`"1st_person"` or `"3rd_person"` for Characters; forced `"3rd_person"` for Fractals).

---

## 🛠️ Verification & Quality Gate

Before declaring work complete, ensure local compliance:

- 🧪 **Static Analysis**: Run `npm run verify` to validate linting and TypeScript compilation.
- 🎨 **Token Harmonization**: Run `npm run sync` if CSS tokens in `DESIGN.md` are updated.
- 📦 **Bundle Integrity**: Validate single-file compilation via `npm run build`.
