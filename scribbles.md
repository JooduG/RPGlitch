# Strategic Roadmap: The Pulse Layer

Beyond the **Four Sovereigns** (Management) and the **Atoms** (Visuals/Audio), I propose the implementation of **The Pulse Layer**. These skills act as the "Nervous System" of the project, translating raw simulation data into meaningful narrative and atmospheric weight.

## 1. 🌊 Resonance (Emotional Intelligence)

**Identity**: The Empath.

- **Purpose**: Analyzes the **Sentiment**, **Tension**, and **Intent** of user messages.
- **Mechanics**: Sits between `entry` and `gamemaster`. It translates the "Vibe" of the player into mechanical signals (e.g., An aggressive response increases the `Entropy` counter in the Dynamics Engine).

## 2. 🎞️ Echo (Narrative Persistence)

**Identity**: The Historian.

- **Purpose**: Managing **Long-term Recall** and **Recap Generation**.
- **Mechanics**: Current memory is just state-saving. `echo` performs "Narrative Compression"—summarizing past Rounds into a "Living History" that follows the AI characters, ensuring your choices have a "Shadow" even 50 Rounds later.

## 3. 🔮 Oracle (The Great Library)

**Identity**: The Librarian.

- **Purpose**: Managing **Lore Integrity** and **Massive Document Lookups**.
- **Mechanics**: As the project grows, lore lookups will become expensive. `oracle` owns the **Vector Engine (Pinecone)** and the official **Spec Docs**, acting as the single source of truth for "What is the capital of X?" or "How does Magic work in this Fractal?"

## 4. 🌀 Glitch (Procedural Entropy)

**Identity**: The Reality-Breaker.

- **Purpose**: Orchestrating **Dynamic Reality Shifts** and **Simulation Anomalies**.
- **Mechanics**: On-brand with the **RPGlitch** name. It monitors the `entropy` levels in the `dynamics-engine` and triggers procedural UI "Breakdowns" (CSS distortions, cryptic audio cues, logic errors) when the simulation becomes unstable.

---

## 🏗️ The Foundry (Bonus: Asset Engineering)

**Identity**: The Architect.

- **Purpose**: On-the-fly construction of **SVG Components** and **Perchance Tools**.
- **Mechanics**: Instead of using static images, `foundry` generates dynamic, reactive SVGs for character profiles, maps, and artifacts based on the current state.

---

## 📈 Integration Strategy

I suggest we focus on **Echo** or **Resonance** immediately after the Sovereigns are established, as they provide the most noticeable "10x" improvement to the storytelling feel.

## Absorption & Removal Plan (The Great Consolidation)

This plan outlines the "Merging of the Shards." Once the four major skills are implemented, the following legacy components will be absorbed or removed to achieve a **Lean Sovereign Core**.

## 1. 🕵️ Agent Manager (The Meta-Optimizer)

**Role**: Governing Infrastructure & Mission Board.

### Absorbs 1

- **Skills**: `workshop-scribe` (State), `project` (Lifecycle), `markdown` (Templates).
- **Hybrid Absorbs**: `cognition` (Strategic Planning), `data` (Infrastructure Knowledge), `tool-forge` (Capability Design).
- **Scripts**: [sync.js](file:///c:/Users/johng/source/repos/RPGlitch/.agent/skills/project/scripts/sync.js), [scaffold-skill.js](file:///c:/Users/johng/source/repos/RPGlitch/.agent/skills/markdn/scripts/scaffold-skill.js).
- **Targets for Removal**:
- `c:/Usersohng/source/repos/RPGlitch/.agent/skills/workshop-scribe/`
- :/Users/johng/source/repos/RPGlitch/.agent/skills/project/`
- :/Users/johng/source/repos/RPGlitch/.agent/skills/markdown/`
- :/Users/johng/source/repos/RPGlitch/.agent/skills/cognition/`
- `c:/Users/johng/source/repos/RPGlitch/.agent/skills/data/`
- `c:/Users/johng/source/repos/RPGlitch/.agent/skills/tool-forge/`

---

## 2. 🚪 Entry Skill (The Frontier Scout)

**Role**: Ideation, Translation, & Intent.

### Absorbs 2

- **Skills**: `vibe-decoder` (Interpretation), `workshop-forge` (Brainstorming).
- **Hybrid Absorbs**: `cognition`Divergent Ideation), `find-skills` (Discovery).
- **Targets for Remova*:
- `c:/Users/johng/source/repos/RPGlitch/.agent/skills/vibe-decode`
- `c:/Users/johng/source/repos/RPGlitch/.agent/skills/workshop-rge/`
- `c:/Users/johng/source/repos/RPGlitch/.agent/skills/find-skills/`
- `c:/Users/johng/source/repos/RPGlitch/.agent/skills/cognition/` (Shared)

---

## 3. 🛡️ Warden Skill (The Adversarial Sentry)

**Role**: Compliance, Security, & Scholar Gate.

### Absorbs 3

- **Skills**: `quality-assurance` (Testing), `naming-analyzer` (Rule 03 Compliance).
- **Hybrid Absorbs**: `workshop-warden` (Structural Sentry), `tool-forge` (Capability Aud).
- **Scripts**: `janitor.js`, `security-scan.js`, `audit.js`.
- **Targetfor Removal**:
- `c:/Users/johng/source/repos/RPGlitch/.agent/skills/ality-assurance/`
- `c:/Users/johng/source/repos/RPGlitch/.agent/skills/namingnalyzer/`
- `c:/Users/johng/source/repos/RPGlitch/.agent/skills/workshop-warden/` (Shared)
- `c:/Users/johng/source/repos/RPGlitch/.agent/skills/tool-forge/` (Shared)

---

## 🎲 4. Gamemaster Skill (The Simulation Strategist)

**Role**: Rules, Physics, & Mechanical Truth.

### Absorbs 4

- **Skills**: `simulation-strategy` (Narrative Loop), `simulation-memory` (Persistence).
- **Hybrid Absorbs**: `workshop-warden` (Physics Sentry), `cognition` (Narrative Arbitration), `data` (Lore/Echo Persistence).- **Files**: `intelligence-kernel.js`, `dynamics-engine.js`, `session-driver.j.
- **Targets for Removal**:
- `c:/Users/johng/source/repos/RPGlitch/.agent/skil/simulation-strategy/`
- `c:/Users/johng/source/repos/RPGlitch/.agent/skills/sulation-memory/` (Logical)
- `c:/Users/johng/source/repos/RPGlitch/.agenskills/workshop-warden/` (Shared)
- `c:/Users/johng/source/repos/RPGlitch/.agent/skills/cognition/` (Shared)
- `c:/Users/johng/source/repos/RPGlitch/.agent/skills/data/` (Shared)

---

## 📈 Net Gains

- **Skill Count**: Reduced from ~17 skills to **4 Sovereigns** + Atoms (Audio, CSS, etc.).
- **Cognitive Load**: Significant reduction in "Where does this script live?" friction.
- **Structural Purity**: Closer alignment with Rule 03 (Infrastructure).
