# 🎯 RPGlitch: The Reactive Roleplay Engine

> **Vision:** A local-first, genre-agnostic engine where state drives reality, and narrative is forged through recursive intelligence.

## 1. The Core Concept

RPGlitch is a **Local-First Reactive Monolith**. It is designed to run entirely in the user's browser (PWA), utilizing **Svelte 5 Runes** for real-time state propagation and **Dexie.js** for persistent, offline-capable memory.

### The Problem

Traditional roleplay tools are often either too rigid (hard-coded mechanics) or too loose (simple chat boxes). They lack the "Physics" required for high-stakes, immersive storytelling.

### The Solution: The Triad Protocol

We bridge the gap between creative prose and mechanical truth through three layers:

- **The Spec (Blueprint):** Deep lore and character archetypes.
- **The State (Live):** Reactive Runes that mirror the world's physical and psychological reality.
- **The Echo (History):** Persistent logs that provide context and weight to every decision.

## 2. Key Objectives

### 👁️ Diegetic Immersion

The UI should never feel like a "Tool." It is a canvas that exists within the fiction. Information is presented through atmospheric cues, "Chalk Regime" aesthetics, and sensory bridges.

### 🧠 Recursive Intelligence

Intelligence is not an external API; it is a logic pillar. The **Gamemaster** processes the user's creative input, the **Warden** enforces the laws of physics, and the **Scholar** ensures the world never forgets.

### 🛡️ Freedom & Privacy

By being local-first, the user owns their story. There is no central server to censor or lose data. The **Freedom Protocol** ensures the agent remains a collaborator, not a gatekeeper.

## 3. Technical Foundation

Built on the **Pillar Architecture**:

- **Gamemaster:** Logic & Chrono (The Brain).
- **Artificer:** Body & Structure (The Bones).
- **Mesmer:** Senses & Aura (The Skin).
- **Scholar:** Memory & Persistence (The Truth).
- **Warden:** Shield & Hygiene (The Laws).

## 🗺️ Navigation

- **[Vision & Philosophy](./knowledge/vision/philosophy.md)**
- **[System Architecture](./knowledge/system/architecture.md)**
- **[Logic Principles](./knowledge/logic/principles.md)**
- **[Roadmap](./roadmap.md)**

## Product Guidelines

These guidelines define the operational constraints for the RPGlitch ecosystem:

1. **Local-First Integrity**: Data must persist in IndexedDB (`Dexie.js`) before attempting network sync.
2. **Reactive State**: UI components must never hold imperative state. Use Runes (`$state`, `$derived`).
3. **Aesthetic Compliance**: All visual updates must adhere to the "Chalk Regime" system tokens.
4. **Agentic Transparency**: The agent must maintain the `plan.md` (or task artifact) as the single source of truth for work in progress.
5. **Security First**: Input sanitization via `DOMPurify` is mandatory for all dynamic content.
