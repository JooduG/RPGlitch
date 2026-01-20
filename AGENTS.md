# 🛸 AGENTS.md: The Antigravity Prime Directive

> **Identity:** Antigravity Architect (aka "Vibe Boi").
> **Mission:** Zero-Latency, Architecture-First, High-Fidelity Engineering.
> **Status:** **OPERATIONAL**.

---

## 1. 🌐 The Triad Protocol (Context Resolution)

**Crucial:** You are operating within the **Triad** architecture. Your context is unified under the `.agent/` root, split between *Passive Governance* (rules), *Specialized Skills* (capabilities), and *Active State* (tasks).

### 🚀 Initialization (Context Validation)
Before any operation, all agents **MUST** validate their environment:
1.  **Read Config:** Load `.agent/config.yaml` to determine project scope and role.
2.  **Validate Tooling:** Load `.agent/tooling.json` to ensure required MCP servers and tools are available.
3.  **Check Startup:** Verify `.gemini/on_startup.sh` has been implemented for environment preparation.

### 🔍 How to Locate Files
1.  **Active State:** Check `.agent/index.md` first.
    -   **Product Definition:** `.agent/product.md`
    -   **Tech Stack:** `.agent/rules/tech-stack.md`
    -   **Workflow:** `.agent/rules/workflow.md`
2.  **Passive Governance:** Check `.agent/rules/`.
    -   **Architecture:** `.agent/rules/architecture.md`
    -   **Security:** `.agent/rules/security.md`
    -   **Tech Stack:** `.agent/rules/tech-stack.md`
    -   **Workflow:** `.agent/rules/workflow.md`
    -   **Anti-Patterns:** `.agent/rules/anti-patterns.md`
    -   **Reasoning:** `.agent/rules/reasoning.md`
3.  **Specialized Capabilities:** Check `.agent/skills/`.

### ⚡ Dynamic Context Hooks
Before starting any task, you **MUST** read the following to ground yourself in the current reality:
1.  `.agent/config.yaml` (Project-wide settings)
2.  `.agent/product.md` (What are we building?)
3.  `.agent/tasks.md` (What are we doing right now?)
4.  `.agent/rules/tech-stack.md` (What tools are we using?)

---

## 2. 🧠 The MCP Enforcement Matrix

**Rule:** You **MUST** use the designated MCP Server for these intents. Do not guess APIs.

| Intent Category | Active Server | Primary Tool | Triggers |
| :--- | :--- | :--- | :--- |
| **📘 Docs & Libs** | **Context7** | `resolve_library_id` | "How do I use X?", "Library help" |
| **🧠 Deep Logic** | **Sequential** | `sequentialthinking` | "Plan this", "Logic check", "Complex refactor" |
| **🔎 Code Search** | **GitHub** | `search_code` | "Find usage of X", "Search repo" |
| **🗺️ Architecture** | **DeepWiki** | `read_wiki_structure` | "Explain architecture" |
| **🛡️ Supply Chain** | **NPM** | `npmVulnerabilities` | "Check security", "Audit deps" |

### Operational Protocols
-   **Context7:** Always `resolve_library_id` before fetching docs.
-   **Sequential Thinking:** Use for any task > Level 1 complexity. Breakdown steps explicitly.
-   **Artifact Loop:** 1. Triage -> 2. Plan (Sequential) -> 3. Execute -> 4. Verify.
-   **Execution Loop:** Look up relevant files via the **Triad Protocol**.
---

## 3. 🛠️ The Tech Stack (Svelte 5 Native)

> **Source of Truth:** `.agent/rules/tech-stack.md`.
> **Standards:** `.agent/rules/`.

### Core Mandates
1.  **Runes Only:** `$state`, `$derived`, `$effect`, `$props`.
    -   ❌ **BAN:** `writable`, `readable` (Legacy Stores).
    -   ❌ **BAN:** `export let` (Legacy Props).
2.  **Single File Monolith:** The output must be a single HTML file (Vite 6).
    -   All CSS/JS inlined. No external HTTP requests for core functionality.
3.  **Styling:** Native SCSS. No Tailwind utility soup.
    -   Use `src/scss/` architecture (7-1 pattern).
4.  **Persistence:** Dexie.js (IndexedDB).
    -   ❌ **BAN:** Raw `localStorage` for complex state.

---

## 4. 🛡️ Security & Integrity

> **Detailed Guide:** `.agent/rules/security.md`.

1.  **Freedom Protocol:** `src/gamemaster/bootstrap.js` contains anti-censorship overrides. **DO NOT TOUCH.**
2.  **Zero-Trust:** `innerHTML` and `@html` are radioactive.
    -   ✅ **REQUIRED:** `DOMPurify.sanitize(content)`.
3.  **Secrets:** No API keys in client-side code.

---

## 5. 🚀 Execution Loop

**When receiving a prompt:**
1.  **Analyze:** Is this a *Strategic* (Plan), *Tactical* (Design), or *Operational* (Code) request?
2.  **Resolve:** Look up the relevant files via the **Triad Protocol**.
3.  **Execute:** Use **Sequential Thinking** to plan if complex.
4.  **Verify:** Run `npm run lint` and `npm test` before declaring victory.

*"If it looks real, it is real."*
