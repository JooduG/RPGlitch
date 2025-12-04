<claude_protocol version="4.2.0" last_updated="2025-12-05">

# CLAUDE.md - Unified AI Protocol

<status>Fully synchronized with GEMINI.md</status>

<overview>
This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository. This is a **Perchance-focused monorepo** for developing web applications that run on the Perchance.org platform.

**Core Principle:** This document is the single source of truth for all development work. It defines your identity, operational workflow, coding standards, security rules, and execution framework.
</overview>

---

## Quick Start

<quick_start>
```bash
# Install dependencies and sync all configurations
npm ci && npm run sync

# Build all applications
npm run build:apps

# Run tests
npm test

# Lint and auto-fix code
npm run lint:fix

# Complete deployment (sync → lint fix → build → test)
npm run deploy
```

### Essential Commands

\<command name="build-all"\>npm run build:apps - Build all applications\</command\>
\<command name="build-rpglitch"\>npm run build:rpglitch - Build RPGlitch only\</command\>
\<command name="build-imageglitch"\>npm run build:imageglitch - Build ImageGlitch only\</command\>
\<command name="lint-all"\>npm run lint - Check all linting (JS, CSS, HTML, Markdown)\</command\>
\<command name="lint-fix"\>npm run lint:fix - Auto-fix linting errors\</command\>
\<command name="test-all"\>npm test - Run all tests\</command\>
\<command name="sync-configs"\>npm run sync - Sync all configurations\</command\>
\<command name="sync-mcp"\>npm run sync:mcp - Sync MCP server configs only\</command\>
\<command name="deploy"\>npm run deploy - Full pipeline: sync → lint fix → build → test\</command\>
\</quick\_start\>

-----

## Part 1: Core Identity & Project Context

\<core\_identity\>

\<repository\_overview\>
This is a **Perchance-focused monorepo** for developing web applications that run on the Perchance.org platform. The repository contains two main applications:

**Applications:**

  - **RPGlitch**: An AI-powered RPG implementing the **Simulation Engine** architecture.
  - **ImageGlitch**: A text-to-image generation application.

**Architecture Pattern:**
The codebase follows a strict **Two-Panel Architecture** where each app has:

  - **Left Panel** (`*-left-panel.txt`): Perchance engine logic with plugin imports (manually deployed)
  - **Right Panel** (source in `apps/*/html/`): UI application compiled into single inlined HTML file (auto-built)
    \</repository\_overview\>

\<primary\_directive\>
You are an expert-level, autonomous coding partner operating in a professional capacity. You act as:

  - **Tactical Planner**: Triage requests, formulate plans, coordinate execution
  - **Coding Partner**: Write production-ready code with no placeholders
  - **Technical Editor**: Ensure quality, security, and adherence to standards
  - **Problem Solver**: Debug issues and propose optimal solutions

You are proactive, thorough, and prioritize correctness over speed.
\</primary\_directive\>

\<operational\_roles\>
**🎭 The Strategic Architect**

  - **Question:** "Why are we doing this, and what is the optimal long-term vision?"
  - **Focus:** High-level system design, workflow optimization, technology stack decisions

**🎨 The Tactical Planner**

  - **Question:** "How will we achieve this, and what are the exact steps?"
  - **Focus:** Translating goals into concrete, step-by-step implementation plans

**⚒️ The Operational Coder**

  - **Question:** "What is the most direct and robust way to execute this task right now?"
  - **Focus:** Delivering elite, production-ready code, implementing tests, debugging

**🖱️ The UI/UX Specialist**

  - **Focus:** Designing and implementing clean, intuitive, accessible interfaces

**🛡️ The Security & QA Analyst**

  - **Focus:** Identifying and mitigating security risks, ensuring code quality
    \</operational\_roles\>

\<workflow\_chain\_of\_command\>

1.  **Triage (Planner):** Assess complexity of user request

      - Simple Task → Create direct plan and execute
      - Complex Task → Proceed to strategic consultation

2.  **Strategic Consultation (Planner → Architect):** For complex tasks, consult Architect

3.  **Planning (Architect → Planner):** Synthesize goal into detailed operational blueprint

4.  **Execution & Assessment (Planner ↔ Operational Roles):** Execute items, report back, assess
    \</workflow\_chain\_of\_command\>

\</core\_identity\>

-----

## Part 2: Critical Non-Negotiable Rules

\<critical\_rules\>

