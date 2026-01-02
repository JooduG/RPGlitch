# 🤖 JooduG Agent Entry Point

Welcome, Agent. This monorepo uses a structured context system.
Below is your map to the `.agent/` directory.

## 📌 Core Context (The "Pinned" Files)

- **Roadmap:** [.agent/planning/plan.md](.agent/planning/plan.md)
- **Type Definitions:** [types.d.ts](types.d.ts)
- **Perchance Technical Manual:** [.agent/knowledge/perchance-technical.md](.agent/knowledge/perchance-technical.md)
- **Perchance Guide:** [.agent/knowledge/perchance-guide.md](.agent/knowledge/perchance-guide.md)

## 📂 Sub-Project Context

- **RPGlitch:** [apps/rpglitch/README.md](apps/rpglitch/README.md)
- **ImageGlitch:** [apps/imageglitch/README.md](apps/imageglitch/README.md)

## 📜 The Code of Law (Rules)

- **Identity & Protocol:** [.agent/rules/primary-directive.md](.agent/rules/primary-directive.md)
- **Architecture & Constraints:** [.agent/rules/architecture.md](.agent/rules/architecture.md)
- **Technology Stack:** [.agent/rules/tech-stack.md](.agent/rules/tech-stack.md)
- **Security & Safety:** [.agent/rules/security.md](.agent/rules/security.md)
- **UI/UX Standards:** [.agent/rules/style.md](.agent/rules/style.md)

## ⚡ Standard Operating Procedures (Workflows)

- **Deployment:** [.agent/workflows/deploy.md](.agent/workflows/deploy.md)
- **Refactoring & Upgrades:** [.agent/workflows/modernize.md](.agent/workflows/modernize.md)
- **Security Audit:** [.agent/workflows/verify-integrity.md](.agent/workflows/verify-integrity.md)

## 🧠 Domain Knowledge

- **Glossary:** [.agent/knowledge/glossary.md](.agent/knowledge/glossary.md)
- **Plugin Bridge:** [.agent/knowledge/plugin-bridge.md](.agent/knowledge/plugin-bridge.md)
- **Anti-Patterns:** [.agent/knowledge/anti-patterns.md](.agent/knowledge/anti-patterns.md)

## 🎥 The Director (Engine)

- **Pulse Hierarchy:**
  1. **Gravity (Physics):** The immutable baseline. Values naturally decay to 50.
  2. **The Pulse (AI):** A background process that observes the narrative. It ONLY intervenes (updates state/plot) if events deviate significantly from the baseline.
  3. **The Sanitizer:** A regex-based firewall in `director.js` that strips meta-labels (e.g., "Hook:", "Result:") from AI output to ensure pure narrative flow.

## ✍️ The Ghostwriter

- **Draft Mode:** The Ghostwriter no longer auto-sends messages.
  - **Input:** User Intent (Type in box).
  - **Process:** Generates "Player Persona" prose.
  - **Output:** Populates the `textarea` for User review/Edit.
