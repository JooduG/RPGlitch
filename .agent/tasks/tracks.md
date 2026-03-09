# 🛤️ Active Tracks

> **State:** Active
> **Objective:** Refactor RPGlitch to a robust, Svelte 5 + Agentic Architecture.

## 🚀 Active Tracks

### Track: SCSS Token Standardization

- Path: [.agent/tasks/scss-token-standardization/](file:///c:/Users/johng/source/repos/RPGlitch/.agent/tasks/scss-token-standardization/)
- Status: Planning
- Checkpoint: `scss-std-01`
- Note: Codebase-wide hygienic sweep replacing all hardcoded SCSS values (colors, opacities, spacing) with reusable variables.

## 📋 Protocols & Checklists

### 🧪 Perchance Testing Checklist

- **Path:** [.agent/tasks/perchance-testing-checklist.md](file:///c:/Users/johng/source/repos/RPGlitch/.agent/tasks/perchance-testing-checklist.md)
- **Status:** Active
- **Note:** Living document for E2E validation of Perchance plugins and responsive layouts.

### ✅ Track: UI Regressions & Stability

- **Status:** Complete
- **Checkpoint:** `f2b2609`
- **Note:** Implemented 2% Grain Overlay, fixed duplicate box-shadows (Storyboard/ControlPanel), standardized `--curve-snappy` transitions, and resolved SCSS comment warnings. All UI regressions resolved and passed production build.

### ✅ Track: Dynamics Nomenclature Refactor

- **Status:** Complete
- **Checkpoint:** `491e55b8`
- **Note:** Systemic rename of character dynamics: entropy -> chaos, velocity -> intensity, permeability -> openness, resonance -> affinity. Updated state, engine logic, template tags, and UI labels. Resolved build regression in `ContextBroker.js`. pass final `npm run deploy`.

## ✅ Archive

### ✅ Track: Terminology & Convention Alignment

- **Status:** Complete
- **Checkpoint:** `c7cdacfb`
- **Note:** Aligned engine nomenclature. Reverted AI-facing terminology from 'Vector' to 'Memory'. Standardized `text_parser.js` to Process Realm (`snake_case`) and `SessionDriver` to Blueprint Realm (`PascalCase`). Expanded `entity_ref` to `entity_reference`. Refined `simulation` SKILL.md.

### ✅ Track: Intelligence Reconstruction v2

- Path: [.agent/archive/intelligence-reconstruction-v2/](file:///c:/Users/johng/source/repos/RPGlitch/.agent/archive/intelligence-reconstruction-v2/)
- Status: Complete
- Checkpoint: `71f726fd`
- Note: First-principles deconstruction of 10 core intelligence & engine files. Fixing circular LlmService↔PromptBuilder coupling, extracting NarrativeDirector, splitting config palette, and enforcing Three Lanes pipeline (Hydrate → Simulate → Synthesize).

### ✅ Track: Emotional Half-Life Protocol

- **Path:** [.agent/archive/emotional-half-life/](file:///c:/Users/johng/source/repos/RPGlitch/.agent/archive/emotional-half-life/)
- **Status:** Complete
- **Checkpoint:** `emot-half-01`
- **Note:** Implemented weighted vector scoring via MNOTION W-tiers. Centralized logic in DynamicsEngine, flattened vector schema, added new MNOTION reflexes.

### ✅ Track: Sino-Logic Optimization

- **Path:** [.agent/archive/sino-logic-optimization/](file:///c:/Users/johng/source/repos/RPGlitch/.agent/archive/sino-logic-optimization/)
- **Status:** Complete
- **Checkpoint:** `1e27a640`
- **Note:** Configured prompt synthesis pipeline to force internal `<think>` reasoning into concise technical `zh-CN`, retaining English payload semantics, driving a rigorous cut to token consumption and raising dense logical coherence without external drift.

### ✅ Track: Naivety Index

- **Path:** [.agent/archive/naivety-index/](file:///c:/Users/johng/source/repos/RPGlitch/.agent/archive/naivety-index/)
- **Status:** Complete
- **Checkpoint:** `naivety-idx-01`
- **Note:** Upgraded NPC social intelligence to calculate trust scores using the Openness axis as a credulity prior. Low-openness NPCs are cold skeptics; high-openness NPCs are naive and easily swayed.

### ✅ Track: Fractal Pivot: Purge Off-Screen Dynamics

- **Path:** [.agent/archive/fractal-pivot/](file:///c:/Users/johng/source/repos/RPGlitch/.agent/archive/fractal-pivot/)
- **Status:** Complete
- **Checkpoint:** `pivot-01`
- **Note:** Successfully purged all off-screen and background character logic from the engine, intelligence, and data layers. Verified via unit tests and 0-error build.

### ✅ Track: Prompt Intelligence Reconstruction

- **Path:** [.agent/archive/prompt-intelligence-reconstruction/](file:///c:/Users/johng/source/repos/RPGlitch/.agent/archive/prompt-intelligence-reconstruction/)
- **Status:** Complete
- **Checkpoint:** `recon-pi-03`
- **Note:** Systemic refactor of the intelligence pipeline (Blueprint -> Orchestrator). Unification of IntelligencePayload and final resolution of Typescript types.

### ✅ Track: Engine Audit (Interior Guide)

- **Path:** [engine_audit_report.md](file:///c:/Users/johng/source/repos/RPGlitch/engine_audit_report.md)
- **Status:** Complete
- **Checkpoint:** `aud-eng-01`
- **Note:** Completed deep audit of core engine, intelligence assembly, and memory hierarchy. Findings transitioned to Reconstruction track.

### ✅ Track: Integration Proving

- **Path:** [.agent/archive/integration-proving/](file:///c:/Users/johng/source/repos/RPGlitch/.agent/archive/integration-proving/)
- **Status:** Complete
- **Checkpoint:** `ver-pp-01`
- **Note:** Successfully refactored `ProsePanel.svelte` with Svelte 5 Runes and verified integration via unit tests (mocked environment).
- **Deployed:** 2026-02-19 (~362kB Bundle)

### ✅ Track: LocalStorage -> Dexie.js Migration

- **Status:** Complete
- **Checkpoint:** `16236583`
- **Note:** Migrated all persistence logic to Dexie.js (IndexedDB). (7 files impacted).

### ✅ Track: Unified Visuals Service

- **Status:** Complete
- **Checkpoint:** `224358ee`
- **Note:** Consolidated Perchance image generation and performed duplication audit.

### ✅ Track: Narrative Stability Nexus

- **Path:** [.agent/archive/narrative-stability-nexus/](file:///c:/Users/johng/source/repos/RPGlitch/.agent/archive/narrative-stability-nexus/)
- **Status:** Complete
- **Checkpoint:** `7f3443b`
- **Note:** Stabilized prompt logic, fixed settings persistence, and implemented the Narrative Stability Nexus (CHRONO/ENTITY layers).

### ✅ Track: MCP Integration Optimization

- **Path:** [.agent/archive/mcp-integration-optimization/](file:///c:/Users/johng/source/repos/RPGlitch/.agent/archive/mcp-integration-optimization/)
- **Status:** Complete
- **Checkpoint:** `e36cf449`
- **Note:** Deep integration of Waldzell Cognitive Suite (Reflection, Project, Research, Visuals) and configuration hygiene. Purged legacy tools.

### ✅ Track: Knowledge Reconstruction

- **Path:** [.agent/archive/knowledge-reconstruction/](file:///c:/Users/johng/source/repos/RPGlitch/.agent/archive/knowledge-reconstruction/)
- **Status:** Complete
- **Checkpoint:** `f3960fc5`
- **Note:** Restructured documentation for clarity and "Red Thread" alignment. Unified Vision, Governance, and Physics rules.

### ✅ Track: Concept Reconstruction

- **Path:** [.agent/archive/concept-reconstruction/](file:///c:/Users/johng/source/repos/RPGlitch/.agent/archive/concept-reconstruction/)
- **Status:** Complete
- **Checkpoint:** `f3960fc5`
- **Note:** Deconstructed and rebuilt speculative materials into the Meridian Lab standard. Purged legacy canon folders.

### ✅ Track: Vector Architecture Refactor

- **Status:** Complete
- **Checkpoint:** `vec-arch-01`
- **Note:** Nuke-and-Pave refactor of temporal memory. Terminology Unification (simulation_log) and snake_case standardization complete.

### ✅ Track: Event Bus Purge

- **Path:** [.agent/tasks/event-bus-purge/](file:///c:/Users/johng/source/repos/RPGlitch/.agent/tasks/event-bus-purge/)
- **Status:** Complete
- **Checkpoint:** `arch-bus-02`
- **Note:** Purged legacy `bus.js` architecture. Fixed production regressions in `engine.js` and removed stale test mocks. Transitioned to Svelte 5 Rune reactivity.
