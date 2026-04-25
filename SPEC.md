# SPEC: RPGlitch Simulation Engine

> **Version**: 0.6.0 (The Forge)
> **Status**: Sovereign / Grounded

## 1. Objective

RPGlitch is a high-fidelity, local-first simulation engine designed for immersive storytelling. It functions as a reactive monolith where state drives reality and narrative is forged through recursive intelligence.

### Target Vision

- **Atmospheric Canvas**: Chalk Regime aesthetics focusing on imagination.
- **Agentic Pacing**: Procedural story arcs managed by an autonomous Intelligence Kernel.
- **Local Sovereignty**: Zero-latency, browser-resident state (Dexie.js).

### Persistent Integrity

- **Atomicity**: The simulation round increments are locked to prevent desynchronization during asynchronous turn transitions.
- **Log Hygiene**: AI internal "thoughts" (`<think>` blocks) are purged before log persistence to maintain context window efficiency.
- **Metadata Isolation**: Visual generation metadata (e.g., "8k", "hyper-realistic") is stripped from narrative prose to maintain diegetic immersion.
- **XML Hygiene**: Outbound prompt attributes are escaped to prevent data structure corruption from unclosed brackets or quotes.
- **UI: Interaction Hygiene**: Message actions sit outside the content boundary in a vertical `GlassPill` to eliminate "whitespace chin" and preserve narrative focus.

---

## 2. Technical Stack

The engine is built on a sovereign, client-side-only stack optimized for the Perchance Two-Panel Paradigm.

- **Framework**: Svelte 5 (Runes-only: `$state`, `$derived`, `$effect`).
- **Persistence**: Dexie.js (IndexedDB).
- **Security**: DOMPurify sanitization boundaries + Zod contract enforcement.
- **Build**: Vite 6 (Single-file ESM output).
- **Communication**: Post-Message bridges for Perchance inter-panel logic.

---

## 3. Project Structure

```text
RPGlitch/
├── SPEC.md                # This document (Master Spec)
├── tasks/                 # Active mission board & technical plans
├── src/
│   ├── core/              # Logic & Round Orchestration (Temporal Engine, IQ Kernel)
│   ├── data/              # Persistence & Entity Repositories
│   ├── state/             # Global Reactive Runes
│   ├── theme/             # The Chalk Regime (Tokens & Glass)
│   ├── ui/                # Atomic Svelte 5 Components
│   └── media/             # Internal Sensory Assets (Visual/Audio)
└── .agent/                # AI Constitution (Rules & Skills)
```

---

## 4. Code Style & Design

### Narrative Logic (Rule 02)

- **Diegetic Integrity**: Strict third-person limited for entities.
- **Turn Cycle**: 1. System Turn (Lock/Round++) -> 2. AI Turn (Asynch/Strip) -> 3. User Turn (Release).
- **Temporal Continuum**: The engine manages the reactive transition of Future Vectors (Impulses) into Past Vectors (Memories).
- **Atomic Locking**: All state mutations affecting the current round must be performed via an `isProcessing` gate in `ReactiveSession`.

### Aesthetics (Rule 04)

- **The Nordic Collection**: Abyssal radial gradients, atmospheric noise (3%), and glassmorphic elevation.
- **Naming**: kebab-case (files), PascalCase (Svelte), snake_case (variables).

### Interaction (Vertical Monolith)

- **Standardization**: High-frequency actions utilize the `GlassPill` and the **Universal Field Chassis** standard.
- **Universal Field Chassis**: Focus-activated narrative modules with elastic expanding headers, allowing for surgical AI enhancements and metadata tracking (GRAV).
- **Quantum Presence**: The visual representation of narrative gravity through opacity and glow intensity rather than horizontal bars.
- **Component Sovereignty**: Atomic components (`Button`, `Slider`, `Toggle`, `LibraryCard`) own their internal kinetic reflexes (hover/active states) to ensure predictable, modular behavior.
- **Sticky Glass Navigation**: Modal headers and footers are sticky glass anchors with signature-tinted filters, ensuring global commands (Save/Edit) are always reachable.
- **Narrative Toolbar**: Vertical action strip triggered by row-hover, positioned in the inner gutter.

---

## 5. Testing & Verification (The Proving Grounds)

- **Unit**: Vitest for core engine logic and state mutations.
- **UI**: Svelte testing-library for rune-based component reactions.
- **E2E**: Playwright for high-fidelity sensory user flows.
- **Rule**: Every logic change requires an accompanying `.test.js` or `.svelte.test.js`.

---

## 6. Boundaries

- **NEVER**: Commit secrets, use Svelte 4 styles, or read UI state from DOM.
- **ALWAYS**: Validate data crossing boundaries (Dexie/PostMessage).
- **ALWAYS**: Sanitize `{@html}` inputs via the `sanitize()` secure bridge.
