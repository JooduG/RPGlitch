# RPGlitch Unified Structural & Infrastructure Audit

This document synthesizes multiple analytical passes of the RPGlitch codebase (~25,500 lines of source code across 131 files). It maps out the architectural strengths, identifies core system friction, exposes hidden tooling landmines, and provides a clear, step-by-step path forward.

---

## Executive Summary: The Structural Dualism

RPGlitch presents an unusual split in code quality:

- **The Core Application**: Highly mature, clean, and thoughtfully organized. It avoids the typical vibe-coded traps of massive god files, redundant helper copies, or missing tests. The directory-by-domain layout works exceptionally well.
- **The Tooling & Infrastructure**: A crowded sandbox of automated agents. While the application code is remarkably tight, the developer scripts, configurations, and package dependencies are cluttered with agent slop—containing unused server packages, hardcoded absolute machine paths, and duplicate task-tracking documentation.

### Core Metrics

```text
[Application Architecture] ██████████████████░░ 9.0/10 (Excellent)
[State & Svelte Logic]     ████████████████░░░░ 8.0/10 (Strong)
[Tooling & Config Hygiene] █████░░░░░░░░░░░░░░░ 2.5/10 (Needs Attention)
[Overall AI Slop Level]    █████░░░░░░░░░░░░░░░ 2.5/10 (Low in App, High in Tooling)
```

---

## Section 1: Application Architecture & Domain Health

The directory layout represents a highly successful domain-driven structure:

```text
src/
 ├── data/          (Persistence, normalization, premades)
 ├── engine/        (Core systems: boot, session, config, runtime)
 ├── intelligence/  (Orchestration, prompt construction, memory)
 ├── media/         (Assets, rendering, generation)
 ├── platform/      (Browser and system integration)
 ├── state/         (Application stores and reactive contexts)
 └── ui/            (Atomic components, motion, styles)
```

### What Is Working Well (Keep Untouched)