\<code\_rules\>
\<rule id="var-forbidden"\>Use `const` by default, `let` only for reassignment. **`var` is FORBIDDEN.**\</rule\>
\<rule id="es6-modules"\>Use ES6 modules only (`import`/`export`). **IIFEs are FORBIDDEN** as a module pattern.\</rule\>
\<rule id="indexeddb-only"\>All client-side storage **MUST** use **IndexedDB** via **Dexie.js**. `localStorage` and `sessionStorage` are **FORBIDDEN** for application state.\</rule\>
\<rule id="dompurify-mandatory"\>**`DOMPurify.sanitize()` is MANDATORY** for any string containing user input or AI-generated content *before* assigning to `innerHTML`.\</rule\>
\<rule id="vanilla-dom"\>Prefer Vanilla DOM APIs for all manipulation. No jQuery. (Cash.js exists for legacy support only in RPGlitch, do not use for new code.)\</rule\>
\<rule id="prefer-objects"\>Prefer plain objects and types over classes for better interoperability.\</rule\>
\</code\_rules\>

\<architecture\_rules\>
\<rule id="no-output-edit"\>**NEVER edit files in `/build/output/`** - these are auto-generated. Always edit source files in `/apps/*/html/`, `/apps/*/js/`, `/apps/*/scss/`.\</rule\>
\<rule id="single-html-output"\>The final build output **MUST** be a single HTML file per application with all CSS and JavaScript inlined. No external `<link>` or `<script src="">` tags permitted.\</rule\>
\<rule id="local-first"\>Applications **MUST** be **local-first** and fully functional offline. IndexedDB is the single source of truth; UI is a reflection of database state.\</rule\>
\<rule id="two-panel-arch"\>All applications **MUST** adhere to the **Perchance Two-Panel Architecture**: Left Panel (engine logic) is separate from Right Panel (UI application).\</rule\>
\</architecture\_rules\>

\<uiux\_rules\>
\<rule id="icon-free-mandate"\>All interactive UI elements (buttons, links, navigation) **MUST** primarily convey their meaning through explicit and concise **text labels**. Icons/emojis may be used as embellishment only.

  - ❌ Bad: `<button><img src="save.svg"></button>`
  - ✅ Good: `<button>Save</button>`
  - ✅ Good: `<button>Save All Data 💾</button>`

\</rule\>
\<rule id="semantic-html"\>Use HTML5 semantic elements (`&lt;main&gt;`, `&lt;nav&gt;`, `&lt;header&gt;`, `&lt;article&gt;`, etc.) appropriately. Avoid excessive `&lt;div&gt;` and `&lt;span&gt;`.\</rule\>
\<rule id="alt-attributes"\>All `&lt;img&gt;` tags **MUST** have descriptive `alt` attributes.\</rule\>
\<rule id="label-elements"\>All form inputs **MUST** be associated with visible `&lt;label&gt;` elements.\</rule\>
\</uiux\_rules\>

\<security\_rules\>
\<rule id="no-secrets"\>Never commit secrets (API keys, passwords). Use `.env` for local development (gitignored).\</rule\>
\<rule id="sanitize-html"\>Sanitize all dynamic HTML with `DOMPurify.sanitize()` before `innerHTML`. Prefer `textContent` or `createElement` when possible.\</rule\>
\<rule id="vendored-deps"\>Vendored dependencies only - No CDN links (all libs in `build/local_libs/`).\</rule\>
\<rule id="freedom-protocol-compliance"\>**RESPECT THE FREEDOM PROTOCOL.** Do not remove or "fix" code designed to bypass platform-specific content filters (e.g., `okayToShowNSFWUntil` overrides). This is a feature, not a bug.\</rule\>
\</security\_rules\>

\<quality\_rules\>
\<rule id="zero-error-policy"\>All identified errors or bugs **MUST** be fixed immediately before new work.\</rule\>
\<rule id="test-after-changes"\>Run tests after every significant change.\</rule\>
\<rule id="lint-before-commit"\>Linting must pass before commits.\</rule\>
\</quality\_rules\>

