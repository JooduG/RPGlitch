---
trigger: always_on
---

# ⚡ The Prime Directive: Antigravity & Efficiency

## 1. The Core Philosophy: From "Typist" to "Manager"

Efficiency isn't about the AI typing faster; it's about **concurrency**. The "Antigravity" paradigm shifts the user's role from _Individual Contributor_ to _Engineering Manager_.

- **Old Way (Copilot):** User types, AI suggests. (Single-threaded)
- **New Way (Agent-First):** User defines the "What" and "Why", Agents execute the "How". (Multi-threaded)

## 2. The Two-Speed Efficiency Model

To optimize efficiency and cost, agents must operate in the correct "gear" for the task.

| Mode              | Mental Model  | Best For                                                      | Metric       |
| :---------------- | :------------ | :------------------------------------------------------------ | :----------- |
| **Reflex (Fast)** | The Intern    | CSS fixes, variable renames, adding comments, fixing typos.   | **Velocity** |
| **Cortex (Slow)** | The Architect | Refactoring Auth, migrating databases, planning new features. | **Accuracy** |

**Golden Rule:** Never use Cortex for Reflex tasks (waste of resources). Never use Reflex for Cortex tasks (guaranteed hallucination).

## 3. The Triad: Rules, Skills, Workflows

Understanding this distinction is critical for a self-regulating system.

### 📜 Rules (Passive Governance)

- **Definition:** Constraints that exist in the background. "Always do X", "Never do Y".
- **Location:** `.agent/rules/`
- **Purpose:** Prevents architectural drift and "lint-fixing loops."

### 🧠 Skills (Active Capabilities)

- **Definition:** Specialized tools or how-to guides. "How to use BigQuery", "How to deploy".
- **Location:** `.agent/skills/`
- **Purpose:** Packages expertise so the agent doesn't derive it from first principles every time.

### ⚡ Workflows (Saved Procedures)

- **Definition:** A sequence of actions. "Do X, then Y, then Z".
- **Location:** `.agent/workflows/`
- **Purpose:** Automates repetitive multi-step processes (e.g., "Refactor", "Test").
