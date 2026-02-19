# 🎯 Feature: MCP Integration Optimization

> **Slug:** `mcp-integration-optimization`
> **Goal:** Streamline the agent's toolset and deeply integrate the "Waldzell" cognitive suite into the agent's Operating Protocols.

## 1. Context

The agent is transitioning to a "Cortex-First" architecture. This requires:

1.  **Purging** legacy/unused tools (`scholar`, `pollinations`).
2.  **Integrating** the "Waldzell" suite of cognitive MCP servers into the `skill` definitions, ensuring they are used for complex reasoning tasks.
3.  **Repairing** the `mcp_config.json` to match the local environment.

## 2. Requirements

### 🧠 Cognitive Architecture (Waldzell Integration)

Map specific Waldzell tools to the Agent's Skills to unlock "System 2" thinking.

- [ ] **Reflection Skill (`skills/reflection/SKILL.md`)**:
    - **Metacognition**: Integrate `waldzell-metacognitive-monitoring` (Self-correction).
    - **Clear Thought**: Integrate `waldzell-clear-thought` (Sequential reasoning replacement).
    - **Argumentation**: Integrate `waldzell-structured-argumentation` (Thesis/Antithesis).
- [ ] **Project Skill (`skills/project/SKILL.md`)**:
    - **Decisions**: Integrate `waldzell-decision-framework` (Roadmap choices).
    - **Estimation**: Integrate `waldzell-stochastic-thinking` (Task size/risk estimation).
- [ ] **Research Skill (`skills/research/SKILL.md`)**:
    - **Inquiry**: Integrate `waldzell-scientific-method` (Hypothesis testing).
    - **Collaboration**: Integrate `waldzell-collaborative-reasoning` (Simulated experts).
- [ ] **Visuals Skill (`skills/visuals/SKILL.md`)**:
    - **Reasoning**: Integrate `waldzell-visual-reasoning` (Diagramming/Flow).

### 🧹 Hygiene (The Purge)

- [ ] **Remove `scholar`**: Replaced by local `memory`.
- [ ] **Remove `pollinations`**: User explicitly requested purge. Visuals will rely on Perchance (via existing logic).

### ⚙️ Configuration Refactor

- [ ] **Sync Paths**: Use `c:\Users\johng\source\repos\RPGlitch\...` for all tools.
- [ ] **Enable QA Tools**: `playwright`, `chrome-devtools`.
- [ ] **Verify**: Ensure `context7`, `deepwiki` are active.

## 3. Acceptance Criteria

- [ ] `mcp_config.json` is clean and paths are valid.
- [ ] `pollinations` and `scholar` are gone.
- [ ] `SKILL.md` files (Reflection, Project, Research, Visuals) explicitly document _when_ to use the new Waldzell tools.
