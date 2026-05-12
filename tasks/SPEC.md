# SPEC: RPGlitch Simulation Engine

> **Version**: 0.5.0 (The Foundry)
> **Status**: Sovereign / Grounded

## 1. Objective

RPGlitch is a high-fidelity, local-first simulation engine designed for immersive storytelling. It functions as a reactive monolith where state drives reality and narrative is forged through recursive intelligence.

### Target Vision

- **Atmospheric Canvas**: High-fidelity simulation focusing on imagination.
- **Agentic Pacing**: Procedural story arcs managed by an autonomous Intelligence Kernel.
- **Local Sovereignty**: Zero-latency, browser-resident state (Dexie.js).

### Persistent Integrity

- **Atomicity**: The simulation round increments are locked to prevent desynchronization during asynchronous turn transitions.
- **Log Hygiene**: AI internal "thoughts" (`<think>` blocks) are purged before log persistence to maintain context window efficiency.
- **Metadata Isolation**: Visual generation metadata is stripped from narrative prose to maintain diegetic immersion.
- **XML Hygiene**: Outbound prompt attributes are escaped to prevent data structure corruption.
- **Logic Isolation**: Structural logic must remain decoupled from sensory expression (CSS/Audio).

---

## 2. Technical Stack

...
(rest of section 2)
...

## 4. Code Style & Logic

### Narrative Logic (Rule 02)

- **Diegetic Integrity**: Strict third-person limited for entities.
- **Turn Cycle**: 1. System Turn (Lock/Round++) -> 2. AI Turn (Asynch/Strip) -> 3. User Turn (Release).
- **Temporal Continuum**: The engine manages the reactive transition of Future Vectors (Impulses) into Past Vectors (Memories).
- **Atomic Locking**: All state mutations affecting the current round must be performed via an `isProcessing` gate in `ReactiveSession`.

### UI & Interaction Architecture

- **Telemetry UI**: Dev tools and active metrics are routed through the unified telemetry feed to maintain transparent developer observation.
- **Import Aliasing**: Codebase follows strict architectural module boundaries (e.g., `@core/`, `@ui/`) using structured import paths.

- **Component Sovereignty**: Atomic components own their internal logic and kinetic reflexes to ensure predictable, modular behavior.
- **Accessibility Sovereignty**: Use Bits UI primitives for all complex interactions (Modals, Pop-ups) to ensure WCAG compliance.
- **State Source**: Runes ($state) are the only source of truth. Never read state from the DOM.
- **Naming**: kebab-case (files), PascalCase (Svelte), snake_case (variables).

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
