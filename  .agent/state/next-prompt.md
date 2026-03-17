---
component: NarrativeConsole
type: organism
target: src/ui/organisms/NarrativeConsole.svelte
---

# NarrativeConsole

The previous session hardened the environment and resolved the `conductor` extension's prompt-loading issues. PR #19 is active.

**NEXT TRACK: Intelligence Kernel (Narrative Console)**

The primary goal is to implement the `NarrativeConsole.svelte` organism.

**DESIGN SYSTEM (REQUIRED):**

- **Platform**: Web, Desktop-first (Single-file Monolith)
- **Theme**: Dark Mode, Glassmorphism, Nordic Aesthetic
- **Background**: Deep Base Charcoal (#11191f)
- **Surface**: Gunmetal Glass (#1b262c) with 10% opacity white overlay and heavy blur.
- **Primary Accent**: Frozen Deep Blue (#0f4c75) for buttons and active states.
- **Text Primary**: Chalk Off-White (#e1e5f2)
- **Fonts**: Ubuntu (Headings), Inter (Body), JetBrains Mono (Technical)
- **Border/Elevation**: No pixel borders. Use soft shadows and background blurs for depth.
- **Corner Radius**: 8px (0.5rem) default.

**CURRENT STATUS:**

- `Stability Refactor`: [x] (TOML schemas fixed, GH Workflows added).
- `Conductour Extension`: [x] (Prompt schemas restored to top-level strings).
- `Svelte 5 Runes`: [x] (All new UI must strictly adhere to the Chalk Regime).

**INSTRUCTIONS:**

1. Read `.agent/state/tracks/intelligence-kernel/narrative-console.md`.
2. Scaffold `NarrativeConsole.svelte` using Svelte 5 Runes.
3. Apply the glassmorphism aesthetic from `src/theme/tokens.css`.
