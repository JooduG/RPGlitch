# 🔷 JooduG Monorepo

> **Architecture:** [02-architecture](.agent/rules/02-architecture.md) (Pillar-based)
> **Stack:** [03-tech-stack](.agent/rules/03-tech-stack.md) (Svelte 5 Runes)
> **Platform:** [Perchance](https://perchance.org)

## ⚡ Quick Start

```bash
# 1. Install & Sync
npm install
npm run sync

# 2. Build & Launch
npm run dev
```

## 🏗️ The System

RPGlitch is a high-fidelity roleplay engine and visual generator. The architecture prioritizes offline-first resilience and agentic automation.

- **Local-First Persistence:** Data resides in IndexedDB via Dexie.js. No external backend required for core operations.
- **Pillar-Based Reactivity:** State flows through decoupled domains (Gamemaster, Artificer, Mesmer, Scholar, Warden).
- **Agentic Integration:** The Antigravity OS (`.agent/`) governs system rules and automated workflows.
- **Zero-Trust Security:** Strict sanitization and the "Freedom Protocol" safeguard the runtime environment.

## 🗺️ Context Map

- **Rules:** [AGENTS.md](AGENTS.md) (The governing laws)
- **Workflows:** [.agent/workflows/](.agent/workflows/) (Automation)
- **Docs:** [.agent/knowledge/](.agent/knowledge/) (Deep Dives)
