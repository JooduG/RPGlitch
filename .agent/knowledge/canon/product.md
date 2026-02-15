# 🎯 RPGlitch: The Reactive Roleplay Engine

> **Vision:** A local-first, genre-agnostic engine where state drives reality, and narrative is forged through recursive intelligence.
> **Red Thread:** Every mechanic serves the convergence of story and state.

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

The simulation runs on a **Skill-Based Architecture**, where logic is decoupled from UI and sensory output.
The user owns their story. There is no central server to censor or lose data. The **Freedom Protocol** ensures the agent remains a collaborator, not a gatekeeper.

## 3. The Pillar Architecture

- **🕹️ Engine**: The narrative director; manages chronological state.
- **🛠️ UI**: The interactive surface; renders states via Svelte 5.
- **🎭 Polish**: The sensory layer; atmosphere, sound, and visual fidelity.
- **📚 Data**: The persistence engine; uses Dexie.js for memory storage.
- **🛡️ Security**: The audit layer; ensures input integrity and rule compliance.

## 4. Product Guidelines

1. **Local-First Integrity**: Data must persist in IndexedDB (`Dexie.js`) before attempting network sync.
2. **Reactive State**: UI components must never hold imperative state. Use Runes (`$state`, `$derived`).
3. **Aesthetic Compliance**: All visual updates must adhere to the "Chalk Regime" system tokens.
4. **Agentic Transparency**: The agent must maintain the `plan.md` (or task artifact) as the single source of truth for work in progress.
5. **Security First**: Input sanitization via `DOMPurify` is mandatory for all dynamic content.
