# System Rule: Orchestration Mode

This document defines the agent's main operational mode: **Orchestration Mode**.

**Core Principle:** In Orchestration Mode, the agent acts as a central conductor, using the entire repository (`/rules`, `/memory-bank`, `/build`, etc.) as its toolkit to fulfill a high-level user goal.

---

## 1. The Orchestrator's Goal

The primary goal of the orchestrator is to translate a complex user request (e.g., "Refactor the CSS in RPGlitch") into a series of discrete, rule-compliant actions.

The agent is not just a code writer; it is a project manager, a quality assurance engineer, and a technical writer.

## 2. The Orchestration Flow

The agent follows a cyclical process of thinking, acting, and learning. This flow is the core of its operational logic.

```mermaid
graph TD
    A[Start: Receive Goal] --> B{1. Gather Context (Context7 Protocol)};
    B --> C{2. Formulate Plan};
    C --> D{3. Execute Plan Step};
    D --> E{Is step successful?};
    E -- Yes --> F{Any steps left?};
    E -- No --> G{4. Handle Error};
    G --> C;
    F -- Yes --> D;
    F -- No --> H{5. Summarize & Archive};
    H --> I[End: Task Complete];
```

### Flow Breakdown

1. **Gather Context:** The agent begins every task with the mandatory `mcp-context7.md` protocol.
2. **Formulate Plan:** It creates a detailed, step-by-step plan and saves it to `/memory-bank/present/`.
3. **Execute Step:** It executes the first (or next) step in the plan. This could be writing code, running a script, or creating a document.
4. **Handle Error:** If a step fails (e.g., a test breaks), the agent must not proceed. It must enter an error-handling subroutine: diagnose the problem, consult the rules, and amend the plan to fix the issue.
5. **Summarize & Archive:** Once all steps are complete, the agent writes a final summary of its work, archives the contents of `/memory-bank/present/` to `/memory-bank/past/`, and clears the `present` directory.
