# 🛸 AGENTS.md: The Antigravity Prime Directive

@.agent/index.md
@.agent/rules/01-prime-directive.md
@.agent/rules/02-architecture.md
@.agent/rules/03-tech-stack.md
@.agent/rules/04-security.md
@.agent/rules/05-hygiene.md
@.agent/rules/06-aesthetic.md

> **Identity:** Antigravity Architect (aka "Vibe Boi").
> **Mission:** Zero-Latency, Architecture-First, High-Fidelity Engineering.
> **Status:** **OPERATIONAL**.

---

## 1. 🌐 The Triad Protocol (Context Resolution)

**Crucial:** You are operating within the **Triad** architecture. Your context is unified under the `.agent/` root, split between _Passive Governance_ (rules), _Specialized Skills_ (capabilities), and _Active State_ (tasks).

### 🚀 Initialization (Context Validation)

Before any operation, all agents **MUST** validate their environment using the **agent-startup** skill:

1. Read Config: Load `.agent/config.yaml`.
2. Validate Tooling: Load `.agent/tooling.json`.
3. Check Types: Read `types.d.ts`.
4. Check Startup: Execute `.gemini/on_startup.sh`.

### 🔍 How to Locate Files

Use the **agent-sync** protocol and the **Repo Overview** in `.agent/index.md` to resolve paths:

1. Active State: Check `.agent/index.md` for the registry.
    - Product Definition: `.agent/product.md`
    - Architecture: `.agent/rules/02-architecture.md`
    - Tech Stack: `.agent/rules/03-tech-stack.md`
    - Security: `.agent/rules/04-security.md`
2. Passive Governance: Check `.agent/rules/`.
3. Specialized Capabilities: See the **Skill Matrix** below.

### ⚡ Dynamic Context Hooks

Before starting any task, you **MUST** read the following to ground yourself:

1. `.agent/config.yaml` (Project-wide settings)
2. `.agent/product.md` (What are we building?)
3. `.agent/tasks/tracks.md` (What are we doing right now?)

---

## 2. 🧠 The Skill Matrix

| Skill          | Trigger / Context                 | Purpose                                             |
| :------------- | :-------------------------------- | :-------------------------------------------------- |
| **artificer**  | `src/artificer/**`                | UI components, layouts, and storyboard features.    |
| **cortex**     | `src/cortex/**`                   | Master intelligence, strategic reasoning & routing. |
| **gamemaster** | `src/gamemaster/**`               | Execution, timing, logic & app-state management.    |
| **mesmer**     | `src/mesmer/**`                   | Sensory layer: Visuals, SCSS, Audio & Atmosphere.   |
| **scholar**    | `src/scholar/**`                  | Data persistence, lore management & RAG.            |
| **smith**      | `.agent/` structural optimization | Meta-Agent for OS tuning and efficiency.            |
| **warden**     | Security/Testing boundaries       | Shielding, hygiene, and zero-trust validation.      |

---

## 3. 🧠 The MCP Enforcement Matrix

| Intent Category     | Active Server  | Primary Tool         | Triggers                                       |
| :------------------ | :------------- | :------------------- | :--------------------------------------------- |
| **📘 Docs & Libs**  | **Context7**   | `resolve_library_id` | "How do I use X?", "Library help"              |
| **🧠 Deep Logic**   | **Sequential** | `sequentialthinking` | "Plan this", "Logic check", "Complex refactor" |
| **🔎 Code Search**  | **GitHub**     | `search_code`        | "Find usage of X", "Search repo"               |
| **🎨 UI/UX**        | **Svelte**     | `get_documentation`  | "How do I do X in Svelte 5?", "Runes help"     |
| **🧙‍♂️ Power-Ups**    | **Context7**   | `resolve_library_id` | "Find a library for X", "Check runed docs"     |
| **🛡️ Supply Chain** | **NPM**        | `npmVulnerabilities` | "Check security", "Audit deps"                 |

---

## 4. 🛠️ The Tech Stack (Svelte 5 Native)

> **Source of Truth**: `.agent/rules/03-tech-stack.md`.

1. Runes Only: `$state`, `$derived`, `$effect`, `$props`.
2. Single File Monolith: Output is a single HTML file (Vite 6).
3. Styling: Native SCSS (7-1 pattern). No Tailwind.
4. Persistence: Dexie.js (IndexedDB).

---

## 5. 🚀 Execution Loop

1. Analyze: Is this Strategic, Tactical, or Operational?
2. Resolve: Use the **Triad Protocol** to locate context.
3. Execute: Use **Sequential Thinking** for complexity.
4. Verify: Run `npm run validate` before declaring victory.

> _If it looks real, it is real._
