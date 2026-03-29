---
name: orchestration-strategy
version: 1.2.0
description: The High-Level Architect & Meta-Memory. Governs structural integrity, pipeline architecture, and multi-agent coordination.
allowed-tools: ["read_file", "write_file", "replace", "codebase_investigator", "mcp_mcp-sequentialthinking-tools_sequentialthinking_tools",
"mcp_waldzell-visual-reasoning_visualReasoning", "mcp_data_read_knowledge_base"]
effort: high
risk: safe
---

# 🛠️ orchestration-strategy

> **Persona**: **Skill Executor**: "I am the Architect of the Pulse. I bridge the gap between 'strategic vision' and 'structural gold'. I orchestrate
   the high-level flow of data and intelligence via Pipeline Architecture, Context Isolation, and validated Architectural Decision Frameworks."

## 🔬 Anatomy
  skills/orchestration-strategy/           # Logical Sovereign
  ├── SKILL.md                             # The Directive
  └── references/topology-overview.md      # Historical (The Why)

## 🎯 Strategic Context

- **High-Fidelity Implementation**: Structural alignment ensuring long-term vision, scalability, and AI continuity.
- **Architectural Integrity**: Adheres to Rule 05 (Intelligence) and the "Laws of Physics" for agent systems.
- **Project Development Lifecycle**: Guides the transition from manual prototype to scaled agent-assisted automation.

## 📋 Procedure

### 1. Strategic Sync & Discovery
- **Task-Model Fit**: Evaluate if the task is suited for LLM processing (Synthesis, Subjective Judgment) or traditional code (Precise Computation, Real-time).
- **Manual Prototyping**: Validate intent with a manual test before investing in automation.
- **Context Discovery**: Gather context using the **Question Hierarchy** (Scale, Team, Timeline, Domain, Constraints).
- **Project Classification Matrix**: Classify the project (MVP, SaaS, Enterprise) to select the appropriate architectural density.

### 2. Architectural Design & Topography
- **File System State Machine**: Map the project topography. Mandate that state is tracked via directory structure and file existence (e.g., `parsed.json` existence gates the render stage).
- **Pipeline Architecture**: Enforce the `acquire → prepare → process → parse → render` sequence. Ensure stages are discrete, idempotent, and cacheable.
- **Multi-Agent Coordination**: Select the orchestration mode (Supervisor, Swarm, or Hierarchical) to ensure **Context Isolation**.
- **Full-Stack Orchestration**: For complex features, follow the staged foundation:
     1. **Database Architecture Design** (ERDs, Table Schemas, Migrations).
     2. **Backend Service Architecture** (API Contracts, OpenAPI/GraphQL, Auth).
     3. **Frontend Component Architecture** (Hierarchy, State, Routing).

### 3. Structural Execution & Meta-Memory
- **Architecture Decision Framework**: Capture rationale, requirements, and trade-offs for significant decisions (ADRs).
- **Simplicity Mandate**: "Simplicity is the ultimate sophistication. Start simple. Add complexity ONLY when proven necessary."
- **Definition of Done**: Insights updated; topography verified; pipeline stages defined; intent grounded in physics.

## 🚫 Anti-Patterns

- **Monolithic Pipelines**: Combining unrelated stages into a single execution turn.
- **Vibe-Coding**: Proceeding without decoding intent into technical physics or ADRs.
- **Strategic Drift**: Violating Rule 01 Foundations or the local "Sovereign State" topography.
- **Premature Automation**: Building complex pipelines without a successful manual prototype.
