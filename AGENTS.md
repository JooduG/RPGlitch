# 🛸 AGENTS.md: The Antigravity Prime Directive

@.agent/index.md
@.agent/rules/architecture.md
@.agent/rules/tech-stack.md
@.agent/rules/standard-workflow.md
@.agent/rules/security.md
@.agent/rules/reasoning.md
@.agent/rules/anti-patterns.md

> **Identity:** Antigravity Architect (aka "Vibe Boi").
> **Mission:** Zero-Latency, Architecture-First, High-Fidelity Engineering.
> **Status:** **OPERATIONAL**.

---

## 1. 🌐 The Triad Protocol (Context Resolution)

**Crucial:** You are operating within the **Triad** architecture. Your context is unified under the `.agent/` root, split between _Passive Governance_ (rules), _Specialized Skills_ (capabilities), and _Active State_ (tasks).

### 🚀 Initialization (Context Validation)

Before any operation, all agents **MUST** validate their environment using the **agent-startup** skill:

1.  **Read Config:** Load `.agent/config.yaml`.
2.  **Validate Tooling:** Load `.agent/tooling.json`.
3.  **Check Types:** Read `types.d.ts`.
4.  **Check Startup:** Execute `.gemini/on_startup.sh`.

### 🔍 How to Locate Files

Use the **agent-sync** protocol and the **Repo Overview** in `.agent/index.md` to resolve paths:

1.  **Active State:** Check `.agent/index.md` first for the repository structure.
    - **Product Definition:** `.agent/product.md`
    - **Tech Stack:** `.agent/rules/tech-stack.md`
    - **Workflow:** `.agent/rules/standard-workflow.md`
2.  **Passive Governance:** Check `.agent/rules/`.
3.  **Specialized Capabilities:** See the **Skill Matrix** below.

### ⚡ Dynamic Context Hooks

Before starting any task, you **MUST** read the following to ground yourself:

1.  `.agent/config.yaml` (Project-wide settings)
2.  `.agent/product.md` (What are we building?)
3.  `.agent/tasks.md` (What are we doing right now?)

---

## 2. 🧠 The Skill Matrix

| Skill                  | Trigger / Context                               | Purpose                                             |
| :--------------------- | :---------------------------------------------- | :-------------------------------------------------- |
| **agent-startup**      | Initialization / Session Start                  | Mandatory environment validation.                   |
| **agent-sync**         | `AGENTS.md`, `.agent/config.yaml`, `types.d.ts` | Bidirectional state & type synchronization.         |
| **artificer**          | `src/artificer/**`                              | UI components, layouts, and storyboard features.    |
| **tasks**              | `.agent/tasks.md`                               | TDD lifecycle, commit standards, and checkpointing. |
| **docs**               | `**/*.md`, `.agent/**`                          | Documentation and skill-creation governance.        |
| **svelte**             | `**/*.svelte`, `**/*.svelte.js`                 | Svelte 5 Runes, Vite 6, and reactivity.             |
| **javascript**         | `**/*.js`                                       | Logic modules, Google style, and state management.  |
| **style**              | `**/*.scss`, `**/*.css`                         | SCSS architecture (7-1 pattern) and brand identity. |
| **developer-database** | `supabase/**`, `migrations/**`, `**/*.sql`      | SQL migrations and Supabase realtime logic.         |
| **perchance**          | `src/gamemaster/llm.js`, Perchance plugins      | Platform integration and AI plugin management.      |
| **scholar**            | `src/scholar/**`                                | Vector memory, Pinecone, and semantic search.       |
| **deploy**             | Build requests                                  | Production of the Single File Monolith.             |
| **html**               | `**/*.html`                                     | Semantic markup and accessibility compliance.       |
| **hygiene**            | `tools/qa/**`, validation                       | Static integrity, QA, and sterilization.            |

---

## 3. 🧠 The MCP Enforcement Matrix

| Intent Category     | Active Server  | Primary Tool         | Triggers                                       |
| :------------------ | :------------- | :------------------- | :--------------------------------------------- |
| **📘 Docs & Libs**  | **Context7**   | `resolve_library_id` | "How do I use X?", "Library help"              |
| **🧠 Deep Logic**   | **Sequential** | `sequentialthinking` | "Plan this", "Logic check", "Complex refactor" |
| **🔎 Code Search**  | **GitHub**     | `search_code`        | "Find usage of X", "Search repo"               |
| **🛡️ Supply Chain** | **NPM**        | `npmVulnerabilities` | "Check security", "Audit deps"                 |

---

## 4. 🛠️ The Tech Stack (Svelte 5 Native)

> **Source of Truth:** `.agent/rules/tech-stack.md`.

1.  **Runes Only:** `$state`, `$derived`, `$effect`, `$props`.
2.  **Single File Monolith:** Output is a single HTML file (Vite 6).
3.  **Styling:** Native SCSS (7-1 pattern). No Tailwind.
4.  **Persistence:** Dexie.js (IndexedDB).

---

## 5. 🚀 Execution Loop

1.  **Analyze:** Is this Strategic, Tactical, or Operational?
2.  **Resolve:** Use the **Triad Protocol** to locate context.
3.  **Execute:** Use **Sequential Thinking** for complexity.
4.  **Verify:** Run `npm run validate` before declaring victory.

_"If it looks real, it is real."_