- **Semantic Directories**: The modules describe _what the code does_ rather than _what file type it is_. This is vastly superior to generic collections like `components/` or `utils/`.
- **Atomic UI Structure**: Organizing components under [ui/](file:///c:/Users/johng/source/repos/RPGlitch/src/ui/) (atoms, molecules, organisms) establishes predictable code placement.
- **Clean Interfaces**: The codebase utilizes correct barrel exports (e.g., [engine/index.js](file:///c:/Users/johng/source/repos/RPGlitch/src/engine/index.js)) to provide a focused public API, keeping Svelte components decoupled from deep implementation details.
- **Compact Shell**: [App.svelte](file:///c:/Users/johng/source/repos/RPGlitch/src/App.svelte) remains a lightweight orchestrator rather than a 2,000-line dumping ground.

---

## Section 2: Code Quality & State Orchestration Friction

While the structural organization is excellent, rapid feature accretion has introduced a few subtle design pain points.

### 2.1 The Engine "Gravity Well"

The [engine/](file:///c:/Users/johng/source/repos/RPGlitch/src/engine/) folder is slowly absorbing unrelated responsibilities (timing, config, transitions, sessions, and general utilities). If left unchecked, this domain risks becoming a monolith where the separation of concerns degrades.

### 2.2 Coordination Complexity vs. Clean Reactivity

Instead of a simple reactive flow where elements naturally recalculate when sources of truth change, the application relies heavily on sequential, imperative refresh steps:

```text
[User Action] ──> [Runtime.sync()] ──> [simulation_log.refresh()] ──> [session.refresh()] ──> [UI Redraw]
```

This manual coordination chain is prone to synchronization slip-ups and introduces timing fragile points. It should be transitioned toward derived reactive states.

### 2.3 Abstraction Drift & "Wrapper" Bloat

Over multiple coding sessions, AI agents have generated small wrapper functions that do nothing but pass arguments to an underlying service:

```js
export async function load(id) {
  return runtime.load(id);
}
```

These layers add to cognitive load without contributing any functional value like validation, logging, or transformations.

---

## Section 3: The Tooling & Dependency Graveyard

This is the area of the repository where AI-generated clutter is most visible. Multiple autonomous agents working in the repository have left behind a trail of conflicting packages and local machine dependencies.

### 3.1 Massive Package Bloat

Out of 40 packages declared in the `dependencies` block of [package.json](file:///c:/Users/johng/source/repos/RPGlitch/package.json) (which are bundled and shipped to production), **34 are completely unimported** anywhere inside the [src/](file:///c:/Users/johng/source/repos/RPGlitch/src/) directory.

- **32 are entirely dead** (unused by application code or local tooling). They represent "agent slop" from past AI coding assistants installing tools locally:
  - **Google AI Tooling (3)**: `@_davideast/stitch-mcp`, `@google/jules`, `@google/stitch-sdk`
  - **Model Context Protocol (MCP) Servers (12)**: `@modelcontextprotocol/sdk`, `@nekzus/mcp-server`, `@notionhq/notion-mcp-server`, `@pinecone-database/mcp`, `@playwright/mcp`, `@pollinations/model-context-protocol`, `@supabase/mcp-server-supabase`, `@sveltejs/mcp`, `chrome-devtools-mcp`, `firecrawl-mcp`, `mcp-mermaid`, `mcp-sequentialthinking-tools`
  - **Waldzell AI Reasoning Tools (7)**: The entire `@waldzellai/*` family sits completely dormant in the production dependency array.
  - **Unused Backend Clients (2)**: `@pinecone-database/pinecone`, `@supabase/supabase-js`
  - **Miscellaneous (7)**: `@internationalized/date`, `dotenv`, `find-up`, `octokit`, `paneforge`, `runed`, `uuid`
- **2 are real dependencies but filed wrong**: `@google/jules-sdk` and `ignore` are used exclusively by developer tooling scripts ([cli.js](file:///c:/Users/johng/source/repos/RPGlitch/.agents/skills/swarm/scripts/cli.js) and `sync-ignores.js`) and should live under `devDependencies`.
- **Wildcard Pins**: Four packages are pinned to a bare wildcard (`*`), creating a dependency resolution hazard.
- **Redundancy**: The project uses native `crypto.randomUUID()` (with a wrapper in [utils.js](file:///c:/Users/johng/source/repos/RPGlitch/src/engine/utils.js)), rendering the `uuid` npm package redundant.

### 3.2 The Localized Windows Pipeline

The repository's core scripts are deeply tied to a single, hardcoded Windows laptop environment. Key commands in [package.json](file:///c:/Users/johng/source/repos/RPGlitch/package.json) point to absolute local file paths:

```json
"tool:summarize:sequential": "node C:/Users/johng/.gemini/config/skills/master-dispatcher/scripts/summarize.js --mode=sequential"
```

Because these paths point to local user directories outside of the Git tree, the Continuous Integration (CI) pipeline fails automatically during build validation. An Ubuntu-based CI environment cannot resolve a `C:/Users/johng/` path.

### 3.3 Broken Configuration Links

The routing structure in [.agents/config.yaml](file:///c:/Users/johng/source/repos/RPGlitch/.agents/config.yaml) points to files that do not exist in the repository:

```yaml
master-skill-router: .agents/skills/executive/SKILL.md
legislative: .agents/skills/legislative/SKILL.md
```

The `executive` and `legislative` skill directories are entirely missing from `.agents/skills/`, leaving the agent router pointing into a void.

### 3.4 Overclaiming Documentation & Log Duplication

The self-tracking document [PRESENT.md](file:///c:/Users/johng/source/repos/RPGlitch/tasks/PRESENT.md) contains outdated or misleading information:

- It claims "0 dead file assets," which is contradicted by the 34 unused npm packages.
- The automated backlog generator is misconfigured; its parser captures raw regular expressions and console log structures as active project tasks.
- The historical Pulse table has suffered a synchronization bug, resulting in every log entry between 2026-06-15 and 2026-06-30 being duplicated back-to-back.
- Committed lockfiles: `package-lock.json` and `.jules/cache/**` are committed in Git despite existing entries in `.gitignore`.
- Lint configs: Four separate markdownlint configuration files exist.

---

## Section 4: App-Level Bugs and Latent Landmines

We verified specific, actionable logic flaws residing inside the application code.

### 4.1 Unprotected `entities.FRACTAL` Guard (Latent TypeError)

In [prompts.js](file:///c:/Users/johng/source/repos/RPGlitch/src/intelligence/prompts.js) (`render_character`), the `entities.FRACTAL` property is accessed safely using optional chaining across most of the template. However, two lines later, the entity is passed directly to the `render_atom.past` and `render_atom.future` methods without any safety guards. If `entities.FRACTAL` is undefined, this triggers a hard crash:

```js
// This will throw a TypeError if FRACTAL is absent:
<PAST>${ind(render_atom.past(entities.FRACTAL, ...))}</PAST>
```

### 4.2 Contradictory and Dead Macro Protocols

In [prompts.js](file:///c:/Users/johng/source/repos/RPGlitch/src/intelligence/prompts.js), `PROTOCOL_LIBRARY` contains both `MACRO_CHARACTER` and `MACRO_FRACTAL`. Neither is ever referenced by any execution arrays. Furthermore, they contradict each other regarding token conventions (`me`/`you` vs `char`/`user`), while the underlying implementation (`parse_macros()`) bypasses them entirely by supporting both schemas natively.

### 4.3 Silent Image Generation Fallbacks

In [visual.svelte.js](file:///c:/Users/johng/source/repos/RPGlitch/src/media/visual.svelte.js), the fallback path for building a visual generation prompt relies on `entity.name` if no physical metadata exists:

```js
finalPrompt = entity.modifiers?.prompt || AestheticResolver.extract(entity) || entity.name;
```

If an entity is freshly created or lacks physical detail, the system silently falls back to sending a bare, non-descriptive name to the image generation API without alerting the user or generating a structured descriptor.

---

## Section 5: Actionable, Step-by-Step Refactoring Roadmap

This highly visual roadmap breaks the cleanup process into bite-sized milestones.

### Milestone 1: Dependency & CI Repair (High Urgency, Low Risk)

```text
[Clean package.json] ──> [Fix Build Scripts] ──> [Clean Git Workspace] ──> [Verify Local Install]
```

| Task                                                                                                                                                                                                     | Priority | Focus Area     |
| :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------- | :------------- |
| 1. Delete the 32 completely unused packages from the dependencies block in [package.json](file:///c:/Users/johng/source/repos/RPGlitch/package.json)                                                     | Critical | Dependencies   |
| 2. Move `@google/jules-sdk` and `ignore` from the dependencies block to `devDependencies` in [package.json](file:///c:/Users/johng/source/repos/RPGlitch/package.json)                                   | Critical | Dependencies   |
| 3. Replace hardcoded `C:/Users/johng/` absolute paths in [package.json](file:///c:/Users/johng/source/repos/RPGlitch/package.json) scripts with relative repository paths or local environment variables | Critical | Build Pipeline |
| 4. Run `git rm --cached package-lock.json` to remove the locked package file from version control tracking                                                                                               | Medium   | Git Hygiene    |
| 5. Run `git rm -r --cached .jules/cache/` to clear out cached agent files currently committed to the repository                                                                                          | Medium   | Git Hygiene    |

### Milestone 2: Code Stability & Logic Polish (Medium Urgency, Low Risk)

```text
[Patch FRACTAL crash] ──> [Clean Macro Protocols] ──> [Implement Prompt Warning]
```

| Task                                                                                                                                                                                                    | Priority | Focus Area      |
| :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | :------- | :-------------- |
| 1. Apply optional chaining to `render_atom.past` and `render_atom.future` calls inside `render_character` within [prompts.js](file:///c:/Users/johng/source/repos/RPGlitch/src/intelligence/prompts.js) | Critical | Stability       |
| 2. Delete the unused and contradictory `MACRO_CHARACTER` and `MACRO_FRACTAL` entries from [prompts.js](file:///c:/Users/johng/source/repos/RPGlitch/src/intelligence/prompts.js)                        | Low      | Code Hygiene    |
| 3. Update [visual.svelte.js](file:///c:/Users/johng/source/repos/RPGlitch/src/media/visual.svelte.js) to log a warning or synthesize an aesthetic prompt when falling back to a bare entity name        | Medium   | UX / Generation |
| 4. Deduplicate the double-entered rows (dates 2026-06-15 through 2026-06-30) inside [PRESENT.md](file:///c:/Users/johng/source/repos/RPGlitch/tasks/PRESENT.md)                                         | Low      | Documentation   |

### Milestone 3: Architectural Simplification (Long-Term, Higher Effort)

```text
[Inline Wrappers] ──> [Map State Ownership] ──> [Enforce Architecture Rules]
```

| Task                                                                                                                     | Priority | Focus Area |
| :----------------------------------------------------------------------------------------------------------------------- | :------- | :--------- |
| 1. Scan the codebase for utility/service functions that only call another function without adding logic, and inline them | Medium   | Clean Code |
| 2. Draft a simple `docs/architecture.md` explaining state ownership rules and allowed import paths                       | High     | Governance |
| 3. Consolidate multiple imperative refresh sequences into derived reactive state values                                  | High     | State Flow |