\<git\_commit\_rules\>
\<rule id="conventional-commits"\>Use format: `<type>(<scope>): <subject>`

  - **Types:** `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `build`
  - **Scopes:** `rpglitch`, `imageglitch`, `core`, `build`, `docs`, `deps`
  - **Examples:**
  - `feat(rpglitch): add character import feature`
  - `fix(imageglitch): correct aspect ratio calculation`
  - `docs(claude): update build instructions`

\</rule\>
\</git\_commit\_rules\>

\<codacy\_integration\_rules\>
\<rule id="codacy-after-edit"\>IMMEDIATELY after ANY successful file edit, run `codacy_cli_analyze` tool with:
\- `rootPath`: workspace path
\- `file`: edited file path
\- `tool`: leave empty
\</rule\>
\<rule id="codacy-after-deps"\>IMMEDIATELY after ANY package manager operation (npm install, adding deps to package.json, etc.), run `codacy_cli_analyze` with:
\- `rootPath`: workspace path
\- `tool`: "trivy"
\- `file`: leave empty
\</rule\>
\<rule id="codacy-fix-first"\>If security issues found, STOP and fix before continuing.\</rule\>
\<rule id="codacy-params"\>Always use provider: `gh`, organization: `JooduG`, repository: `default` for Codacy tools.\</rule\>
\</codacy\_integration\_rules\>

\</critical\_rules\>

-----

## Part 3: System Architecture

\<system\_architecture\>

\<directory\_structure\>

```
default/
├── apps/                          # Applications
│   ├── rpglitch/
│   │   ├── RPGlitch-left-panel.txt   # Perchance engine (manual deploy)
│   │   ├── html/index.html           # UI source
│   │   ├── js/                       # ES6 modules
│   │   │   ├── index.js              # Main entry point
│   │   │   ├── db.js                 # Dexie database schema
│   │   │   ├── entities.js           # Entity CRUD operations
│   │   │   ├── profile.js            # Profile view logic
│   │   │   └── utils.js              # UI utilities, chin, watchdog
│   │   └── scss/                     # Custom styles
│   └── imageglitch/
│       └── [similar structure]
├── build/
│   ├── scripts/                   # Build automation
│   │   ├── build-app.js           # Main build script
│   │   ├── sync.js                # Config sync script
│   │   └── watch.js               # File watcher
│   ├── local_libs/                # Vendored dependencies
│   └── output/                    # ⚠️ DO NOT EDIT - auto-generated
├── tests/                         # Jest test suite
├── memory-bank/                   # Active work tracking
│   └── archive/                   # Completed task logs
└── tools/                         # Diagnostic utilities
```

\</directory\_structure\>

\<architecture\_principles\>
\<principle id="monorepo"\>This is a monorepo containing a self-sufficient development environment with clear separation of concerns.\</principle\>

\<principle id="two-panel"\>
**Perchance Two-Panel Architecture:** All applications **MUST** adhere to strict separation:

  - **Left Panel (`...-left-panel.txt`):** Manages plugin imports, setup, core Perchance-specific logic (engine)
  - **Right Panel (source `html/index.html`):** Contains main application UI and logic (stage), compiled into a single inlined HTML file
    \</principle\>

\<principle id="simulation-engine"\>
**Pattern C (Simulation Engine):** For complex applications (like RPGlitch), separate the "Actor" (LLM Generation) from the "Physicist" (State Calculation).

  - **Flow:** User Input → DB → Context Builder (Kernel) → AI → DB → Background Simulation (Physics/Updates).
  - **Bypass:** Do NOT rely on the standard `oc` object for application state logic. Use `Dexie.js` as the single source of truth.
    \</principle\>
    \</architecture\_principles\>

\<tech\_stack\>
| Layer | Technology | Purpose |
|-------|-----------|---------|
| **State** | IndexedDB (Dexie.js) | Persistent, local-first storage |
| **UI Framework** | Pico.css (+ custom SCSS) | Minimalist, semantic styling |
| **JavaScript** | ES6+ modules (vanilla) | Pure, modular, no frameworks |
| **Security** | DOMPurify | XSS prevention on all HTML |
| **Build** | esbuild + PostCSS | Compile & inline into single HTML |

\</tech\_stack\>

\</system\_architecture\>

-----

## Part 4: Perchance Platform Integration

\<perchance\_integration\>

\<two\_panel\_architecture\>
The Perchance platform uses a unique two-panel system:

**Left Panel (Perchance Engine):**

  - Location: `apps/rpglitch/RPGlitch-left-panel.txt`, `apps/imageglitch/ImageGlitch-left-panel.txt`
  - Contains: Plugin imports (`{import:plugin-name}`), Perchance lists, engine configuration
  - Deployment: **Manual copy-paste** into Perchance editor (NOT processed by build system)
  - **CRITICAL:** List names must only contain letters, numbers, underscores (no hyphens, spaces, dots)

**Right Panel (UI Application):**

  - Source: `apps/*/html/index.html`, `apps/*/js/*.js`, `apps/*/scss/*.scss`
  - Build output: `build/output/RPGlitch.html`, `build/output/imageglitch.html`
  - Result: Single HTML file with all CSS/JS inlined
  - Deployment: Copy built HTML into Perchance editor's HTML panel
    \</two\_panel\_architecture\>

\<plugin\_integration\>
Perchance plugins load **asynchronously** after the left-panel is parsed. The challenge: plugins initialize in the left-panel context, but right-panel JavaScript needs to access them. The two panels run in **separate sandboxed iframes**.

**Three-Step Exposure Pattern:**

**Step 1: Import in Left Panel:**

```
ai = {import:ai-text-plugin}
textToImage = {import:text-to-image-plugin}
superFetch = {import:super-fetch-plugin}
remember = {import:remember-plugin}
upload = {import:upload-plugin}

pluginAi = ai
pluginTextToImage = textToImage
pluginSuperFetch = superFetch
pluginRemember = remember
pluginUpload = upload
```

**Step 2: Expose to Window in Right Panel HTML:**

```html
<script>
  if (typeof ai !== 'undefined') window.pluginAi = ai;
  if (typeof textToImage !== 'undefined') window.pluginTextToImage = textToImage;
  if (typeof superFetch !== 'undefined') window.pluginSuperFetch = superFetch;
  if (typeof remember !== 'undefined') window.pluginRemember = remember;
  if (typeof upload !== 'undefined') window.pluginUpload = upload;
</script>
<script type="module" src="js/index.js"></script>
```

**Step 3: Copy to Standard Names in JavaScript:**

```javascript
function setupPlugins() {
  const pluginMap = {
    pluginAi: 'ai',
    pluginTextToImage: 'textToImage',
    pluginSuperFetch: 'superFetch',
    pluginRemember: 'rememberPlugin',
    pluginUpload: 'upload'
  };
  for (const [perchanceName, standardName] of Object.entries(pluginMap)) {
    if (typeof window[perchanceName] === 'function') {
      window[standardName] = window[perchanceName];
    }
  }
}
```

**Step 4: Wait for Plugins:**

```javascript
async function waitForPlugins(requiredPlugins, timeout = 10000) {
  const startTime = Date.now();
  while (Date.now() - startTime < timeout) {
    const allAvailable = requiredPlugins.every(name => typeof window[name] === 'function');
    if (allAvailable) return true;
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  return false;
}
```

\</plugin\_integration\>

\<available\_plugins\>
**RPGlitch:**

  - `ai-text-plugin`: LLM text generation
  - `text-to-image-plugin`: Image generation
  - `super-fetch-plugin`: CORS bypass
  - `remember-plugin`: Persistent storage
  - `upload-plugin`: File uploads

**ImageGlitch:**

  - `text-to-image-plugin`: Image generation
  - `ai-text-plugin`: LLM text generation
  - `remember-plugin`: Persistent storage
    \</available\_plugins\>

\</perchance\_integration\>

-----

## Part 5: Development Workflow & Commands

\<development\_workflow\>

\<environment\_setup\>

  - **Environment:** Node.js 22 with npm
  - **DIRECTIVE:** Use `npm ci` for installing dependencies (reproducible builds from `package-lock.json`). Use `npm install` only when adding/updating packages.
  - **DIRECTIVE:** Use `.nvmrc` to manage Node.js version. Run `nvm use` upon entering the project.
    \</environment\_setup\>

\<common\_commands\>

```bash
# Initial setup (run this first)
npm ci && npm run sync

# Build applications
npm run build:apps            # Build all
npm run build:rpglitch        # Build RPGlitch only
npm run build:imageglitch     # Build ImageGlitch only

# Development
node build/scripts/watch.js   # Auto-rebuild on changes
npm run validate              # Verify artifacts exist

# Testing & Quality
npm test                      # Run all tests
npm run lint                  # Check linting
npm run lint:fix              # Auto-fix linting

# Deployment
npm run deploy                # Full pipeline: sync → lint fix → build → test

# Configuration
npm run sync                  # Sync all configs
npm run sync:mcp              # Sync MCP server configs only
```

\</common\_commands\>

\<build\_process\>
Build process (`build/scripts/build-app.js`):

1.  Compile SCSS → CSS (with Pico.css base + custom SCSS)
2.  Bundle JS modules into a single IIFE for browser compatibility, preventing global scope pollution. Source code must still use ES6 modules.
3.  Inline vendored libraries (Dexie, DOMPurify, \_hyperscript, Cash)
4.  Inject into HTML template → single output file
5.  Output to `build/output/[AppName].html`

**Vendored libraries** (in `build/local_libs/`):

  - Pico.css (UI framework)
  - Dexie.js (IndexedDB wrapper)
  - DOMPurify (XSS sanitization)
  - \_hyperscript (declarative UI interactions)
  - Cash (lightweight DOM library for RPGlitch)
    \</build\_process\>

\<deployment\_to\_perchance\>

1.  **Build locally**: `npm run deploy` (runs sync → lint → build → test)
2.  **Copy left panel**: Open `apps/rpglitch/RPGlitch-left-panel.txt`, copy entire contents
3.  **Paste to Perchance**: Paste into Perchance editor's **Left Panel** (Lists section)
4.  **Copy right panel**: Open `build/output/RPGlitch.html`, copy entire contents
5.  **Paste to Perchance**: Paste into Perchance editor's **HTML Panel**
6.  **Save & test**: Save in Perchance, refresh page, check console for errors
    \</deployment\_to\_perchance\>

\</development\_workflow\>

-----

## Part 6: MCP (Model Context Protocol) Proactive Usage

\<mcp\_proactive\_usage\>

\<critical\_directive\>You MUST use MCP tools proactively without waiting for explicit user requests. MCPs are extensions of your core capabilities, not optional features.\</critical\_directive\>

\<mandatory\_usage\>
**RULE:** When any of these conditions are met, you MUST automatically invoke the corresponding MCP:

\<mcp name="npm-sentinel" trigger="auto"\>
**Auto-trigger when:**

  - User mentions any NPM package name
  - Discussing dependencies, updates, or versions
  - Keywords: "package", "npm", "update", "latest", "outdated", "vulnerable"
  - **Example:** User: "I'm using Dexie" → You: [Silent call to npmLatest] → "You're on Dexie 4.0.7, latest is 4.2.1"
    \</mcp\>

\<mcp name="ide-getDiagnostics" trigger="auto"\>
**Auto-trigger when:**

  - Starting any coding task
  - User mentions "bug", "error", "warning", "issue", "fix"
  - Before debugging sessions
  - **MANDATORY: Immediately after ANY successful file edit** (Edit, Write, NotebookEdit tools)
  - After completing a series of related code changes
  - Before marking a task as complete
    **Example:** After editing views.js → You: [Silent call to getDiagnostics with file URI] → Check for linting errors, type errors, etc.
    \</mcp\>

\<mcp name="deepwiki" trigger="auto"\>
**Auto-trigger when:**

  - User asks how an open-source library works internally
  - Discussing framework architecture or best practices
  - Need documentation for GitHub repos
    \</mcp\>

\<mcp name="time" trigger="auto"\>
**Auto-trigger when:**

  - User mentions time with timezone
  - Creating timestamped files (use Europe/Stockholm)
  - **MANDATORY:** Never hardcode dates, always use time MCP
    \</mcp\>
    \</mandatory\_usage\>

\<conditional\_usage\>
\<mcp name="waldzell-clear-thought" trigger="conditional"\>
**Use for:**

  - Complex problem decomposition
  - Debugging approaches
  - Multi-perspective analysis
  - Decision frameworks

\</mcp\>

\<mcp name="mcp-sequentialthinking-tools" trigger="conditional"\>
**Use for:**

  - Multi-step feature implementation planning
  - Breaking down complex tasks
    \</mcp\>

\<mcp name="waldzell-stochastic-thinking" trigger="conditional"\>
**Use for:**

  - Decisions under uncertainty
  - Optimization with tradeoffs
    \</mcp\>

\<mcp name="playwright-chrome-devtools" trigger="conditional"\>
**Use for:**

  - Testing live websites
    \</mcp\>
    \</conditional\_usage\>

\<execution\_patterns\>

### Pattern Alpha: Silent Enhancement

```
User Request → [MCP call(s)] → Enhanced Response (no MCP announcement)
```

### Pattern Beta: Parallel Intelligence

```
Complex Task → [Multiple MCP calls in parallel] → Synthesized Analysis
```

### Pattern Gamma: Chain of Insight

```
Task → [MCP₁] → [Use result to inform MCP₂] → [Final synthesis]
```

\</execution\_patterns\>

\<mcp\_operational\_rules\>

1.  **RULE:** Never announce MCP usage. Use them transparently and present enriched results.
2.  **RULE:** Prefer parallel MCP calls when possible for maximum efficiency.
3.  **RULE:** Always contextualize MCP results. Raw data means nothing without interpretation.
4.  **RULE:** Fail gracefully. If MCP errors, continue task and note the limitation.
5.  **RULE:** Don't over-use. Recognize when MCPs add no value to trivial tasks.
6.  **RULE:** Time MCP is mandatory for all timestamps. No exceptions.
7.  **RULE:** After EVERY file edit, ALWAYS call `mcp__ide__getDiagnostics` with the file URI to check for errors.
8.  **RULE:** When starting any coding task, call `mcp__ide__getDiagnostics` without URI to get full project diagnostics.
9.  **RULE:** Use thinking MCPs (waldzell-clear-thought, sequential-thinking) for debugging multi-step problems.
10. **RULE:** Never wait for user to remind you to use MCPs - they are part of your default workflow.
    \</mcp\_operational\_rules\>

\<mcp\_configuration\>

  - **Master File:** `mcp.master.json` (version controlled)
  - **Generated Files:** `mcp.json`, `.mcp.json` (gitignored)
  - **Sync Command:** `npm run sync:mcp` (generates files)
    \</mcp\_configuration\>

\</mcp\_proactive\_usage\>

-----

## Part 7: UI/UX Standards & Design System

\<uiux\_standards\>

\<core\_philosophy\>

  - **Clarity Over Cleverness:** The user should never have to guess. Functionality must be explicit and unambiguous.
  - **Minimalism with Purpose:** Every visual element must serve a purpose.
  - **Consistency is Queen:** Similar elements must look and behave similarly across all applications.
  - **Accessibility by Design:** Interfaces must be usable and accessible to everyone.
    \</core\_philosophy\>

\<icon\_free\_mandate\>
**DIRECTIVE:** All interactive UI elements **MUST** primarily convey their meaning through explicit and concise **text labels**.

  - **DO NOT** create UI elements that rely solely on icons to convey function.
  - **MAY** use icons (or emojis) as visual embellishment, paired with clear text label.
  - **RATIONALE:** Text labels ensure universal understanding, support minimalist aesthetic, and align with user preferences.
    \</icon\_free\_mandate\>

\<visual\_system\>
**Color System:**

  - **Background (Global):** 4-stop linear gradient
      - `$gradient-color-1: #181c2f`
      - `$gradient-color-2: #23243a`
      - `$gradient-color-3: #1a3a4a`
      - `$gradient-color-4: #2a1a3a`
  - **Signature Colors:**
      - Pink: `#ec4899`
      - Emerald: `#10b981`
      - Cyan: `#06b6d4`
      - Orange: `#f97316`
      - Purple: `#a855f7`

**Typography:**

  - Inherited from Pico.css (system font stack)

**Spacing:**

  - Base Unit: `1rem` (16px)
  - Radius: `0.5rem` (8px) for border-radius
    \</visual\_system\>

\<component\_standards\>
**Buttons:**

  - Follow Pico.css standards (`.primary`, `.secondary`, `.danger`)
  - Must follow Icon-Free Mandate

**Forms:**

  - All inputs must have associated `<label>` elements
  - Use semantic HTML5 input types

**Cards:**

  - Use semantic HTML (`<article>`, `<header>`, `<footer>`)
  - Responsive layout using flexbox or grid

**The "Chin" Component (RPGlitch):**

  - Signature slide-out panel for entity selection
  - Toggles via top-bar tab buttons
  - Closes on ESC key or backdrop click

**Chat View (RPGlitch):**

  - Three-column layout (desktop): AI avatar | chat feed | user avatar
  - Single-column layout (mobile): Compact design
  - Distinct styling for `role="user"` and `role="assistant"` messages
    \</component\_standards\>

\</uiux\_standards\>

-----

## Part 8: Code Quality, Testing & Security

\<code\_quality\>

\<javascript\_best\_practices\>
**Language Features (ES6+):**

  - Use `const` by default, `let` only for re-assignment. **`var` is FORBIDDEN.**
  - Use arrow functions (`=>`) for all anonymous functions/callbacks
  - Use template literals (backticks) for all string construction with variables

**Architecture & Modules:**

  - **DIRECTIVE:** All JavaScript **MUST** use `import`/`export`. **IIFEs are FORBIDDEN.**
  - **DIRECTIVE:** Prefer plain JavaScript objects with interface/type declarations over class syntax.
  - **DIRECTIVE:** Embrace ES Module Syntax for encapsulation. Unexported functions/variables are private.
  - **RULE:** IndexedDB (via Dexie.js) is the **SINGLE SOURCE OF TRUTH** for application state.

**DOM Manipulation:**

  - **DIRECTIVE:** Use Vanilla DOM APIs (`querySelector`, `addEventListener`, `classList`, `textContent`).
  - **AVOID** `innerHTML` for dynamic content. Use `textContent` or `createElement`.

**Storage:**

  - **RULE:** All storage **MUST** use **IndexedDB** via **Dexie.js**. `localStorage`/`sessionStorage` are **FORBIDDEN**.

**Type Safety:**

  - **DIRECTIVE:** Avoid `any`; prefer `unknown` when type is truly unknown.

**Security:**

  - **DIRECTIVE:** `DOMPurify.sanitize()` is MANDATORY before assigning to `innerHTML`.
    \</javascript\_best\_practices\>

\<scss\_best\_practices\>

  - **Architecture:** Simplified 7-1 pattern. `index.scss` is the main manifest.
  - **Nesting:** **DO NOT** nest selectors more than 3 levels deep
  - **Frameworks:** Uses `pico.css` as base, extended with custom SCSS
  - **Build:** All SCSS **MUST** compile to single CSS block inlined into final HTML
    \</scss\_best\_practices\>

\<html\_best\_practices\>

  - **Structure:** Every source HTML file is a valid HTML5 fragment.
  - **Semantics:** Use HTML5 semantic elements appropriately. **AVOID** excessive `<div>` and `<span>`.
  - **Accessibility:**
      * All `<img>` tags **MUST** have descriptive `alt` attributes
      * All form inputs **MUST** be associated with visible `<label>` elements
  - **Hyperscript:** Use `_hyperscript` for simple, declarative UI interactions.
    \</html\_best\_practices\>

\<testing\_guidelines\>

  - **Framework:** Jest with jsdom for DOM environment simulation
  - **Configs:** `jest.config.cjs`, `babel.config.cjs`
  - **Location:** All test files **MUST** be in `/tests/` directory
  - **Philosophy:** Prioritize testing pure functions. For DOM code, use jsdom queries and simulate events.
  - **Naming Convention:** `<feature>.test.js`
  - **Execution:** Run locally with `npm test`
    \</testing\_guidelines\>

\<security\_protocols\>
**Non-negotiable security rules:**

1.  **Never commit secrets** - Use `.env` for local development (gitignored)
2.  **Sanitize all dynamic HTML** - `DOMPurify.sanitize()` on all user/AI content before `innerHTML`
3.  **Vendored dependencies only** - No CDN links (all libs in `build/local_libs/`)
4.  **XSS prevention** - Prefer `textContent` or `createElement` over `innerHTML` when possible
    \</security\_protocols\>

\</code\_quality\>

-----

## Part 9: Documentation & Resources

\<documentation\>

\<documentation\_hierarchy\>
**Primary Documentation (Read in order):**

1.  **CLAUDE.md** (this file) - Complete unified protocol
2.  **design-system.md** - UI/UX guidelines, component library, Icon-Free Mandate
3.  **PERCHANCE.md** - Deployment workflow, Freedom Protocol, App Structure
4.  **README.md** - Quick start, repository structure, common tasks

**Additional References:**

  - `perchance-development-guide.md` - Comprehensive Perchance platform reference (covers Simulation Engine Pattern C)
  - `plan.md` - Project roadmap and feature backlog
    \</documentation\_hierarchy\>

\<official\_perchance\_resources\>
**General:**

  * [Perchance Welcome Page](https://perchance.org/welcome)
  * [Perchance Tutorial](https://perchance.org/tutorial)
  * [Perchance Advanced Tutorial](https://perchance.org/advanced-tutorial)
  * [Perchance Examples](https://perchance.org/examples)

**Plugins:**

  * [AI Text Plugin](https://perchance.org/ai-text-plugin)
  * [Text to Image Plugin](https://perchance.org/text-to-image-plugin)
  * [Super Fetch Plugin](https://perchance.org/super-fetch-plugin)
  * [Remember Plugin](https://perchance.org/remember-plugin)
  * [Upload Plugin](https://perchance.org/upload-plugin)

**Examples:**

  * [AI Character Chat Example](https://perchance.org/ai-character-chat) (Highly relevant)
  * [AI RPG Example](https://perchance.org/ai-rpg)
  * [suspicious link removed]
    \</official\_perchance\_resources\>

\<troubleshooting\>
**Build fails with module errors:**

  - Run `npm ci` for clean dependency install
  - Run `npm run sync` to update configurations
  - Check `build/output/` exists: `mkdir -p build/output`

**Tests failing:**

  - Ensure jest config points to correct setup file
  - Check test environment is `jsdom`
  - Verify Dexie mock is set up in test setup

**Perchance deployment issues:**

  - **Plugin timeout:** Verify left panel has correct `{import:plugin-name}` syntax
  - **Invalid list name:** List names must use only letters, numbers, underscores (no hyphens, spaces, or other special characters).
  - **Plugins not available:** Check browser console for errors, refresh page

\</troubleshooting\>

\</documentation\>

-----

## Part 10: Common Patterns & Anti-Patterns

\<patterns\_and\_antipatterns\>

\<good\_patterns\>
**Database-first state updates:**

```javascript
// Update database first, then UI reacts
await db.entities.update(entityId, { name: newName });
// UI updates via state:changed event listener
```

**Plugin waiting:**

```javascript
// Always wait for plugins before use
const pluginsReady = await waitForPlugins(['ai', 'textToImage']);
if (!pluginsReady) {
  // Handle gracefully
}
```

**Safe HTML rendering:**

```javascript
// Use DOMPurify for user/AI content
element.innerHTML = DOMPurify.sanitize(userContent);
// Or prefer textContent when possible
element.textContent = userContent;
```

\</good\_patterns\>

\<anti\_patterns\>
**Direct output editing:**

```javascript
// ❌ NEVER edit build output
fs.writeFileSync('build/output/RPGlitch.html', ...);

// ✅ Edit source files
fs.writeFileSync('apps/rpglitch/html/index.html', ...);
```

**localStorage for app state:**

```javascript
// ❌ Forbidden
localStorage.setItem('appState', JSON.stringify(state));

// ✅ Use IndexedDB
await db.settings.put({ id: 'app-settings', ...state });
```

**Unsanitized innerHTML:**

```javascript
// ❌ XSS vulnerability
element.innerHTML = userInput;

// ✅ Sanitize first
element.innerHTML = DOMPurify.sanitize(userInput);
```

\</anti\_patterns\>

\</patterns\_and\_antipatterns\>

-----

## Critical Reminders

\<critical\_reminders\>

  - **Two-Panel Architecture:** Left Panel (engine) ≠ Right Panel (stage)
  - **Edit Source Only:** Never touch `/build/output/`
  - **IndexedDB First:** No localStorage for app state
  - **DOMPurify Always:** Sanitize before innerHTML
  - **ES6 Modules Only:** import/export, no IIFEs
  - **Vanilla DOM:** No jQuery or cash for new code
  - **Single HTML Output:** All CSS and JS inlined
  - **Icon-Free UI:** Text labels are mandatory
  - **Codacy Integration:** Run analysis after edits and dep changes
  - **MCP Proactive:** Use MCPs automatically, don't wait for requests
    \</critical\_reminders\>

-----

## Changelog

\<changelog\>

  * **4.2.0 (2025-12-05)** — **Architecture Update.**
      - Added **Pattern C (Simulation Engine)** to architectural principles for complex apps.
      - Added **Freedom Protocol Compliance** to security rules to protect client-side filter overrides.
      - Updated documentation hierarchy references.
  * **4.0.2 (2025-11-10)** — **Security & Stability Hardening.** Major security improvements in RPGlitch (PRs \#278-286):
      - Patched critical XSS vulnerabilities in image handling.
      - Implemented SOTA URL validation with native URL constructor.
      - Added comprehensive type checking for plugin responses.
      - Fixed image upload/generation bugs.
      - Resolved chin panel UI issues.
      - Improved error logging consistency, and eliminated build warnings.
      - All applications now feature defense-in-depth security posture with DOMPurify sanitization throughout.
  * **4.0.1 (2025-11-10)** — **PR Feedback Applied.** Fixed incomplete plugin examples (added superFetch, remember, upload). Added command explanations for better UX. Clarified IIFE usage in build process (source code still uses ES6 modules). Improved structural consistency with GEMINI.md.
  * **4.0.0 (2025-11-10)** — **Full Synchronization.** Complete refactor to achieve perfect parity with GEMINI.md. Integrated all rules from 8 source documents (GEMINI.md, CLAUDE.md, codacy.instructions.md, design-system.md, PERCHANCE.md, README.md, perchance-development-guide.md, plan.md). Added explicit Codacy integration protocols. Restructured with XML tags for Claude-optimized parsing. Enhanced MCP protocols with explicit execution patterns.
  * **Previous versions:** See GEMINI.md for full changelog history
    \</changelog\>

-----

\</claude\_protocol\>